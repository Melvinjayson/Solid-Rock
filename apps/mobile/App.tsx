import "react-native-url-polyfill/auto";
import React, { useEffect, useState } from "react";
import {
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  churchClient,
  events,
  register,
  friendlyError,
  formatDate,
  type ChurchEvent,
  type Registration,
} from "@solid-rock/core";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const client =
  url && key
    ? churchClient(url, key, {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;
const tabs = ["Home", "Watch", "Events", "Give", "More"] as const;
type Tab = (typeof tabs)[number];
export default function App() {
  return (
    <SafeAreaProvider>
      <ChurchApp />
    </SafeAreaProvider>
  );
}
function ChurchApp() {
  const [tab, setTab] = useState<Tab>("Home");
  const [list, setList] = useState<ChurchEvent[]>([]);
  const [mine, setMine] = useState<Registration[]>([]);
  const [user, setUser] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    if (!client) return;
    try {
      setList(
        (await events(client)).filter(
          (e) => e.status === "published" && new Date(e.ends_at) > new Date(),
        ),
      );
      const {
        data: { user: current },
        error: authError,
      } = await client.auth.getUser();
      if (authError && current) throw authError;
      setUser(current?.id ?? null);
      if (current) {
        const { data, error } = await client
          .from("registrations")
          .select("*")
          .eq("user_id", current.id);
        if (error) throw error;
        setMine(data ?? []);
      } else setMine([]);
    } catch (e) {
      setMessage(friendlyError(e));
    }
  }
  useEffect(() => {
    void load();
    const subscription = client?.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user.id ?? null);
      setMine([]);
      setTimeout(() => void load(), 0);
    });
    const appState = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        client?.auth.startAutoRefresh();
        void load();
      } else client?.auth.stopAutoRefresh();
    });
    return () => {
      subscription?.data.subscription.unsubscribe();
      appState.remove();
    };
  }, []);
  async function act(work: () => Promise<void>) {
    if (busy) return;
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
  function button(label: string, onPress: () => void) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={onPress}
        style={[s.button, busy && { opacity: 0.5 }]}
      >
        <Text style={s.buttonText}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <SafeAreaView style={s.page}>
      <View style={s.header}>
        <Text style={s.brand}>SOLID ROCK</Text>
        <Text style={s.eyebrow}>DUBLIN · CHURCH & COMMUNITY</Text>
      </View>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.heading}>
          {tab === "Home" ? "A place to belong." : tab}
        </Text>
        {!client && (
          <Text style={s.notice}>
            Development build. Connect a Supabase project to load events and
            sign in.
          </Text>
        )}
        {!!message && (
          <Text accessibilityLiveRegion="polite" style={s.notice}>
            {message}
          </Text>
        )}
        {tab === "Home" && (
          <>
            <Text style={s.body}>
              Worship, grow in faith and serve together.
            </Text>
            <View style={s.card}>
              <Text style={s.title}>Sunday worship · 11:00am</Text>
              <Text style={s.body}>
                Goldenbridge Industrial Estate, 6B, Inchicore, Dublin 8
              </Text>
              <Text style={s.body}>Lead Pastor Emmanuel Might</Text>
            </View>
            {button("Explore upcoming events", () => setTab("Events"))}
            {button(
              "Plan your visit",
              () =>
                void Linking.openURL(
                  "https://solidrockdublin.org/plan-a-visit",
                ),
            )}
          </>
        )}
        {tab === "Events" && (
          <>
            {button(busy ? "Loading…" : "Refresh events", () => void act(load))}
            {list.length === 0 && (
              <Text style={s.body}>No upcoming events available.</Text>
            )}
            {list.map((event) => {
              const registration = mine.find(
                (r) => r.event_id === event.id && r.status === "confirmed",
              );
              return (
                <View key={event.id} style={s.card}>
                  <Text style={s.title}>{event.title}</Text>
                  <Text style={s.eyebrow}>
                    {formatDate(event.starts_at)} · Dublin time
                  </Text>
                  <Text style={s.body}>{event.location}</Text>
                  <Text style={s.body}>{event.description}</Text>
                  {registration ? (
                    <>
                      <Text accessibilityLiveRegion="polite" style={s.confirm}>
                        Your place is confirmed.
                      </Text>
                      <Text selectable style={s.body}>
                        Reference: {registration.id}
                      </Text>
                      {button(
                        "Cancel my place",
                        () =>
                          void act(async () => {
                            if (!client) return;
                            const { error } = await client.rpc(
                              "cancel_registration",
                              { p_event_id: event.id },
                            );
                            if (error) throw error;
                            await load();
                            setMessage("Your registration has been cancelled.");
                          }),
                      )}
                    </>
                  ) : (
                    button(
                      user ? "Reserve my place" : "Sign in to register",
                      () => {
                        if (!user) {
                          setTab("More");
                          setMessage("Sign in, then return to Events.");
                          return;
                        }
                        void act(async () => {
                          if (!client) return;
                          const reference = await register(client, event.id);
                          await load();
                          setMessage(
                            `Your place is confirmed. Reference: ${reference}`,
                          );
                        });
                      },
                    )
                  )}
                </View>
              );
            })}
          </>
        )}
        {tab === "Watch" && (
          <>
            <Text style={s.body}>
              Visit the church website for current messages and worship content.
            </Text>
            {button(
              "Open church website",
              () => void Linking.openURL("https://solidrockdublin.org/"),
            )}
          </>
        )}
        {tab === "Give" && (
          <>
            <Text style={s.body}>
              Use the church’s official giving page for current payment
              instructions. Giving history and in-app payments are not available
              in this development release.
            </Text>
            {button(
              "Official ways to give",
              () => void Linking.openURL("https://solidrockdublin.org/give"),
            )}
          </>
        )}
        {tab === "More" && (
          <>
            {user ? (
              <>
                <Text style={s.body}>
                  You are signed in. Your registration references are available
                  under Events.
                </Text>
                {button(
                  "Sign out",
                  () =>
                    void act(async () => {
                      if (!client) return;
                      const { error } = await client.auth.signOut();
                      if (error) throw error;
                      setUser(null);
                      setMine([]);
                      setMessage("Signed out.");
                    }),
                )}
              </>
            ) : (
              <>
                <Text style={s.body}>
                  Sign in with your invited development account. This account is
                  not automatically linked to ChMeetings.
                </Text>
                <Text style={s.label}>Email</Text>
                <TextInput
                  accessibilityLabel="Email"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={s.input}
                />
                <Text style={s.label}>Password</Text>
                <TextInput
                  accessibilityLabel="Password"
                  secureTextEntry
                  autoComplete="current-password"
                  value={password}
                  onChangeText={setPassword}
                  style={s.input}
                />
                {button(
                  "Sign in",
                  () =>
                    void act(async () => {
                      if (!client) throw new Error();
                      const { error } = await client.auth.signInWithPassword({
                        email: email.trim(),
                        password,
                      });
                      if (error) throw error;
                      setPassword("");
                      await load();
                      setMessage("Signed in. Choose an event to register.");
                    }),
                )}
              </>
            )}
            {button(
              "Contact the church",
              () => void Linking.openURL("mailto:admin@solidrockdublin.org"),
            )}
          </>
        )}
      </ScrollView>
      <View style={s.tabs}>
        {tabs.map((t) => (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            onPress={() => {
              setTab(t);
              setMessage("");
            }}
            style={[s.tab, tab === t && s.selected]}
          >
            <Text style={s.tabText}>{t}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F8F6EF" },
  header: { padding: 24, borderBottomWidth: 1, borderColor: "#DEDCCF" },
  brand: { fontSize: 24, fontWeight: "800", color: "#183F35" },
  eyebrow: { fontSize: 12, color: "#50675F", marginTop: 6 },
  content: { padding: 24, paddingBottom: 40 },
  heading: {
    fontSize: 34,
    fontWeight: "700",
    color: "#183F35",
    marginBottom: 16,
  },
  body: { fontSize: 16, lineHeight: 25, color: "#344C43", marginVertical: 8 },
  title: { fontSize: 21, fontWeight: "700", color: "#183F35" },
  card: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#DEDCCF",
  },
  button: {
    backgroundColor: "#205644",
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    minHeight: 48,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  notice: {
    padding: 16,
    backgroundColor: "#EFE5C9",
    color: "#40371F",
    lineHeight: 23,
    marginBottom: 16,
    borderRadius: 10,
  },
  confirm: { color: "#205644", fontWeight: "700", fontSize: 17 },
  label: { fontSize: 15, marginTop: 12, color: "#344C43" },
  input: {
    borderWidth: 1,
    borderColor: "#72867D",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    marginVertical: 8,
  },
  tabs: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#DEDCCF",
  },
  tab: {
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  selected: { backgroundColor: "#DDE8DF" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#183F35" },
});
