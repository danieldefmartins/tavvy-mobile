import React,{useState} from 'react';
import {View,Text,TouchableOpacity} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useThemeContext} from '../contexts/ThemeContext';
import {useOnTheGoSchedule} from '../lib/useOnTheGoSchedule';
import {businessTime} from '../lib/onthego';
export default function OnTheGoSchedule({placeId,refreshVersion=0}:{placeId:string;refreshVersion?:number}){
 const state=useOnTheGoSchedule(placeId,refreshVersion),{theme}=useThemeContext(),{i18n}=useTranslation();const [confirm,setConfirm]=useState<string|null>(null);
 const button=(label:string,action:()=>unknown,disabled=state.loading||!!state.cancelling)=><TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={action} style={{minHeight:44,padding:12,borderRadius:10,borderWidth:1,borderColor:theme.border,marginVertical:5,opacity:disabled?.55:1}}><Text style={{color:theme.text}}>{label}</Text></TouchableOpacity>;
 return <View style={{marginVertical:20,borderTopWidth:1,borderColor:theme.border,paddingTop:14}}><Text accessibilityRole="header" style={{color:theme.text,fontSize:18,fontWeight:'700'}}>Your scheduled stops</Text>{button('Refresh schedule',state.refresh)}
  {!!state.error&&<Text accessibilityRole="alert" style={{color:theme.text}}>{state.error}</Text>}{!!state.message&&<Text accessibilityLiveRegion="polite" style={{color:theme.text}}>{state.message}</Text>}
  {state.loading&&<Text style={{color:theme.textSecondary}}>Loading your schedule…</Text>}{!state.signedIn?<Text style={{color:theme.textSecondary}}>Sign in to manage your scheduled stops.</Text>:!state.loading&&!state.error&&!state.stops.length?<Text style={{color:theme.textSecondary}}>No upcoming stops have been published.</Text>:null}
  {state.stops.map(stop=><View key={stop.id} style={{paddingVertical:14,borderBottomWidth:1,borderColor:theme.border,gap:6}}><Text style={{color:theme.text,fontWeight:'700'}}>{stop.event_title||stop.location_name}</Text><Text style={{color:theme.textSecondary}}>{businessTime(stop.scheduled_start,i18n.language)} – {businessTime(stop.scheduled_end,i18n.language)}</Text>{!!stop.location_address&&<Text style={{color:theme.textSecondary}}>{stop.location_address}</Text>}{confirm===stop.id?<View><Text style={{color:theme.text}}>Cancel this scheduled stop? Customers will no longer see it as upcoming.</Text>{button('Keep stop',()=>setConfirm(null),!!state.cancelling)}{button(state.cancelling===stop.id?'Cancelling…':'Confirm cancellation',async()=>{if(await state.cancel(stop.id))setConfirm(null);},!!state.cancelling)}</View>:button('Cancel stop',()=>setConfirm(stop.id))}</View>)}
  {state.nextOffset!==null&&button('Show more stops',state.loadMore)}<Text style={{color:theme.textSecondary,lineHeight:21,marginTop:12}}>To change a stop, cancel it and publish the corrected details below.</Text>
 </View>;
}
