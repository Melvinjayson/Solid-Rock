import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Pressable, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, View, Image, ImageBackground, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHURCH_NAME, CHURCH_URL, INTRO, sampleEvents, sampleMessages, SUNDAY_SERVICE, CONTACT_ADDRESS, VISIT_URL, MINISTRIES } from './src/content';
import { theme as T, setActiveTheme, churchAssets, type ThemeMode } from './src/theme';
import MemberHub from './src/MemberHub';
import { cloudEnabled, getPublicContent } from './src/backend';

type Tab = 'Home' | 'Watch' | 'Events' | 'Give' | 'More';
type Page = 'Bible' | 'Prayer' | 'Groups' | 'About' | 'My interests' | 'Church hub' | null;
const tabs: { name: Tab; icon: string }[] = [
  { name: 'Home', icon: '⌂' }, { name: 'Watch', icon: '▶' },
  { name: 'Events', icon: '▦' }, { name: 'Give', icon: '♡' }, { name: 'More', icon: '☰' },
];
const STORAGE = '@solidrock:preferences:v1';
type Preferences = { interests: string[]; bookmarks: string[] };
const EMPTY: Preferences = { interests: [], bookmarks: [] };

async function openOfficialSite() {
  try { await Linking.openURL(CHURCH_URL); }
  catch { Alert.alert('Unable to open website', 'Please visit solidrockdublin.org in your browser.'); }
}
function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={s.headingRow}><Text style={s.heading}>{title}</Text>{action && <Pressable accessibilityRole="button" onPress={onAction}><Text style={s.action}>{action}  →</Text></Pressable>}</View>;
}
function Tag({ children }: { children: React.ReactNode }) {
  return <View style={s.tag}><Text style={s.tagText}>{children}</Text></View>;
}
function PrimaryButton({ label, onPress, outline = false }: { label: string; onPress: () => void; outline?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.button, outline && s.buttonOutline, pressed && { opacity: 0.8 }]}>
    <Text style={[s.buttonText, outline && { color: T.brand }]}>{label}</Text>
  </Pressable>;
}
function Surface({ children }: { children: React.ReactNode }) {
  return <View style={s.surface}>{children}</View>;
}
function Header({ onAbout, mode, toggleMode }: { onAbout: () => void; mode:ThemeMode; toggleMode:()=>void }) {
  return <View style={s.topbar}><Image source={{uri:mode==='dark'?churchAssets.logoDark:churchAssets.logoLight}} style={{height:49,width:55}} resizeMode="contain" accessibilityLabel="Solid Rock Dublin official logo"/>
    <View style={{ flex: 1 }}><Text style={s.brand}>{CHURCH_NAME}</Text><Text style={s.subBrand}>LOVING GOD · SERVING THE WORLD</Text></View>
    <Pressable accessibilityLabel={mode==='dark'?'Switch to light mode':'Switch to dark mode'} accessibilityRole="button" accessibilityHint="Changes the app colour theme" onPress={toggleMode} style={s.info}><Text style={{color:T.ink,fontSize:16}}>{mode==='dark'?'☼':'☾'}</Text></Pressable>
    <Pressable accessibilityLabel="About Solid Rock" accessibilityRole="button" onPress={onAbout} style={s.info}><Text style={{ color: T.brand, fontWeight: '800' }}>i</Text></Pressable>
  </View>;
}
function AppContent() {
  const { width } = useWindowDimensions();
  const [mode,setMode]=useState<ThemeMode>('dark');
  setActiveTheme(mode);
  s=makeStyles();
  useEffect(()=>{let mounted=true;AsyncStorage.getItem('@solidrock:theme').then(v=>{if(mounted&&(v==='light'||v==='dark'))setMode(v);}).catch(()=>{});return()=>{mounted=false;};},[]);
  function toggleMode(){const next=mode==='dark'?'light':'dark';setMode(next);void AsyncStorage.setItem('@solidrock:theme',next).catch(()=>{});}
  const [tab, setTab] = useState<Tab>('Home');
  const [page, setPage] = useState<Page>(null);
  const [preferences, setPreferences] = useState<Preferences>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [prayer, setPrayer] = useState('');
  const [remote, setRemote] = useState<Awaited<ReturnType<typeof getPublicContent>> | null>(null);
  useEffect(() => { if (!cloudEnabled) return; let mounted=true; getPublicContent().then(d=>{if(mounted)setRemote(d);}).catch(()=>{}); return ()=>{mounted=false;}; }, []);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE).then(raw => {
      if (!alive || !raw) return;
      const value = JSON.parse(raw) as Partial<Preferences>;
      setPreferences({ interests: Array.isArray(value.interests) ? value.interests : [], bookmarks: Array.isArray(value.bookmarks) ? value.bookmarks : [] });
    }).catch(() => Alert.alert('Local data unavailable', 'Saved interests could not be loaded on this device.'))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  async function persist(next: Preferences) {
    setPreferences(next);
    try { await AsyncStorage.setItem(STORAGE, JSON.stringify(next)); }
    catch { Alert.alert('Could not save', 'This device could not save your preference.'); }
  }
  function toggleInterest(id: string) {
    const interests = preferences.interests.includes(id) ? preferences.interests.filter(x => x !== id) : [...preferences.interests, id];
    void persist({ ...preferences, interests });
  }
  function toggleBookmark(id: string) {
    const bookmarks = preferences.bookmarks.includes(id) ? preferences.bookmarks.filter(x => x !== id) : [...preferences.bookmarks, id];
    void persist({ ...preferences, bookmarks });
  }
  function goTab(next: Tab) { setPage(null); setTab(next); }
  function goPage(next: Page) { setPage(next); }
  const contentWidth = Math.min(width - 36, 620);

  function Home() {
    return <>
      <ImageBackground source={{uri:churchAssets.worship}} style={{borderRadius:25,overflow:'hidden'}} imageStyle={{borderRadius:25}} resizeMode="cover"><View style={s.hero}><Tag>YOU BELONG HERE</Tag>
        <Text style={[s.heroTitle,{color:'#FFFFFF'}]}>Welcome to{ '\n' }Solid Rock.</Text>
        <Text style={[s.heroCopy,{color:'#F2EBDD'}]}>{INTRO}</Text>
        <PrimaryButton label="Plan your visit  ↗" onPress={()=>{void Linking.openURL(VISIT_URL);}}/>
      </View></ImageBackground>
      <View style={s.quickRow}>
        <Pressable style={s.quick} onPress={() => goTab('Watch')} accessibilityRole="button"><Text style={s.quickIcon}>▶</Text><Text style={s.quickTitle}>Watch</Text><Text style={s.quickMeta}>Worship & study</Text></Pressable>
        <Pressable style={s.quick} onPress={() => goTab('Events')} accessibilityRole="button"><Text style={s.quickIcon}>▦</Text><Text style={s.quickTitle}>Events</Text><Text style={s.quickMeta}>Gather together</Text></Pressable>
        <Pressable style={s.quick} onPress={() => goPage('Prayer')} accessibilityRole="button"><Text style={s.quickIcon}>♡</Text><Text style={s.quickTitle}>Prayer</Text><Text style={s.quickMeta}>Find support</Text></Pressable>
      </View>
      {remote?.announcements?.length ? <><SectionHeading title="Church announcements"/>{remote.announcements.slice(0,2).map(a=><Surface key={a.id}><Text style={s.cardTitle}>{a.title}</Text><Text style={s.body}>{a.body}</Text></Surface>)}</> : null}
      <SectionHeading title="This week" action="All events" onAction={() => goTab('Events')}/>
      <Surface><Tag>WEEKLY WORSHIP</Tag><Text style={s.cardTitle}>{SUNDAY_SERVICE}</Text><Text style={s.body}>{CONTACT_ADDRESS}</Text><PrimaryButton label="Plan a visit  ↗" outline onPress={()=>{void Linking.openURL(VISIT_URL);}}/></Surface>
      <SectionHeading title="Life at Solid Rock"/>
      <Image source={{uri:churchAssets.community}} style={{width:'100%',height:180,borderRadius:18}} resizeMode="cover" accessibilityLabel="Solid Rock Dublin community photography"/>
      {MINISTRIES.map(m=><Surface key={m.name}><Text style={s.cardTitle}>{m.name}</Text><Text style={s.body}>{m.detail}</Text><PrimaryButton label="Learn more  ↗" outline onPress={()=>{void Linking.openURL(m.url);}}/></Surface>)}
      <SectionHeading title="Grow in the Word" action="Explore" onAction={() => goTab('Watch')}/>
      <Surface><Text style={s.kicker}>REFLECTION</Text><Text style={s.cardTitle}>Rooted in faith</Text><Text style={s.body}>A short reading guide to help you reflect during the week.</Text><Pressable onPress={() => goPage('Bible')} accessibilityRole="button"><Text style={s.action}>Open Bible resources →</Text></Pressable></Surface>
    </>;
  }

  function Watch() {
    const filtered = sampleMessages.filter(m => (m.title + m.description + m.passage).toLowerCase().includes(search.toLowerCase()));
    return <>
      <Text style={s.pageTitle}>Watch & grow</Text><Text style={s.pageIntro}>Worship, teaching and Scripture for every day.</Text>
      <View style={s.mediaHero}><Text style={s.livePill}>● WORSHIP ONLINE</Text><Text style={s.mediaTitle}>Join our community{ '\n' }in worship</Text><Text style={s.mediaSub}>Official services and the latest messages are available through the church.</Text><PrimaryButton label="Visit official media  ↗" onPress={openOfficialSite}/></View>
      {remote?.sermons?.length ? <><SectionHeading title="Church sermons"/>{remote.sermons.map(m=><Surface key={m.id}><Tag>{m.series||'SERMON'}</Tag><Text style={s.cardTitle}>{m.title}</Text><Text style={s.body}>{m.description}</Text><Text style={s.meta}>{[m.speaker,m.passage].filter(Boolean).join(' · ')}</Text>{m.media_url?.startsWith('https://')?<PrimaryButton label="Open sermon  ↗" outline onPress={()=>{void Linking.openURL(m.media_url!);}}/>:null}</Surface>)}</> : null}
      <SectionHeading title="Study guides"/><TextInput accessibilityLabel="Search study guides" value={search} onChangeText={setSearch} placeholder="Search topics or Scripture" placeholderTextColor={T.muted} style={s.input}/>
      {filtered.map(m => <Surface key={m.id}><Tag>{m.series}</Tag><Text style={s.cardTitle}>{m.title}</Text><Text style={s.body}>{m.description}</Text><Text style={s.meta}>{m.passage}</Text><Pressable accessibilityRole="button" onPress={() => toggleBookmark(m.id)}><Text style={s.action}>{preferences.bookmarks.includes(m.id) ? '★ Saved to this device' : '☆ Save reading guide'}</Text></Pressable></Surface>)}
      {filtered.length === 0 && <Text style={s.body}>No guides match your search.</Text>}
      <Text style={s.disclaimer}>These are original sample reading guides, not recordings or sermons attributed to church leaders.</Text>
    </>;
  }

  function Events() {
    return <><Text style={s.pageTitle}>Gather together</Text><Text style={s.pageIntro}>Discover ways to connect with your church community.</Text>
      <Surface><Tag>PLAN YOUR WEEK</Tag><Text style={s.cardTitle}>Church calendar</Text><Text style={s.body}>Explore current services and activities on the official church website. The starter cards below are illustrative weekly activities.</Text><PrimaryButton label="View church schedule  ↗" onPress={openOfficialSite}/></Surface>
      {remote?.events?.length ? <><SectionHeading title="Verified church events"/>{remote.events.map(ev=><Surface key={ev.id}><Text style={s.cardTitle}>{ev.title}</Text><Text style={s.body}>{ev.description}</Text><Text style={s.meta}>{new Date(ev.starts_at).toLocaleString('en-IE')} {ev.venue||''}</Text>{ev.registration_enabled?<PrimaryButton label="Register in Church hub" outline onPress={()=>goPage('Church hub')}/>:null}</Surface>)}</> : null}
      <SectionHeading title="Explore gatherings"/>
      {sampleEvents.map(ev => {
        const added = preferences.interests.includes(ev.id);
        return <Surface key={ev.id}><View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
          <View style={s.dateBox}><Text style={s.dateTop}>{ev.day}</Text><Text style={s.dateBottom}>{ev.date}</Text></View>
          <View style={{ flex: 1 }}><Text style={s.kicker}>{ev.label}</Text><Text style={s.cardTitle}>{ev.title}</Text><Text style={s.body}>{ev.detail}</Text></View></View>
          <PrimaryButton label={added ? '✓ Added to my interests' : '+ Save my interest'} outline onPress={() => toggleInterest(ev.id)}/>
        </Surface>;
      })}
      <Text style={s.disclaimer}>Saving interest stores a preference on this device only. It does not register you or notify the church.</Text>
    </>;
  }

  function Give() {
    return <><Text style={s.pageTitle}>A heart of generosity</Text><Text style={s.pageIntro}>Give thoughtfully, securely and with confidence.</Text>
      <View style={s.scripture}><Text style={s.scriptureText}>“God loves a cheerful giver.”</Text><Text style={s.scriptureRef}>2 Corinthians 9:7</Text></View>
      <SectionHeading title="Ways to give"/>
      {[
        ['Tithes & offerings', 'Support the day-to-day ministry of the church.'],
        ['Missions & outreach', 'Learn how to support church-approved community initiatives.'],
        ['Special projects', 'Discover current projects directly from the church.'],
      ].map(([title, detail]) => <Surface key={title}><Text style={s.cardTitle}>{title}</Text><Text style={s.body}>{detail}</Text></Surface>)}
      <Surface><Text style={s.kicker}>SECURITY FIRST</Text><Text style={s.cardTitle}>Only use verified payment details</Text><Text style={s.body}>For current giving methods, payment references and confirmed beneficiaries, continue to the official church website. No payment or financial information is collected by this prototype.</Text><PrimaryButton label="Official giving information  ↗" onPress={openOfficialSite}/></Surface>
    </>;
  }

  function More() {
    const links: { title: string; desc: string; target?: Page; external?: boolean }[] = [
      { title: 'Bible & reading', desc: 'Open Scripture and reading guides', target: 'Bible' },
      { title: 'Prayer & care', desc: 'Private pastoral contact information', target: 'Prayer' },
      { title: 'Fellowships & ministries', desc: 'Connect and discover ways to serve', target: 'Groups' },
      { title: 'Church hub', desc: 'Membership, events, groups, pastoral care and reading plans', target: 'Church hub' },
      { title: 'My saved items', desc: 'Local event interests and study bookmarks', target: 'My interests' },
      { title: 'About Solid Rock', desc: 'Find our church and plan a visit', target: 'About' },
      { title: 'Official website', desc: 'Latest information and announcements', external: true },
    ];
    return <><Text style={s.pageTitle}>More to explore</Text><Text style={s.pageIntro}>Faith, community and helpful resources.</Text>
      {links.map(l => <Pressable accessibilityRole="button" key={l.title} style={s.menuRow} onPress={() => l.external ? void openOfficialSite() : goPage(l.target ?? null)}>
        <View style={{ flex: 1 }}><Text style={s.menuTitle}>{l.title}</Text><Text style={s.menuDesc}>{l.desc}</Text></View><Text style={s.chevron}>›</Text>
      </Pressable>)}
      <Text style={s.disclaimer}>Member accounts, financial statements and pastoral bookings require approved integrations and are not enabled in this MVP.</Text>
    </>;
  }

  function Detail() {
    return <><Pressable accessibilityRole="button" onPress={() => goPage(null)} style={{ marginBottom: 22 }}><Text style={s.action}>← Back</Text></Pressable>
      {page === 'Church hub' ? <MemberHub/> : <Text style={s.pageTitle}>{page}</Text>}
      {page === 'Bible' && <><Text style={s.pageIntro}>Scripture is for everyone. No account required.</Text>
        <Surface><Tag>READING RESOURCE</Tag><Text style={s.cardTitle}>Ephesians 2:8–10</Text><Text style={s.body}>Reflect on grace, faith and a life shaped by good works. Open a Bible translation through the church's approved resources.</Text><PrimaryButton label="Explore Scripture resources  ↗" onPress={openOfficialSite}/></Surface>
        <Surface><Text style={s.cardTitle}>Suggested reflection</Text><Text style={s.body}>What does it mean to respond to grace with generosity, humility and service?</Text></Surface></>}
      {page === 'Prayer' && <><Text style={s.pageIntro}>You are not alone. Connect with the church for prayer and pastoral care.</Text>
        <Surface><Text style={s.cardTitle}>Prepare a prayer request</Text><Text style={s.body}>You may draft a short personal note below. It stays in this screen and is not submitted, saved or shared.</Text>
          <TextInput multiline value={prayer} onChangeText={setPrayer} placeholder="Write a private draft (optional)" placeholderTextColor={T.muted} style={[s.input, { height: 120, textAlignVertical: 'top' }]} accessibilityLabel="Draft prayer request"/>
          <PrimaryButton label="Contact the church  ↗" onPress={openOfficialSite}/><Text style={s.disclaimer}>Do not enter urgent or highly sensitive information here. For immediate danger, contact local emergency services.</Text></Surface></>}
      {page === 'Groups' && <><Text style={s.pageIntro}>Find a place to grow, serve and build meaningful relationships.</Text>
        <Surface><Text style={s.cardTitle}>Life together</Text><Text style={s.body}>Connect with ministries, fellowship gatherings and outreach initiatives. For current group availability and volunteer opportunities, contact the church.</Text><PrimaryButton label="Explore community  ↗" onPress={openOfficialSite}/></Surface></>}
      {page === 'About' && <><Text style={s.pageIntro}>A welcoming community of faith in Dublin.</Text><Surface><Text style={s.cardTitle}>{CHURCH_NAME}</Text><Text style={s.body}>Visit the church's website for current directions, service times, ministries and contact information.</Text><PrimaryButton label="Visit solidrockdublin.org  ↗" onPress={openOfficialSite}/></Surface></>}
      {page === 'My interests' && <><Text style={s.pageIntro}>Saved locally on this device, not connected to a church account.</Text>
        <SectionHeading title="Gatherings"/>{preferences.interests.length ? sampleEvents.filter(x => preferences.interests.includes(x.id)).map(x => <Surface key={x.id}><Text style={s.cardTitle}>{x.title}</Text><Pressable onPress={() => toggleInterest(x.id)}><Text style={s.action}>Remove from saved</Text></Pressable></Surface>) : <Text style={s.body}>No gatherings saved yet.</Text>}
        <SectionHeading title="Reading guides"/>{preferences.bookmarks.length ? sampleMessages.filter(x => preferences.bookmarks.includes(x.id)).map(x => <Surface key={x.id}><Text style={s.cardTitle}>{x.title}</Text><Pressable onPress={() => toggleBookmark(x.id)}><Text style={s.action}>Remove bookmark</Text></Pressable></Surface>) : <Text style={s.body}>No reading guides bookmarked yet.</Text>}</>}
    </>;
  }

  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}><StatusBar barStyle={mode==='dark'?'light-content':'dark-content'} backgroundColor={T.white}/>
    <Header onAbout={() => goPage('About')} mode={mode} toggleMode={toggleMode}/>
    {loading ? <View style={s.loading}><ActivityIndicator color={T.brand}/></View> : <>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.scrollContent, { width: contentWidth, alignSelf: 'center' }]}>{page ? Detail() : tab === 'Home' ? Home() : tab === 'Watch' ? Watch() : tab === 'Events' ? Events() : tab === 'Give' ? Give() : More()}</ScrollView>
      <View style={s.tabBar}>{tabs.map(t => <Pressable key={t.name} accessibilityRole="tab" accessibilityState={{ selected: tab === t.name && !page }} accessibilityLabel={t.name} onPress={() => goTab(t.name)} style={s.tab}>
        <Text style={[s.tabIcon, tab === t.name && !page && s.active]}>{t.icon}</Text><Text style={[s.tabText, tab === t.name && !page && s.active]}>{t.name}</Text></Pressable>)}</View>
    </>}
  </SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><AppContent/></SafeAreaProvider>; }

let s: ReturnType<typeof makeStyles>;
function makeStyles(){return StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.background },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 11, borderBottomWidth: 1, borderBottomColor: T.border },
  mark: { backgroundColor: T.brand, width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: 16, color: T.background, fontWeight: '900', letterSpacing: -1 },
  brand: { color: T.ink, fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  subBrand: { fontSize: 9, color: T.muted, fontWeight: '700', letterSpacing: 1.35, marginTop: 3 },
  info: { borderRadius: 20, borderWidth: 1, borderColor: T.border, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingTop: 20, paddingBottom: 32, gap: 14 },
  hero: { borderRadius: 25, padding: 25, backgroundColor: 'rgba(15,13,10,0.70)', gap: 15, minHeight:300, justifyContent:'center' },
  heroTitle: { color: T.ink, fontWeight: '900', fontSize: 35, lineHeight: 42, letterSpacing: -1.3 },
  heroCopy: { color: T.muted, fontSize: 15, lineHeight: 23 },
  button: { alignItems: 'center', justifyContent: 'center', backgroundColor: T.brand, borderRadius: 13, minHeight: 48, paddingHorizontal: 18, paddingVertical: 12, marginTop: 6 },
  buttonOutline: { backgroundColor: T.white, borderWidth: 1, borderColor: T.border },
  buttonText: { color: T.background, fontWeight: '700', fontSize: 14 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quick: { flex: 1, paddingVertical: 18, paddingHorizontal: 11, backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 17, minWidth: 0 },
  quickIcon: { fontSize: 22, color: T.blue, marginBottom: 8 },
  quickTitle: { fontSize: 14, fontWeight: '800', color: T.ink },
  quickMeta: { color: T.muted, fontSize: 10, marginTop: 4 },
  headingRow: { marginTop: 12, marginBottom: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { color: T.ink, fontWeight: '800', fontSize: 21, letterSpacing: -0.5 },
  action: { color: T.blue, fontSize: 13, fontWeight: '700', paddingVertical: 6 },
  surface: { backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 19, padding: 19, gap: 10 },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#DFE8F9' },
  tagText: { color: T.brand, fontSize: 10, fontWeight: '800', letterSpacing: 0.75 },
  cardTitle: { color: T.ink, fontSize: 20, fontWeight: '800', lineHeight: 26, letterSpacing: -0.4 },
  body: { color: T.muted, fontSize: 14, lineHeight: 22 },
  kicker: { color: T.blue, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  meta: { color: T.ink, fontWeight: '600', fontSize: 12 },
  pageTitle: { color: T.ink, fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  pageIntro: { color: T.muted, lineHeight: 22, fontSize: 15, marginBottom: 4 },
  mediaHero: { backgroundColor: T.ink, borderRadius: 22, padding: 25, gap: 15 },
  mediaTitle: { color: T.white, fontSize: 27, fontWeight: '900', lineHeight: 34 },
  mediaSub: { color: '#CCD7E9', fontSize: 14, lineHeight: 22 },
  livePill: { color: '#F1CB90', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  input: { borderRadius: 13, backgroundColor: T.background, color: T.ink, borderWidth: 1, borderColor: T.border, padding: 14, fontSize: 14 },
  disclaimer: { fontSize: 12, color: T.muted, lineHeight: 19, marginTop: 7 },
  dateBox: { width: 63, borderRadius: 13, backgroundColor: T.pale, paddingVertical: 12, alignItems: 'center', gap: 5 },
  dateTop: { color: T.blue, fontWeight: '900', fontSize: 12 },
  dateBottom: { color: T.ink, fontWeight: '700', fontSize: 10 },
  scripture: { borderRadius: 18, borderLeftWidth: 4, borderLeftColor: T.gold, backgroundColor: T.pale, padding: 23, gap: 8 },
  scriptureText: { color: T.ink, fontSize: 20, fontWeight: '700', lineHeight: 29 },
  scriptureRef: { color: T.blue, fontSize: 12, fontWeight: '700' },
  menuRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 18, gap: 12 },
  menuTitle: { fontSize: 16, fontWeight: '800', color: T.ink },
  menuDesc: { color: T.muted, marginTop: 4, fontSize: 12, lineHeight: 18 },
  chevron: { fontSize: 27, color: T.blue },
  tabBar: { flexDirection: 'row', paddingTop: 10, paddingBottom: 4, paddingHorizontal: 7, borderTopWidth: 1, borderTopColor: T.border, backgroundColor: T.white },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4, minHeight: 53 },
  tabIcon: { fontSize: 22, color: T.muted, fontWeight: '600' },
  tabText: { fontSize: 10, color: T.muted, fontWeight: '700' },
  active: { color: T.blue },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});}
s=makeStyles();
