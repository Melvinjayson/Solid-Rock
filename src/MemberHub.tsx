import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  churchDb, cloudEnabled, getPublicContent, requestEventRegistration, requestPastoralSlot,
  sendPrayerRequest, joinGroup, volunteer, givingHistory, pastoralAvailability,
  type Announcement, type ChurchEvent, type ChurchSermon, type ChurchGroup, type VolunteerOpportunity,
  type GivingRecord, type PastoralSlot,
  myEventRegistrations, myPastoralBookings, cancelEventRegistration, cancelPastoralBooking,
  type EventRegistration, type PastoralBooking,
} from './backend';
import { theme as T } from './theme';
import AppIcon,{type IconName} from './AppIcon';

type Section = 'Discover' | 'Account' | 'Events' | 'Community' | 'Care' | 'Giving' | 'Reading';
const sections: Section[] = ['Discover','Account','Events','Community','Care','Giving','Reading'];
type PublicData = Awaited<ReturnType<typeof getPublicContent>>;
type PersonalReading = Record<string, number[]>;
const READING_KEY='@solidrock:reading-progress:v1';
const plans=[
  { key:'grace', title:'Grace and gratitude', refs:['Ephesians 2:8–10','2 Corinthians 9:7','Romans 5:1','Psalm 100:4','Titus 3:5','Colossians 3:17','Psalm 136:1'] },
  { key:'faith', title:'Rooted in faith', refs:['Colossians 2:6–7','Hebrews 11:1','James 2:17','Proverbs 3:5–6','Mark 9:24','Romans 10:17','Psalm 46:10'] },
];
const blank: PublicData={events:[],sermons:[],announcements:[],groups:[],opportunities:[]};

function Card({title,children}:{title:string;children:React.ReactNode}) {
  const icon:IconName=/prayer|pastoral/i.test(title)?'prayer':/giving/i.test(title)?'give':/event/i.test(title)?'calendar':/group|fellowship/i.test(title)?'people':/reading|plan/i.test(title)?'book':/profile|sign in/i.test(title)?'shield':'sparkles';
  return <View style={styles.card}><View style={styles.cardHeading}>
    <View style={styles.cardIcon}><AppIcon name={icon} color={T.gold} size={19}/></View>
    <Text style={styles.cardTitle}>{title}</Text>
  </View>{children}</View>;
}
function CTA({title,onPress,disabled=false}:{title:string;onPress:()=>void;disabled?:boolean}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={[styles.cta,disabled&&styles.disabled]}><Text style={styles.ctaText}>{title}</Text><AppIcon name="arrow" color="#16110A" size={17}/></Pressable>;
}
function Info({children}:{children:React.ReactNode}){return <Text style={styles.body}>{children}</Text>;}
function fmt(date:string){try{return new Date(date).toLocaleString('en-IE',{dateStyle:'medium',timeStyle:'short'});}catch{return date;}}
function safeMessage(e:unknown){return e instanceof Error?e.message:'Something went wrong. Please try again.';}
async function officialLink(){try{await Linking.openURL('https://solidrockdublin.org/');}catch{Alert.alert('Website unavailable','Visit solidrockdublin.org directly.');}}

export default function MemberHub() {
  styles=makeStyles();
  const [section,setSection]=useState<Section>('Discover');
  const [data,setData]=useState<PublicData>(blank);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [userId,setUserId]=useState<string|null>(null);
  const [userEmail,setUserEmail]=useState('');
  const [email,setEmail]=useState('');
  const [otp,setOtp]=useState('');
  const [name,setName]=useState('');
  const [prayer,setPrayer]=useState('');
  const [giving,setGiving]=useState<GivingRecord[]>([]);
  const [slots,setSlots]=useState<PastoralSlot[]>([]);
  const [registrations,setRegistrations]=useState<EventRegistration[]>([]);
  const [bookings,setBookings]=useState<PastoralBooking[]>([]);
  const [reading,setReading]=useState<PersonalReading>({});
  const [savedGroups,setSavedGroups]=useState<string[]>([]);
  const [savedOpportunities,setSavedOpportunities]=useState<string[]>([]);

  const refresh=useCallback(async()=>{
    if(!cloudEnabled) return;
    setBusy(true);setError(null);
    try{setData(await getPublicContent());}
    catch(e){setError(safeMessage(e));}
    finally{setBusy(false);}
  },[]);
  useEffect(()=>{
    let live=true;
    AsyncStorage.getItem(READING_KEY).then(v=>{if(live&&v) setReading(JSON.parse(v) as PersonalReading);})
      .catch(()=>{});
    const client=churchDb;
    if(!client)return()=>{live=false;};
    void client.auth.getUser().then(({data:{user}})=>{
      if(!live)return;setUserId(user?.id??null);setUserEmail(user?.email??'');void refresh();
    });
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{
      if(!live)return;setUserId(session?.user.id??null);setUserEmail(session?.user.email??'');
    });
    return()=>{live=false;subscription.unsubscribe();};
  },[refresh]);

  async function run(action:()=>Promise<void>,success:string): Promise<boolean>{
    setBusy(true);
    try{await action();Alert.alert('Success',success);return true;}
    catch(e){Alert.alert('Unable to complete',safeMessage(e));return false;}
    finally{setBusy(false);}
  }
  async function saveReading(key:string,day:number) {
    const existing=reading[key]??[];
    const updated={...reading,[key]:existing.includes(day)?existing.filter(x=>x!==day):[...existing,day]};
    setReading(updated);
    try{await AsyncStorage.setItem(READING_KEY,JSON.stringify(updated));}
    catch{Alert.alert('Save failed','Reading progress could not be stored on this device.');}
    if(churchDb&&userId){
      const {error:e}=await churchDb.from('reading_progress').upsert({user_id:userId,plan_key:key,completed_days:updated[key]},{onConflict:'user_id,plan_key'});
      if(e) Alert.alert('Cloud sync not completed',e.message);
    }
  }
  async function signIn() {
    const target=email.trim();
    if(!/^\S+@\S+\.\S+$/.test(target)){Alert.alert('Enter a valid email address');return;}
    if(!churchDb){Alert.alert('Not configured','Membership sign-in requires the church Supabase project.');return;}
    await run(async()=>{
      const {error:e}=await churchDb!.auth.signInWithOtp({email:target,options:{shouldCreateUser:true}});
      if(e)throw e;
    },'Check your email for your sign-in code. The Supabase email template must be configured to send a six-digit OTP.');
  }
  async function verifyCode() {
    if(!churchDb)return;
    if(!/^\\d{6}$/.test(otp.trim())){Alert.alert('Enter the six-digit code from your email');return;}
    await run(async()=>{
      const {error:e}=await churchDb!.auth.verifyOtp({email:email.trim(),token:otp.trim(),type:'email'});
      if(e)throw e;
      setOtp('');
    },'You are signed in.');
  }
  async function updateName() {
    if(!churchDb||!userId)return;
    if(!name.trim()){Alert.alert('Enter a display name');return;}
    await run(async()=>{
      const {error:e}=await churchDb!.from('profiles').upsert({id:userId,display_name:name.trim(),email:userEmail});
      if(e)throw e;
    },'Your profile was saved.');
  }
  async function loadPrivate() {
    if(!userId)return;
    setBusy(true);
    try{
      const [records,available,reg,book]=await Promise.all([givingHistory(),pastoralAvailability(),myEventRegistrations(),myPastoralBookings()]);
      setGiving(records);setSlots(available);setRegistrations(reg);setBookings(book);
    }catch(e){setError(safeMessage(e));}finally{setBusy(false);}
  }
  function mustSignIn(){Alert.alert('Member sign-in required','Open the Account section to sign in first.');setSection('Account');}
  async function handleRegistration(event:ChurchEvent){
    if(!userId){mustSignIn();return;}
    if(await run(()=>requestEventRegistration(event.id),'Registration confirmed by the church service.')) {
      await loadPrivate();
    }
  }
  async function handleJoin(group:ChurchGroup){
    if(!userId){mustSignIn();return;}
    if(await run(()=>joinGroup(group.id),'Your fellowship membership was recorded.'))
      setSavedGroups(prev=>prev.includes(group.id)?prev:[...prev,group.id]);
  }
  async function handleVolunteer(opp:VolunteerOpportunity){
    if(!userId){mustSignIn();return;}
    if(await run(()=>volunteer(opp.id),'Your interest has been recorded.'))
      setSavedOpportunities(prev=>prev.includes(opp.id)?prev:[...prev,opp.id]);
  }

  return <View style={styles.wrap}>
    <Text style={styles.kicker}>YOUR CHURCH ACCOUNT</Text><Text style={styles.title}>Stay connected.</Text>
    <Info>Find church updates, manage your reading, and connect through verified member services when available.</Info>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionNav}>
      {sections.map(x=><Pressable accessibilityRole="tab" accessibilityState={{selected:section===x}} key={x} onPress={()=>{
        setSection(x);setError(null);if((x==='Giving'||x==='Care'||x==='Events')&&userId)void loadPrivate();
      }} style={[styles.pill,section===x&&styles.selected]}><Text style={[styles.pillText,section===x&&styles.selectedText]}>{x}</Text></Pressable>)}
    </ScrollView>
    {!cloudEnabled && <View style={styles.notice}><Text style={styles.noticeTitle}>Offline experience</Text><Info>Member services need a church-controlled Supabase deployment. Local reading plans and existing app features remain usable.</Info></View>}
    {error && <View style={styles.notice}><Text style={styles.danger}>{error}</Text><CTA title="Retry church data" onPress={()=>void refresh()}/></View>}
    {busy && <ActivityIndicator size="small" color={T.blue}/>}
    {section==='Discover' && <>
      <Card title="Latest announcements">{data.announcements.length ? data.announcements.map((a:Announcement)=><View key={a.id} style={styles.item}><Text style={styles.itemTitle}>{a.title}</Text><Info>{a.body}</Info></View>) : <Info>No verified church announcements are available in this app yet.</Info>}</Card>
      <Card title="Sermon library">{data.sermons.length ? data.sermons.map((s:ChurchSermon)=><View key={s.id} style={styles.item}><Text style={styles.itemTitle}>{s.title}</Text><Info>{[s.speaker,s.passage].filter(Boolean).join(' · ')}</Info>{s.description?<Info>{s.description}</Info>:null}{s.media_url&&/^https:\/\//.test(s.media_url)&&<CTA title="Open sermon" onPress={()=>void Linking.openURL(s.media_url!)}/>}</View>) : <Info>Verified church sermon feeds have not been published to the backend.</Info>}</Card>
      <CTA title="Refresh official content" onPress={()=>void refresh()} disabled={!cloudEnabled||busy}/>
    </>}
    {section==='Account' && <Card title={userId?'My membership':'Sign in to your church account'}>
      {userId ? <>
        <Info>Signed in as {userEmail||'member'}</Info>
        <TextInput accessibilityLabel="Display name" style={styles.input} value={name} onChangeText={setName} placeholder="Display name"/>
        <CTA title="Save profile" onPress={()=>void updateName()} disabled={busy}/>
        <CTA title="Sign out" onPress={()=>void run(async()=>{const {error:e}=await churchDb!.auth.signOut();if(e)throw e;},'Signed out successfully.')} disabled={busy}/>
      </> : <>
        <Info>Access registrations, pastoral bookings and verified giving history. A sign-in email is sent only when church authentication is configured.</Info>
        <TextInput accessibilityLabel="Email address" autoCapitalize="none" keyboardType="email-address" style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address"/>
        <CTA title="Send sign-in code" onPress={()=>void signIn()} disabled={!cloudEnabled||busy}/>
        <TextInput accessibilityLabel="Six-digit sign-in code" keyboardType="number-pad" maxLength={6} style={styles.input} value={otp} onChangeText={setOtp} placeholder="Six-digit email code"/>
        <CTA title="Verify code and sign in" onPress={()=>void verifyCode()} disabled={!cloudEnabled||busy||otp.trim().length!==6}/>
      </>}
      <Info>Member records are isolated from Liberty-TV. Signing in does not automatically import a ChMeetings account.</Info>
    </Card>}
    {section==='Events' && <Card title="Upcoming events">
      {data.events.length ? data.events.map((e:ChurchEvent)=><View key={e.id} style={styles.item}>
        <Text style={styles.itemTitle}>{e.title}</Text><Info>{fmt(e.starts_at)}{e.venue?' · '+e.venue:''}</Info><Info>{e.description}</Info>
        {e.registration_enabled&&<CTA title={registrations.some(r=>r.event_id===e.id&&r.status==='registered')?'Registered':'Register for event'} onPress={()=>void handleRegistration(e)} disabled={busy||registrations.some(r=>r.event_id===e.id&&r.status==='registered')}/>}
      </View>) : <Info>No verified events are available from the church backend. For confirmed events, use the official website.</Info>}
      {userId&&<><Text style={styles.cardTitle}>My event registrations</Text>{registrations.filter(x=>x.status==='registered').map(r=><View key={r.id} style={styles.item}><Text style={styles.itemTitle}>{data.events.find(e=>e.id===r.event_id)?.title||'Registered event'}</Text><CTA title="Cancel my registration" onPress={()=>void run(async()=>{await cancelEventRegistration(r.id);await loadPrivate();},'Registration cancelled.')} disabled={busy}/></View>)}</>}
      <CTA title="Official church calendar" onPress={()=>void officialLink()}/>
    </Card>}
    {section==='Community' && <>
      <Card title="Home fellowships">{data.groups.length ? data.groups.map((g:ChurchGroup)=><View key={g.id} style={styles.item}><Text style={styles.itemTitle}>{g.title}</Text><Info>{g.description}{g.location_label?' · '+g.location_label:''}</Info><CTA title={savedGroups.includes(g.id)?'Joined':'Join fellowship'} onPress={()=>void handleJoin(g)} disabled={busy||savedGroups.includes(g.id)}/></View>) : <Info>Fellowship listings are not yet configured.</Info>}</Card>
      <Card title="Volunteering">{data.opportunities.length ? data.opportunities.map((o:VolunteerOpportunity)=><View key={o.id} style={styles.item}><Text style={styles.itemTitle}>{o.title}</Text><Info>{o.description}</Info><CTA title={savedOpportunities.includes(o.id)?'Interest submitted':'Register interest'} onPress={()=>void handleVolunteer(o)} disabled={busy||savedOpportunities.includes(o.id)}/></View>) : <Info>Volunteer opportunities are not yet configured.</Info>}</Card>
    </>}
    {section==='Care' && <>
      <Card title="Confidential prayer request">
        <Info>Requests are visible only to you and authorised care staff. For emergencies, contact local emergency services.</Info>
        <TextInput accessibilityLabel="Prayer request" multiline maxLength={3000} style={[styles.input,{minHeight:110,textAlignVertical:'top'}]} placeholder="Write a private request" value={prayer} onChangeText={setPrayer}/>
        <CTA title="Securely send request" disabled={!cloudEnabled||busy||!prayer.trim()} onPress={()=>{
          if(!userId){mustSignIn();return;}
          void run(async()=>{await sendPrayerRequest(prayer);setPrayer('');},'Your prayer request was received.');
        }}/>
      </Card>
      <Card title="Pastoral appointments">
        {!userId?<Info>Sign in to see verified appointment availability.</Info>:slots.length?slots.map(slot=><View style={styles.item} key={slot.id}>
          <Info>{fmt(slot.starts_at)}</Info>
          <CTA title="Request appointment" onPress={()=>void run(()=>requestPastoralSlot(slot.id),'Your appointment booking was recorded.')} disabled={busy}/>
        </View>):<Info>No open pastoral slots are available from the backend.</Info>}
        {bookings.filter(b=>!b.cancelled_at).length>0&&<Text style={styles.cardTitle}>My appointments</Text>}
        {bookings.filter(b=>!b.cancelled_at).map(b=><View key={b.id} style={styles.item}><Info>Appointment reference: {b.id.slice(0,8)}</Info><CTA title="Cancel appointment" onPress={()=>void run(async()=>{await cancelPastoralBooking(b.id);await loadPrivate();},'Appointment cancelled.')} disabled={busy}/></View>)}
        <CTA title="Refresh availability" onPress={()=>void loadPrivate()} disabled={!cloudEnabled||!userId||busy}/>
      </Card>
    </>}
    {section==='Giving' && <Card title="Verified giving history">
      {!userId?<Info>Sign in to view your own giving history.</Info>:giving.length?<>
        {giving.map((g:GivingRecord)=><View style={styles.item} key={g.id}><Text style={styles.itemTitle}>{(g.amount_minor/100).toLocaleString('en-IE',{style:'currency',currency:g.currency})}</Text><Info>{g.fund_code} · {fmt(g.verified_at)}</Info></View>)}
        <Info>Only server-verified payments appear here. This is not a tax certificate.</Info>
      </>:<Info>No verified giving records are available for this account.</Info>}
      <CTA title="Refresh verified records" onPress={()=>void loadPrivate()} disabled={!userId||busy}/>
      <CTA title="Official giving guidance" onPress={()=>void officialLink()}/>
      <Info>Payment transactions, recurring gifts and downloadable statements require a verified payment provider and finance approval. No payment details are collected by this interface.</Info>
    </Card>}
    {section==='Reading' && <>
      {plans.map(plan=><Card key={plan.key} title={plan.title}>
        <Info>{(reading[plan.key]??[]).length} of {plan.refs.length} days completed — progress is saved on this device{userId?' and synced when permitted':''}.</Info>
        {plan.refs.map((ref,i)=><Pressable accessibilityRole="checkbox" accessibilityState={{checked:(reading[plan.key]??[]).includes(i+1)}} onPress={()=>void saveReading(plan.key,i+1)} key={i} style={styles.checkRow}>
          <Text style={styles.check}>{(reading[plan.key]??[]).includes(i+1)?'☑':'☐'}</Text><Text style={styles.checkLabel}>Day {i+1}: {ref}</Text>
        </Pressable>)}
      </Card>)}
      <CTA title="Read more through the church" onPress={()=>void officialLink()}/>
    </>}
  </View>;
}
let styles:ReturnType<typeof makeStyles>;
function makeStyles(){return StyleSheet.create({
  wrap:{gap:14,paddingBottom:24},
  kicker:{fontSize:10,fontFamily:'Mulish_700Bold',color:T.gold,letterSpacing:2},
  title:{fontSize:29,fontFamily:'Poppins_700Bold',color:T.ink,letterSpacing:-0.8},
  sectionNav:{gap:7,paddingVertical:7},
  pill:{paddingHorizontal:13,paddingVertical:10,borderRadius:18,backgroundColor:T.pale},
  selected:{backgroundColor:T.brand},
  pillText:{fontWeight:'700',fontSize:12,color:T.brand},
  selectedText:{color:T.background},
  card:{borderWidth:1,borderColor:T.border,borderRadius:23,padding:18,gap:13,backgroundColor:T.white},
  cardHeading:{flexDirection:'row',alignItems:'center',gap:11},
  cardIcon:{width:37,height:37,borderRadius:13,backgroundColor:T.pale,alignItems:'center',justifyContent:'center'},
  cardTitle:{fontSize:17,fontFamily:'Poppins_700Bold',color:T.ink,flex:1},
  body:{color:T.muted,fontSize:13,lineHeight:21,fontFamily:'Mulish_400Regular'},
  item:{gap:7,borderTopColor:T.border,borderTopWidth:1,paddingTop:12,paddingBottom:6},
  itemTitle:{fontSize:15,fontWeight:'700',color:T.ink},
  cta:{backgroundColor:T.gold,padding:14,borderRadius:15,marginTop:4,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9},
  ctaText:{color:'#16110A',fontSize:13,fontFamily:'Mulish_700Bold'},
  disabled:{opacity:0.45},
  input:{backgroundColor:T.background,borderColor:T.border,borderWidth:1,borderRadius:12,color:T.ink,fontSize:14,padding:13},
  notice:{backgroundColor:T.pale,padding:14,borderRadius:14,gap:6},
  noticeTitle:{color:T.ink,fontWeight:'800'},
  danger:{color:'#9E3333',fontWeight:'600'},
  checkRow:{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:10},
  check:{fontSize:20,color:T.blue},
  checkLabel:{color:T.ink,fontSize:13,flex:1},
});}
styles=makeStyles();
