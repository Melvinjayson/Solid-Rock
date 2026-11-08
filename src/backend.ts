import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const cloudEnabled = Boolean(url && anon);
export const churchDb: SupabaseClient | null = url && anon
  ? createClient(url, anon, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;

// Keep every query scoped to the church-owned Supabase project and RLS policies.
// Client code must never use a service_role key or claim a payment was verified.
export type ChurchEvent = {
  id: string; title: string; description: string; starts_at: string; ends_at: string | null;
  venue: string | null; capacity: number | null; registration_enabled: boolean;
};
export type ChurchSermon = {
  id: string; title: string; description: string; speaker: string | null; series: string | null;
  passage: string | null; media_url: string | null; published_at: string | null;
};
export type ChurchGroup = { id: string; title: string; description: string; location_label: string | null };
export type VolunteerOpportunity = { id: string; title: string; description: string };
export type Announcement = { id: string; title: string; body: string; published_at: string | null };
export type GivingRecord = {
  id: string; fund_code: string; amount_minor: number; currency: string; verified_at: string;
};
export type PastoralSlot = { id: string; starts_at: string; ends_at: string };
export type ChurchProfile = { id: string; display_name: string; email: string | null; phone: string | null };

export async function getPublicContent() {
  if (!churchDb) return { events: [] as ChurchEvent[], sermons: [] as ChurchSermon[], announcements: [] as Announcement[], groups: [] as ChurchGroup[], opportunities: [] as VolunteerOpportunity[] };
  const [e,s,a,g,v] = await Promise.all([
    churchDb.from('events').select('id,title,description,starts_at,ends_at,venue,capacity,registration_enabled').eq('published',true).gte('starts_at',new Date().toISOString()).order('starts_at').limit(30),
    churchDb.from('sermons').select('id,title,description,speaker,series,passage,media_url,published_at').eq('is_public',true).order('published_at',{ascending:false}).limit(30),
    churchDb.from('announcements').select('id,title,body,published_at').eq('published',true).order('published_at',{ascending:false}).limit(10),
    churchDb.from('groups').select('id,title,description,location_label').eq('is_public',true).limit(40),
    churchDb.from('volunteer_opportunities').select('id,title,description').eq('published',true).limit(40),
  ]);
  for (const r of [e,s,a,g,v]) if (r.error) throw r.error;
  return {
    events: (e.data ?? []) as ChurchEvent[], sermons: (s.data ?? []) as ChurchSermon[],
    announcements: (a.data ?? []) as Announcement[], groups: (g.data ?? []) as ChurchGroup[],
    opportunities: (v.data ?? []) as VolunteerOpportunity[],
  };
}

export async function requestEventRegistration(eventId: string) {
  if (!churchDb) throw new Error('Church services are not configured.');
  const { error } = await churchDb.rpc('register_for_event', { p_event_id: eventId });
  if (error) throw error;
}
export async function requestPastoralSlot(slotId: string) {
  if (!churchDb) throw new Error('Church services are not configured.');
  const { error } = await churchDb.rpc('book_pastoral_slot', { p_slot_id: slotId });
  if (error) throw error;
}
export async function sendPrayerRequest(body: string) {
  if (!churchDb) throw new Error('Church services are not configured.');
  const user = (await churchDb.auth.getUser()).data.user;
  if (!user) throw new Error('Sign in before sending a prayer request.');
  const { error } = await churchDb.from('prayer_requests').insert({ user_id: user.id, body: body.trim() });
  if (error) throw error;
}
export async function joinGroup(groupId: string) {
  if (!churchDb) throw new Error('Church services are not configured.');
  const user = (await churchDb.auth.getUser()).data.user;
  if (!user) throw new Error('Sign in before joining a fellowship.');
  const { error } = await churchDb.from('group_memberships').insert({ user_id: user.id, group_id: groupId });
  if (error) throw error;
}
export async function volunteer(opportunityId: string) {
  if (!churchDb) throw new Error('Church services are not configured.');
  const user = (await churchDb.auth.getUser()).data.user;
  if (!user) throw new Error('Sign in before registering interest.');
  const { error } = await churchDb.from('volunteer_interests').insert({ user_id: user.id, opportunity_id: opportunityId });
  if (error) throw error;
}
export async function givingHistory(): Promise<GivingRecord[]> {
  if (!churchDb) return [];
  const { data, error } = await churchDb.from('giving_ledger')
    .select('id,fund_code,amount_minor,currency,verified_at').order('verified_at',{ascending:false}).limit(100);
  if (error) throw error;
  return (data ?? []) as GivingRecord[];
}
export async function pastoralAvailability(): Promise<PastoralSlot[]> {
  if (!churchDb) return [];
  const { data, error } = await churchDb.from('pastoral_slots').select('id,starts_at,ends_at')
    .eq('available',true).gte('starts_at',new Date().toISOString()).order('starts_at').limit(20);
  if (error) throw error;
  return (data ?? []) as PastoralSlot[];
}
