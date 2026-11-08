import React from 'react';
import { View } from 'react-native';
export type PlayerProps={videoId?:string;playlistId?:string};
const idPattern=/^[A-Za-z0-9_-]{11}$/;
const playlistPattern=/^PL[A-Za-z0-9_-]{12,}$/;
export default function YouTubePlayer({videoId,playlistId}:PlayerProps){
  const src=videoId&&idPattern.test(videoId)
    ?'https://www.youtube-nocookie.com/embed/'+videoId+'?playsinline=1&rel=0'
    :playlistId&&playlistPattern.test(playlistId)
      ?'https://www.youtube-nocookie.com/embed/videoseries?list='+playlistId+'&playsinline=1'
      :null;
  if(!src)return null;
  return <View style={{width:'100%',aspectRatio:16/9,borderRadius:14,overflow:'hidden',backgroundColor:'#100F0D'}}>
    {React.createElement('iframe',{src,title:'Solid Rock Centre official YouTube player',
      style:{width:'100%',height:'100%',border:0,display:'block'},
      allow:'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowFullScreen:true,loading:'lazy',referrerPolicy:'strict-origin-when-cross-origin'})}
  </View>;
}
