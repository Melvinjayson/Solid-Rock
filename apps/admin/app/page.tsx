"use client";
import { useEffect, useState, type FormEvent } from "react";
import {
  churchClient,
  events,
  friendlyError,
  formatDate,
  type ChurchEvent,
  type Registration,
} from "@solid-rock/core";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const client = url && key ? churchClient(url, key) : null;
export default function Office() {
  const [user, setUser] = useState(false);
  const [staff, setStaff] = useState(false);
  const [items, setItems] = useState<ChurchEvent[]>([]);
  const [attendees, setAttendees] = useState<Registration[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    if (!client) return;
    const {
      data: { user: current },
    } = await client.auth.getUser();
    setUser(!!current);
    if (!current) {
      setStaff(false);
      setItems([]);
      setAttendees([]);
      return;
    }
    const { data, error } = await client
      .from("staff_roles")
      .select("role")
      .eq("user_id", current.id)
      .maybeSingle();
    if (error) throw error;
    setStaff(!!data);
    if (data) setItems(await events(client));
    else {
      setItems([]);
      setMessage("Your account does not have church-office access.");
    }
  }
  useEffect(() => {
    void run(load);
    const subscription = client?.auth.onAuthStateChange(() => {
      setAttendees([]);
      setSelected("");
      setTimeout(() => void run(load), 0);
    });
    return () => subscription?.data.subscription.unsubscribe();
  }, []);
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await work();
    } catch (e) {
      setMessage(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await run(async () => {
      if (!client) return;
      const { error } = await client.auth.signInWithPassword({
        email: String(f.get("email")).trim(),
        password: String(f.get("password")),
      });
      if (error) throw error;
      await load();
    });
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    await run(async () => {
      if (!client) return;
      const { error } = await client.rpc("save_event", {
        p_id: null,
        p_title: f.get("title"),
        p_description: f.get("description"),
        p_location: f.get("location"),
        p_starts_at: new Date(String(f.get("starts_at"))).toISOString(),
        p_ends_at: new Date(String(f.get("ends_at"))).toISOString(),
        p_capacity: Number(f.get("capacity")),
        p_status: f.get("status"),
      });
      if (error) throw error;
      form.reset();
      await load();
      setMessage("Event saved.");
    });
  }
  async function changeStatus(
    event: ChurchEvent,
    status: ChurchEvent["status"],
  ) {
    await run(async () => {
      if (!client) return;
      const { error } = await client.rpc("save_event", {
        p_id: event.id,
        p_title: event.title,
        p_description: event.description,
        p_location: event.location,
        p_starts_at: event.starts_at,
        p_ends_at: event.ends_at,
        p_capacity: event.capacity,
        p_status: status,
      });
      if (error) throw error;
      await load();
      setMessage("Event status updated.");
    });
  }
  async function inspect(id: string) {
    await run(async () => {
      if (!client) return;
      setAttendees([]);
      setSelected("");
      const { data, error } = await client
        .from("registrations")
        .select("*")
        .eq("event_id", id)
        .order("created_at");
      if (error) throw error;
      setAttendees(data ?? []);
      setSelected(id);
    });
  }
  return (
    <main>
      <header>
        <a href="https://solidrockdublin.org/">SOLID ROCK / DUBLIN</a>
        <span>Church office · Development</span>
      </header>
      <h1>Gather. Connect. Serve.</h1>
      <p>Manage events and view confirmed registrations.</p>
      {!client && (
        <aside>Configure Supabase to enable this development portal.</aside>
      )}
      {message && <aside role="status">{message}</aside>}
      {!user ? (
        <form onSubmit={signIn}>
          <h2>Staff sign in</h2>
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button disabled={busy || !client}>Sign in</button>
        </form>
      ) : (
        <button
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const { error } = await client!.auth.signOut();
              if (error) throw error;
              setUser(false);
              setStaff(false);
              setItems([]);
              setAttendees([]);
            })
          }
        >
          Sign out
        </button>
      )}
      {staff && (
        <div className="columns">
          <section>
            <form onSubmit={save}>
              <h2>Create an event</h2>
              <label>
                Title
                <input name="title" maxLength={160} required />
              </label>
              <label>
                Description
                <textarea name="description" maxLength={10000} />
              </label>
              <label>
                Location
                <input
                  name="location"
                  maxLength={300}
                  defaultValue="Goldenbridge Industrial Estate, 6B, Inchicore, Dublin 8"
                  required
                />
              </label>
              <label>
                Starts (your browser’s local time)
                <input name="starts_at" type="datetime-local" required />
              </label>
              <label>
                Ends (your browser’s local time)
                <input name="ends_at" type="datetime-local" required />
              </label>
              <label>
                Capacity
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  max="10000"
                  defaultValue="50"
                  required
                />
              </label>
              <label>
                Visibility
                <select name="status">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <button disabled={busy}>Save event</button>
            </form>
          </section>
          <section>
            <h2>Events</h2>
            <button disabled={busy} onClick={() => void run(load)}>
              Refresh events
            </button>
            {items.length === 0 && <p>No events yet.</p>}
            {items.map((event) => (
              <article key={event.id}>
                <small>{event.status.toUpperCase()}</small>
                <h3>{event.title}</h3>
                <p>{formatDate(event.starts_at)} · Dublin</p>
                <p>{event.location}</p>
                <p>Capacity: {event.capacity}</p>
                <button disabled={busy} onClick={() => void inspect(event.id)}>
                  View registrations
                </button>
                {event.status === "draft" && (
                  <button
                    disabled={busy}
                    onClick={() => void changeStatus(event, "published")}
                  >
                    Publish
                  </button>
                )}
                {event.status === "published" && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Cancel this event? Existing attendees will need to be contacted by the church office.",
                        )
                      )
                        void changeStatus(event, "cancelled");
                    }}
                  >
                    Cancel event
                  </button>
                )}
              </article>
            ))}
          </section>
        </div>
      )}
      {staff && selected && (
        <section>
          <h2>Registrations · {items.find((e) => e.id === selected)?.title}</h2>
          <p>
            {attendees.filter((r) => r.status === "confirmed").length}{" "}
            confirmed. Member linking and contact details are deferred.
          </p>
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Account ID</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.user_id}</td>
                    <td>{r.status}</td>
                    <td>{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
