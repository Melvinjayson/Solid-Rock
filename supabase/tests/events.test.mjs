import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const ids = {
  staff: "00000000-0000-0000-0000-000000000001",
  alice: "00000000-0000-0000-0000-000000000002",
  bob: "00000000-0000-0000-0000-000000000003",
  unconfirmed: "00000000-0000-0000-0000-000000000004",
};
test("event registration database permissions and lifecycle", async (t) => {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  const migrations = (await readdir(new URL("../migrations/", import.meta.url)))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of migrations)
    await db.exec(
      await readFile(new URL("../migrations/" + file, import.meta.url), "utf8"),
    );
  for (const [name, id] of Object.entries(ids))
    await db.query(
      "insert into auth.users(id,email_confirmed_at) values($1,$2)",
      [id, name === "unconfirmed" ? null : new Date().toISOString()],
    );
  await db.query("insert into public.staff_roles values($1,'events')", [
    ids.staff,
  ]);
  async function as(role, id, fn) {
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      id ?? "",
    ]);
    try {
      return await fn();
    } finally {
      await db.exec("reset role");
    }
  }
  const save = (title, status = "published", capacity = 1, id = null) =>
    db.query(
      "select public.save_event($1,$2,'Description','Inchicore',now()+interval '1 day',now()+interval '1 day 2 hours',$3,$4) as id",
      [id, title, capacity, status],
    );
  let event, draft, registration;
  await t.test("staff creates draft and published event", async () => {
    await as("authenticated", ids.staff, async () => {
      event = (await save("Published")).rows[0].id;
      draft = (await save("Draft", "draft")).rows[0].id;
    });
  });
  await t.test("guest sees published events, not drafts", async () => {
    await as("anon", null, async () => {
      assert.equal(
        (await db.query("select * from public.events")).rows.length,
        1,
      );
      assert.equal(
        (await db.query("select * from public.events where id=$1", [draft]))
          .rows.length,
        0,
      );
    });
  });
  await t.test(
    "guest cannot call registration RPC or see attendees",
    async () => {
      await as("anon", null, async () => {
        await assert.rejects(
          db.query("select public.register_for_event($1)", [event]),
          /permission denied/,
        );
        await assert.rejects(
          db.query("select * from public.registrations"),
          /permission denied/,
        );
      });
    },
  );
  await t.test(
    "member cannot publish or grant themselves staff permissions",
    async () => {
      await as("authenticated", ids.alice, async () => {
        await assert.rejects(save("Unauthorised"), /STAFF_REQUIRED/);
        await assert.rejects(
          db.query("insert into public.staff_roles values($1,'admin')", [
            ids.alice,
          ]),
          /permission denied/,
        );
        await assert.rejects(
          db.query("update public.events set capacity=100"),
          /permission denied/,
        );
      });
    },
  );
  await t.test("unconfirmed account cannot register", async () => {
    await as("authenticated", ids.unconfirmed, async () => {
      await assert.rejects(
        db.query("select public.register_for_event($1)", [event]),
        /AUTH_REQUIRED/,
      );
    });
  });
  await t.test("member cannot register for unpublished event", async () => {
    await as("authenticated", ids.alice, async () => {
      await assert.rejects(
        db.query("select public.register_for_event($1)", [draft]),
        /EVENT_CLOSED/,
      );
    });
  });
  await t.test("registration creates persisted confirmation", async () => {
    await as("authenticated", ids.alice, async () => {
      registration = (
        await db.query("select public.register_for_event($1) as id", [event])
      ).rows[0].id;
      assert.equal(
        (await db.query("select * from public.registration_confirmations")).rows
          .length,
        1,
      );
    });
  });
  await t.test(
    "retry returns same reference without another audit or confirmation",
    async () => {
      await as("authenticated", ids.alice, async () => {
        assert.equal(
          (
            await db.query("select public.register_for_event($1) as id", [
              event,
            ])
          ).rows[0].id,
          registration,
        );
      });
      assert.equal(
        (
          await db.query(
            "select * from public.audit_events where action='registration.confirmed'",
          )
        ).rows.length,
        1,
      );
    },
  );
  await t.test("capacity enforced for second member", async () => {
    await as("authenticated", ids.bob, async () => {
      await assert.rejects(
        db.query("select public.register_for_event($1)", [event]),
        /EVENT_FULL/,
      );
    });
  });
  await t.test(
    "another member cannot read registrations or confirmations",
    async () => {
      await as("authenticated", ids.bob, async () => {
        assert.equal(
          (await db.query("select * from public.registrations")).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select * from public.registration_confirmations"))
            .rows.length,
          0,
        );
        await assert.rejects(
          db.query(
            "insert into public.registrations(event_id,user_id) values($1,$2)",
            [event, ids.bob],
          ),
          /permission denied/,
        );
      });
    },
  );
  await t.test(
    "staff sees attendees; invalid capacity does not persist",
    async () => {
      await as("authenticated", ids.staff, async () => {
        assert.equal(
          (await db.query("select * from public.registrations")).rows.length,
          1,
        );
        await assert.rejects(
          save("Published", "published", 0, event),
          /CAPACITY_BELOW_REGISTRATIONS/,
        );
      });
    },
  );
  await t.test("cancelling another account’s place has no effect", async () => {
    await as("authenticated", ids.bob, async () => {
      await db.query("select public.cancel_registration($1)", [event]);
    });
    assert.equal(
      (
        await db.query(
          "select * from public.registrations where status='confirmed'",
        )
      ).rows.length,
      1,
    );
  });
  await t.test(
    "owner cancels and releases capacity; confirmation removed",
    async () => {
      await as("authenticated", ids.alice, async () => {
        await db.query("select public.cancel_registration($1)", [event]);
        assert.equal(
          (await db.query("select * from public.registration_confirmations"))
            .rows.length,
          0,
        );
      });
      await as("authenticated", ids.bob, async () => {
        await db.query("select public.register_for_event($1)", [event]);
      });
    },
  );
  await t.test("cancelled event rejects new registrations", async () => {
    await as("authenticated", ids.staff, async () => {
      await save("Published", "cancelled", 1, event);
    });
    await as("authenticated", ids.alice, async () => {
      await assert.rejects(
        db.query("select public.register_for_event($1)", [event]),
        /EVENT_CLOSED/,
      );
    });
  });
  await t.test("past event rejects registrations", async () => {
    await db.query(
      "update public.events set status='published',starts_at=now()-interval '2 days',ends_at=now()-interval '1 day' where id=$1",
      [event],
    );
    await as("authenticated", ids.alice, async () => {
      await assert.rejects(
        db.query("select public.register_for_event($1)", [event]),
        /EVENT_CLOSED/,
      );
    });
  });
  await t.test("staff revocation applies without refreshing JWT", async () => {
    await db.query("delete from public.staff_roles where user_id=$1", [
      ids.staff,
    ]);
    await as("authenticated", ids.staff, async () => {
      await assert.rejects(save("Revoked"), /STAFF_REQUIRED/);
      assert.equal(
        (await db.query("select * from public.registrations")).rows.length,
        0,
      );
    });
  });
  await db.close();
});
