'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
import Link from 'next/link';
type Assignment={event_id:string};
function errorText(e:unknown){return e instanceof Error?e.message:'Could not verify registration';}
export default function EventCheckIn(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const client=useMemo(()=>url&&key?createClient(url,key):null,[url,key]);
 const [verified,setVerified]=useState(false),[signedIn,setSignedIn]=useState(false);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [eventIds,setEventIds]=useState<string[]>([]),[registration,setRegistration]=useState('');
 const [result,setResult]=useState(''),[error,setError]=useState('');
 const load=useCallback(async()=>{
  if(!client){setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const {data:{user},error:ue}=await client.auth.getUser();
   if(ue)throw ue;
   setSignedIn(Boolean(user));if(!user){setVerified(false);return;}
   const [role,assigned]=await Promise.all([
    client.from('staff_roles').select('role').eq('user_id',user.id),
    client.from('event_staff_assignments').select('event_id').eq('user_id',user.id)
   ]);
   if(role.error)throw role.error;if(assigned.error)throw assigned.error;
   const admin=(role.data||[]).some(r=>r.role==='super_admin');
   setEventIds((assigned.data||[] as Assignment[]).map(r=>r.event_id));
   setVerified(admin||(assigned.data||[]).length>0);
  }catch(e){setError(errorText(e));}finally{setLoading(false);}
 },[client]);
 useEffect(()=>{void load();},[load]);
 async function checkIn(){
  const input=registration.trim().toLowerCase();
  if(!client||!verified)return;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(input)){
    setError('Enter the complete registration reference (UUID).');return;
  }
  setError('');setResult('');setBusy(true);
  try{
   const {data,error:rpc}=await client.rpc('checkin_event_registration',{p_registration_id:input});
   if(rpc)throw rpc;
   if(!data)throw Error('No check-in timestamp was returned');
   setResult('Attendance confirmed · '+new Date(data).toLocaleString('en-IE')+'. This reference cannot be checked in twice.');
   setRegistration('');
  }catch(e){setError(errorText(e));}finally{setBusy(false);}
 }
 return <main className="shell">
  <header className="top"><div><p className="sub">SOLID ROCK · APPROVED EVENTS TEAM</p>
   <h1 className="title">Member event check-in</h1>
   <p className="sub">Manual attendance confirmation, role-checked by the church database</p></div>
   <Link href="/" className="btn" style={{textDecoration:'none'}}>Back to church operations</Link>
  </header>
  <section className="panel" style={{marginTop:24,maxWidth:650}}>
  {!client?<p className="sub">Configure church-owned staging Supabase credentials to test event check-in.</p>:
   loading?<p className="sub">Verifying staff access…</p>:
   !signedIn?<p className="sub">Sign in through the approved staff dashboard before checking in attendees.</p>:
   !verified?<p className="sub">This account is not assigned to an event and does not have super-admin authority.</p>:
   <>
    <h2>Verify registration reference</h2>
    <p className="sub">Ask the registered adult to show their reference from the church app. A reference is not a paid ticket or proof of identity. The server validates event status, staff role and the event check-in window.</p>
    {eventIds.length>0&&<p className="sub">{eventIds.length} assigned event{eventIds.length===1?'':'s'} for this staff account</p>}
    <div className="form"><label htmlFor="registration">Registration reference
      <input id="registration" autoComplete="off" spellCheck={false} maxLength={36}
       placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={registration}
       onChange={e=>setRegistration(e.target.value)}/></label>
     <button disabled={busy||registration.length<36} onClick={()=>void checkIn()}>{busy?'Checking…':'Confirm check-in'}</button>
    </div>
   </>}
   {result&&<p className="ok" role="status">{result}</p>}
   {error&&<p className="error" role="alert">{error}</p>}
  </section>
  <p className="sub" style={{marginTop:25}}>QR scanning, youth/household check-in, paid ticket entitlement, attendance analytics and auto notifications remain gated pending dedicated church approval. Never photograph or publicly share attendee references.</p>
 </main>;
}
