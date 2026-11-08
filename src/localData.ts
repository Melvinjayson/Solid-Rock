import AsyncStorage from '@react-native-async-storage/async-storage';
import {churchDb} from './backend';

export const LOCAL_KEY_PREFIX='@solidrock:';

/**
 * Clears app-owned local preferences, reading notes, devotionals, faith journeys,
 * notification read state, social feed cache and onboarding progress.
 * Never deletes arbitrary AsyncStorage keys belonging to libraries or other apps.
 *
 * An authenticated session is ended locally before removing personal state.
 * This does NOT delete the user's remote church account or any legal ledger.
 */
export async function clearSolidRockDeviceData():Promise<number>{
  if(churchDb){
    const {error}=await churchDb.auth.signOut({scope:'local'});
    if(error)throw new Error('Could not end the local session; no app data has been cleared. Try signing out and retry.');
  }
  const keys=(await AsyncStorage.getAllKeys()).filter(key=>key.startsWith(LOCAL_KEY_PREFIX));
  if(keys.length)await AsyncStorage.multiRemove(keys);
  return keys.length;
}
