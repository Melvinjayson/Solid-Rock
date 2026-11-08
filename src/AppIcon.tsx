import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme as T } from './theme';
export type IconName='home'|'watch'|'community'|'events'|'more'|'give'|'prayer'|'book'|'arrow'|'back'|'sun'|'moon'|'info'|'chevron'|'check'|'sparkles'|'send'|'heart'|'people'|'shield'|'chat'|'calendar'|'bell'|'help'|'flag'|'refresh'|'globe'|'close'|'lock'|'plus'|'menu';
type IonName=React.ComponentProps<typeof Ionicons>['name'];
const names:Record<IconName,{outline:IonName;filled:IonName}>={
 home:{outline:'home-outline',filled:'home'},watch:{outline:'play-circle-outline',filled:'play-circle'},
 community:{outline:'people-outline',filled:'people'},events:{outline:'calendar-outline',filled:'calendar'},
 more:{outline:'grid-outline',filled:'grid'},give:{outline:'heart-outline',filled:'heart'},
 prayer:{outline:'hand-left-outline',filled:'hand-left'},book:{outline:'book-outline',filled:'book'},
 arrow:{outline:'arrow-forward',filled:'arrow-forward'},back:{outline:'arrow-back',filled:'arrow-back'},
 sun:{outline:'sunny-outline',filled:'sunny'},moon:{outline:'moon-outline',filled:'moon'},
 info:{outline:'information-circle-outline',filled:'information-circle'},
 chevron:{outline:'chevron-forward',filled:'chevron-forward'},
 check:{outline:'checkmark-circle-outline',filled:'checkmark-circle'},
 sparkles:{outline:'sparkles-outline',filled:'sparkles'},send:{outline:'send-outline',filled:'send'},
 heart:{outline:'heart-outline',filled:'heart'},people:{outline:'people-outline',filled:'people'},
 shield:{outline:'shield-checkmark-outline',filled:'shield-checkmark'},
 chat:{outline:'chatbubbles-outline',filled:'chatbubbles'},
 calendar:{outline:'calendar-outline',filled:'calendar'},bell:{outline:'notifications-outline',filled:'notifications'},
 help:{outline:'help-circle-outline',filled:'help-circle'},
 flag:{outline:'flag-outline',filled:'flag'},refresh:{outline:'refresh',filled:'refresh'},
 globe:{outline:'globe-outline',filled:'globe'},
 close:{outline:'close',filled:'close'},lock:{outline:'lock-closed-outline',filled:'lock-closed'},
 plus:{outline:'add',filled:'add'},menu:{outline:'menu-outline',filled:'menu'}
};
export default function AppIcon({name,size=22,color,filled=false}:{name:IconName;size?:number;color?:string;filled?:boolean}){
 return <Ionicons name={filled?names[name].filled:names[name].outline} size={size} color={color||T.ink}/>;
}
