import React from 'react';
import {View,Text,TouchableOpacity,Linking,StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useThemeContext} from '../contexts/ThemeContext';
import {useOnTheGoDetails} from '../lib/useOnTheGoDetails';
import {businessTime,safeBusinessUrl,validCoordinates} from '../lib/onthego';
import type {MobilePlaceDetails} from '../lib/onthegoDetails';
export default function OnTheGoStatus({canonicalPlaceId,tavvyPlaceId}:{canonicalPlaceId?:string;tavvyPlaceId?:string}) {
 const state=useOnTheGoDetails({canonicalPlaceId,tavvyPlaceId}); const {isDark}=useThemeContext();
 if(state.loading)return <Text style={{color:isDark?'#ccc':'#625e70',padding:12}}>Checking live location…</Text>;
 if(!state.data&&!state.error)return null;
 return <View>{state.error&&<TouchableOpacity accessibilityRole="button" onPress={state.retry}><Text style={{color:isDark?'#ffc5b7':'#a32f13',padding:12}}>{state.error} Retry</Text></TouchableOpacity>}{state.data&&<OnTheGoStatusContent data={state.data} loadMore={state.loadMore}/>}</View>;
}
export function OnTheGoStatusContent({data,loadMore}:{data:MobilePlaceDetails;loadMore?:()=>void}) {
 const {isDark}=useThemeContext();const {i18n}=useTranslation();const [open,setOpen]=React.useState(!data.live);const [linkError,setLinkError]=React.useState('');
 const text={color:isDark?'#fff':'#17013a'},sub={color:isDark?'#b8b3c3':'#625e70',lineHeight:21};const {place,live,events}=data;
 const link=(title:string,url:string|null)=>url?<TouchableOpacity accessibilityRole="link" onPress={()=>{setLinkError('');void Linking.openURL(url).catch(()=>setLinkError('Unable to open this link. Please try again.'));}} style={styles.action}><Text style={{color:isDark?'#caafff':'#70059b',fontWeight:'600'}}>{title}</Text></TouchableOpacity>:null;
 const directions=(lat:number,lng:number)=>`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
 return <View style={[styles.card,{backgroundColor:isDark?'#1a1821':'#f7f5fa',borderColor:isDark?'#393343':'#dedbe4'}]}>
  <Text style={[text,styles.heading]}>{live?'Live now':'Mobile business'}</Text>
  {live?<><Text style={[text,{fontWeight:'600'}]}>{live.session_address||live.location_label}</Text><Text style={sub}>Live until {businessTime(live.scheduled_end_at,i18n.language)} · reported by the business</Text>{live.today_note&&<Text style={sub}>{live.today_note}</Text>}{link('Directions to current stop',directions(live.session_lat,live.session_lng))}</>:<Text style={sub}>No live location is being shared right now. Scheduled stops are plans; confirm with the business before travelling.</Text>}
  {!!place.service_area&&<Text style={sub}>Service area: {place.service_area}</Text>}{!!place.hours_display&&<Text style={sub}>Usual hours: {place.hours_display}</Text>}{link(`Call ${place.phone}`,safeBusinessUrl(place.phone,'phone'))}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:14}}>{['website','instagram','facebook','twitter','tiktok'].map(key=><View key={key}>{link(key==='twitter'?'X / Twitter':key.charAt(0).toUpperCase()+key.slice(1),safeBusinessUrl(place[key as keyof typeof place] as string))}</View>)}</View>
  {!!live?.specials?.length&&<View style={{gap:8}}><Text style={[text,{fontWeight:'700'}]}>Today’s specials</Text>{live.specials.filter(s=>!s.valid_until||Date.parse(s.valid_until)>Date.now()).map(s=><View key={s.id}><Text style={text}>{s.title}</Text>{!!s.description&&<Text style={sub}>{s.description}</Text>}{!!s.valid_until&&<Text style={sub}>Until {businessTime(s.valid_until,i18n.language)}</Text>}</View>)}</View>}
  {!!live?.items?.length&&<View style={{gap:8}}><Text style={[text,{fontWeight:'700'}]}>Available at this stop</Text>{live.items.map(item=><View key={item.id}><Text style={text}>{item.name}</Text>{!!item.description&&<Text style={sub}>{item.description}</Text>}</View>)}</View>}
  <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={styles.action}><Text style={[text,{fontWeight:'700'}]}>Scheduled stops{events.length?` (${events.length}${data.has_more?'+':''})`:''} {open?'−':'+'}</Text></TouchableOpacity>
  {open&&(!events.length?<Text style={sub}>No upcoming stops have been published.</Text>:events.map(e=><View key={e.id} style={styles.stop}><Text style={[text,{fontWeight:'600'}]}>{e.event_title||e.location_name}</Text><Text style={sub}>{businessTime(e.scheduled_start,i18n.language)} – {businessTime(e.scheduled_end,i18n.language)}</Text><Text style={sub}>{e.location_name}{e.location_address?` · ${e.location_address}`:''}</Text>{!!e.event_description&&<Text style={sub}>{e.event_description}</Text>}{validCoordinates(e.latitude,e.longitude)&&link('Directions to this stop',directions(e.latitude,e.longitude))}</View>))}
  {open&&data.has_more&&loadMore&&<TouchableOpacity accessibilityRole="button" onPress={loadMore} style={styles.action}><Text style={text}>Show more stops</Text></TouchableOpacity>}{!!linkError&&<Text accessibilityRole="alert" style={sub}>{linkError}</Text>}
 </View>;
}
const styles=StyleSheet.create({card:{padding:16,borderWidth:1,borderRadius:18,marginVertical:12,gap:8},heading:{fontSize:18,fontWeight:'700'},action:{minHeight:44,justifyContent:'center'},stop:{borderTopWidth:StyleSheet.hairlineWidth,borderTopColor:'#8886',paddingVertical:12,gap:5}});
