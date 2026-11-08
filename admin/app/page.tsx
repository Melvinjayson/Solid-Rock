'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Module = 'announcements' | 'events' | 'sermons' | 'groups' | 'volunteer_opportunities' | 'pastoral_slots';
type Form = { title:string; body:string; description:string; speaker:string; passage:string; series:string; media_url:string; starts_at:string; ends_at:string; venue:string; capacity:string; location_label:string; published:boolean };
const empty:Form={title:'',body:'',description:'',speaker:'',passage:'',series:'',media_url:'',starts_at:'',ends_at:'',venue:'',capacity:'',location_label:'',published:false};
const labels:Record<Module,string>={announcements:'Announcements',events:'Events',sermons:'Sermons',groups:'Fellowship groups',volunteer_opportunities:'Volunteering',pastoral_slots:'Pastoral availability'};
const allowed:Record<Module,string[]> = {
  announcements:['content_admin','super_admin'],events:['content_admin','super_admin'],sermons:['content_admin','super_admin'],
  groups:['group_leader','super_admin'],volunteer_opportunities:['ministry_leader','super_admin'],
  pastoral_slots:['pastor','super_admin'],
};
type Row = { id:string; [key:string]:unknown };
const errorMessage=(e:unknown)=>e instanceof Error?e.message:'Unexpected error';

export default function Admin() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const client=useMemo<SupabaseClient|null>(()=>url&&key?createClient(url,key):null,[url,key]);
  const [email,setEmail]=useState(''),[code,setCode]=useState(''),[user,setUser]=useState<string|null>(null);
  const [roles,setRoles]=useState<string[]>([]),[module,setModule]=useState<Module>('announcements');
  const [form,setForm]=useState<Form>(empty),[rows,setRows]=useState<Row[]>([]);
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const [ready,setReady]=useState(false);
  const canWrite=roles.some(r=>allowed[module].includes(r));
  const canSee=roles.length>0;

  const loadAuth=useCallback(async()=>{
    if(!client){setReady(true);return;}
    const {data:{user:u},error:e}=await client.auth.getUser();
    if(e){setError(e.message);setReady(true);return;}
    setUser(u?.id??null);
    if(u){
      const {data:r,error:re}=await client.from('staff_roles').select('role').eq('user_id',u.id);
      if(re)setError(re.message);
      setRoles((r??[]).map((x:{role:string})=>x.role));
    }else setRoles([]);
    setReady(true);
  },[client]);
  useEffect(()=>{
    void loadAuth();
    if(!client)return;
    const {data:{subscription}}=client.auth.onAuthStateChange(()=>{void loadAuth();});
    return()=>subscription.unsubscribe();
  },[client,loadAuth]);

  const loadRows=useCallback(async()=>{
    if(!client||!canSee)return;
    setBusy(true);
    const {data,error:e}=await client.from(module).select('*').limit(100);
    if(e)setError(e.message);else{setRows((data??[]) as Row[]);setError('');}
    setBusy(false);
  },[client,module,canSee]);
  useEffect(()=>{void loadRows();},[loadRows]);

  async function action(task:()=>Promise<void>){
    setBusy(true);setError('');setNotice('');
    try{await task();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}
  }
  async function sendOtp(){if(!client)return;
    await action(async()=>{
      const {error:e}=await client.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:false}});
      if(e)throw e;setNotice('Check the email for your six-digit sign-in code.');
    });
  }
  async function verify(){if(!client)return;
    await action(async()=>{
      const {error:e}=await client.auth.verifyOtp({email:email.trim(),token:code.trim(),type:'email'});
      if(e)throw e;setNotice('Signed in. Staff permissions are being loaded.');await loadAuth();
    });
  }
  async function save(){if(!client||!user||!canWrite)return;
    await action(async()=>{
      if(module!=='pastoral_slots'&&!form.title.trim())throw Error('Enter a title.');
      let payload:Record<string,unknown>={};
      switch(module){
        case 'announcements':payload={title:form.title.trim(),body:form.body.trim(),published:form.published,published_at:form.published?new Date().toISOString():null};break;
        case 'events':
          if(!form.starts_at||Number.isNaN(Date.parse(form.starts_at)))throw Error('Enter a valid event start date.');
          payload={title:form.title.trim(),description:form.description.trim(),starts_at:new Date(form.starts_at).toISOString(),ends_at:form.ends_at?new Date(form.ends_at).toISOString():null,venue:form.venue.trim(),capacity:form.capacity?Number(form.capacity):null,published:form.published,registration_enabled:form.published};break;
        case 'sermons':payload={title:form.title.trim(),description:form.description.trim(),speaker:form.speaker.trim(),series:form.series.trim(),passage:form.passage.trim(),media_url:form.media_url.trim()||null,is_public:form.published,published_at:form.published?new Date().toISOString():null};break;
        case 'groups':payload={title:form.title.trim(),description:form.description.trim(),location_label:form.location_label.trim(),is_public:form.published};break;
        case 'volunteer_opportunities':payload={title:form.title.trim(),description:form.description.trim(),published:form.published};break;
        case 'pastoral_slots':
          if(!form.starts_at||!form.ends_at||new Date(form.ends_at)<=new Date(form.starts_at))throw Error('Enter a valid start and end time.');
          payload={pastor_id:user,starts_at:new Date(form.starts_at).toISOString(),ends_at:new Date(form.ends_at).toISOString(),available:true};break;
      }
      const {error:e}=await client.from(module).insert(payload);
      if(e)throw e;
      setForm(empty);setNotice('Saved to the church database under your staff permissions.');await loadRows();
    });
  }
  function field(label:string,field:keyof Form,kind:'text'|'textarea'|'datetime-local'|'number'='text'){
    return <label>{label}{kind==='textarea'?
      <textarea value={String(form[field])} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}/>:
      <input type={kind} value={String(form[field])} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}/>}</label>;
  }

  return <main className="shell">
    <header className="top"><div style={{display:'flex',alignItems:'center'}}><div className="mark">SR</div><div><h1 className="title">Solid Rock · Operations</h1><div className="sub">Church-controlled content and community management</div></div></div>
      {user&&<button type="button" onClick={()=>void client?.auth.signOut()}>Sign out</button>}
    </header>
    {!client?<div className="panel" style={{marginTop:24}}><h2>Configuration needed</h2><p className="sub">Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the admin environment. Never use a service-role key in this browser.</p></div>:
    !ready?<div className="panel" style={{marginTop:24}}>Checking authentication…</div>:
    !user?<div className="panel" style={{marginTop:24,maxWidth:480}}><h2>Staff sign-in</h2><p className="sub">Sign in using a pre-approved church staff email. A registered member alone has no administrative access.</p>
      <div className="form"><label>Staff email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <button disabled={busy||!email.includes('@')} onClick={()=>void sendOtp()}>Send email code</button>
      <label>Six-digit code<input type="text" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value)}/></label>
      <button disabled={busy||code.length!==6} onClick={()=>void verify()}>Verify sign-in code</button></div></div>:
    !canSee?<div className="panel" style={{marginTop:24}}><h2>Staff access required</h2><p className="sub">Your account is authenticated but has no approved staff role. Role grants require separate identity verification and trusted provisioning.</p></div>:
    <div className="grid"><nav className="nav" aria-label="Administration modules">
      {Object.entries(labels).map(([key,label])=><button key={key} onClick={()=>{setModule(key as Module);setForm(empty);setNotice('');setError('');}} className={module===key?'active':''}>{label}</button>)}
    </nav>
    <section className="panel"><h2>{labels[module]}</h2><p className="sub">{canWrite?'Your approved staff role permits updates in this module.':'Read-only for your current staff permissions.'}</p>
      {canWrite&&<div className="form">
        {module!=='pastoral_slots'&&field('Title', 'title')}
        {module==='announcements'&&field('Announcement body','body','textarea')}
        {(module==='events'||module==='sermons'||module==='groups'||module==='volunteer_opportunities')&&field('Description','description','textarea')}
        {module==='events'&&<>{field('Start time','starts_at','datetime-local')}{field('End time (optional)','ends_at','datetime-local')}{field('Venue','venue')}{field('Capacity (leave blank for unlimited)','capacity','number')}</>}
        {module==='sermons'&&<>{field('Speaker','speaker')}{field('Series','series')}{field('Scripture passage','passage')}{field('Approved video URL','media_url')}</>}
        {module==='groups'&&field('Area / general location','location_label')}
        {module==='pastoral_slots'&&<>{field('Start time','starts_at','datetime-local')}{field('End time','ends_at','datetime-local')}</>}
        {module!=='pastoral_slots'&&<label style={{display:'flex',flexDirection:'row',gap:10,alignItems:'center'}}><input type="checkbox" style={{width:18}} checked={form.published} onChange={e=>setForm(p=>({...p,published:e.target.checked}))}/> Publish to the mobile app</label>}
        <button disabled={busy} onClick={()=>void save()}>{busy?'Saving…':'Save new record'}</button>
      </div>}
      {error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status" className="ok">{notice}</p>}
      <div className="records"><h3>Existing records</h3>
        {rows.length?rows.map(row=><div className="record" key={row.id}>
          <strong>{String(row.title??row.starts_at??'Record')}</strong>
          <span className="badge">{row.published===true||row.is_public===true?'Published':row.published===false||row.is_public===false?'Draft':'Record'}</span>
          <p className="sub">{String(row.description??row.body??row.venue??'')}</p>
        </div>):<p className="sub">No records available for this module or access level.</p>}
        <button disabled={busy} onClick={()=>void loadRows()}>Refresh records</button>
      </div>
    </section></div>}
    <p className="sub" style={{marginTop:30}}>Staff access and publishing are governed by database role policies. Never upload confidential pastoral or financial data to public content modules.</p>
  </main>;
}
