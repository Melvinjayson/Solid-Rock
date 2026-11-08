import React,{useCallback,useEffect,useState} from 'react';
import {Alert,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {churchDb,cloudEnabled} from './backend';
import AppIcon,{type IconName} from './AppIcon';
import {theme as T} from './theme';
import {COMMUNITY_PREVIEW,listChannels,getMyChannelMemberships,getMessages,joinChannel,leaveChannel,sendMessage,reportMessage,blockMember,listenToMessages,
 type CommunityChannel,type CommunityMessage,type ChannelKind,sendReply,togglePrayerSupport,getPrayerSupportCounts} from './community';

type Props={onAccount:()=>void;onVisit:()=>void};
const kindIcon:Record<ChannelKind,IconName>={announcements:'bell',discussion:'chat',prayer:'prayer',study:'book'};
function channelIcon(x:{slug:string;kind:ChannelKind}):IconName{return x.slug==='serve-together'?'people':kindIcon[x.kind];}
const prompts:Record<ChannelKind,string>={
 announcements:'Official news and important messages from church leaders.',
 discussion:'A question for this week: what helped you grow?',
 prayer:'What are you grateful for today? Please avoid sharing names or confidential details.',
 study:'What is one passage you have reflected on this week?'
};
function readableError(e:unknown){return e instanceof Error?e.message:'Unable to connect to the community.';}
function time(s:string){return new Date(s).toLocaleString('en-IE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}
export default function CommunityScreen({onAccount,onVisit}:Props){
 const [channels,setChannels]=useState<CommunityChannel[]>([]);
 const [current,setCurrent]=useState<string|null>(null);
 const [membership,setMembership]=useState<string[]>([]);
 const [messages,setMessages]=useState<CommunityMessage[]>([]);
 const [text,setText]=useState('');
 const [busy,setBusy]=useState(false);
 const [user,setUser]=useState<string|null>(null);
 const [error,setError]=useState('');
 const [consent,setConsent]=useState(false);
 const [replyTo,setReplyTo]=useState<string|null>(null);
 const [prayerCounts,setPrayerCounts]=useState<Record<string,number>>({});
 const [filter,setFilter]=useState<'all'|'prayer'|'discussion'|'study'>('all');
 const styles=makeStyles();
 const active=(cloudEnabled?channels:COMMUNITY_PREVIEW.map((x,i)=>({...x,id:'preview-'+i,is_locked:false}))).find(x=>x.id===current)||null;
 const signedIn=Boolean(user);
 const joined=Boolean(current&&membership.includes(current));
 const load=useCallback(async()=>{
  if(!cloudEnabled)return;
  setBusy(true);setError('');
  try{
    const u=(await churchDb!.auth.getUser()).data.user;
    setUser(u?.id||null);
    const list=await listChannels();setChannels(list);
    if(u)setMembership(await getMyChannelMemberships());else setMembership([]);
  }catch(e){setError(readableError(e));}finally{setBusy(false);}
 },[]);
 useEffect(()=>{
  void load();
  if(!churchDb)return;
  const {data:{subscription}}=churchDb.auth.onAuthStateChange(()=>{void load();});
  return()=>subscription.unsubscribe();
 },[load]);
 const refreshMessages=useCallback(async(id:string)=>{
  try{setMessages(await getMessages(id));setError('');}
  catch(e){setError(readableError(e));}
 },[channels]);
 useEffect(()=>{
   setMessages([]);setReplyTo(null);setText('');
   if(!current||!membership.includes(current))return;
   void refreshMessages(current);
   return listenToMessages(current,()=>{void refreshMessages(current);});
 },[current,membership.join('|'),refreshMessages]);
 async function act(run:()=>Promise<void>,ok?:string){
  setBusy(true);setError('');
  try{await run();if(ok)Alert.alert('Updated',ok);}
  catch(e){setError(readableError(e));Alert.alert('Community',readableError(e));}
  finally{setBusy(false);}
 }
 async function join(){
  if(!active||!signedIn)return onAccount();
  if(!consent){Alert.alert('Community guidelines','Please read and accept the community guidelines before joining.');return;}
  await act(async()=>{await joinChannel(active.id);setMembership(p=>[...new Set([...p,active.id])]);},'Welcome to '+active.title+'.');
 }
 async function leave(){
  if(!active)return;
  Alert.alert('Leave conversation?','You can rejoin later. Your messages may remain visible to other members.',[
   {text:'Stay',style:'cancel'},{text:'Leave',style:'destructive',onPress:()=>{void act(async()=>{await leaveChannel(active.id);setMembership(p=>p.filter(x=>x!==active.id));setMessages([]);});}}
  ]);
 }
 async function post(){
  if(!active||!text.trim()||!joined)return;
  const draft=text.trim();
  await act(async()=>{if(replyTo)await sendReply(active.id,replyTo,draft);else await sendMessage(active.id,draft);setText('');setReplyTo(null);await refreshMessages(active.id);});
 }
 function report(m:CommunityMessage){
  Alert.alert('Keep this space safe','Flag a message for the church moderation team.',[
   {text:'Cancel',style:'cancel'},
   {text:'Spam',onPress:()=>{void act(()=>reportMessage(m.id,'spam'),'Your report was submitted.');}},
   {text:'Harassment',onPress:()=>{void act(()=>reportMessage(m.id,'harassment'),'Your report was submitted.');}},
   {text:'Privacy or safeguarding',onPress:()=>{void act(()=>reportMessage(m.id,'safeguarding'),'Your report was submitted.');}}
  ]);
 }
 function block(m:CommunityMessage){
  Alert.alert('Block this member?','You will no longer see their posts in channels. This does not remove posts for others.',[
   {text:'Cancel',style:'cancel'},{text:'Block member',style:'destructive',onPress:()=>{void act(async()=>{await blockMember(m.author_id);if(active)await refreshMessages(active.id);});}}
  ]);
 }
 const list=cloudEnabled?channels:COMMUNITY_PREVIEW.map((x,i)=>({...x,id:'preview-'+i,is_locked:false}));
 const filtered=list.filter(x=>filter==='all'||x.kind===filter);
 return <View style={styles.wrap}>
  {!active ? <>
   <View style={styles.head}>
    <Text style={styles.kicker}>BELONG · GROW · SERVE</Text>
    <Text style={styles.title}>Together is better.</Text>
    <Text style={styles.intro}>Your church family, between Sundays. Discover conversations, pray together and grow in faith.</Text>
   </View>
   <View style={styles.welcome}>
    <View style={styles.welcomeIcon}><AppIcon name="community" color={T.gold} size={25}/></View>
    <View style={{flex:1,gap:4}}><Text style={styles.welcomeTitle}>A place to belong</Text>
    <Text style={styles.welcomeText}>Community channels are moderated spaces. Joining is optional and conversations are never public social media posts.</Text></View>
   </View>
   <View style={styles.filters}>
    {(['all','prayer','discussion','study'] as const).map(x=><Pressable accessibilityRole="button"
     accessibilityState={{selected:filter===x}} key={x} style={[styles.filter,filter===x&&styles.selected]} onPress={()=>setFilter(x)}>
     <Text style={[styles.filterText,filter===x&&{color:'#16110A'}]}>{x==='all'?'All spaces':x==='prayer'?'Prayer':x==='discussion'?'Conversations':'Scripture'}</Text>
    </Pressable>)}
   </View>
   <View style={styles.sectionHeading}><Text style={styles.subTitle}>Explore spaces</Text>
     <Text style={styles.count}>{list.length} channels</Text></View>
   {filtered.map(x=><Pressable key={x.id} accessibilityRole="button" accessibilityLabel={'Open '+x.title}
     style={({pressed})=>[styles.channel,pressed&&{opacity:.75}]} onPress={()=>{setCurrent(x.id);setConsent(false);setError('');}}>
     <View style={styles.channelIcon}><AppIcon name={channelIcon(x)} size={25} color={T.gold}/></View>
     <View style={{flex:1,gap:5}}><Text style={styles.channelTitle}>{x.title}</Text>
       <Text style={styles.channelDesc}>{x.description}</Text>
       <Text style={styles.channelMeta}>{x.kind==='announcements'?'CHURCH LED':x.kind==='prayer'?'PRAYER & SUPPORT':'OPEN DISCUSSION'}</Text>
     </View>
     <AppIcon name="chevron" size={18} color={T.muted}/>
   </Pressable>)}
   {!cloudEnabled&&<View style={styles.offline}><AppIcon name="shield" size={20} color={T.gold}/>
     <View style={{flex:1}}><Text style={styles.offlineTitle}>Community preview</Text>
       <Text style={styles.channelDesc}>Explore the planned spaces. Member messaging opens once church moderation, safeguarding and identity checks are approved.</Text>
     </View></View>}
   {cloudEnabled&&!signedIn&&<Pressable accessibilityRole="button" onPress={onAccount} style={styles.cta}>
     <Text style={styles.ctaText}>Sign in to join conversations</Text><AppIcon name="arrow" color="#16110A" size={18}/>
    </Pressable>}
   <Pressable accessibilityRole="button" style={styles.external} onPress={onVisit}>
    <AppIcon name="globe" size={17} color={T.muted}/><Text style={styles.externalText}>Find ways to serve and visit the church</Text><AppIcon name="arrow" size={15} color={T.muted}/>
   </Pressable>
   {!!error&&<Text role="alert" style={styles.warning}>{error}</Text>}
  </> : <>
   <Pressable accessibilityRole="button" accessibilityLabel="Back to community channels" onPress={()=>setCurrent(null)}
     style={styles.back}><AppIcon name="back" size={19} color={T.gold}/><Text style={styles.backText}>Community</Text></Pressable>
   <View style={styles.head}><Text style={styles.kicker}>{active.kind==='prayer'?'PRAY TOGETHER':active.kind==='announcements'?'CHURCH LED':'SHARED SPACE'}</Text>
     <Text style={styles.title}>{active.title}</Text><Text style={styles.intro}>{active.description}</Text></View>
   <View style={styles.guidelines}><AppIcon name="shield" size={19} color={T.gold}/>
     <Text style={styles.guidelineText}>Be kind. Respect privacy. Do not share confidential details, contact information or children's personal data. Report concerning posts to church moderators.</Text></View>
   {!cloudEnabled?<View style={styles.empty}>
     <AppIcon name={channelIcon(active)} color={T.gold} size={32}/><Text style={styles.emptyTitle}>A space to grow together</Text>
     <Text style={styles.channelDesc}>{prompts[active.kind]}</Text>
     <Text style={styles.channelDesc}>Live conversations are not enabled in this preview. No sample posts are presented as messages from real worshippers.</Text>
     <Pressable style={styles.secondary} onPress={()=>setCurrent(null)}><Text style={styles.secondaryText}>Explore other spaces</Text></Pressable>
   </View>:!signedIn?<View style={styles.empty}><AppIcon name="lock" color={T.gold} size={30}/>
     <Text style={styles.emptyTitle}>Join the conversation</Text>
     <Text style={styles.channelDesc}>Sign in with your church member account to participate in moderated conversations.</Text>
     <Pressable style={styles.cta} onPress={onAccount}><Text style={styles.ctaText}>Sign in</Text><AppIcon name="arrow" size={18} color="#16110A"/></Pressable>
   </View>:!joined?<View style={styles.empty}><AppIcon name="heart" color={T.gold} size={29}/>
     <Text style={styles.emptyTitle}>Make this your space</Text>
     <Text style={styles.channelDesc}>Join to read and contribute. Messages are only visible to channel members and authorised church moderators.</Text>
     <Pressable accessibilityRole="checkbox" accessibilityState={{checked:consent}} onPress={()=>setConsent(!consent)}
       style={styles.consent}><AppIcon name={consent?'check':'shield'} size={20} color={T.gold}/>
       <Text style={styles.consentText}>I agree to be respectful, protect others' privacy and follow the church's community guidelines.</Text>
     </Pressable>
     <Pressable accessibilityRole="button" disabled={busy||!consent} style={[styles.cta,(!consent||busy)&&{opacity:.45}]} onPress={()=>{void join();}}>
       <Text style={styles.ctaText}>Join {active.title}</Text><AppIcon name="arrow" color="#16110A" size={18}/></Pressable>
   </View>:<>
     <View style={styles.roomTop}><Text style={styles.count}>MEMBER CONVERSATION</Text>
       <Pressable accessibilityRole="button" onPress={leave}><Text style={styles.leave}>Leave room</Text></Pressable></View>
     {!messages.length?<View style={styles.empty}>
       <AppIcon name="chat" size={30} color={T.gold}/><Text style={styles.emptyTitle}>Start something meaningful</Text>
       <Text style={styles.channelDesc}>{prompts[active.kind]}</Text>
       <Text style={styles.channelDesc}>No messages yet. You can begin the conversation.</Text>
     </View>:<View style={{gap:12}}>
       {messages.map(m=><View key={m.id} style={[styles.message,m.author_id===user&&styles.myMessage]}>
         <View style={styles.messageHeading}>
           <View style={styles.avatar}><Text style={styles.avatarText}>{m.author_id===user?'Y':'M'}</Text></View>
           <Text style={styles.author}>{m.author_id===user?'You':'Community member'}</Text>
           <Text style={styles.time}>{time(m.created_at)}</Text>
         </View>
         {m.reply_to_id&&<View style={styles.replyPreview}><AppIcon name="chat" size={13} color={T.gold}/><Text style={styles.replyText}>Replying to {messages.find(x=>x.id===m.reply_to_id)?.author_id===user?'you':'a member'}</Text></View>}
         <Text style={styles.messageText}>{m.hidden_at?'Message hidden by moderator':m.body}</Text>
         {!m.hidden_at&&<View style={styles.actions}>
           {active.kind!=='announcements'&&<Pressable accessibilityRole="button" accessibilityLabel={'Reply to '+(m.author_id===user?'your message':'member message')} onPress={()=>setReplyTo(m.id)}><Text style={styles.smallAction}>Reply</Text></Pressable>}
           {active.kind==='prayer'&&<Pressable accessibilityRole="button" accessibilityLabel="Pray with this member" onPress={()=>{void act(async()=>{await togglePrayerSupport(m.id);await refreshMessages(active.id);});}} style={{flexDirection:'row',gap:5,alignItems:'center'}}>
             <AppIcon name="prayer" size={15} color={T.gold}/><Text style={styles.smallAction}>Praying · {prayerCounts[m.id]||0}</Text>
           </Pressable>}
         </View>}
         {m.author_id!==user&&<View style={styles.actions}>
           <Pressable accessibilityRole="button" onPress={()=>report(m)}><Text style={styles.smallAction}>Report</Text></Pressable>
           <Pressable accessibilityRole="button" onPress={()=>block(m)}><Text style={styles.smallAction}>Block</Text></Pressable>
         </View>}
       </View>)}
     </View>}
     {active.kind==='announcements'?<Text style={styles.guidelineText}>Only authorised church staff can publish announcements here.</Text>:
       <View style={{gap:8}}>{replyTo&&<Pressable accessibilityRole="button" style={styles.replying} onPress={()=>setReplyTo(null)}>
          <AppIcon name="chat" size={15} color={T.gold}/><Text style={styles.replyText}>Replying to a message · Tap to cancel</Text><AppIcon name="close" size={15} color={T.muted}/>
        </Pressable>}<View style={styles.composer}><TextInput multiline maxLength={2000} accessibilityLabel={'Message to '+active.title}
           placeholder={active.kind==='prayer'?'Write encouragement or a general prayer…':'Share a thought with the group…'}
           placeholderTextColor={T.muted} style={styles.input} value={text} onChangeText={setText}/>
         <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={!text.trim()||busy} onPress={()=>{void post();}}
           style={[styles.send,(!text.trim()||busy)&&{opacity:.4}]}><AppIcon name="send" color="#16110A" size={20}/></Pressable>
       </View></View>}
   </>}
   {!!error&&<Text role="alert" style={styles.warning}>{error}</Text>}
   {joined&&<Pressable accessibilityRole="button" style={styles.external} onPress={()=>{if(active)void refreshMessages(active.id);}}>
     <AppIcon name="refresh" size={17} color={T.muted}/><Text style={styles.externalText}>Refresh conversation</Text></Pressable>}
  </>}
 </View>;
}
function makeStyles(){return StyleSheet.create({
 wrap:{gap:17,paddingBottom:30},
 head:{gap:7,marginBottom:4},kicker:{fontSize:10,fontFamily:'Mulish_700Bold',letterSpacing:2.1,color:T.gold},
 title:{fontSize:31,lineHeight:40,color:T.ink,fontFamily:'Poppins_700Bold',letterSpacing:-1.15},
 intro:{color:T.muted,fontFamily:'Mulish_400Regular',fontSize:15,lineHeight:23},
 welcome:{backgroundColor:T.pale,borderRadius:22,borderWidth:1,borderColor:T.border,padding:17,flexDirection:'row',gap:15},
 welcomeIcon:{width:48,height:48,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:T.background},
 welcomeTitle:{fontFamily:'Poppins_700Bold',fontSize:16,color:T.ink},
 welcomeText:{fontFamily:'Mulish_400Regular',fontSize:13,color:T.muted,lineHeight:21},
 filters:{flexDirection:'row',gap:7,flexWrap:'wrap'},
 filter:{paddingVertical:10,paddingHorizontal:12,backgroundColor:T.white,borderWidth:1,borderColor:T.border,borderRadius:14},
 selected:{backgroundColor:T.gold,borderColor:T.gold},filterText:{fontFamily:'Mulish_700Bold',fontSize:12,color:T.ink},
 sectionHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:4},
 subTitle:{fontFamily:'Poppins_700Bold',fontSize:20,color:T.ink},count:{fontFamily:'Mulish_700Bold',fontSize:10,color:T.muted,letterSpacing:.9},
 channel:{flexDirection:'row',alignItems:'center',gap:14,borderRadius:20,backgroundColor:T.white,borderWidth:1,borderColor:T.border,padding:16},
 channelIcon:{width:50,height:50,borderRadius:16,backgroundColor:T.pale,justifyContent:'center',alignItems:'center'},
 channelTitle:{fontFamily:'Poppins_700Bold',fontSize:15,color:T.ink},
 channelDesc:{fontFamily:'Mulish_400Regular',fontSize:13,color:T.muted,lineHeight:21},
 channelMeta:{fontFamily:'Mulish_700Bold',fontSize:10,color:T.gold,letterSpacing:1},
 offline:{flexDirection:'row',alignItems:'flex-start',gap:12,backgroundColor:T.pale,borderWidth:1,borderColor:T.border,borderRadius:17,padding:16},
 offlineTitle:{fontFamily:'Mulish_700Bold',fontSize:13,color:T.ink,marginBottom:4},
 cta:{minHeight:52,backgroundColor:T.gold,borderRadius:16,paddingHorizontal:19,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:11,marginTop:4},
 ctaText:{fontFamily:'Mulish_700Bold',fontSize:14,color:'#16110A'},
 external:{flexDirection:'row',gap:9,alignItems:'center',justifyContent:'center',paddingVertical:13},
 externalText:{color:T.muted,fontFamily:'Mulish_700Bold',fontSize:12},
 back:{flexDirection:'row',alignItems:'center',gap:9,paddingVertical:4},
 backText:{color:T.gold,fontFamily:'Mulish_700Bold',fontSize:13},
 guidelines:{flexDirection:'row',gap:12,padding:15,backgroundColor:T.pale,borderRadius:16,borderWidth:1,borderColor:T.border},
 guidelineText:{fontFamily:'Mulish_400Regular',fontSize:12,lineHeight:19,color:T.muted,flex:1},
 empty:{backgroundColor:T.white,borderRadius:22,borderWidth:1,borderColor:T.border,padding:22,gap:13,alignItems:'flex-start'},
 emptyTitle:{fontFamily:'Poppins_700Bold',fontSize:19,color:T.ink},
 consent:{flexDirection:'row',gap:12,alignItems:'flex-start',paddingVertical:8},
 consentText:{flex:1,fontFamily:'Mulish_400Regular',fontSize:13,lineHeight:20,color:T.ink},
 secondary:{padding:11,borderRadius:12,borderWidth:1,borderColor:T.border},
 secondaryText:{color:T.ink,fontFamily:'Mulish_700Bold'},
 roomTop:{flexDirection:'row',justifyContent:'space-between'},
 leave:{fontFamily:'Mulish_700Bold',fontSize:12,color:T.gold},
 message:{backgroundColor:T.white,borderRadius:17,borderWidth:1,borderColor:T.border,padding:15,gap:9},
 replyPreview:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:T.pale,padding:9,borderRadius:10},
 replyText:{fontFamily:'Mulish_700Bold',color:T.muted,fontSize:11,flex:1},
 replying:{flexDirection:'row',alignItems:'center',gap:9,backgroundColor:T.pale,padding:12,borderRadius:12},
 myMessage:{backgroundColor:T.pale},
 messageHeading:{flexDirection:'row',alignItems:'center',gap:8},
 avatar:{height:28,width:28,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:T.pale},
 avatarText:{color:T.gold,fontFamily:'Mulish_700Bold',fontSize:12},
 author:{fontFamily:'Mulish_700Bold',fontSize:12,color:T.ink,flex:1},
 time:{color:T.muted,fontSize:10},messageText:{color:T.ink,fontFamily:'Mulish_400Regular',fontSize:14,lineHeight:22},
 actions:{flexDirection:'row',gap:20,justifyContent:'flex-end'},smallAction:{fontFamily:'Mulish_700Bold',fontSize:12,color:T.gold},
 composer:{flexDirection:'row',gap:9,alignItems:'flex-end'},
 input:{flex:1,minHeight:52,maxHeight:150,borderWidth:1,borderColor:T.border,backgroundColor:T.white,borderRadius:16,padding:13,fontFamily:'Mulish_400Regular',fontSize:14,color:T.ink,textAlignVertical:'top'},
 send:{width:52,height:52,borderRadius:16,backgroundColor:T.gold,alignItems:'center',justifyContent:'center'},
 warning:{fontSize:12,color:'#DC8A79',fontFamily:'Mulish_400Regular'}
});}
