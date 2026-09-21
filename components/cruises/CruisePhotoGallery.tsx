import React,{useEffect,useState} from 'react';
import {View,Text,Image,TouchableOpacity,ActivityIndicator} from 'react-native';
import {getCruiseGallery} from '../../lib/cruises/service';
import {CruiseGalleryPhoto,galleryWithCover} from '../../lib/cruises/gallery';
import {useThemeContext} from '../../contexts/ThemeContext';
import {useReleaseCopy} from '../../hooks/useReleaseCopy';
export default function CruisePhotoGallery({shipId,cover}:{shipId:string;cover:{url:string;alt:string}|null}){
 const copy=useReleaseCopy(),{theme}=useThemeContext(),[photos,setPhotos]=useState<CruiseGalleryPhoto[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[retry,setRetry]=useState(0),[limit,setLimit]=useState(8);
 useEffect(()=>{let active=true;setPhotos([]);setLoading(true);setError(false);setLimit(8);getCruiseGallery(shipId).then(rows=>{if(active)setPhotos(rows)}).catch(()=>{if(active)setError(true)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false};},[shipId,retry]);
 const visible=galleryWithCover(photos,cover),button=(label:string,action:()=>void)=><TouchableOpacity accessibilityRole="button" onPress={action} style={{minHeight:44,padding:12,borderWidth:1,borderColor:theme.border,borderRadius:12,alignSelf:'flex-start'}}><Text style={{color:theme.text}}>{label}</Text></TouchableOpacity>;
 return <View style={{gap:16}}>{visible.slice(0,limit).map(photo=>{const original=photos.find(p=>p.id===photo.id);return <View key={photo.id} style={{borderWidth:1,borderColor:theme.border,borderRadius:16,overflow:'hidden',backgroundColor:theme.surface}}><Image source={{uri:photo.url}} accessibilityLabel={photo.alt} resizeMode="contain" style={{width:'100%',aspectRatio:original?original.width/original.height:16/9}}/>{photo.caption&&<Text style={{color:theme.textSecondary,padding:12,lineHeight:21}}>{photo.caption}</Text>}</View>})}{loading&&<ActivityIndicator accessibilityLabel={copy('Loading…')} color={theme.primary}/>}{error&&<View style={{gap:8}}><Text accessibilityRole="alert" style={{color:theme.textSecondary}}>{copy('Photos could not be loaded.')}</Text>{button(copy('Try again'),()=>setRetry(v=>v+1))}</View>}{visible.length>limit&&button(copy('Show more'),()=>setLimit(n=>n+8))}</View>;
}
