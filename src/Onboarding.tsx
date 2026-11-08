import React, {useState} from 'react';
import {Pressable,StyleSheet,Text,View,Image} from 'react-native';
import {theme as T,churchAssets} from './theme';
import AppIcon from './AppIcon';
type Choice='faith'|'community'|'media'|'events';
type Step={eyebrow:string;title:string;description:string;icon:'sparkles'|'people'|'watch'|'shield'};
const steps:Step[]=[
 {eyebrow:'WELCOME HOME',title:'A community beyond Sunday.',description:'Worship, learn and grow together. Your space to stay connected to Solid Rock Centre, wherever you are.',icon:'sparkles'},
 {eyebrow:'MADE FOR YOUR WEEK',title:'Find what matters to you.',description:'Catch up on messages, follow community conversations, and discover church gatherings without hunting through the website.',icon:'people'},
 {eyebrow:'FAITH, ON YOUR TERMS',title:'Connection with boundaries.',description:'Explore as a guest. Join church conversations only when you choose. Share carefully, report concerns, and control your privacy.',icon:'shield'}
];
export default function Onboarding({onFinish}:{onFinish:(interest:Choice|null)=>void}){
 const [step,setStep]=useState(0);
 const [interest,setInterest]=useState<Choice|null>(null);
 const item=steps[step];
 const styles=makeStyles();
 const last=step===steps.length-1;
 return <View style={styles.wrap} accessibilityLabel="First time welcome guide">
   <View style={styles.top}><Text style={styles.wordmark}>SOLID ROCK <Text style={{color:T.gold}}>·</Text> CENTRE</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Skip welcome guide" onPress={()=>onFinish(null)} style={styles.skip}><Text style={styles.skipText}>Skip</Text></Pressable>
   </View>
   <View style={styles.visual}>
     <View style={styles.orbit}><Image source={{uri:churchAssets.logoDark}} accessibilityLabel="Solid Rock Centre logo" resizeMode="contain" style={{width:92,height:92}}/></View>
     <View style={[styles.float,{top:32,left:14}]}><AppIcon name={item.icon} size={25} color={T.gold}/></View>
     <View style={[styles.float,{bottom:42,right:6}]}><AppIcon name="heart" size={25} color={T.gold}/></View>
     <View style={styles.bottomPill}><AppIcon name="people" size={15} color={T.gold}/><Text style={styles.visualTag}>BELONG · GROW · SERVE</Text></View>
   </View>
   <Text style={styles.eyebrow}>{item.eyebrow}</Text>
   <Text style={styles.title}>{item.title}</Text>
   <Text style={styles.description}>{item.description}</Text>
   {last&&<View style={styles.choices}>
     <Text style={styles.choiceHeading}>What brings you here?</Text>
     {([['faith','Grow in faith'],['community','Find community'],['media','Watch messages'],['events','Explore gatherings']] as const).map(([key,label])=><Pressable
       accessibilityRole="radio" accessibilityState={{selected:interest===key}} key={key}
       onPress={()=>setInterest(key)} style={[styles.choice,interest===key&&styles.chosen]}>
       <Text style={[styles.choiceText,interest===key&&{color:T.gold}]}>{label}</Text>
       {interest===key&&<AppIcon name="check" color={T.gold} size={18}/>}
     </Pressable>)}
   </View>}
   <View style={styles.footer}><View style={styles.dots}>
      {steps.map((_,i)=><View key={i} style={[styles.dot,i===step&&styles.dotActive]}/>)}
     </View>
     <Pressable accessibilityRole="button" accessibilityLabel={last?'Enter Solid Rock app':'Next welcome step'}
       onPress={()=>last?onFinish(interest):setStep(x=>x+1)} style={styles.button}>
       <Text style={styles.buttonText}>{last?'Enter the app':'Continue'}</Text><AppIcon name="arrow" size={18} color="#16110A"/>
     </Pressable>
   </View>
 </View>;
}
function makeStyles(){return StyleSheet.create({
 wrap:{flex:1,backgroundColor:T.background,paddingHorizontal:28,paddingTop:18,paddingBottom:24,justifyContent:'space-between'},
 top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 wordmark:{fontSize:13,fontFamily:'Poppins_700Bold',color:T.ink,letterSpacing:1},
 skip:{padding:12},skipText:{color:T.muted,fontSize:14,fontFamily:'Mulish_700Bold'},
 visual:{minHeight:230,maxHeight:320,flex:1,marginVertical:10,justifyContent:'center',alignItems:'center'},
 orbit:{height:200,width:200,borderRadius:100,borderWidth:1,borderColor:T.gold,backgroundColor:T.pale,alignItems:'center',justifyContent:'center'},
 float:{position:'absolute',width:62,height:62,backgroundColor:T.white,borderRadius:25,borderWidth:1,borderColor:T.border,alignItems:'center',justifyContent:'center'},
 bottomPill:{position:'absolute',bottom:10,alignItems:'center',flexDirection:'row',gap:9,borderRadius:18,backgroundColor:T.white,borderWidth:1,borderColor:T.border,paddingVertical:11,paddingHorizontal:14},
 visualTag:{fontFamily:'Mulish_700Bold',fontSize:11,letterSpacing:1,color:T.ink},
 eyebrow:{fontFamily:'Mulish_700Bold',fontSize:11,color:T.gold,letterSpacing:2,marginBottom:10},
 title:{fontFamily:'Poppins_700Bold',fontSize:35,lineHeight:43,color:T.ink,letterSpacing:-1.4,marginBottom:12},
 description:{fontFamily:'Mulish_400Regular',fontSize:16,lineHeight:25,color:T.muted,marginBottom:16},
 choices:{gap:8,marginBottom:10},choiceHeading:{fontFamily:'Mulish_700Bold',fontSize:13,color:T.ink,marginBottom:3},
 choice:{minHeight:44,borderRadius:13,borderWidth:1,borderColor:T.border,backgroundColor:T.white,paddingHorizontal:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 chosen:{borderColor:T.gold,backgroundColor:T.pale},
 choiceText:{fontFamily:'Mulish_700Bold',fontSize:13,color:T.ink},
 footer:{gap:15,marginTop:8},dots:{flexDirection:'row',gap:7,justifyContent:'center'},dot:{width:7,height:7,borderRadius:4,backgroundColor:T.border},dotActive:{width:25,backgroundColor:T.gold},
 button:{minHeight:54,backgroundColor:T.gold,borderRadius:17,justifyContent:'center',alignItems:'center',flexDirection:'row',gap:14},
 buttonText:{fontFamily:'Mulish_700Bold',fontSize:16,color:'#16110A'}
});}
