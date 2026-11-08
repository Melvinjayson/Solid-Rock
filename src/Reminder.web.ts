export async function enableSundayReminder():Promise<{supported:boolean;id?:string}>{
 return {supported:false};
}
export async function disableReminder(_id:string):Promise<void>{}
