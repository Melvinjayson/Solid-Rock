import React from 'react';
import {Image,Linking,Pressable,StyleSheet,Text,View} from 'react-native';
import AppIcon,{type IconName} from './AppIcon';
import {theme as T} from './theme';
import {CONTACT_ADDRESS,SUNDAY_SERVICE,VISIT_URL} from './content';
import type {Announcement,ChurchEvent} from './backend';
import type {MediaFeed,ChannelVideo} from './mediaFeed';
import {YOUTUBE_CHANNEL} from './mediaFeed';

// Deliberately follows the church team's approved prototype hierarchy:
// important notice -> real livestream -> quick actions -> announcements ->
// latest teaching -> practical visiting information. Personal/UGC feeds
// belong in secondary navigation, not a social-media-style home feed.
type Props={
 media:MediaFeed|null;
 announcements:Announcement[];
 events:ChurchEvent[];
 onGive:()=>void;onWatch:()=>void;onEvents:()=>void;onBible:()=>void;
 onUpdates:()=>void;onCommunity:()=>void;onTalk:()=>void;
 onPlayVideo:(id:string)=>void;
};
function Action({icon,title,onPress}:{icon:IconName;title:string;onPress:()=>void}){
 const s=styles();
 return <Pressable accessibilityRole="button" accessibilityLabel={title==='Give'?'Give to Solid Rock':title}
  onPress={onPress} style={({pressed})=>[s.quickAction,pressed&&{opacity:.7}]}>
  <AppIcon name={icon} size={23} color={T.green}/>
  <Text style={s.quickLabel}>{title}</Text>
 </Pressable>;
}
function Section({title,action,onAction}:{title:string;action?:string;onAction?:()=>void}){
 const s=styles();
 return <View style={s.sectionHeader}><Text style={s.sectionTitle}>{title}</Text>
  {action&&<Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onAction} hitSlop={8}>
   <Text style={s.actionText}>{action} →</Text>
  </Pressable>}
 </View>;
}
function Opening({title,caption,onPress}:{title:string;caption:string;onPress:()=>void}){
 const s=styles();
 return <Pressable accessibilityRole="button" accessibilityLabel={title} style={s.messageLink} onPress={onPress}>
  <Text style={s.messageTitle}>{title}</Text>
  <Text style={s.messageCaption} numberOfLines={2}>{caption}</Text>
  <AppIcon name="chevron" size={18} color={T.green}/>
 </Pressable>;
}
export default function ChurchHome({media,announcements,events,onGive,onWatch,onEvents,onBible,onUpdates,onCommunity,onTalk,onPlayVideo}:Props){
 const s=styles();
 const live=media?.activeLive||null;
 // Do not display old events as upcoming or invent calendar entries.
 const now=Date.now();
 const upcoming=events.filter(e=>Number.isFinite(Date.parse(e.starts_at))&&Date.parse(e.starts_at)>=now)
   .sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at))[0];
 const latestVideo=media?.videos?.find((v:ChannelVideo)=>v.state==='recorded');
 const topNotice=announcements[0];
 const extraNotices=announcements.slice(1,3);
 const websiteNews=media?.news?.slice(0,2)||[];
 return <View style={s.wrap}>
  <View style={s.welcome} accessibilityLabel="Welcome to Solid Rock Centre">
   <Text style={s.eyebrow}>SOLID ROCK CENTRE · DUBLIN</Text>
   <Text style={s.welcomeTitle}>Welcome to Solid Rock</Text>
   <Text style={s.welcomeSub}>Faith beyond Sunday. Stay connected to worship and church life.</Text>
  </View>
  {topNotice&&<Pressable accessibilityRole="button" accessibilityLabel={'Important church notice: '+topNotice.title}
   onPress={onUpdates} style={s.notice}>
    <View style={s.noticeIcon}><AppIcon name="bell" size={18} color={T.green}/></View>
    <View style={{flex:1,gap:3}}>
     <Text style={s.noticeEyebrow}>CHURCH NOTICE</Text><Text style={s.noticeTitle}>{topNotice.title}</Text>
     <Text style={s.noticeBody} numberOfLines={2}>{topNotice.body}</Text>
    </View><AppIcon name="chevron" color={T.green} size={16}/>
  </Pressable>}
  {live?<Pressable accessibilityRole="button" accessibilityLabel="Watch the live church service in the app"
   onPress={onWatch} style={s.liveCard}>
   <Text style={s.liveLabel}>● LIVE NOW</Text>
   <Text style={s.liveTitle}>Join the worship livestream</Text>
   <Text style={s.liveSub} numberOfLines={2}>{live.title}</Text>
   <View style={s.liveCTA}><AppIcon name="watch" color="#FFFFFF" size={20}/><Text style={s.liveButton}>Watch in app</Text></View>
  </Pressable>:<View style={s.serviceCard}>
   <View style={s.serviceIcon}><AppIcon name="calendar" size={24} color={T.green}/></View>
   <View style={{flex:1,gap:4}}><Text style={s.serviceEyebrow}>NEXT CHURCH SERVICE</Text>
    <Text style={s.serviceTitle}>{SUNDAY_SERVICE}</Text>
    <Text style={s.smallText}>Inchicore, Dublin 8 · in person and online</Text>
   </View>
   <Pressable accessibilityRole="button" accessibilityLabel="Watch church service" onPress={onWatch} hitSlop={8}>
    <AppIcon name="watch" size={23} color={T.green}/>
   </Pressable>
  </View>}
  <Section title="Quick actions"/>
  <View style={s.quickGrid}>
   <Action icon="give" title="Give" onPress={onGive}/>
   <Action icon="events" title="Events" onPress={onEvents}/>
   <Action icon="watch" title="Watch" onPress={onWatch}/>
   <Action icon="book" title="Bible" onPress={onBible}/>
  </View>
  <Section title="Recent announcements" action="All updates" onAction={onUpdates}/>
  {extraNotices.length?extraNotices.map(n=><Opening key={n.id} title={n.title} caption={n.body} onPress={onUpdates}/>):
   websiteNews.length?websiteNews.map(n=><Opening key={n.id} title={n.title}
    caption={n.summary||'Update from the official church website'}
    onPress={()=>{void Linking.openURL(n.url);}}/>):
   <View style={s.listCard}>
    <Text style={s.cardTitle}>{topNotice?'That is the latest church notice.':'Stay informed'}</Text>
    <Text style={s.smallText}>{topNotice?'More church announcements will appear here when published.':'Official church notices will appear here when published. You can also check the church website.'}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Open church updates" onPress={onUpdates}>
     <Text style={s.actionText}>View church updates →</Text>
    </Pressable>
   </View>}
  <Section title="Latest message" action="All messages" onAction={onWatch}/>
  {latestVideo?<Pressable accessibilityRole="button" accessibilityLabel={'Play '+latestVideo.title}
   style={s.mediaCard} onPress={()=>onPlayVideo(latestVideo.id)}>
   {latestVideo.thumbnail&&<Image source={{uri:latestVideo.thumbnail}} style={s.thumb}
     accessibilityLabel="Official Solid Rock Centre YouTube sermon thumbnail" resizeMode="cover"/>}
   <View style={s.mediaText}><Text style={s.mediaEyebrow}>CHURCH TEACHING</Text>
    <Text style={s.cardTitle} numberOfLines={2}>{latestVideo.title}</Text>
    <Text style={s.actionText}>Play message →</Text>
   </View>
  </Pressable>:<View style={s.listCard}>
   <Text style={s.cardTitle}>Watch Solid Rock messages</Text>
   <Text style={s.smallText}>Sermons, playlists and short clips from the church's official YouTube channel.</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Open Watch" onPress={onWatch}>
    <Text style={s.actionText}>Watch messages →</Text>
   </Pressable>
  </View>}
  <Section title="This week" action="All events" onAction={onEvents}/>
  <View style={s.listCard}>
   <Text style={s.cardTitle}>{upcoming?.title||'Join us this Sunday'}</Text>
   <Text style={s.smallText}>{upcoming?new Date(upcoming.starts_at).toLocaleString('en-IE',{dateStyle:'medium',timeStyle:'short'}):
     SUNDAY_SERVICE}</Text>
   <Text style={s.smallText}>{upcoming?.venue||CONTACT_ADDRESS}</Text>
   <View style={s.bottomActions}>
    <Pressable accessibilityRole="button" accessibilityLabel="Plan your visit to Solid Rock"
     onPress={()=>{void Linking.openURL(VISIT_URL);}} style={s.outlineButton}>
     <Text style={s.outlineText}>Plan your visit</Text><AppIcon name="arrow" size={16} color={T.green}/>
    </Pressable>
   </View>
  </View>
  <View style={s.footerLinks}>
   <Pressable accessibilityRole="button" accessibilityLabel="Explore church community" onPress={onCommunity}>
    <Text style={s.footerLinkText}>Find your community →</Text>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel="Talk to the church" onPress={onTalk}>
    <Text style={s.footerLinkText}>Talk to us →</Text>
   </Pressable>
  </View>
 </View>;
}
function styles(){return StyleSheet.create({
 wrap:{gap:12},
 welcome:{paddingVertical:12,gap:4},
 eyebrow:{fontFamily:'Mulish_700Bold',fontSize:10,letterSpacing:1.45,color:T.green},
 welcomeTitle:{fontFamily:'Poppins_700Bold',fontSize:27,lineHeight:34,letterSpacing:-.7,color:T.ink},
 welcomeSub:{fontFamily:'Mulish_400Regular',fontSize:14,lineHeight:21,color:T.muted},
 notice:{flexDirection:'row',gap:11,alignItems:'center',padding:14,borderRadius:16,backgroundColor:T.white,borderWidth:1,borderColor:T.green},
 noticeIcon:{width:34,height:34,backgroundColor:T.pale,borderRadius:10,justifyContent:'center',alignItems:'center'},
 noticeEyebrow:{fontFamily:'Mulish_700Bold',fontSize:10,letterSpacing:1.2,color:T.green},
 noticeTitle:{fontFamily:'Mulish_700Bold',fontSize:15,color:T.ink},
 noticeBody:{fontFamily:'Mulish_400Regular',fontSize:12,color:T.muted,lineHeight:18},
 liveCard:{padding:18,borderRadius:17,backgroundColor:'#3C6E63',gap:9,minHeight:154},
 liveLabel:{fontFamily:'Mulish_700Bold',color:'#FFFFFF',fontSize:11,letterSpacing:1.4},
 liveTitle:{fontFamily:'Poppins_700Bold',fontSize:22,lineHeight:30,color:'#FFFFFF'},
 liveSub:{fontFamily:'Mulish_400Regular',fontSize:13,color:'#F2F8F5'},
 liveCTA:{flexDirection:'row',alignItems:'center',gap:8,marginTop:4},
 liveButton:{fontFamily:'Mulish_700Bold',color:'#FFFFFF',fontSize:14},
 serviceCard:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:T.border,
  borderRadius:17,backgroundColor:T.white,padding:15},
 serviceIcon:{height:45,width:45,borderRadius:13,backgroundColor:T.pale,alignItems:'center',justifyContent:'center'},
 serviceEyebrow:{fontFamily:'Mulish_700Bold',fontSize:10,color:T.green,letterSpacing:1},
 serviceTitle:{fontFamily:'Poppins_700Bold',fontSize:15,color:T.ink},
 smallText:{fontFamily:'Mulish_400Regular',fontSize:13,lineHeight:20,color:T.muted},
 sectionHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'baseline',marginTop:6,marginBottom:1},
 sectionTitle:{fontFamily:'Poppins_700Bold',fontSize:18,color:T.ink,letterSpacing:-.3},
 actionText:{fontFamily:'Mulish_700Bold',fontSize:12,color:T.green},
 quickGrid:{flexDirection:'row',gap:8},
 quickAction:{flex:1,minHeight:78,backgroundColor:T.white,borderColor:T.border,borderWidth:1,borderRadius:15,
  justifyContent:'center',alignItems:'center',gap:7,paddingVertical:11},
 quickLabel:{fontFamily:'Mulish_700Bold',fontSize:12,color:T.ink},
 messageLink:{minHeight:70,paddingHorizontal:15,paddingVertical:12,borderWidth:1,borderColor:T.border,borderRadius:15,
  backgroundColor:T.white,flexDirection:'row',alignItems:'center',gap:12},
 messageTitle:{fontFamily:'Mulish_700Bold',fontSize:14,color:T.ink,flex:1},
 messageCaption:{fontFamily:'Mulish_400Regular',fontSize:12,lineHeight:18,color:T.muted,flex:1.4},
 listCard:{borderRadius:16,padding:16,gap:8,backgroundColor:T.white,borderWidth:1,borderColor:T.border},
 cardTitle:{fontFamily:'Poppins_700Bold',fontSize:16,color:T.ink,lineHeight:23},
 mediaCard:{overflow:'hidden',borderRadius:16,backgroundColor:T.white,borderWidth:1,borderColor:T.border},
 thumb:{height:150,width:'100%'},
 mediaText:{padding:15,gap:8},
 mediaEyebrow:{fontFamily:'Mulish_700Bold',fontSize:10,letterSpacing:1.2,color:T.green},
 bottomActions:{marginTop:6,flexDirection:'row'},
 outlineButton:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:13,paddingVertical:12,
  borderWidth:1,borderRadius:12,borderColor:T.green,minHeight:44},
 outlineText:{fontFamily:'Mulish_700Bold',fontSize:13,color:T.green},
 footerLinks:{flexDirection:'row',justifyContent:'space-between',gap:9,paddingVertical:14},
 footerLinkText:{fontFamily:'Mulish_700Bold',fontSize:12,color:T.green},
});}
