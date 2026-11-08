'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';

type Report={id:string;message_id:string;reason:string;created_at:string;context:string};
type Msg={id:string;body:string;author_id:string;channel_id:string;hidden_at:string|null};
type Channel={id:string;title:string;kind:string;is_locked:boolean};
function reasonText(s:string){return s.replace(/[^a-z]/gi,' ').slice(0,80);}
function message(e:unknown){return e instanceof Error?e.message:'An unexpected error occurred';}
export default function CommunityModeration(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const client=useMemo<SupabaseClient|null>(()=>url&&key?createClient(url,key):null,[url,key]);
 const [user,setUser]=useState(''),[allowed,setAllowed]=useState(false);
 const [reports,setReports]=useState<Report[]>([]),[messages,setMessages]=useState<Msg[]>([]);
 const [channels,setChannels]=useState<Channel[]>([]),[error,setError]=useState('');
 const [busy,setBusy]=useState(false),[reason,setReason]=useState('Inappropriate community content');
 const [loading,setLoading]=useState(true);
 const load=useCallback(async()=>{
  if(!client){setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const {data:{user:u},error:e}=await client.auth.getUser();if(e)throw e;
   setUser(u?.id||'');
   if(!u){setAllowed(false);return;}
   const {data:r,error:re}=await client.from('staff_roles').select('role').eq('user_id',u.id);
   if(re)throw re;
   const permitted=(r||[]).some((x:{role:string})=>['pastor','super_admin'].includes(x.role));
   setAllowed(permitted);
   if(!permitted)return;
   const [rs,ms,cs]=await Promise.all([
    client.from('community_reports').select('id,message_id,reason,context,created_at').order('created_at',{ascending:false}).limit(100),
    client.from('community_messages').select('id,body,author_id,channel_id,hidden_at').order('created_at',{ascending:false}).limit(200),
    client.from('community_channels').select('id,title,kind,is_locked').order('title')
   ]);
   for(const result of [rs,ms,cs])if(result.error)throw result.error;
   setReports((rs.data||[]) as Report[]);setMessages((ms.data||[]) as Msg[]);
   setChannels((cs.data||[]) as Channel[]);
  }catch(e){setError(message(e));}finally{setLoading(false);}
 },[client]);
 useEffect(()=>{void load();},[load]);
 async function execute(run:()=>Promise<void>){
  setBusy(true);setError('');
  try{await run();await load();}
  catch(e){setError(message(e));}finally{setBusy(false);}
 }
 async function hide(id:string){
  if(!client||reason.trim().length<3)return setError('Provide a clear moderation reason.');
  await execute(async()=>{const {error:e}=await client.rpc('community_hide',{p_message:id,p_reason:reason.trim()});if(e)throw e;});
 }
 async function lock(id:string,isLocked:boolean){
  if(!client)return;
  await execute(async()=>{const {error:e}=await client.rpc('community_set_lock',{p_channel:id,p_locked:isLocked});if(e)throw e;});
 }
 const find=(id:string)=>messages.find(m=>m.id===id);
 return <main className="shell">
  <header className="top"><div><p className="sub">SOLID ROCK · COMMUNITY SAFETY</p>
    <h1 className="title">Community moderation</h1><p className="sub">Report triage and channel controls · Approved pastoral roles only</p></div>
    <Link href="/" className="btn" style={{textDecoration:'none'}}>Back to operations</Link></header>
  {!client?<section className="panel" style={{marginTop:25}}>Configure church staging Supabase public credentials to access moderator tools.</section>:
   loading?<p className="sub">Checking authorised staff access…</p>:
   !user?<section className="panel" style={{marginTop:25}}>Sign in through the staff operations dashboard first. <Link href="/">Staff sign-in</Link></section>:
   !allowed?<section className="panel" style={{marginTop:25}}>Your account is not approved to moderate community conversations.</section>:
   <div className="grid">
    <section className="panel"><h2>Channel controls</h2>
      <p className="sub">Pause messages while resolving safeguarding or moderation incidents.</p>
      {channels.map(ch=><div className="record" key={ch.id}>
       <strong>{ch.title}</strong><p className="sub">{ch.kind} · {ch.is_locked?'Paused':'Open'}</p>
       <button disabled={busy} onClick={()=>void lock(ch.id,!ch.is_locked)}>{ch.is_locked?'Resume channel':'Pause channel'}</button>
      </div>)}
    </section>
    <section className="panel"><h2>Reported posts</h2>
      <p className="sub">Treat reports as confidential. Do not export or forward prayer details without a documented safeguarding need.</p>
      <label>Moderation reason<input value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}/></label>
      <div className="records">{reports.length?reports.map(r=>{
       const m=find(r.message_id),ch=channels.find(x=>x.id===m?.channel_id);
       return <article className="record" key={r.id}>
        <strong>{reasonText(r.reason)}</strong><span className="badge">{ch?.title||'Community channel'}</span>
        <p className="sub">{new Date(r.created_at).toLocaleString('en-IE')}</p>
        <p>{m?.body||'Message not available or access restricted.'}</p>
        {m?.hidden_at?<p className="sub">Hidden by an authorised moderator.</p>:
          <button disabled={!m||busy} onClick={()=>{if(m&&window.confirm('Hide this reported message for members?'))void hide(m.id);}}>Hide reported message</button>}
       </article>;
      }):<p className="sub">No reports available in this authorised workspace.</p>}</div>
      <button disabled={busy} onClick={()=>void load()}>Refresh moderation queue</button>
    </section>
   </div>}
  {error&&<p role="alert" className="error">{error}</p>}
  <p className="sub" style={{marginTop:24}}>Safety incidents require the church's approved escalation, safeguarding, retention and appeals procedures. Automated message hiding is not used.</p>
 </main>;
}
