import React,{useEffect,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIcon,{type IconName} from './AppIcon';
import {theme as T} from './theme';
const STORAGE='@solidrock:faith-journey:v1';
const paths=[
 {id:'explore',name:'Exploring faith',description:'Come with questions. No pressure to have it all figured out.',icon:'sparkles' as IconName,
  tasks:[['John 3','What does belonging mean to you?'],['Psalm 139','Notice something beautiful today.'],['Luke 15','Reflect on welcome and compassion.'],['Matthew 5','Practise one small act of kindness.'],['Mark 12','Listen carefully to someone different from you.'],['James 1','Write a question to explore with others.'],['Romans 12','Choose one next step that feels meaningful.']]},
 {id:'word',name:'Grow in the Word',description:'A simple week of Scripture, reflection and discovery.',icon:'book' as IconName,
  tasks:[['Psalm 1','Choose a calm moment to read.'],['John 1','Write down one word that stands out.'],['Proverbs 3','Consider a decision and the role of trust.'],['Romans 8','Notice a source of hope.'],['Matthew 6','Reflect on today rather than tomorrow.'],['Philippians 4','Share an encouragement.'],['Colossians 3','Take one lesson into the coming week.']]},
 {id:'together',name:'Faith in community',description:'Meet people, support one another and find belonging.',icon:'community' as IconName,
  tasks:[['Romans 12','Say hello to someone new.'],['Hebrews 10','Encourage a fellow worshipper.'],['1 Corinthians 12','Learn about a ministry that serves others.'],['Galatians 6','Offer practical support.'],['Psalm 133','Pray for unity across backgrounds.'],['Ephesians 4','Listen to a different perspective.'],['Matthew 25','Explore a voluntary way to serve.']]},
 {id:'home',name:'Faith at home',description:'Small moments of care and reflection for families and all ages.',icon:'people' as IconName,
  tasks:[['Psalm 100','Share something you are grateful for.'],['Matthew 6','Make space for a short prayer.'],['Luke 10','Offer someone your full attention.'],['Proverbs 17','Choose patience in a difficult moment.'],['Mark 10','Help a younger person feel heard and safe.'],['Romans 15','Celebrate something you appreciate about another culture.'],['Colossians 3','Make time for rest and connection.']]}
] as const;
type PathId=typeof paths[number]['id'];
type Progress={path:PathId;done:string[]};
export default function JourneyScreen({onBible,onCommunity}:{onBible:()=>void;onCommunity:()=>void}){
 const [progress,setProgress]=useState<Progress>({path:'explore',done:[]});
 const styles=makeStyles();
 useEffect(()=>{void AsyncStorage.getItem(STORAGE).then(x=>{if(x){const p=JSON.parse(x);if(paths.some(v=>v.id===p.path)&&Array.isArray(p.done))setProgress({path:p.path,done:p.done.filter((v:unknown)=>typeof v==='string')});}}).catch(()=>{});},[]);
 function update(next:Progress){setProgress(next);void AsyncStorage.setItem(STORAGE,JSON.stringify(next)).catch(()=>{});}
 const path=paths.find(x=>x.id===progress.path)!;
 const count=path.tasks.filter((_,i)=>progress.done.includes(path.id+':'+i)).length;
 return <View style={styles.wrap}>
  <Text style={styles.kicker}>A LITTLE, OFTEN</Text><Text style={styles.title}>Your faith journey.</Text>
  <Text style={styles.intro}>Choose a path for your season of life. Seven small reflections, at your pace. No scores, streaks or comparisons.</Text>
  <View style={styles.paths}>{paths.map(p=><Pressable accessibilityRole="button" accessibilityState={{selected:p.id===progress.path}}
    key={p.id} onPress={()=>update({...progress,path:p.id})}
    style={[styles.path,p.id===progress.path&&styles.selected]}>
     <AppIcon name={p.icon} color={p.id===progress.path?'#16110A':T.gold} size={20}/>
     <Text style={[styles.pathName,p.id===progress.path&&{color:'#16110A'}]}>{p.name}</Text>
   </Pressable>)}</View>
  <View style={styles.progress}><Text style={styles.pathTitle}>{path.name}</Text><Text style={styles.intro}>{path.description}</Text>
   <Text style={styles.note}>{count} of 7 reflections marked complete · You set the pace</Text>
   <View style={styles.bar}><View style={[styles.filled,{width:`${count/7*100}%` as `${number}%`}]}/></View>
  </View>
  {path.tasks.map(([passage,prompt],i)=>{
    const k=path.id+':'+i,done=progress.done.includes(k);
    return <View key={k} style={[styles.card,done&&{borderColor:T.gold}]}>
     <View style={styles.day}><View style={styles.dayNum}><Text style={styles.dayNumText}>{i+1}</Text></View>
      <View style={{flex:1}}><Text style={styles.cardTitle}>{passage}</Text><Text style={styles.intro}>{prompt}</Text></View>
      <Pressable accessibilityRole="checkbox" accessibilityState={{checked:done}} accessibilityLabel={'Mark reflection '+(i+1)+' complete'}
       onPress={()=>update({...progress,done:done?progress.done.filter(x=>x!==k):[...progress.done,k]})}
       style={styles.check}><AppIcon name={done?'check':'plus'} size={22} color={T.gold}/></Pressable>
     </View>
     <View style={styles.row}>
      <Pressable accessibilityRole="button" onPress={onBible}><Text style={styles.action}>Read in Bible →</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={onCommunity}><Text style={styles.action}>Discuss together →</Text></Pressable>
     </View>
    </View>;
  })}
  <Text style={styles.note}>Progress is stored only on this device. These prompts are optional reflections, not a measure of faith or attendance. All journeys are open to visitors and members.</Text>
 </View>;
}
function makeStyles(){return StyleSheet.create({
 wrap:{gap:15},kicker:{fontFamily:'Mulish_700Bold',fontSize:11,color:T.gold,letterSpacing:1.5},
 title:{fontFamily:'Poppins_700Bold',fontSize:28,color:T.ink},intro:{fontFamily:'Mulish_400Regular',fontSize:13,lineHeight:21,color:T.muted},
 paths:{flexDirection:'row',flexWrap:'wrap',gap:9},path:{width:'48%',minHeight:90,padding:12,borderRadius:17,backgroundColor:T.white,borderWidth:1,borderColor:T.border,justifyContent:'center',gap:10},
 selected:{backgroundColor:T.gold,borderColor:T.gold},
 pathName:{fontFamily:'Mulish_700Bold',color:T.ink,fontSize:13},
 progress:{padding:18,borderRadius:22,backgroundColor:T.pale,borderWidth:1,borderColor:T.border,gap:8},
 pathTitle:{fontFamily:'Poppins_700Bold',color:T.ink,fontSize:19},note:{color:T.muted,fontFamily:'Mulish_400Regular',fontSize:11,lineHeight:19},
 bar:{height:7,borderRadius:7,backgroundColor:T.border,overflow:'hidden'},filled:{height:7,backgroundColor:T.gold},
 card:{padding:16,borderWidth:1,borderColor:T.border,backgroundColor:T.white,borderRadius:19,gap:15},
 day:{flexDirection:'row',alignItems:'flex-start',gap:13},
 dayNum:{height:34,width:34,backgroundColor:T.pale,borderRadius:13,alignItems:'center',justifyContent:'center'},
 dayNumText:{fontFamily:'Mulish_700Bold',color:T.gold,fontSize:13},
 cardTitle:{fontFamily:'Poppins_700Bold',color:T.ink,fontSize:16},check:{minHeight:44,minWidth:44,alignItems:'center',justifyContent:'center'},
 row:{flexDirection:'row',justifyContent:'space-between'},action:{fontFamily:'Mulish_700Bold',color:T.gold,fontSize:12}
});}
