import React, { useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppIcon, {type IconName} from './src/AppIcon';
import Onboarding from './src/Onboarding';
import CommunityScreen from './src/CommunityScreen';
import GivingScreen from './src/GivingScreen';
import BibleReader from './src/BibleReader';
import JourneyScreen from './src/JourneyScreen';
import TalkToUsScreen from './src/TalkToUsScreen';
import SocialConnectScreen from './src/SocialConnectScreen';
import NotificationsScreen from './src/NotificationsScreen';
import PreferencesScreen,{loadAppPreferences,APP_PREF_KEY,DEFAULT_APP_PREFERENCES,type AppPreferences} from './src/PreferencesScreen';
import {disableReminder} from './src/Reminder';
import { Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Mulish_400Regular, Mulish_700Bold } from '@expo-google-fonts/mulish';
import {
  ActivityIndicator, Alert, Linking, Pressable, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, View, Image, ImageBackground, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHURCH_NAME, CHURCH_URL, INTRO, sampleEvents, sampleMessages, SUNDAY_SERVICE, CONTACT_ADDRESS, VISIT_URL, MINISTRIES } from './src/content';
import { theme as T, setActiveTheme, churchAssets, type ThemeMode } from './src/theme';
import MemberHub from './src/MemberHub';
import YouTubePlayer from './src/YouTubePlayer';
import { loadMediaFeed, YOUTUBE_CHANNEL, YOUTUBE_LIVE, INSTAGRAM_CHANNEL, OFFICIAL_PLAYLISTS, type MediaFeed } from './src/mediaFeed';
import { cloudEnabled, getPublicContent } from './src/backend';

type Tab = 'Home' | 'Watch' | 'Community' | 'Events' | 'More';
type Page = 'Bible' | 'Prayer' | 'Groups' | 'About' | 'Privacy' | 'Giving' | 'My interests' | 'Church hub' | 'Social' | 'Talk to us' | 'Preferences' | 'Notifications' | 'Journey' | null;
const tabs: { name: Tab; icon:IconName }[] = [
  {name:'Home',icon:'home'},{name:'Watch',icon:'watch'},
  {name:'Community',icon:'community'},{name:'Events',icon:'events'},
  {name:'More',icon:'more'}
];
const WELCOME_KEY='@solidrock:welcome:v1';
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
  return <Pressable accessibilityRole="button" onPress={onPress} style={({pressed})=>[s.button,outline&&s.buttonOutline,pressed&&{opacity:.8}]}>
    <Text style={[s.buttonText,outline&&{color:T.ink}]}>{label.replace(/\\s+[↗→]$/,'')}</Text>
    {/[↗→]$/.test(label)&&<AppIcon name="arrow" size={17} color={outline?T.gold:'#16110A'}/>}
  </Pressable>;
}
function Surface({ children }: { children: React.ReactNode }) {
  return <View style={s.surface}>{children}</View>;
}
function MinistryImage({asset,name}:{asset:keyof typeof churchAssets;name:string}){
  const [failed,setFailed]=useState(false);
  return failed?<View style={{width:'100%',height:155,backgroundColor:T.pale,borderRadius:12,justifyContent:'center',alignItems:'center'}}><Text style={{color:T.muted}}>Solid Rock · {name}</Text></View>:
    <Image source={{uri:churchAssets[asset]}} onError={()=>setFailed(true)} resizeMode="cover"
      accessibilityLabel={name+' ministry photograph from the official church website'}
      style={{width:'100%',height:155,borderRadius:12}}/>;
}
function Header({ mode, toggleMode, onNotifications }: { mode:ThemeMode; toggleMode:()=>void;onNotifications:()=>void }) {
  const [logoFailed,setLogoFailed]=useState(false);
  useEffect(()=>setLogoFailed(false),[mode]);
  return <View style={s.topbar}>{logoFailed ? <View style={s.mark}><Text style={s.markText}>SR</Text></View> : <Image source={{uri:mode==='dark'?churchAssets.logoDark:churchAssets.logoLight}} onError={()=>setLogoFailed(true)} style={{height:49,width:55}} resizeMode="contain" accessibilityLabel="Solid Rock Dublin official logo"/>}
    <View style={{ flex: 1 }}><Text style={s.brand}>{CHURCH_NAME}</Text><Text style={s.subBrand}>YOUR CHURCH. EVERY DAY.</Text></View>
    <Pressable accessibilityLabel={mode==='dark'?'Switch to light mode':'Switch to dark mode'} accessibilityRole="button" accessibilityHint="Changes the app colour theme" onPress={toggleMode} style={s.info}><AppIcon name={mode==='dark'?'sun':'moon'} size={19} color={T.ink}/></Pressable>
    <Pressable accessibilityLabel="Open updates" accessibilityRole="button" onPress={onNotifications} style={s.info}><AppIcon name="bell" size={19} color={T.gold}/></Pressable>
  </View>;
}
function AppContent() {
  const { width } = useWindowDimensions();
  const [mode,setMode]=useState<ThemeMode>('dark');
  const [appPrefs,setAppPrefs]=useState<AppPreferences>({...DEFAULT_APP_PREFERENCES});
  const [studyShare,setStudyShare]=useState<string|null>(null);
  useEffect(()=>{let alive=true;void loadAppPreferences().then(v=>{if(alive)setAppPrefs(v);});return()=>{alive=false;};},[]);
  const [onboarding,setOnboarding]=useState<'loading'|'show'|'done'>('loading');
  setActiveTheme(mode);
  s=makeStyles();
  useEffect(()=>{let mounted=true;AsyncStorage.getItem('@solidrock:theme').then(v=>{if(mounted&&(v==='light'||v==='dark'))setMode(v);}).catch(()=>{});return()=>{mounted=false;};},[]);
  function toggleMode(){const next=mode==='dark'?'light':'dark';setMode(next);void AsyncStorage.setItem('@solidrock:theme',next).catch(()=>{});}
  useEffect(()=>{let alive=true;AsyncStorage.getItem(WELCOME_KEY).then(x=>{if(alive)setOnboarding(x==='done'?'done':'show');}).catch(()=>{if(alive)setOnboarding('show');});return()=>{alive=false;};},[]);
  function finishOnboarding(interest:'faith'|'community'|'media'|'events'|null){setOnboarding('done');void AsyncStorage.setItem(WELCOME_KEY,'done').catch(()=>{});setTab(interest==='community'?'Community':interest==='media'?'Watch':interest==='events'?'Events':'Home');}
  const [tab, setTab] = useState<Tab>('Home');
  const [page, setPage] = useState<Page>(null);
  const [preferences, setPreferences] = useState<Preferences>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const scrollRef=useRef<ScrollView>(null);
  const [media,setMedia]=useState<MediaFeed|null>(null);
  const [mediaCached,setMediaCached]=useState(false);
  const [mediaBusy,setMediaBusy]=useState(false);
  const [selectedVideo,setSelectedVideo]=useState<string|null>(null);
  const [selectedPlaylist,setSelectedPlaylist]=useState<string|null>(null);
  const [mediaView,setMediaView]=useState<'live'|'videos'|'clips'|'playlists'>('live');
  async function refreshMedia(){setMediaBusy(true);try{const v=await loadMediaFeed();setMedia(v.feed);setMediaCached(v.fromCache);}finally{setMediaBusy(false);}}
  useEffect(()=>{void refreshMedia();},[]);
  function chooseVideo(id:string){setSelectedVideo(id);setSelectedPlaylist('');scrollRef.current?.scrollTo({y:0,animated:true});}
  function choosePlaylist(id:string){setSelectedVideo(null);setSelectedPlaylist(id);scrollRef.current?.scrollTo({y:0,animated:true});}
  const [prayer, setPrayer] = useState('');
  const [confirmErase,setConfirmErase]=useState(false);
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
      <ImageBackground accessibilityLabel="Solid Rock congregation gathering for worship" source={{uri:churchAssets.worship}} style={{borderRadius:25,overflow:'hidden'}} imageStyle={{borderRadius:25}} resizeMode="cover"><View style={s.hero}><Tag>YOU BELONG HERE</Tag>
        <Text style={[s.heroTitle,{color:'#FFFFFF'}]}>Faith beyond{ '\n' }Sunday.</Text>
        <Text style={[s.heroCopy,{color:'#F2EBDD'}]}>A space to belong, reflect, pray and stay connected with your church family.</Text>
        <Text style={{fontFamily:'Mulish_700Bold',fontSize:13,color:'#F5E3B3'}}>{SUNDAY_SERVICE} · Inchicore, Dublin 8</Text>
        <PrimaryButton label="Plan your visit  ↗" onPress={()=>{void Linking.openURL(VISIT_URL);}}/>
      </View></ImageBackground>
      <View style={s.quickRow}>
        <Pressable style={s.quick} onPress={() => goTab('Watch')} accessibilityRole="button"><AppIcon name="watch" size={25} color={T.gold}/><Text style={s.quickTitle}>Watch</Text><Text style={s.quickMeta}>Worship & study</Text></Pressable>
        <Pressable style={s.quick} onPress={() => goTab('Community')} accessibilityRole="button"><AppIcon name="community" size={25} color={T.gold}/><Text style={s.quickTitle}>Community</Text><Text style={s.quickMeta}>Pray & connect</Text></Pressable>
        <Pressable style={s.quick} onPress={() => goPage('Prayer')} accessibilityRole="button"><AppIcon name="prayer" size={25} color={T.gold}/><Text style={s.quickTitle}>Prayer</Text><Text style={s.quickMeta}>Find support</Text></Pressable>
      </View>
      {remote?.announcements?.length ? <><SectionHeading title="Church announcements"/>{remote.announcements.slice(0,2).map(a=><Surface key={a.id}><Text style={s.cardTitle}>{a.title}</Text><Text style={s.body}>{a.body}</Text></Surface>)}</> : null}
      <SectionHeading title="This week" action="All events" onAction={() => goTab('Events')}/>
      <Surface><Tag>WEEKLY WORSHIP</Tag><Text style={s.cardTitle}>{SUNDAY_SERVICE}</Text><Text style={s.body}>{CONTACT_ADDRESS}</Text><PrimaryButton label="Plan a visit  ↗" outline onPress={()=>{void Linking.openURL(VISIT_URL);}}/></Surface>
      <SectionHeading title="Grow at your own pace" action="My journey" onAction={()=>goPage('Journey')}/>
      <Surface><Tag>THIS WEEK'S SMALL STEP</Tag><Text style={s.cardTitle}>Seven days. Your pace.</Text>
        <Text style={s.body}>Explore Scripture, kindness and everyday faith through simple reflections you can save privately.</Text>
        <PrimaryButton label="Start a personal faith journey" onPress={()=>goPage('Journey')}/>
      </Surface>
      <SectionHeading title="Find your place" action="Explore ministries" onAction={()=>goPage('Groups')}/>
      <Surface><Text style={s.cardTitle}>From first visit to feeling at home</Text>
        <Text style={s.body}>Meet people across backgrounds and generations, grow in Scripture and discover ways to serve.</Text>
        <PrimaryButton label="Discover community spaces" onPress={()=>goTab('Community')}/>
        <PrimaryButton label="Talk to us" outline onPress={()=>goPage('Talk to us')}/>
      </Surface>
      <SectionHeading title="From our community" action="Instagram" onAction={()=>{void Linking.openURL(INSTAGRAM_CHANNEL);}}/>
      {media?.instagram?.length ? media.instagram.slice(0,3).map(p=><Surface key={p.id}>
        {p.thumbnail&&<Image source={{uri:p.thumbnail}} accessibilityLabel="Solid Rock Centre Instagram post" resizeMode="cover" style={{height:180,width:'100%',borderRadius:12}}/>}
        <Tag>{p.type==='REELS'?'REEL':'INSTAGRAM'}</Tag>
        <Text style={s.body} numberOfLines={4}>{p.caption||'Latest update from Solid Rock Centre'}</Text>
        <PrimaryButton outline label="View original post  ↗" onPress={()=>{void Linking.openURL(p.permalink);}}/>
      </Surface>) : <Surface><Text style={s.cardTitle}>Follow Solid Rock Centre</Text>
        <Text style={s.body}>See official posts, reels and community photos on Instagram. A church-authorised feed will appear here when connected.</Text>
        <PrimaryButton label="Open Instagram  ↗" outline onPress={()=>{void Linking.openURL(INSTAGRAM_CHANNEL);}}/></Surface>}
      {media?.news?.length? <><SectionHeading title="From the church website"/>{media.news.slice(0,3).map(n=>
        <Surface key={n.id}><Text style={s.cardTitle}>{n.title}</Text><Text style={s.body}>{n.summary}</Text><PrimaryButton label="Read church update  ↗" outline onPress={()=>{void Linking.openURL(n.url);}}/></Surface>
      )}</>:null}
      <SectionHeading title="Grow in the Word" action="Explore" onAction={() => goTab('Watch')}/>
      <Surface><Text style={s.kicker}>REFLECTION</Text><Text style={s.cardTitle}>Rooted in faith</Text><Text style={s.body}>A short reading guide to help you reflect during the week.</Text><Pressable onPress={() => goPage('Bible')} accessibilityRole="button"><Text style={s.action}>Open Bible resources →</Text></Pressable></Surface>
    </>;
  }

  function Watch() {
    const filtered = sampleMessages.filter(m => (m.title + m.description + m.passage).toLowerCase().includes(search.toLowerCase()));
    return <>
      <Text style={s.pageTitle}>Watch & grow</Text><Text style={s.pageIntro}>Worship, teaching and Scripture for every day.</Text>
      <View style={s.mediaHero}>
        <Text style={s.livePill}>{media?.activeLive?'● LIVE NOW':'● SOLID ROCK CENTRE TV'}</Text>
        <Text style={s.mediaTitle}>{media?.activeLive?'Watch Sunday service live':'Worship, wherever you are'}</Text>
        <Text style={s.mediaSub}>{media?.activeLive?'Streaming now from the official Solid Rock Centre YouTube channel.':'Watch official messages, shorts and playlists directly in the app.'}</Text>
        <PrimaryButton label={media?.activeLive?'Watch on YouTube  ↗':'Open channel  ↗'} onPress={()=>{void Linking.openURL(media?.activeLive?.url||YOUTUBE_CHANNEL);}}/>
      </View>
      <View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}>
        {(['live','videos','clips','playlists'] as const).map(v=><Pressable key={v}
          accessibilityRole="button" accessibilityState={{selected:mediaView===v}}
          style={{backgroundColor:mediaView===v?T.brand:T.pale,borderRadius:14,paddingVertical:10,paddingHorizontal:13}}
          onPress={()=>setMediaView(v)}>
          <Text style={{color:mediaView===v?T.background:T.ink,fontSize:12,fontWeight:'800'}}>{v==='live'?'Live':v==='videos'?'Messages':v==='clips'?'Short clips':'Playlists'}</Text>
        </Pressable>)}
      </View>
      <Surface>
        <Tag>{selectedVideo?'NOW PLAYING':media?.activeLive?'CHURCH LIVESTREAM':'CHURCH VIDEO'}</Tag>
        {selectedVideo?<YouTubePlayer key={selectedVideo} videoId={selectedVideo}/>:
          selectedPlaylist?<YouTubePlayer key={selectedPlaylist} playlistId={selectedPlaylist}/>:
          media?.activeLive?<YouTubePlayer key={media.activeLive.id} videoId={media.activeLive.id}/>:
          <YouTubePlayer key={OFFICIAL_PLAYLISTS[0].id} playlistId={OFFICIAL_PLAYLISTS[0].id}/>}
        <Text style={s.body}>{selectedVideo?'Playing an official YouTube video.':media?.activeLive?
          'Live stream detected from the church channel.':
          'No live broadcast is confirmed right now. Browse an official playlist or check the Live channel.'}</Text>
        {media?.activeLive&&(selectedVideo||selectedPlaylist)&&<PrimaryButton outline label="Return to live service" onPress={()=>{setSelectedVideo(null);setSelectedPlaylist(null);}}/>}
        {!media?.activeLive&&<PrimaryButton outline label="Check for live service  ↗"
          onPress={()=>{void Linking.openURL(YOUTUBE_LIVE);}}/>}
        <PrimaryButton outline label={mediaBusy?'Checking feed…':'Refresh latest videos'} onPress={()=>{void refreshMedia();}}/>
        {mediaCached&&<Text style={s.disclaimer}>Showing previously available channel information. For live updates, the church media sync needs to be connected.</Text>}
        <Text style={s.disclaimer}>YouTube playback is hosted by YouTube, depends on internet access and may be unavailable when the creator disables embedding.</Text>
      </Surface>
      {mediaView==='live'&&<Surface><Text style={s.cardTitle}>Sunday worship · 11:00 am</Text>
        <Text style={s.body}>Join online from the church's verified YouTube channel or gather at Goldenbridge, Inchicore.</Text>
        <PrimaryButton outline label="Official live channel  ↗" onPress={()=>{void Linking.openURL(YOUTUBE_LIVE);}}/>
      </Surface>}
      {mediaView==='videos'&&<>
        <SectionHeading title="Recent church messages"/>
        {(media?.videos||[]).length?media!.videos.map(v=><Pressable key={v.id} accessibilityRole="button"
          accessibilityLabel={'Play '+v.title} onPress={()=>chooseVideo(v.id)} style={s.surface}>
          {v.thumbnail&&<Image source={{uri:v.thumbnail}} style={{width:'100%',aspectRatio:16/9,borderRadius:12}} resizeMode="cover"/>}
          <Text style={s.cardTitle}>{v.title}</Text>
          <Text style={s.meta}>{v.publishedAt?new Date(v.publishedAt).toLocaleDateString('en-IE'):''}</Text>
          <Text style={s.action}>▶ Play here</Text>
        </Pressable>):<Surface><Text style={s.body}>The latest videos will appear after the YouTube Data API is connected. Meanwhile, the curated church playlists above are playable.</Text>
          <PrimaryButton outline label="Browse all videos  ↗" onPress={()=>{void Linking.openURL(YOUTUBE_CHANNEL+'/videos');}}/></Surface>}
      </>}
      {mediaView==='clips'&&<>
        <SectionHeading title="Short messages"/>
        {(media?.clips||[]).length?media!.clips.map(v=><Pressable key={v.id} accessibilityRole="button"
          accessibilityLabel={'Play short clip '+v.title} onPress={()=>chooseVideo(v.id)} style={s.surface}>
          {v.thumbnail&&<Image source={{uri:v.thumbnail}} style={{width:'100%',height:140,borderRadius:12}} resizeMode="cover"/>}
          <Text style={s.cardTitle}>{v.title}</Text><Text style={s.action}>▶ Play short clip</Text>
        </Pressable>):<Surface><Text style={s.body}>Enjoy short highlights from the church's official #SHORT playlist.</Text>
          <PrimaryButton outline label="Play short clips here" onPress={()=>choosePlaylist(OFFICIAL_PLAYLISTS[1].id)}/></Surface>}
      </>}
      {mediaView==='playlists'&&<>
        <SectionHeading title="Official YouTube playlists"/>
        {(media?.playlists?.length?media.playlists:OFFICIAL_PLAYLISTS).map(p=><Surface key={p.id}>
          <Text style={s.cardTitle}>{p.title}</Text>
          <PrimaryButton outline label="▶ Play playlist in app" onPress={()=>choosePlaylist(p.id)}/>
        </Surface>)}
      </>}
      <Surface><Tag>FROM SOLID ROCK DUBLIN</Tag><Text style={s.cardTitle}>Demonstrating the Gospel of Christ</Text><Text style={s.body}>Listen to the welcome audio published on the official church website.</Text><PrimaryButton label="Listen to welcome message  ↗" outline onPress={()=>{void Linking.openURL('https://solidrockdublin.org/wp-content/uploads/2025/02/Welcome.mp3');}}/></Surface>
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

  function More() {
    const links: { title: string; desc: string; target?: Page; external?: boolean }[] = [
      { title: 'Bible & reading', desc: 'Read, highlight and discuss the World English Bible', target: 'Bible' },
      { title: 'Your faith journey', desc: 'Small reflections for every age and stage', target: 'Journey' },
      { title: 'Talk to us', desc: 'Questions, pastoral contact, inclusion and support', target: 'Talk to us' },
      { title: 'Updates', desc: 'Church messages and news in one place', target: 'Notifications' },
      { title: 'Preferences', desc: 'Black mode, reading comfort and reminders', target: 'Preferences' },
      { title: 'Prayer & fasting devotionals', desc: 'Read published 2026 church devotionals', external: true },
      { title: 'Prayer & care', desc: 'Private pastoral contact information', target: 'Prayer' },
      { title: 'Fellowships & ministries', desc: 'Connect and discover ways to serve', target: 'Groups' },
      { title: 'Welcome guide', desc: 'Explore what the app can do', target: null },
      { title: 'Church hub', desc: 'Membership, events, groups, pastoral care and reading plans', target: 'Church hub' },
      { title: 'Giving', desc: 'Support the church through verified giving information', target: 'Giving' },
      { title: 'Social channels', desc: 'Facebook, TikTok, Instagram, X and podcasts', target: 'Social' },
      { title: 'My saved items', desc: 'Local event interests and study bookmarks', target: 'My interests' },
      { title: 'About Solid Rock', desc: 'Find our church and plan a visit', target: 'About' },
      { title: 'Privacy and your data', desc: 'How this preview handles information', target: 'Privacy' },
      { title: 'Official website', desc: 'Latest information and announcements', external: true },
    ];
    return <><Text style={s.pageTitle}>Your space</Text><Text style={s.pageIntro}>Preferences, useful resources and your connection to Solid Rock.</Text>
      {links.map(l => <Pressable accessibilityRole="button" key={l.title} style={s.menuRow} onPress={() => l.title==='Welcome guide'?setOnboarding('show'):l.external ? void Linking.openURL(l.title==='Prayer & fasting devotionals'?'https://solidrockdublin.org/devotional/day-2-repentance-and-surrender':l.title==='Official YouTube'?YOUTUBE_CHANNEL:l.title==='Official Instagram'?INSTAGRAM_CHANNEL:CHURCH_URL) : goPage(l.target ?? null)}>
        <View style={{ flex: 1 }}><Text style={s.menuTitle}>{l.title}</Text><Text style={s.menuDesc}>{l.desc}</Text></View><AppIcon name="chevron" size={18} color={T.muted}/>
      </Pressable>)}
      <Text style={s.disclaimer}>Member accounts, financial statements and pastoral bookings require approved integrations and are not enabled in this MVP.</Text>
    </>;
  }

  function Detail() {
    return <><Pressable accessibilityRole="button" onPress={() => goPage(null)} style={{ marginBottom: 22 }}><Text style={s.action}>← Back</Text></Pressable>
      {page==='Church hub'?<MemberHub/>:!(['Bible','Giving','Social','Talk to us','Preferences','Notifications','Journey'] as Page[]).includes(page)&&<Text style={s.pageTitle}>{page}</Text>}
      {page === 'Giving' && <GivingScreen/>}
      {page === 'Talk to us' && <TalkToUsScreen/>}
      {page === 'Notifications' && <NotificationsScreen feed={media} announcements={remote?.announcements||[]} prefs={appPrefs} onWatch={()=>goTab('Watch')}/>}
      {page === 'Preferences' && <PreferencesScreen mode={mode} setMode={v=>{setMode(v);void AsyncStorage.setItem('@solidrock:theme',v);}} prefs={appPrefs} setPrefs={setAppPrefs} onAccount={()=>goPage('Church hub')}/>} 
      {page === 'Social' && <SocialConnectScreen feed={media} busy={mediaBusy} onRefresh={()=>{void refreshMedia();}} onWatch={()=>goTab('Watch')}/>}
      {page === 'Bible' && <BibleReader fontScale={appPrefs.fontScale} onShare={reference=>{setStudyShare(reference);goTab('Community');}}/>}
      {page === 'Journey' && <JourneyScreen onBible={()=>goPage('Bible')} onCommunity={()=>goTab('Community')}/>}
      {page === 'Prayer' && <><Text style={s.pageIntro}>You are not alone. Connect with the church for prayer and pastoral care.</Text>
        <Surface><Text style={s.cardTitle}>Prepare a prayer request</Text><Text style={s.body}>You may draft a short personal note below. It stays in this screen and is not submitted, saved or shared.</Text>
          <TextInput multiline value={prayer} onChangeText={setPrayer} placeholder="Write a private draft (optional)" placeholderTextColor={T.muted} style={[s.input, { height: 120, textAlignVertical: 'top' }]} accessibilityLabel="Draft prayer request"/>
          <PrimaryButton label="Talk privately to the church" onPress={()=>goPage('Talk to us')}/><Text style={s.disclaimer}>Do not enter urgent or highly sensitive information here. For immediate danger, contact local emergency services.</Text></Surface></>}
      {page === 'Groups' && <><Text style={s.pageIntro}>Find a place to learn, serve and meet people across cultures and generations.</Text>
        {MINISTRIES.map(m=><Surface key={m.name}><MinistryImage asset={m.image} name={m.name}/><Text style={s.cardTitle}>{m.name}</Text><Text style={s.body}>{m.detail}</Text><PrimaryButton label="Ask about this ministry" onPress={()=>goPage('Talk to us')}/></Surface>)}
        <PrimaryButton label="Explore conversations" onPress={()=>goTab('Community')}/></>}
      {page === 'About' && <><Text style={s.pageIntro}>Loving God, loving others and serving the world.</Text>
        <Surface><Tag>PLAN YOUR VISIT</Tag><Text style={s.cardTitle}>{CHURCH_NAME}</Text><Text style={s.body}>{SUNDAY_SERVICE}</Text><Text style={s.body}>{CONTACT_ADDRESS}</Text>
          <PrimaryButton label="Plan your visit  ↗" onPress={()=>{void Linking.openURL(VISIT_URL);}}/>
          <PrimaryButton label="Get directions  ↗" outline onPress={()=>{void Linking.openURL('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(CONTACT_ADDRESS));}}/></Surface>
        <Surface><Text style={s.cardTitle}>Get in touch</Text><Text style={s.body}>Questions about visiting, ministries or support? The church can help.</Text>
          <PrimaryButton label="Talk to us" outline onPress={()=>goPage('Talk to us')}/>
          <PrimaryButton label="Call the church  ↗" outline onPress={()=>{void Linking.openURL('tel:+35314549788');}}/></Surface>
      </>}
      {page === 'Privacy' && <><Text style={s.pageIntro}>Your information should be treated with care.</Text>
        <Surface><Text style={s.cardTitle}>What this preview stores</Text><Text style={s.body}>Saved interests, bookmarks, reading progress and your theme preference may be stored on your device. No payment data is collected in this preview.</Text><Text style={s.body}>Account details, registration, prayer requests and care records require an explicitly configured Solid Rock database. The current public preview is not connected to one.</Text></Surface>
        <Surface><Text style={s.cardTitle}>Your choices and support</Text><Text style={s.body}>A church-approved privacy notice, deletion workflow and data retention schedule are required before inviting real members to share personal data.</Text><PrimaryButton label="Contact Solid Rock  ↗" onPress={()=>{void Linking.openURL('mailto:admin@solidrockdublin.org');}}/>
          {!confirmErase?<PrimaryButton label="Clear locally saved preferences" outline onPress={()=>setConfirmErase(true)}/>:
            <><Text style={s.disclaimer}>This permanently clears local bookmarks, reading progress, saved event interest and appearance preferences on this device. It does not delete any separate church account.</Text>
            <PrimaryButton label="Yes, clear this device" onPress={()=>{void (async()=>{try{await Promise.all([AsyncStorage.removeItem(STORAGE),AsyncStorage.removeItem('@solidrock:reading-progress:v1'),AsyncStorage.removeItem('@solidrock:theme'),AsyncStorage.removeItem('@solidrock:web-chapters:v1'),AsyncStorage.removeItem('@solidrock:bible-highlights:v1'),AsyncStorage.removeItem('@solidrock:bible-notes:v1'),AsyncStorage.removeItem('@solidrock:updates-read:v1'),AsyncStorage.removeItem(APP_PREF_KEY)]);if(appPrefs.sundayReminderId)await disableReminder(appPrefs.sundayReminderId);setAppPrefs({...DEFAULT_APP_PREFERENCES});setPreferences(EMPTY);setMode('dark');setConfirmErase(false);}catch{Alert.alert('Unable to clear data','Please try again.');}})();}}/>
            <PrimaryButton label="Keep my saved data" outline onPress={()=>setConfirmErase(false)}/></>}
</Surface>
      </>}
      {page === 'My interests' && <><Text style={s.pageIntro}>Saved locally on this device, not connected to a church account.</Text>
        <SectionHeading title="Gatherings"/>{preferences.interests.length ? sampleEvents.filter(x => preferences.interests.includes(x.id)).map(x => <Surface key={x.id}><Text style={s.cardTitle}>{x.title}</Text><Pressable onPress={() => toggleInterest(x.id)}><Text style={s.action}>Remove from saved</Text></Pressable></Surface>) : <Text style={s.body}>No gatherings saved yet.</Text>}
        <SectionHeading title="Reading guides"/>{preferences.bookmarks.length ? sampleMessages.filter(x => preferences.bookmarks.includes(x.id)).map(x => <Surface key={x.id}><Text style={s.cardTitle}>{x.title}</Text><Pressable onPress={() => toggleBookmark(x.id)}><Text style={s.action}>Remove bookmark</Text></Pressable></Surface>) : <Text style={s.body}>No reading guides bookmarked yet.</Text>}</>}
    </>;
  }

  return <SafeAreaView style={s.safe} edges={['top','bottom']}>
    <StatusBar barStyle={mode==='dark'?'light-content':'dark-content'} backgroundColor={T.background}/>
    {onboarding==='loading'?<View style={s.loading}><ActivityIndicator color={T.gold}/></View>:
    onboarding==='show'?<Onboarding onFinish={finishOnboarding}/>:
    <>
      <Header onNotifications={()=>goPage('Notifications')} mode={mode} toggleMode={toggleMode}/>
      {loading?<View style={s.loading}><ActivityIndicator color={T.gold}/></View>:<>
        <ScrollView ref={scrollRef} key={page ?? tab} keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.scrollContent,{width:contentWidth,alignSelf:'center'}]}>
          {page?Detail():tab==='Home'?Home():tab==='Watch'?Watch():
            tab==='Community'?<CommunityScreen studyShare={studyShare} onAccount={()=>goPage('Church hub')} onVisit={()=>goPage('Talk to us')}/>:
            tab==='Events'?Events():More()}
        </ScrollView>
        <View style={s.tabBar}>{tabs.map(t=>{
          const active=tab===t.name&&!page;
          return <Pressable key={t.name} accessibilityRole="tab" accessibilityState={{selected:active}} accessibilityLabel={t.name}
            onPress={()=>goTab(t.name)} style={[s.tab,active&&s.tabSelected]}>
            <AppIcon name={t.icon} size={22} color={active?T.gold:T.muted} filled={active}/>
            <Text style={[s.tabText,active&&s.active]}>{t.name}</Text>
          </Pressable>;
        })}</View>
      </>}
    </>}
  </SafeAreaView>;
}
export default function App() { const [fontsLoaded] = useFonts({ Poppins_700Bold, Mulish_400Regular, Mulish_700Bold,...Ionicons.font }); return <SafeAreaProvider>{fontsLoaded ? <AppContent/> : <View style={{flex:1,backgroundColor:'#100F0D',justifyContent:'center',alignItems:'center'}}><ActivityIndicator color='#C9A24A'/></View>}</SafeAreaProvider>; }

let s: ReturnType<typeof makeStyles>;
function makeStyles(){return StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.background },
  topbar: { flexDirection:'row',alignItems:'center',paddingHorizontal:18,paddingVertical:12,gap:11,backgroundColor:T.background },
  mark: { backgroundColor: T.pale, width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: 16, color: T.gold, fontWeight: '900', letterSpacing: -1 },
  brand: { fontFamily:'Poppins_700Bold', color: T.ink, fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  subBrand: { fontFamily:'Mulish_400Regular', fontSize: 9, color: T.muted, fontWeight: '700', letterSpacing: 1.35, marginTop: 3 },
  info: { borderRadius: 20, borderWidth: 1, borderColor: T.border, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingTop:18,paddingBottom:36,gap:17 },
  hero: { borderRadius: 25, padding: 25, backgroundColor: 'rgba(15,13,10,0.70)', gap: 15, minHeight:300, justifyContent:'center' },
  heroTitle: { fontFamily:'Poppins_700Bold', color: T.ink, fontWeight: '900', fontSize: 35, lineHeight: 42, letterSpacing: -1.3 },
  heroCopy: { fontFamily:'Mulish_400Regular', color: T.muted, fontSize: 15, lineHeight: 23 },
  button: {alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9,backgroundColor:T.gold,borderRadius:16,minHeight:50,paddingHorizontal:19,paddingVertical:12,marginTop:6},
  buttonOutline: { backgroundColor: T.white, borderWidth: 1, borderColor: T.border },
  buttonText: {color:'#16110A',fontFamily:'Mulish_700Bold',fontSize:14},
  quickRow: { flexDirection: 'row', gap: 10 },
  quick: {flex:1,paddingVertical:20,paddingHorizontal:12,backgroundColor:T.white,borderWidth:1,borderColor:T.border,borderRadius:22,minWidth:0,gap:5},
  quickIcon: { fontSize: 22, color: T.blue, marginBottom: 8 },
  quickTitle: { fontFamily:'Poppins_700Bold', fontSize: 14, fontWeight: '800', color: T.ink },
  quickMeta: {fontFamily:'Mulish_400Regular',color:T.muted,fontSize:10,marginTop:2},
  headingRow: { marginTop: 12, marginBottom: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontFamily:'Poppins_700Bold', color: T.ink, fontWeight: '800', fontSize: 21, letterSpacing: -0.5 },
  action: { fontFamily:'Mulish_400Regular', color: T.blue, fontSize: 13, fontWeight: '700', paddingVertical: 6 },
  surface: { backgroundColor:T.white,borderWidth:1,borderColor:T.border,borderRadius:23,padding:19,gap:12 },
  tag: { alignSelf:'flex-start',paddingHorizontal:12,paddingVertical:7,borderRadius:12,backgroundColor:T.pale },
  tagText: { fontFamily:'Mulish_700Bold', color: T.gold, fontSize: 10, fontWeight: '800', letterSpacing: 0.75 },
  cardTitle: { fontFamily:'Poppins_700Bold', color: T.ink, fontSize: 20, fontWeight: '800', lineHeight: 26, letterSpacing: -0.4 },
  body: { fontFamily:'Mulish_400Regular', color: T.muted, fontSize: 14, lineHeight: 22 },
  kicker: { color: T.blue, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  meta: { fontFamily:'Mulish_400Regular', color: T.ink, fontWeight: '600', fontSize: 12 },
  pageTitle: { fontFamily:'Poppins_700Bold', color: T.ink, fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  pageIntro: { fontFamily:'Mulish_400Regular', color: T.muted, lineHeight: 22, fontSize: 15, marginBottom: 4 },
  mediaHero: { backgroundColor: '#20160F', borderRadius: 22, padding: 25, gap: 15 },
  mediaTitle: { fontFamily:'Poppins_700Bold', color: '#FFFFFF', fontSize: 27, fontWeight: '900', lineHeight: 34 },
  mediaSub: { color: '#E9E0D1', fontSize: 14, lineHeight: 22 },
  livePill: { color: '#F1CB90', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  input: { borderRadius: 13, backgroundColor: T.background, color: T.ink, borderWidth: 1, borderColor: T.border, padding: 14, fontSize: 14 },
  disclaimer: { fontFamily:'Mulish_400Regular', fontSize: 12, color: T.muted, lineHeight: 19, marginTop: 7 },
  dateBox: { width: 63, borderRadius: 13, backgroundColor: T.pale, paddingVertical: 12, alignItems: 'center', gap: 5 },
  dateTop: { color: T.blue, fontWeight: '900', fontSize: 12 },
  dateBottom: { color: T.ink, fontWeight: '700', fontSize: 10 },
  scripture: { borderRadius: 18, borderLeftWidth: 4, borderLeftColor: T.gold, backgroundColor: T.pale, padding: 23, gap: 8 },
  scriptureText: { fontFamily:'Poppins_700Bold', color: T.ink, fontSize: 20, fontWeight: '700', lineHeight: 29 },
  scriptureRef: { color: T.blue, fontSize: 12, fontWeight: '700' },
  menuRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 18, gap: 12 },
  menuTitle: { fontFamily:'Poppins_700Bold', fontSize: 16, fontWeight: '800', color: T.ink },
  menuDesc: { fontFamily:'Mulish_400Regular', color: T.muted, marginTop: 4, fontSize: 12, lineHeight: 18 },
  chevron: { fontSize: 27, color: T.blue },
  tabBar: {flexDirection:'row',paddingTop:8,paddingBottom:8,paddingHorizontal:10,borderTopWidth:1,borderTopColor:T.border,backgroundColor:T.background,gap:3},
  tab: {flex:1,alignItems:'center',justifyContent:'center',gap:4,paddingVertical:9,minHeight:57,borderRadius:15},
  tabSelected:{backgroundColor:T.pale},
  tabIcon: { fontSize: 22, color: T.muted, fontWeight: '600' },
  tabText: {fontFamily:'Mulish_700Bold',fontSize:10,color:T.muted},
  active: {color:T.gold},
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});}
s=makeStyles();
