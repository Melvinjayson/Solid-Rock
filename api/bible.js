// Public-only Scripture cache for a church-owned Vercel deployment.
// World English Bible (WEB) is public domain. Original text is not altered.
// Source information: https://ebible.org/web/ and https://bible-api.com/
// The upstream is a hobby service; this cache is a transition, not a production
// availability guarantee. Church-hosted WEB data should replace it for launch.
const BOOKS=new Set(('GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV').split(' '));
const cache=new Map();
const TTL=24*60*60*1000;
function validate(value,book,chapter){
  if(!value||value.translation?.license!=='Public Domain'||!Array.isArray(value.verses)||
     value.verses.length===0||value.verses.length>176)throw new Error('Unexpected Scripture response');
  const verses=value.verses.map(v=>{
    if(v?.book_id!==book||v.chapter!==chapter||!Number.isInteger(v.verse)||v.verse<1||
       typeof v.text!=='string'||v.text.length>3500)throw new Error('Invalid Scripture verse');
    return {book_id:v.book_id,book:typeof v.book==='string'?v.book.slice(0,70):book,
      chapter:v.chapter,verse:v.verse,text:v.text};
  });
  return {translation:{name:'World English Bible',license:'Public Domain'},verses};
}
module.exports=async function handler(req,res){
  res.setHeader('X-Content-Type-Options','nosniff');
  // Never cache upstream failures or malformed requests for a full day.
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
  const rawBook=req.query?.book,rawChapter=req.query?.chapter;
  const book=typeof rawBook==='string'?rawBook.toUpperCase():'';
  const chapter=typeof rawChapter==='string'&&/^\d{1,3}$/.test(rawChapter)?Number(rawChapter):NaN;
  if(!BOOKS.has(book)||!Number.isInteger(chapter)||chapter<1||chapter>150)
    return res.status(400).json({error:'Invalid book or chapter'});
  const key=book+':'+chapter;
  const cached=cache.get(key);
  if(cached&&cached.until>Date.now()){
    res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json(cached.value);
  }
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6000);
  try{
    const response=await fetch('https://bible-api.com/data/web/'+book+'/'+chapter,{signal:controller.signal});
    if(!response.ok)throw new Error('Scripture source HTTP '+response.status);
    const result=validate(await response.json(),book,chapter);
    if(cache.size>=80)cache.delete(cache.keys().next().value);
    cache.set(key,{until:Date.now()+TTL,value:result});
    res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json(result);
  }catch(e){
    console.warn('Scripture retrieval unavailable',e instanceof Error?e.message:'unknown');
    if(cached){res.setHeader('Cache-Control','public, s-maxage=300');return res.status(200).json(cached.value);}
    return res.status(503).json({error:'Scripture temporarily unavailable'});
  }finally{clearTimeout(timer);}
};
