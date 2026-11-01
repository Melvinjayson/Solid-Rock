import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";
export type ChurchEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: "draft" | "published" | "cancelled";
};
export type Registration = {
  id: string;
  event_id: string;
  user_id: string;
  status: "confirmed" | "cancelled";
  created_at: string;
};
export function churchClient(
  url: string,
  key: string,
  options?: SupabaseClientOptions<"public">,
) {
  if (!url || !key) throw new Error("Supabase configuration is missing.");
  return createClient(url, key, {
    ...options,
    global: {
      ...options?.global,
      fetch: async (input, init = {}) => {
        const controller = new AbortController();
        const cancel = () => controller.abort();
        if (init.signal?.aborted) cancel();
        init.signal?.addEventListener("abort", cancel, { once: true });
        const timeout = setTimeout(cancel, 15000);
        try {
          return await fetch(input, { ...init, signal: controller.signal });
        } finally {
          clearTimeout(timeout);
          init.signal?.removeEventListener("abort", cancel);
        }
      },
    },
  });
}
export async function events(client: SupabaseClient): Promise<ChurchEvent[]> {
  const { data, error } = await client
    .from("events")
    .select("*")
    .order("starts_at");
  if (error) throw error;
  return data ?? [];
}
export async function register(
  client: SupabaseClient,
  eventId: string,
): Promise<string> {
  const { data, error } = await client.rpc("register_for_event", {
    p_event_id: eventId,
  });
  if (error) throw error;
  return data as string;
}
export function friendlyError(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "";
  for (const [key, text] of Object.entries({
    EVENT_FULL: "This event is full.",
    EVENT_CLOSED: "Registration is closed.",
    AUTH_REQUIRED: "Sign in with a confirmed account to register.",
    STAFF_REQUIRED: "Staff access is required.",
    CAPACITY_BELOW_REGISTRATIONS:
      "Capacity cannot be lower than existing registrations.",
  })) {
    if (message.includes(key)) return text;
  }
  return "The request could not be completed. Check your connection and try again.";
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Dublin",
  }).format(new Date(value));
}
