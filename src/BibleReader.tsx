import React,{useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIcon from './AppIcon';
import {theme as T} from './theme';
type Verse={book_id:string;book:string;chapter:number;verse:number;text:string};
type Chapter={translation:{name:string;license:string};verses:Verse[]};
const BOOKS=[
 ['GEN','Genesis'],['EXO','Exodus'],['LEV','Leviticus'],['NUM','Numbers'],['DEU','Deuteronomy'],
 ['JOS','Joshua'],['JDG','Judges'],['RUT','Ruth'],['1SA','1 Samuel'],['2SA','2 Samuel'],
 ['1KI','1 Kings'],['2KI','2 Kings'],['1CH','1 Chronicles'],['2CH','2 Chronicles'],
 ['EZR','Ezra'],['NEH','Nehemiah'],['EST','Esther'],['JOB','Job'],['PSA','Psalms'],['PRO','Proverbs'],
 ['ECC','Ecclesiastes'],['SNG','Song of Solomon'],['ISA','Isaiah'],['JER','Jeremiah'],
 ['LAM','Lamentations'],['EZK','Ezekiel'],['DAN','Daniel'],['HOS','Hosea'],['JOL','Joel'],
 ['AMO','Amos'],['OBA','Obadiah'],['JON','Jonah'],['MIC','Micah'],['NAM','Nahum'],['HAB','Habakkuk'],
 ['ZEP','Zephaniah'],['HAG','Haggai'],['ZEC','Zechariah'],['MAL','Malachi'],
 ['MAT','Matthew'],['MRK','Mark'],['LUK','Luke'],['JHN','John'],['ACT','Acts'],['ROM','Romans'],
 ['1CO','1 Corinthians'],['2CO','2 Corinthians'],['GAL','Galatians'],['EPH','Ephesians'],['PHP','Philippians'],
 ['COL','Colossians'],['1TH','1 Thessalonians'],['2TH','2 Thessalonians'],['1TI','1 Timothy'],
 ['2TI','2 Timothy'],['TIT','Titus'],['PHM','Philemon'],['HEB','Hebrews'],['JAS','James'],
 ['1PE','1 Peter'],['2PE','2 Peter'],['1JN','1 John'],['2JN','2 John'],['3JN','3 John'],
 ['JUD','Jude'],['REV','Revelation']
] as const;
type BookId=typeof BOOKS[number][0];
const CACHE='@solidrock:web-chapters:v1', SAVED='@solidrock:bible-highlights:v1', JOURNAL='@solidrock:bible-notes:v1';
function chapterIsValid(v:unknown):v is Chapter{
 const obj=v as Chapter;
 return Boolean(obj?.translation?.license==='Public Domain'&&Array.isArray(obj.verses)
  &&obj.verses.length>0&&obj.verses.every(x=>typeof x.text==='string'&&Number.isInteger(x.verse)));
}
export default function BibleReader({onShare,fontScale=1}:{onShare:(reference:string)=>void;fontScale?:number}){
 const [book,setBook]=useState<BookId>('JHN'),[chapter,setChapter]=useState(3),[chapterInput,setChapterInput]=useState('3');
 const [filter,setFilter]=useState(''),[showBooks,setShowBooks]=useState(false);
 const [data,setData]=useState<Chapter|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [cached,setCached]=useState(false),[highlights,setHighlights]=useState<string[]>([]);
 const [notes,setNotes]=useState<Record<string,string>>({}),[editing,setEditing]=useState<string|null>(null),[draft,setDraft]=useState('');
 const styles=makeStyles();
 const bookName=BOOKS.find(x=>x[0]===book)?.[1]||book;
 const queryKey=book+':'+chapter;
 const books=useMemo(()=>BOOKS.filter(b=>b[1].toLowerCase().includes(filter.toLowerCase())),[filter]);
 useEffect(()=>{void Promise.all([
   AsyncStorage.getItem(SAVED).then(x=>{if(x){let a=JSON.parse(x);if(Array.isArray(a))setHighlights(a.filter(y=>typeof y==='string').slice(0,500));}}),
   AsyncStorage.getItem(JOURNAL).then(x=>{if(x){const a=JSON.parse(x);if(a&&typeof a==='object'&&!Array.isArray(a))setNotes(a);}})
 ]).catch(()=>{});},[]);
 useEffect(()=>{
  let active=true;const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),10000);
  setBusy(true);setError('');setCached(false);
  void(async()=>{
   let saved:Record<string,Chapter>={};
   try{const raw=await AsyncStorage.getItem(CACHE);if(raw)saved=JSON.parse(raw);}catch{}
   if(saved[queryKey]&&chapterIsValid(saved[queryKey])&&active){setData(saved[queryKey]);setCached(true);}
   try{
    const response=await fetch('https://bible-api.com/data/web/'+book+'/'+chapter,{signal:abort.signal});
    if(!response.ok)throw Error('Scripture service unavailable');
    const result:unknown=await response.json();
    if(!chapterIsValid(result))throw Error('This chapter is unavailable in the selected translation.');
    if(active){setData(result);setCached(false);setError('');}
    saved[queryKey]=result;
    // Limit offline cached chapters, do not mass-download or abuse the public API.
    const keys=Object.keys(saved);for(const k of keys.slice(0,Math.max(0,keys.length-12)))delete saved[k];
    await AsyncStorage.setItem(CACHE,JSON.stringify(saved)).catch(()=>{});
   }catch{
    if(active){if(!saved[queryKey]){setData(null);setError('This chapter is unavailable right now. Connect to the internet or open a chapter you have read before.');}
      else{setData(saved[queryKey]);setCached(true);}}
   }finally{clearTimeout(timer);if(active)setBusy(false);}
  })();
  return()=>{active=false;abort.abort();clearTimeout(timer);};
 },[queryKey,book,chapter]);
 function chooseChapter(next:number){if(!Number.isInteger(next)||next<1||next>150)return;setChapter(next);setChapterInput(String(next));}
 function keyFor(v:Verse){return v.book_id+':'+v.chapter+':'+v.verse;}
 function toggle(v:Verse){const key=keyFor(v);setHighlights(prev=>{const next=prev.includes(key)?prev.filter(x=>x!==key):[...prev,key].slice(-500);void AsyncStorage.setItem(SAVED,JSON.stringify(next));return next;});}
 function saveNote(v:Verse){const k=keyFor(v),next={...notes,[k]:draft.slice(0,750)};setNotes(next);setEditing(null);void AsyncStorage.setItem(JOURNAL,JSON.stringify(next));}
 const verseName=(v:Verse)=>v.book+' '+v.chapter+':'+v.verse;
 return <View style={styles.wrap}>
   <Text style={styles.kicker}>BIBLE · STUDY TOGETHER</Text><Text style={styles.title}>The Word, in your hands.</Text>
   <Text style={styles.body}>Read the World English Bible, save passages and share references for your group study. No account is needed to read.</Text>
   <View style={styles.controls}>
     <Pressable accessibilityRole="button" accessibilityLabel="Select a Bible book" style={[styles.pick,{flex:1}]} onPress={()=>setShowBooks(!showBooks)}>
       <AppIcon name="book" color={T.gold} size={17}/><Text style={styles.pickText}>{bookName}</Text><AppIcon name="chevron" color={T.muted} size={17}/>
     </Pressable>
     <TextInput accessibilityLabel="Bible chapter number" inputMode="numeric" keyboardType="number-pad" maxLength={3}
       style={styles.chapterInput} value={chapterInput} onChangeText={setChapterInput} onEndEditing={()=>chooseChapter(Number(chapterInput))}/>
   </View>
   {showBooks&&<View style={styles.bookShelf}><TextInput style={styles.search} accessibilityLabel="Find a Bible book"
       placeholder="Search all 66 books" placeholderTextColor={T.muted} value={filter} onChangeText={setFilter}/>
     <ScrollView style={{maxHeight:230}} keyboardShouldPersistTaps="handled">
       {books.map(([id,name])=><Pressable accessibilityRole="button" key={id} style={styles.bookRow}
         onPress={()=>{setBook(id);chooseChapter(1);setShowBooks(false);setFilter('');}}>
         <Text style={styles.bookText}>{name}</Text>{id===book&&<AppIcon name="check" color={T.gold} size={18}/>}
       </Pressable>)}
     </ScrollView>
   </View>}
   <View style={styles.chapterNav}>
     <Pressable accessibilityRole="button" style={styles.navAction} disabled={chapter===1} onPress={()=>chooseChapter(chapter-1)}>
       <AppIcon name="back" color={T.gold}/><Text style={styles.navText}>Previous</Text>
     </Pressable><Text style={styles.chapterLabel}>{bookName} {chapter}</Text>
     <Pressable accessibilityRole="button" style={styles.navAction} onPress={()=>chooseChapter(chapter+1)}>
       <Text style={styles.navText}>Next</Text><AppIcon name="arrow" color={T.gold}/>
     </Pressable>
   </View>
   {busy&&!data&&<ActivityIndicator color={T.gold}/>}
   {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
   {cached&&<Text style={styles.hint}>Offline copy of this chapter</Text>}
   {data?.verses.map(v=>{const k=keyFor(v),selected=highlights.includes(k);
     return <View key={k} style={[styles.verse,selected&&styles.selected]}>
       <Pressable accessibilityRole="button" accessibilityLabel={'Highlight '+verseName(v)} onPress={()=>toggle(v)}>
        <Text style={[styles.verseText,{fontSize:17*fontScale,lineHeight:28*fontScale}]}>
          <Text style={styles.number}>{v.verse}  </Text>{v.text.trim()}
        </Text></Pressable>
       <View style={styles.actions}>
         <Pressable accessibilityRole="button" accessibilityLabel={'Share '+verseName(v)+' to Scripture together'}
           onPress={()=>onShare(verseName(v))}><Text style={styles.link}>Discuss in community</Text></Pressable>
         <Pressable accessibilityRole="button" accessibilityLabel={'Add a note to '+verseName(v)}
           onPress={()=>{setEditing(editing===k?null:k);setDraft(notes[k]||'');}}><Text style={styles.link}>{notes[k]?'Edit note':'Journal'}</Text></Pressable>
       </View>
       {editing===k&&<View style={{gap:8}}><TextInput multiline maxLength={750} style={styles.noteInput} value={draft}
         placeholder="Private reflection, saved to this device" placeholderTextColor={T.muted} onChangeText={setDraft}/>
         <Pressable accessibilityRole="button" onPress={()=>saveNote(v)} style={styles.save}><Text style={styles.saveText}>Save private note</Text></Pressable></View>}
       {notes[k]&&editing!==k&&<Text style={styles.note}>{notes[k]}</Text>}
     </View>;
   })}
   <Text style={styles.credit}>World English Bible · Public Domain · Source: bible-api.com and eBible.org. Highlighting, journals and cached chapters stay on this device. Text is displayed without alteration.</Text>
 </View>;
}
function makeStyles(){return StyleSheet.create({
 wrap:{gap:14},kicker:{fontFamily:'Mulish_700Bold',color:T.gold,fontSize:11,letterSpacing:1.7},
 title:{fontFamily:'Poppins_700Bold',color:T.ink,fontSize:26,lineHeight:34},
 body:{fontFamily:'Mulish_400Regular',color:T.muted,fontSize:14,lineHeight:22},
 controls:{flexDirection:'row',gap:9},pick:{borderRadius:15,backgroundColor:T.white,borderWidth:1,borderColor:T.border,minHeight:50,paddingHorizontal:12,alignItems:'center',flexDirection:'row',gap:9},
 pickText:{fontFamily:'Mulish_700Bold',color:T.ink,fontSize:14,flex:1},chapterInput:{borderRadius:15,backgroundColor:T.white,borderWidth:1,borderColor:T.border,color:T.ink,fontFamily:'Mulish_700Bold',fontSize:16,minWidth:64,textAlign:'center'},
 bookShelf:{padding:13,borderRadius:18,borderWidth:1,borderColor:T.border,backgroundColor:T.white,gap:8},search:{borderWidth:1,borderColor:T.border,borderRadius:12,padding:11,color:T.ink,backgroundColor:T.background},
 bookRow:{minHeight:42,paddingHorizontal:9,paddingVertical:9,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:T.border},
 bookText:{color:T.ink,fontFamily:'Mulish_700Bold',fontSize:13},
 chapterNav:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:6},
 navAction:{flexDirection:'row',alignItems:'center',gap:6,minHeight:44,padding:6},
 navText:{fontFamily:'Mulish_700Bold',color:T.gold,fontSize:12},
 chapterLabel:{fontFamily:'Poppins_700Bold',color:T.ink,fontSize:15},
 verse:{backgroundColor:T.white,borderRadius:16,borderWidth:1,borderColor:T.border,padding:15,gap:9},
 selected:{borderColor:T.gold,backgroundColor:T.pale},verseText:{fontFamily:'Mulish_400Regular',color:T.ink},
 number:{fontFamily:'Mulish_700Bold',color:T.gold,fontSize:12},
 actions:{flexDirection:'row',gap:18,flexWrap:'wrap'},link:{fontFamily:'Mulish_700Bold',color:T.gold,fontSize:12},
 noteInput:{backgroundColor:T.background,borderWidth:1,borderColor:T.border,borderRadius:12,padding:12,color:T.ink,minHeight:80,textAlignVertical:'top'},
 note:{fontFamily:'Mulish_400Regular',color:T.muted,fontSize:13,fontStyle:'italic'},
 save:{borderRadius:12,backgroundColor:T.gold,padding:12,alignItems:'center'},saveText:{fontFamily:'Mulish_700Bold',color:'#16110A'},
 hint:{color:T.gold,fontFamily:'Mulish_700Bold',fontSize:12},
 error:{fontFamily:'Mulish_400Regular',color:'#F39B87',fontSize:13},
 credit:{fontFamily:'Mulish_400Regular',color:T.muted,fontSize:11,lineHeight:18,paddingTop:6}
});}
