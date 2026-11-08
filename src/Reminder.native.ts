import * as Notifications from 'expo-notifications';
export async function enableSundayReminder():Promise<{supported:boolean;id?:string}>{
 const existing=await Notifications.getPermissionsAsync();
 let granted=existing.granted;
 if(!granted){const p=await Notifications.requestPermissionsAsync();granted=p.granted;}
 if(!granted)return {supported:true};
 await Notifications.setNotificationChannelAsync('worship',{
   name:'Sunday worship',importance:Notifications.AndroidImportance.DEFAULT,
   sound:'default'
 }).catch(()=>{});
 const id=await Notifications.scheduleNotificationAsync({
  content:{
   title:'Sunday worship at Solid Rock',
   body:'Worship begins at 11:00 am today in Inchicore. You are welcome here.',
   data:{route:'home'}
  },
  trigger:{
   type:Notifications.SchedulableTriggerInputTypes.WEEKLY,
   weekday:1,hour:10,minute:15,channelId:'worship'
  }
 });
 return {supported:true,id};
}
export async function disableReminder(id:string):Promise<void>{
 if(id)await Notifications.cancelScheduledNotificationAsync(id).catch(()=>{});
}
