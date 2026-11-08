import React from 'react';
import { View } from 'react-native';
import WebView from 'react-native-webview';
import type { PlayerProps } from './YouTubePlayer.web';
const idPattern=/^[A-Za-z0-9_-]{11}$/;
const playlistPattern=/^PL[A-Za-z0-9_-]{12,}$/;
export default function YouTubePlayer({videoId,playlistId}:PlayerProps){
  const uri=videoId&&idPattern.test(videoId)
    ?'https://www.youtube-nocookie.com/embed/'+videoId+'?playsinline=1&rel=0'
    :playlistId&&playlistPattern.test(playlistId)
      ?'https://www.youtube-nocookie.com/embed/videoseries?list='+playlistId+'&playsinline=1'
      :null;
  if(!uri)return null;
  return <View style={{width:'100%',aspectRatio:16/9,overflow:'hidden',borderRadius:14,backgroundColor:'#100F0D'}}>
    <WebView source={{uri}} originWhitelist={['https://*']} allowsFullscreenVideo allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={true} javaScriptEnabled domStorageEnabled
      style={{flex:1,backgroundColor:'#100F0D'}} accessibilityLabel="Solid Rock YouTube player"/>
  </View>;
}
