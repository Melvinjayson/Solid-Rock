import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const YOUTUBE_CHANNEL='https://www.youtube.com/@solidrockcentre';
export const YOUTUBE_LIVE='https://www.youtube.com/@solidrockcentre/live';
export const INSTAGRAM_CHANNEL='https://www.instagram.com/solidrockcentre/';
export const OFFICIAL_PLAYLISTS=[
  {id:'PLY36ho3KNKuhilzkq9THo_5xTBoAFsvPL',title:'The Year of Greater Glory'},
  {id:'PLY36ho3KNKuhwVO3TPdXS1CTcvDAWUPMp',title:'Short clips'},
  {id:'PLY36ho3KNKugZVNY1FlVT02tXn04QzzFi',title:'Guest Ministers'},
  {id:'PLY36ho3KNKugJDFGFkYNc0MoSLNv4Cuey',title:'Kids Zone'},
];
export type ChannelVideo={
 id:string;title:string;description:string;thumbnail:string|null;publishedAt:string|null;
 durationSeconds:number|null;state:'live'|'recorded'|'upcoming';url:string;
};
export type SocialPost={id:string;caption:string;type:string;thumbnail:string|null;permalink:string;timestamp:string|null};
export type ChurchNews={id:string;title:string;summary:string;url:string;publishedAt:string|null};
export type MediaFeed={
 version:1;channelId:string;channelUrl:string;instagramUrl:string;fetchedAt:string;
 activeLive:ChannelVideo|null;videos:ChannelVideo[];clips:ChannelVideo[];
 instagram:SocialPost[];news:ChurchNews[];
 playlists:{id:string;title:string}[];
 sources:{youtube:string;instagram:string;website:string};
};
const STORAGE='@solidrock:public-feed:v1';
const fallback:MediaFeed={
 version:1,channelId:'UCM6SGgWXyUDlCaZ8iYnIuKQ',channelUrl:YOUTUBE_CHANNEL,instagramUrl:INSTAGRAM_CHANNEL,
 fetchedAt:'',activeLive:null,videos:[],clips:[],instagram:[],news:[],playlists:OFFICIAL_PLAYLISTS,
 sources:{youtube:'unconfigured',instagram:'unconfigured',website:'unconfigured'}
};
const videoId=/^[A-Za-z0-9_-]{11}$/;
const playlistId=/^PL[A-Za-z0-9_-]{12,}$/;
const ytDomain=(v:string)=>{try{const host=new URL(v).hostname;return host==='www.youtube.com'||host==='youtube.com'||host==='youtu.be';}catch{return false;}};
export function sanitizeFeed(input:unknown):MediaFeed{
  if(!input||typeof input!=='object'||(input as {version?:number}).version!==1)throw Error('Unexpected church media response');
  const src=input as Partial<MediaFeed>;
  const videos=(values:unknown):ChannelVideo[]=>{
    if(!Array.isArray(values))return [];
    return values.filter((v):v is ChannelVideo=>Boolean(v&&typeof v==='object'&&videoId.test(v.id) &&
      typeof v.title==='string'&&typeof v.url==='string'&&ytDomain(v.url) &&
      ['live','upcoming','recorded'].includes(v.state))).slice(0,25);
  };
  const live=videos(src.activeLive?[src.activeLive]:[])[0]||null;
  const instagram=(Array.isArray(src.instagram)?src.instagram:[])
    .filter((p):p is SocialPost=>Boolean(p&&typeof p.id==='string'&&typeof p.caption==='string'&&typeof p.permalink==='string'&&
      /^https:\/\/www\.instagram\.com\//.test(p.permalink))).slice(0,15);
  const news=(Array.isArray(src.news)?src.news:[])
    .filter((p):p is ChurchNews=>Boolean(p&&typeof p.title==='string'&&typeof p.url==='string'&&
      /^https:\/\/solidrockdublin\.org\//.test(p.url))).slice(0,12);
  const list=(Array.isArray(src.playlists)?src.playlists:[])
    .filter((p):p is {id:string;title:string}=>Boolean(p&&playlistId.test(p.id)&&typeof p.title==='string')).slice(0,20);
  const fetchedAt=typeof src.fetchedAt==='string'&&!Number.isNaN(Date.parse(src.fetchedAt))?src.fetchedAt:'';
  const age=Date.now()-Date.parse(fetchedAt);
  // Never keep a stale LIVE badge when offline, even if a previously cached feed marked it active.
  return {...fallback,fetchedAt,
    activeLive:live&&Number.isFinite(age)&&age>=0&&age<5*60*1000?live:null,
    videos:videos(src.videos),clips:videos(src.clips),instagram,news,
    playlists:list.length?list:OFFICIAL_PLAYLISTS,
    sources:{youtube:src.sources?.youtube||'unavailable',instagram:src.sources?.instagram||'unavailable',website:src.sources?.website||'unavailable'},
  };
}
function endpoint():string|null{
  const explicit=process.env.EXPO_PUBLIC_CONTENT_API_URL?.trim();
  if(explicit){
    try{const u=new URL(explicit);if(u.protocol==='https:')return u.toString();}catch{}
  }
  if(Platform.OS==='web')return '/api/content';
  return null;
}
export async function loadMediaFeed():Promise<{feed:MediaFeed;fromCache:boolean}>{
  let saved:MediaFeed|null=null;
  try{const raw=await AsyncStorage.getItem(STORAGE);if(raw)saved=sanitizeFeed(JSON.parse(raw));}catch{}
  const url=endpoint();
  if(!url)return {feed:saved||fallback,fromCache:true};
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),8500);
  try{
    const res=await fetch(url,{signal:ctrl.signal,headers:{Accept:'application/json'}});
    if(!res.ok)throw Error('Media service unavailable');
    const feed=sanitizeFeed(await res.json());
    await AsyncStorage.setItem(STORAGE,JSON.stringify(feed)).catch(()=>{});
    return {feed,fromCache:false};
  }catch{
    return {feed:saved||fallback,fromCache:true};
  }finally{clearTimeout(timer);}
}
