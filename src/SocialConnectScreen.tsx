import React from 'react';
import {Alert,Image,Linking,Pressable,StyleSheet,Text,View} from 'react-native';
import AppIcon from './AppIcon';
import {OFFICIAL_CHANNELS} from './churchFacts';
import {theme as T} from './theme';
import type {MediaFeed} from './mediaFeed';
export default function SocialConnectScreen({feed,onRefresh,onWatch,busy}:{
 feed:MediaFeed|null;onRefresh:()=>void;onWatch:()=>void;busy:boolean
}){
 const styles=makeStyles();
 function open(url:string){void Linking.openURL(url).catch(()=>Alert.alert('Unable to open','This service is not available right now.'));}
 return <View style={styles.wrap}>
  <Text style={styles.kicker}>FAITH IN YOUR FEED</Text><Text style={styles.title}>Stay connected.</Text>
  <Text style={styles.intro}>Follow the church's official channels without losing your place in the app. Church announcements and community conversations remain part of your Solid Rock experience.</Text>
  <View style={styles.feature}>
   <AppIcon name="watch" size={25} color={T.gold}/><View style={{flex:1,gap:5}}>
     <Text style={styles.featureTitle}>Watch and listen here</Text>
     <Text style={styles.intro}>Recent church videos and playlists already play inside the Watch tab.</Text>
   </View>
   <Pressable accessibilityRole="button" accessibilityLabel="Watch church messages in app" onPress={onWatch} style={styles.circle}>
     <AppIcon name="arrow" color="#16110A" size={19}/></Pressable>
  </View>
  <Text style={styles.section}>OFFICIAL SOCIAL CHANNELS</Text>
  {OFFICIAL_CHANNELS.map(c=><Pressable key={c.name} accessibilityRole="button" accessibilityLabel={'Open '+c.name} style={styles.channel}
   onPress={()=>open(c.url)}>
   <View style={styles.channelIcon}><AppIcon name={c.name==='YouTube'||c.name==='Apple Podcasts'?'watch':c.name==='Instagram'||c.name==='TikTok'?'sparkles':'people'} size={21} color={T.gold}/></View>
   <View style={{flex:1,gap:5}}><Text style={styles.channelTitle}>{c.name}</Text>
     <Text style={styles.channelDesc}>{c.description}</Text>
     {c.kind==='directory'&&<Text style={styles.directory}>OPENS VERIFIED CHURCH SOCIAL DIRECTORY</Text>}
   </View><AppIcon name="arrow" color={T.gold} size={19}/>
  </Pressable>)}
  <Text style={styles.section}>LATEST SOCIAL UPDATES</Text>
  {feed?.instagram.length?feed.instagram.map(p=><View style={styles.post} key={p.id}>
    {p.thumbnail&&<Image accessibilityLabel="Church Instagram photo or reel" source={{uri:p.thumbnail}} resizeMode="cover" style={{width:'100%',height:180,borderRadius:13}}/>}
    <Text style={styles.channelDesc}>{p.caption||'Official Solid Rock Centre Instagram post'}</Text>
    <Pressable accessibilityRole="button" onPress={()=>open(p.permalink)}><Text style={styles.link}>View original post →</Text></Pressable>
   </View>):<View style={styles.post}><AppIcon name="shield" color={T.gold}/><Text style={styles.postTitle}>Instagram posts require church authorisation</Text>
    <Text style={styles.intro}>Once the church connects its professional Meta account, approved photos and reels can appear here. Until then, use its verified profile link above.</Text></View>}
  <Text style={styles.section}>FROM THE CHURCH</Text>
  {feed?.news.length?feed.news.slice(0,5).map(n=><Pressable key={n.id} accessibilityRole="button" style={styles.post} onPress={()=>open(n.url)}>
   <Text style={styles.postTitle}>{n.title}</Text><Text style={styles.channelDesc}>{n.summary}</Text><Text style={styles.link}>Read devotional →</Text>
  </Pressable>):<Text style={styles.intro}>Church devotionals and news appear here when the trusted content service is reachable.</Text>}
  <Pressable accessibilityRole="button" style={styles.refresh} disabled={busy} onPress={onRefresh}>
   <AppIcon name="refresh" color={T.gold} size={19}/><Text style={styles.link}>{busy?'Refreshing…':'Refresh public updates'}</Text></Pressable>
  <Text style={styles.footnote}>Facebook, TikTok and X open through the church's verified Linktree until its owners approve exact account URLs. Automatic cross-platform posts need provider permissions; no scraped or fictional posts are shown.</Text>
 </View>;
}
function makeStyles(){return StyleSheet.create({
 wrap:{gap:14},kicker:{fontFamily:'Mulish_700Bold',color:T.gold,fontSize:11,letterSpacing:1.5},
 title:{fontFamily:'Poppins_700Bold',color:T.ink,fontSize:29},
 intro:{fontFamily:'Mulish_400Regular',fontSize:13,color:T.muted,lineHeight:21},
 feature:{padding:17,backgroundColor:T.pale,borderWidth:1,borderColor:T.border,borderRadius:21,flexDirection:'row',alignItems:'center',gap:12},
 featureTitle:{fontFamily:'Poppins_700Bold',color:T.ink,fontSize:17},circle:{width:40,height:40,borderRadius:14,backgroundColor:T.gold,alignItems:'center',justifyContent:'center'},
 section:{fontFamily:'Mulish_700Bold',fontSize:11,color:T.gold,letterSpacing:1.2,marginTop:13},
 channel:{flexDirection:'row',alignItems:'center',gap:13,padding:14,backgroundColor:T.white,borderWidth:1,borderColor:T.border,borderRadius:18},
 channelIcon:{height:45,width:45,borderRadius:15,backgroundColor:T.pale,alignItems:'center',justifyContent:'center'},
 channelTitle:{fontFamily:'Mulish_700Bold',fontSize:15,color:T.ink},channelDesc:{fontFamily:'Mulish_400Regular',fontSize:12,color:T.muted,lineHeight:20},
 directory:{fontFamily:'Mulish_700Bold',fontSize:9,letterSpacing:.5,color:T.gold},
 post:{padding:17,borderRadius:20,borderWidth:1,borderColor:T.border,backgroundColor:T.white,gap:11},
 postTitle:{fontFamily:'Poppins_700Bold',fontSize:17,color:T.ink},link:{fontFamily:'Mulish_700Bold',fontSize:12,color:T.gold},
 refresh:{flexDirection:'row',gap:10,alignItems:'center',justifyContent:'center',padding:14},
 footnote:{fontFamily:'Mulish_400Regular',fontSize:11,lineHeight:18,color:T.muted}
});}
