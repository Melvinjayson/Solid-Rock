import React,{useState} from 'react';
import {Alert,Linking,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {CONTACT} from './churchFacts';
import AppIcon,{type IconName} from './AppIcon';
import {theme as T} from './theme';

const REQUESTS=[
 {key:'visit',title:'New here / plan a visit',detail:'Service access, directions and what to expect',icon:'home' as IconName},
 {key:'faith',title:'Faith & baptism',detail:'Learning, belonging and next steps',icon:'book' as IconName},
 {key:'prayer',title:'Prayer or pastoral contact',detail:'Ask for private follow-up (avoid sensitive details here)',icon:'prayer' as IconName},
 {key:'family',title:'Families, youth & accessibility',detail:'Age-appropriate services, inclusion and support',icon:'people' as IconName},
 {key:'volunteer',title:'Volunteer / food bank',detail:'Help, outreach and opportunities',icon:'heart' as IconName},
 {key:'event',title:'Events & community',detail:'Gatherings, service enquiries and support',icon:'calendar' as IconName},
 {key:'finance',title:'Giving and receipts',detail:'Finance and donation assistance',icon:'give' as IconName},
 {key:'general',title:'Something else',detail:'General enquiry for the church team',icon:'chat' as IconName}
] as const;
type RequestKey=typeof REQUESTS[number]['key'];
export default function TalkToUsScreen(){
 const [topic,setTopic]=useState<RequestKey>('visit'),[message,setMessage]=useState(''),[name,setName]=useState('');
 const styles=makeStyles();
 const current=REQUESTS.find(x=>x.key===topic)!;
 function open(url:string){void Linking.openURL(url).catch(()=>Alert.alert('Cannot open link','Contact '+CONTACT.email+' directly.'));}
 function compose(){
  const subject='Solid Rock Centre · '+current.title;
  const body=[
    'Hello Solid Rock team,','',
    'I would like help with: '+current.title,
    '','My question:',message.trim()||'[Please describe your question here]','',
    name.trim()?'Name: '+name.trim():'',
    '',
    'Sent from the Solid Rock app. No information was submitted to the app database.'
  ].filter((x,i,a)=>!(x===''&&a[i-1]==='')).join('\n');
  open('mailto:'+CONTACT.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body));
 }
 return <View style={styles.wrap}>
  <Text style={styles.kicker}>WE ARE HERE TO LISTEN</Text>
  <Text style={styles.title}>Talk to us.</Text>
  <Text style={styles.intro}>A question, a prayer, an idea or a first visit? Find the right route to connect with the church team. Everyone is welcome.</Text>
  <Text style={styles.subtitle}>WHAT CAN WE HELP WITH?</Text>
  {REQUESTS.map(x=><Pressable key={x.key} accessibilityRole="radio" accessibilityState={{selected:topic===x.key}} accessibilityLabel={x.title}
    style={[styles.choice,topic===x.key&&styles.selected]} onPress={()=>setTopic(x.key)}>
    <View style={styles.icon}><AppIcon name={x.icon} color={T.gold} size={20}/></View>
    <View style={{flex:1,gap:4}}><Text style={styles.name}>{x.title}</Text><Text style={styles.detail}>{x.detail}</Text></View>
    {topic===x.key?<AppIcon name="check" color={T.gold} size={20}/>:<AppIcon name="chevron" color={T.muted} size={18}/>}
  </Pressable>)}
  <View style={styles.card}>
   <Text style={styles.cardTitle}>Send an enquiry</Text>
   <Text style={styles.intro}>This opens your email app with a draft. You choose whether to send it. Nothing is uploaded or sent automatically.</Text>
   <TextInput accessibilityLabel="Your name optional" placeholder="Your name (optional)" placeholderTextColor={T.muted}
      maxLength={80} value={name} onChangeText={setName} style={styles.input}/>
   <TextInput accessibilityLabel="Your message" placeholder="What would you like to ask?" placeholderTextColor={T.muted}
      maxLength={1000} multiline textAlignVertical="top" value={message} onChangeText={setMessage}
      style={[styles.input,{minHeight:110}]}/>
   <Pressable accessibilityRole="button" style={styles.primary} onPress={compose}><Text style={styles.primaryText}>Continue in email app</Text><AppIcon name="arrow" color="#16110A" size={19}/></Pressable>
   <Text style={styles.disclaimer}>Please do not include health information, details about children, emergency reports or confidential pastoral disclosures in this draft. For urgent danger, call emergency services. A church-approved private request portal is planned.</Text>
  </View>
  <Text style={styles.subtitle}>OTHER WAYS TO REACH US</Text>
  <Pressable accessibilityRole="button" style={styles.contact} onPress={()=>open('mailto:'+CONTACT.email)}>
   <AppIcon name="chat" color={T.gold}/><View style={{flex:1}}><Text style={styles.name}>Email</Text><Text style={styles.detail}>{CONTACT.email}</Text></View><AppIcon name="arrow" color={T.gold}/></Pressable>
  {[CONTACT.phone,CONTACT.phoneAlt].map(p=><Pressable key={p} accessibilityRole="button" style={styles.contact} onPress={()=>open('tel:'+p)}>
   <AppIcon name="help" color={T.gold}/><View style={{flex:1}}><Text style={styles.name}>Call the church</Text><Text style={styles.detail}>{p}</Text></View><AppIcon name="arrow" color={T.gold}/></Pressable>)}
  <Pressable accessibilityRole="button" style={styles.contact} onPress={()=>open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(CONTACT.address))}>
   <AppIcon name="globe" color={T.gold}/><View style={{flex:1}}><Text style={styles.name}>Visit Solid Rock</Text><Text style={styles.detail}>{CONTACT.address}</Text></View><AppIcon name="arrow" color={T.gold}/></Pressable>
 </View>;
}
function makeStyles(){return StyleSheet.create({
 wrap:{gap:14},kicker:{fontSize:11,color:T.gold,fontFamily:'Mulish_700Bold',letterSpacing:1.6},title:{fontFamily:'Poppins_700Bold',fontSize:30,lineHeight:39,color:T.ink},
 intro:{fontFamily:'Mulish_400Regular',fontSize:14,lineHeight:23,color:T.muted},
 subtitle:{color:T.gold,fontFamily:'Mulish_700Bold',fontSize:11,letterSpacing:1.1,marginTop:8},
 choice:{flexDirection:'row',gap:13,padding:14,borderRadius:18,backgroundColor:T.white,borderWidth:1,borderColor:T.border,alignItems:'center'},
 selected:{borderColor:T.gold,backgroundColor:T.pale},
 icon:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:T.background},
 name:{fontFamily:'Mulish_700Bold',fontSize:14,color:T.ink},detail:{fontFamily:'Mulish_400Regular',fontSize:12,lineHeight:19,color:T.muted},
 card:{padding:19,gap:13,backgroundColor:T.white,borderRadius:23,borderWidth:1,borderColor:T.border},
 cardTitle:{fontFamily:'Poppins_700Bold',fontSize:19,color:T.ink},input:{padding:13,backgroundColor:T.background,borderWidth:1,borderColor:T.border,color:T.ink,borderRadius:14,fontFamily:'Mulish_400Regular',fontSize:14},
 primary:{backgroundColor:T.gold,minHeight:52,borderRadius:15,alignItems:'center',justifyContent:'center',gap:10,flexDirection:'row'},
 primaryText:{fontFamily:'Mulish_700Bold',fontSize:14,color:'#16110A'},
 disclaimer:{fontFamily:'Mulish_400Regular',fontSize:11,lineHeight:19,color:T.muted},
 contact:{backgroundColor:T.white,padding:15,borderRadius:17,borderColor:T.border,borderWidth:1,flexDirection:'row',alignItems:'center',gap:14,minHeight:64}
});}
