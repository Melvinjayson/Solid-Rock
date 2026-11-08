const {test}=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/bible.js');
function response(){return {statusCode:200,body:null,headers:{},
 setHeader(k,v){this.headers[k]=v;return this;},
 status(n){this.statusCode=n;return this;},
 json(value){this.body=value;return this;}};}
test('Scripture API is read-only, validates bounded book/chapter input',async()=>{
 for(const req of [
   {method:'POST',query:{book:'JHN',chapter:'3'}},
   {method:'GET',query:{book:'../../auth',chapter:'3'}},
   {method:'GET',query:{book:'JHN',chapter:'0'}},
   {method:'GET',query:{book:'JHN',chapter:'999'}},
   {method:'GET',query:{book:['JHN','PSA'],chapter:'3'}}
 ]){
   const res=response();await handler(req,res);
   assert.equal(res.statusCode,req.method==='POST'?405:400);
   assert.equal(res.headers['Cache-Control'],'no-store');
 }
});
test('Scripture API returns exact public-domain text and caches valid results',async(t)=>{
 const original=global.fetch;let calls=0;
 global.fetch=async url=>{
   calls++;
   assert.equal(url,'https://bible-api.com/data/web/JHN/3');
   return {ok:true,json:async()=>({translation:{name:'World English Bible',license:'Public Domain'},
     verses:[{book_id:'JHN',book:'John',chapter:3,verse:16,text:'For God so loved the world.'}]})};
 };
 t.after(()=>{global.fetch=original;});
 const a=response();await handler({method:'GET',query:{book:'JHN',chapter:'3'}},a);
 assert.equal(a.statusCode,200);
 assert.equal(a.body.verses[0].text,'For God so loved the world.');
 const b=response();await handler({method:'GET',query:{book:'JHN',chapter:'3'}},b);
 assert.equal(b.statusCode,200);assert.equal(calls,1,'repeat requests should use cache');
 assert.equal(b.body.translation.license,'Public Domain');
});
test('Scripture API refuses a provider response with incompatible licensing',async(t)=>{
 const original=global.fetch;
 global.fetch=async()=>({ok:true,json:async()=>({translation:{name:'Proprietary',license:'All Rights Reserved'},verses:[{book_id:'GEN',chapter:1,verse:1,text:'No'}]})});
 t.after(()=>{global.fetch=original;});
 const res=response();await handler({method:'GET',query:{book:'GEN',chapter:'1'}},res);
 assert.equal(res.statusCode,503);
 assert.equal(res.headers['Cache-Control'],'no-store');
 assert.equal(res.body.error,'Scripture temporarily unavailable');
});
