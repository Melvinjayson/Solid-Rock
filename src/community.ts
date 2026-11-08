import { churchDb } from './backend';

export type ChannelKind='announcements'|'discussion'|'prayer'|'study';
export type CommunityChannel={id:string;slug:string;title:string;description:string;kind:ChannelKind;is_locked:boolean};
export type CommunityMessage={id:string;channel_id:string;author_id:string;body:string;created_at:string;hidden_at:string|null;reply_to_id:string|null};
export const COMMUNITY_PREVIEW:Omit<CommunityChannel,'id'|'is_locked'>[]=[
 {slug:'church-updates',title:'Church updates',description:'News and pastoral announcements',kind:'announcements'},
 {slug:'prayer-circle',title:'Prayer circle',description:'Pray for and encourage one another',kind:'prayer'},
 {slug:'faith-and-life',title:'Faith & life',description:'Discuss questions and everyday faith',kind:'discussion'},
 {slug:'scripture-together',title:'Scripture together',description:'Read, reflect and learn as a group',kind:'study'},
 {slug:'serve-together',title:'Serve together',description:'Connect through ministry and service',kind:'discussion'}
];
function db(){if(!churchDb)throw Error('Community messaging is not enabled yet.');return churchDb;}
export async function listChannels():Promise<CommunityChannel[]>{
 const {data,error}=await db().from('community_channels')
  .select('id,slug,title,description,kind,is_locked').eq('is_listed',true).order('title');
 if(error)throw error;return (data||[]) as CommunityChannel[];
}
export async function getMyChannelMemberships():Promise<string[]>{
 const user=(await db().auth.getUser()).data.user;if(!user)return [];
 const {data,error}=await db().from('community_memberships').select('channel_id').eq('user_id',user.id);
 if(error)throw error;return (data||[]).map(x=>x.channel_id as string);
}
export async function joinChannel(id:string){
 const {error}=await db().rpc('community_join',{p_channel:id});if(error)throw error;
}
export async function leaveChannel(id:string){
 const {error}=await db().rpc('community_leave',{p_channel:id});if(error)throw error;
}
export async function getMessages(id:string):Promise<CommunityMessage[]>{
 const {data,error}=await db().from('community_messages')
   .select('id,channel_id,author_id,body,created_at,hidden_at,reply_to_id')
   .eq('channel_id',id).order('created_at',{ascending:false}).limit(75);
 if(error)throw error;return ((data||[]) as CommunityMessage[]).reverse();
}
export async function sendMessage(id:string,body:string){
 if(!body.trim()||body.length>2000)throw Error('Please use 1–2,000 characters.');
 const {error}=await db().rpc('community_post',{p_channel:id,p_body:body.trim()});if(error)throw error;
}
export async function reportMessage(id:string,reason:'harassment'|'spam'|'privacy'|'safeguarding'|'other'){
 const {error}=await db().rpc('community_report',{p_message:id,p_reason:reason,p_context:''});if(error)throw error;
}
export async function blockMember(userId:string){
 const {error}=await db().rpc('community_block',{p_user:userId});if(error)throw error;
}
/** Postgres Changes are only observed for joined, RLS-authorised channels.
 * Read access and message visibility are still enforced by the table policy. */
export function listenToMessages(channelId:string,refresh:()=>void){
 const client=churchDb;if(!client)return()=>{};
 const topic='community:'+channelId;
 const channel=client.channel(topic)
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'community_messages',filter:'channel_id=eq.'+channelId},()=>refresh())
   .subscribe();
 return()=>{void client.removeChannel(channel);};
}

export async function sendReply(channelId:string,parentId:string,body:string){
 if(!body.trim()||body.length>2000)throw Error('Please use 1–2,000 characters.');
 const {error}=await db().rpc('community_reply',{p_channel:channelId,p_parent:parentId,p_body:body.trim()});
 if(error)throw error;
}
export async function togglePrayerSupport(messageId:string):Promise<boolean>{
 const {data,error}=await db().rpc('community_toggle_prayer',{p_message:messageId});
 if(error)throw error;return Boolean(data);
}
export async function getPrayerSupportCounts(channelId:string):Promise<Record<string,number>>{
 const {data,error}=await db().rpc('community_prayer_counts',{p_channel:channelId});
 if(error)throw error;
 return Object.fromEntries(((data||[]) as {message_id:string;support_count:number}[])
   .map(x=>[x.message_id,Number(x.support_count)]));
}
