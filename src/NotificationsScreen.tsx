import React,{useEffect,useMemo,useState} from 'react';
import {Linking,Pressable,StyleSheet,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIcon from './AppIcon';
import {theme as T} from './theme';
import type {MediaFeed} from './mediaFeed';
import type {Announcement} from './backend';
import type {AppPreferences} from './PreferencesScreen';
const READ_KEY='@solidrock:updates-read:v1';
type Notice={id:string;title:string;body:string;time:string|null;url?:string;category:'Church'|'Worship'|'Bible'};
export default function NotificationsScreen({feed,announcements,prefs,onWatch}:{
 feed:MediaFeed|null;announcements:Announcement[];prefs:AppPreferences;onWatch:()=>void
}){
 const [read,setRead]=useState<string[]>([]);
 const [filter,setFilter]=useState<'all'|'unread'>('all');
 const styles=makeStyles();
 useEffect(()=>{void AsyncStorage.getItem(READ_KEY).then(x=>{if(x){const p=JSON.parse(x);if(Array.isArray(p))setRead(p.filter(v=>typeof v==='string').slice(-200));}}).catch(()=>{});},[]);
 const notices=useMemo(()=>{
  const n:Notice[]=[];
  if(prefs.announcements){
   for(const item of announcements.slice(0,20))n.push({id:'a:'+item.id,title:item.title,body:item.body.slice(0,230),time:item.published_at,category:'Church'});
   for(const item of feed?.news?.slice(0,10)||[])n.push({id:'n:'+item.id,title:item.title,body:item.summary,time:item.publishedAt,url:item.url,category:'Church'});
  }
  for(const v of feed?.videos?.slice(0,10)||[])n.push({id:'v:'+v.id,title:v.title,body:'New message on the official Solid Rock Centre channel',time:v.publishedAt,url:v.url,category:'Worship'});
  return n.sort((a,b)=>new Date(b.time||0).getTime()-new Date(a.time||0).getTime()).slice(0,35);
 },[feed,announcements,prefs.announcements]);
 const visible=notices.filter(n=>filter==='all'||!read.includes(n.id));
 function mark(id:string){
  setRead(a=>{const next=[...new Set([...a,id])].slice(-200);void AsyncStorage.setItem(READ_KEY,JSON.stringify(next));return next;});
 }
 function markAll(){const next=[...new Set([...read,...notices.map(n=>n.id)])].slice(-200);setRead(next);void AsyncStorage.setItem(READ_KEY,JSON.stringify(next));}
 return <View style={styles.wrap}>
  <Text style={styles.kicker}>STAY IN THE LOOP</Text><Text style={styles.title}>Updates</Text>
  <Text style={styles.intro}>Church announcements, devotional resources and new messages, collected in one place. No marketing notifications or background tracking.</Text>
  <View style={styles.actions}>
   {(['all','unread'] as const).map(x=><Pressable key={x} accessibilityRole="button"
     accessibilityState={{selected:filter===x}} style={[styles.filter,filter===x&&styles.selected]} onPress={()=>setFilter(x)}>
     <Text style={[styles.filterText,filter===x&&{color:'#16110A'}]}>{x==='all'?'All updates':'Unread'}</Text>
   </Pressable>)}
   <Pressable accessibilityRole="button" onPress={markAll} style={styles.mark}><Text style={styles.markText}>Mark all read</Text></Pressable>
  </View>
  {!visible.length?<View style={styles.empty}><AppIcon name="bell" color={T.gold} size={30}/>
   <Text style={styles.emptyTitle}>{filter==='unread'?'All caught up':'No updates yet'}</Text>
   <Text style={styles.intro}>When the church publishes approved news, service recordings or devotionals, they can appear here when you next open the app.</Text></View>
    :visible.map(n=><Pressable key={n.id} accessibilityRole="button" accessibilityLabel={n.title}
      style={[styles.item,!read.includes(n.id)&&styles.unread]}
      onPress={()=>{mark(n.id);if(n.category==='Worship')onWatch();else if(n.url)void Linking.openURL(n.url);}}>
      <View style={styles.icon}><AppIcon name={n.category==='Worship'?'watch':n.category==='Bible'?'book':'bell'} color={T.gold} size={20}/></View>
      <View style={{flex:1,gap:6}}>
       <View style={styles.labelRow}><Text style={styles.cat}>{n.category.toUpperCase()}</Text>{!read.includes(n.id)&&<View style={styles.dot}/>}</View>
       <Text style={styles.heading}>{n.title}</Text><Text style={styles.body} numberOfLines={3}>{n.body}</Text>
       {n.time&&<Text style={styles.timestamp}>{new Date(n.time).toLocaleDateString('en-IE',{day:'numeric',month:'short',year:'numeric'})}</Text>}
      </View>
      <AppIcon name="chevron" size={17} color={T.muted}/>
    </Pressable>)}
  <Text style={styles.note}>Updates are fetched from the official church site and YouTube. Community push notifications are not activated until the church's messaging and privacy release gates pass.</Text>
 </View>;
}
function makeStyles(){return StyleSheet.create({
 wrap:{gap:14},kicker:{fontFamily:'Mulish_700Bold',color:T.gold,fontSize:10,letterSpacing:1.7},title:{fontFamily:'Poppins_700Bold',color:T.ink,fontSize:30},
 intro:{fontFamily:'Mulish_400Regular',fontSize:13,lineHeight:21,color:T.muted},
 actions:{flexDirection:'row',gap:8,alignItems:'center'},filter:{borderRadius:13,borderWidth:1,borderColor:T.border,backgroundColor:T.white,padding:10},
 selected:{backgroundColor:T.gold,borderColor:T.gold},filterText:{fontFamily:'Mulish_700Bold',fontSize:12,color:T.ink},
 mark:{flex:1,alignItems:'flex-end',padding:9},markText:{fontFamily:'Mulish_700Bold',fontSize:12,color:T.gold},
 empty:{padding:22,backgroundColor:T.white,borderColor:T.border,borderWidth:1,borderRadius:22,gap:10},
 emptyTitle:{fontFamily:'Poppins_700Bold',fontSize:18,color:T.ink},
 item:{backgroundColor:T.white,borderRadius:20,borderWidth:1,borderColor:T.border,padding:16,flexDirection:'row',gap:12,alignItems:'center'},
 unread:{borderColor:T.gold},icon:{width:43,height:43,backgroundColor:T.pale,borderRadius:14,justifyContent:'center',alignItems:'center'},
 labelRow:{flexDirection:'row',alignItems:'center',gap:9},cat:{fontFamily:'Mulish_700Bold',fontSize:10,color:T.gold,letterSpacing:1},
 dot:{height:7,width:7,backgroundColor:T.gold,borderRadius:4},
 heading:{fontFamily:'Poppins_700Bold',fontSize:14,color:T.ink},body:{fontFamily:'Mulish_400Regular',color:T.muted,fontSize:12,lineHeight:20},
 timestamp:{fontFamily:'Mulish_700Bold',color:T.muted,fontSize:11},
 note:{fontFamily:'Mulish_400Regular',color:T.muted,fontSize:11,lineHeight:18}
});}
