const {test}=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/content.js');

function reply() {
  return {
    statusCode:200, headers:{},body:null,
    setHeader(k,v){this.headers[k]=v;return this;},
    status(v){this.statusCode=v;return this;},
    json(v){this.body=v;return this;}
  };
}
test('content endpoint rejects writes and does not perform external mutations',async()=>{
  const res=reply();
  await handler({method:'POST'},res);
  assert.equal(res.statusCode,405);
  assert.equal(res.body.error,'Method not allowed');
});
test('public media endpoint uses verified channel RSS without credentials',async(t)=>{
  const realFetch=global.fetch;
  const originalKey=process.env.YOUTUBE_DATA_API_KEY;
  const originalInsta=process.env.INSTAGRAM_ACCESS_TOKEN;
  delete process.env.YOUTUBE_DATA_API_KEY;delete process.env.INSTAGRAM_ACCESS_TOKEN;
  t.after(()=>{global.fetch=realFetch;if(originalKey)process.env.YOUTUBE_DATA_API_KEY=originalKey;if(originalInsta)process.env.INSTAGRAM_ACCESS_TOKEN=originalInsta;});
  const urls=[];
  global.fetch=async(url)=>{
    urls.push(String(url));
    if(String(url)==='https://solidrockdublin.org/') return {ok:true,text:async()=>`<article class="group"><a href="https://solidrockdublin.org/devotional/day-2-repentance-and-surrender"><img alt="Day 2 – Repentance and Surrender"/></a></article>`};
    if(!String(url).startsWith('https://www.youtube.com/feeds/videos.xml?channel_id=UCM6SGgWXyUDlCaZ8iYnIuKQ'))throw Error('Unexpected external request');
    return {ok:true,text:async()=>`<feed><entry><yt:videoId>3l_Ar5UrrVo</yt:videoId><title>Solid Rock Sunday worship</title><published>2026-11-08T10:02:18+00:00</published><media:thumbnail url="https://i.ytimg.com/vi/3l_Ar5UrrVo/hqdefault.jpg"/></entry></feed>`};
  };
  const res=reply();
  await handler({method:'GET'},res);
  assert.equal(res.statusCode,200);
  assert.equal(res.body.version,1);
  assert.equal(res.body.channelId,'UCM6SGgWXyUDlCaZ8iYnIuKQ');
  assert.equal(res.body.sources.youtube,'rss');
  assert.equal(res.body.videos[0].id,'3l_Ar5UrrVo');
  assert.equal(res.body.activeLive,null,'RSS must never claim a video is LIVE');
  assert.equal(res.body.clips.length,3);
  assert.equal(res.body.clips[0].id,'SEDV0Vola8g');
  assert.equal(res.body.instagram.length,0,'No invented Instagram posts');
  assert.ok(!JSON.stringify(res.body).includes('access_token'));
  assert.equal(urls.length,2);
  assert.equal(res.body.news[0].title,'Day 2 – Repentance and Surrender');
  assert.equal(res.body.sources.website,'homepage');
});
