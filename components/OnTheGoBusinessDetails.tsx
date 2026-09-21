import React,{useEffect,useState} from 'react';
import {Modal,View,Text,ScrollView,TouchableOpacity,Image,Linking,ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useThemeContext} from '../contexts/ThemeContext';
import {useOnTheGoDetails} from '../lib/useOnTheGoDetails';
import {safeBusinessUrl} from '../lib/onthego';
import {OnTheGoStatusContent} from './OnTheGoStatus';
/** The canonical screen owns reviews/menu/stories; never pass a tavvy_places ID as a places ID. */
export default function OnTheGoBusinessDetails({id,onClose}:{id:string;onClose:()=>void}) {
 const navigation=useNavigation<any>(),{isDark}=useThemeContext(),state=useOnTheGoDetails({tavvyPlaceId:id});const [tab,setTab]=useState('Overview'),[error,setError]=useState('');
 useEffect(()=>{if(state.data?.place.canonical_place_id){onClose();navigation.navigate('PlaceDetails',{placeId:state.data.place.canonical_place_id,mobileBusinessId:id});}},[state.data?.place.canonical_place_id,id]);
 const color=isDark?'#fff':'#17013a',secondary=isDark?'#b8b3c3':'#625e70',surface=isDark?'#18141f':'#fff',border=isDark?'#3e3648':'#dedbe4';
 const button=(label:string,action:()=>void)=><TouchableOpacity accessibilityRole="button" onPress={action} style={{minHeight:44,padding:12,borderWidth:1,borderColor:border,borderRadius:12,marginVertical:5}}><Text style={{color}}>{label}</Text></TouchableOpacity>;
 const link=(label:string,url:string|null)=>url?button(label,()=>void Linking.openURL(url).catch(()=>setError('Unable to open this link.'))):null;
 const p=state.data?.place;
 return <Modal visible animationType="slide" onRequestClose={onClose}><SafeAreaView style={{flex:1,backgroundColor:surface}}><ScrollView contentContainerStyle={{padding:18,paddingBottom:60}}>
  {button('Back to On The Go',onClose)}{state.loading&&<ActivityIndicator/>}{state.error&&<><Text accessibilityRole="alert" style={{color:secondary}}>{state.error}</Text>{button('Retry',state.retry)}</>}
  {!state.loading&&!state.error&&!p&&<Text style={{color}}>This mobile business is no longer available.</Text>}
  {p&&<>{p.cover_image_url&&<Image source={{uri:p.cover_image_url}} style={{width:'100%',height:220,borderRadius:18}}/>}<Text style={{color,fontSize:26,fontWeight:'700',marginVertical:16}}>{p.name}</Text><Text style={{color:secondary}}>{p.tavvy_subcategory||p.tavvy_category} · {p.service_area}</Text>
   <View style={{flexDirection:'row',gap:8,marginVertical:16}}>{['Overview','Photos','Details'].map(label=><TouchableOpacity key={label} accessibilityRole="tab" accessibilityState={{selected:tab===label}} onPress={()=>setTab(label)} style={{flex:1,padding:12,borderRadius:10,backgroundColor:tab===label?'#70059b':surface,borderWidth:1,borderColor:border}}><Text style={{color:tab===label?'#fff':color,textAlign:'center'}}>{label}</Text></TouchableOpacity>)}</View>
   {tab==='Overview'&&<><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['The Main Thing','The Good','The Vibe','Heads Up'].map(title=><View key={title} style={{width:'48%',padding:14,borderWidth:1,borderColor:border,borderRadius:16}}><Text style={{color,fontWeight:'700'}}>{title}</Text><Text style={{color:secondary,marginTop:8}}>Reviews not available yet</Text></View>)}</View><Text style={{color:secondary,marginVertical:12}}>This business has not enabled its full Tavvy review page yet. No review totals or ratings are inferred.</Text><OnTheGoStatusContent data={state.data!} loadMore={state.loadMore}/><Text style={{color:secondary}}>{p.description}</Text></>}
   {tab==='Photos'&&((p.photos?.length||p.cover_image_url)?[...new Set([p.cover_image_url,...(p.photos||[])].filter(Boolean))].map(url=><Image key={url} source={{uri:url!}} style={{width:'100%',height:240,borderRadius:14,marginBottom:12}}/>):<Text style={{color:secondary}}>No business photos have been added yet.</Text>)}
   {tab==='Details'&&<><Text style={{color:secondary}}>{p.description}</Text><Text style={{color:secondary,marginVertical:10}}>Service area: {p.service_area||'Not provided'}</Text>{!!p.hours_display&&<Text style={{color:secondary}}>Usual hours: {p.hours_display}</Text>}{link('Call',safeBusinessUrl(p.phone,'phone'))}{link('Website',safeBusinessUrl(p.website))}{['instagram','facebook','twitter','tiktok'].map(key=>{const value=p[key as keyof typeof p];return typeof value==='string'?<View key={key}>{link(key,safeBusinessUrl(value))}</View>:null;})}<Text style={{color:secondary,marginTop:14}}>Tavvy Menu, stories and eCard will appear on the full place page when this business enables them.</Text></>}
  </>}{!!error&&<Text style={{color:secondary}}>{error}</Text>}
 </ScrollView></SafeAreaView></Modal>;
}
