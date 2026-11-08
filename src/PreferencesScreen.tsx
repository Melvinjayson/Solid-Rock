import React,{useEffect,useState} from 'react';
import {Alert,Pressable,StyleSheet,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIcon from './AppIcon';
import {theme as T,type ThemeMode} from './theme';
import {enableSundayReminder,disableReminder} from './Reminder';

export const APP_PREF_KEY='@solidrock:app-preferences:v1';
export type AppPreferences={fontScale:number;language:string;videoAutoplay:boolean;announcements:boolean;community:boolean;study:boolean;sundayReminderId:string|null};
export const DEFAULT_APP_PREFERENCES:AppPreferences={
 fontScale:1,language:'en',videoAutoplay:false,
 announcements:true,community:false,study:false,sundayReminderId:null
};
export async function loadAppPreferences():Promise<AppPreferences>{
 try{const v=await AsyncStorage.getItem(APP_PREF_KEY);if(!v)return {...DEFAULT_APP_PREFERENCES};
  const parsed=JSON.parse(v) as Partial<AppPreferences>;
  return {...DEFAULT_APP_PREFERENCES,fontScale:[1,1.15,1.3].includes(parsed.fontScale||0)?parsed.fontScale!:1,
   language:parsed.language==='en'?'en':'en',
   announcements:parsed.announcements===true,community:parsed.community===true,study:parsed.study===true,
   videoAutoplay:false,sundayReminderId:typeof parsed.sundayReminderId==='string'?parsed.sundayReminderId:null};
 }catch{return {...DEFAULT_APP_PREFERENCES};}
}
export default function PreferencesScreen({mode,setMode,prefs,setPrefs,onAccount}:{
 mode:ThemeMode;setMode:(v:ThemeMode)=>void;prefs:AppPreferences;setPrefs:(v:AppPreferences)=>void;onAccount:()=>void
}){
 const [busy,setBusy]=useState(false);
 const styles=makeStyles();
 function change(patch:Partial<AppPreferences>){const next={...prefs,...patch};setPrefs(next);void AsyncStorage.setItem(APP_PREF_KEY,JSON.stringify(next)).catch(()=>{});}
 async function toggleSunday(){
  if(busy)return;setBusy(true);
  try{
   if(prefs.sundayReminderId){
    await disableReminder(prefs.sundayReminderId);
    change({sundayReminderId:null});Alert.alert('Reminder turned off','Your Sunday reminder was cancelled.');
   }else{
    const result=await enableSundayReminder();
    if(!result.supported){Alert.alert('Available in the mobile app','Sunday reminders use Android or iOS notifications. The web preview provides an in-app update centre instead.');return;}
    if(result.id){change({sundayReminderId:result.id});Alert.alert('Sunday reminder enabled','Your device will remind you at 10:15 am each Sunday.');}
    else Alert.alert('Notifications not permitted','Enable notifications for Solid Rock in device Settings, then try again.');
   }
  }catch{Alert.alert('Could not schedule reminder','Please try again from your native device.');}
  finally{setBusy(false);}
 }
 return <View style={styles.wrap}>
  <Text style={styles.kicker}>MAKE IT YOURS</Text><Text style={styles.title}>Preferences</Text>
  <Text style={styles.intro}>Keep the experience comfortable for every age and stage of life. Settings are saved on your device.</Text>
  <Text style={styles.section}>APPEARANCE</Text>
  <View style={styles.row}>
   {(['dark','light'] as const).map(option=><Pressable key={option} accessibilityRole="button"
      accessibilityState={{selected:mode===option}} style={[styles.choice,mode===option&&styles.selected]} onPress={()=>setMode(option)}>
      <AppIcon name={option==='dark'?'moon':'sun'} color={mode===option?'#16110A':T.gold} size={21}/>
      <Text style={[styles.choiceText,mode===option&&{color:'#16110A'}]}>{option==='dark'?'Black / dark':'Light / ivory'}</Text>
   </Pressable>)}
  </View>
  <Text style={styles.section}>READING COMFORT</Text>
  <View style={styles.card}><Text style={styles.cardTitle}>Scripture text size</Text><Text style={styles.intro}>Choose a size that is comfortable for reading Bible chapters.</Text>
   <View style={styles.row}>{([{size:1,label:'Standard'},{size:1.15,label:'Large'},{size:1.3,label:'Extra large'}] as const).map(x=>
     <Pressable key={x.size} accessibilityRole="button" accessibilityState={{selected:prefs.fontScale===x.size}}
       style={[styles.option,prefs.fontScale===x.size&&styles.optionSelected]} onPress={()=>change({fontScale:x.size})}>
       <Text style={[styles.optionText,prefs.fontScale===x.size&&{color:'#16110A'}]}>{x.label}</Text>
     </Pressable>)}</View>
  </View>
  <Text style={styles.section}>UPDATES & NOTIFICATIONS</Text>
  <View style={styles.card}>
   <PreferenceRow title="Church announcements" description="Show church announcements in your in-app updates."
    checked={prefs.announcements} onChange={()=>change({announcements:!prefs.announcements})}/>
   <PreferenceRow title="Community activity" description="Opt into community notices when church messaging is activated."
    checked={prefs.community} onChange={()=>change({community:!prefs.community})}/>
   <PreferenceRow title="Bible study prompts" description="Show shared-study and reading reminders in the app."
    checked={prefs.study} onChange={()=>change({study:!prefs.study})}/>
   <Pressable accessibilityRole="button" style={styles.reminder} disabled={busy} onPress={()=>{void toggleSunday();}}>
    <AppIcon name="bell" color={T.gold} size={22}/>
    <View style={{flex:1}}><Text style={styles.cardTitle}>Sunday worship reminder</Text>
     <Text style={styles.intro}>{prefs.sundayReminderId?'Enabled · Sundays at 10:15 am':'Opt-in native device reminder at 10:15 am'}</Text></View>
    <AppIcon name={prefs.sundayReminderId?'check':'plus'} color={T.gold} size={21}/>
   </Pressable>
   <Text style={styles.note}>No marketing or church chat push notifications are sent in this preview. Notifications about private conversations require an approved church notification service.</Text>
  </View>
  <Text style={styles.section}>LANGUAGE & INCLUSION</Text>
  <View style={styles.card}>
   <Text style={styles.cardTitle}>Language</Text><Text style={styles.intro}>The app interface is currently available in English. The Bible reader uses the open World English Bible. Approved additional languages and translations will be added after licensing and accessibility review.</Text>
   <View style={styles.language}><AppIcon name="globe" color={T.gold} size={18}/><Text style={styles.cardTitle}>English</Text><AppIcon name="check" color={T.gold} size={18}/></View>
   <Text style={styles.note}>We welcome people of all cultures and generations. Contact the church if you need language, mobility, hearing, sensory or family support.</Text>
  </View>
  <Pressable accessibilityRole="button" style={styles.contact} onPress={onAccount}>
   <AppIcon name="people" color={T.gold} size={22}/><View style={{flex:1}}><Text style={styles.cardTitle}>Profile & account</Text><Text style={styles.intro}>Church membership and your personal details</Text></View><AppIcon name="chevron" color={T.gold}/>
  </Pressable>
 </View>;
}
function PreferenceRow({title,description,checked,onChange}:{title:string;description:string;checked:boolean;onChange:()=>void}){
 const s=makeStyles();
 return <Pressable accessibilityRole="switch" accessibilityState={{checked}} accessibilityLabel={title} onPress={onChange}
  style={s.prefRow}><View style={{flex:1,gap:4}}><Text style={s.cardTitle}>{title}</Text><Text style={s.intro}>{description}</Text></View>
  <View style={[s.toggle,checked&&s.toggleOn]}><View style={[s.knob,checked&&s.knobOn]}/></View></Pressable>;
}
function makeStyles(){return StyleSheet.create({
 wrap:{gap:14},kicker:{color:T.gold,letterSpacing:1.5,fontSize:11,fontFamily:'Mulish_700Bold'},
 title:{fontFamily:'Poppins_700Bold',fontSize:28,color:T.ink},intro:{fontFamily:'Mulish_400Regular',fontSize:13,color:T.muted,lineHeight:21},
 section:{fontFamily:'Mulish_700Bold',color:T.gold,letterSpacing:1.3,fontSize:11,marginTop:12},
 row:{flexDirection:'row',gap:8,flexWrap:'wrap'},
 choice:{flex:1,minWidth:125,backgroundColor:T.white,borderColor:T.border,borderWidth:1,borderRadius:16,minHeight:59,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,padding:8},
 selected:{backgroundColor:T.gold,borderColor:T.gold},
 choiceText:{color:T.ink,fontSize:12,fontFamily:'Mulish_700Bold'},
 card:{padding:18,gap:14,backgroundColor:T.white,borderWidth:1,borderColor:T.border,borderRadius:21},
 cardTitle:{fontFamily:'Mulish_700Bold',color:T.ink,fontSize:14},
 option:{flex:1,minWidth:84,borderColor:T.border,borderWidth:1,borderRadius:13,backgroundColor:T.pale,minHeight:44,alignItems:'center',justifyContent:'center',padding:6},
 optionSelected:{backgroundColor:T.gold,borderColor:T.gold},optionText:{color:T.ink,fontFamily:'Mulish_700Bold',fontSize:11},
 prefRow:{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:T.border},
 toggle:{width:44,height:27,borderRadius:15,backgroundColor:T.border,padding:3,justifyContent:'center'},
 toggleOn:{backgroundColor:T.gold},knob:{width:21,height:21,borderRadius:11,backgroundColor:'#F7F1E7'},
 knobOn:{alignSelf:'flex-end',backgroundColor:'#16110A'},
 reminder:{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:10},
 language:{flexDirection:'row',alignItems:'center',gap:9,borderWidth:1,borderColor:T.border,borderRadius:13,padding:12},
 note:{fontFamily:'Mulish_400Regular',fontSize:11,lineHeight:18,color:T.muted},
 contact:{flexDirection:'row',gap:12,alignItems:'center',backgroundColor:T.white,borderWidth:1,borderColor:T.border,borderRadius:18,padding:17}
});}
