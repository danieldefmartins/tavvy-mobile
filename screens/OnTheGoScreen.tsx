/** Mobile businesses: searchable list/map, verified place routing, live stops and owner controls. */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import ToolHeader from '../components/ToolHeader';
import PlaceReviewGrid from '../components/PlaceReviewGrid';
import {useBusinessReviewSummaries} from '../lib/useBusinessReviewSummaries';
import OnTheGoOwner from '../components/OnTheGoOwner';
import { BUSINESS_FILTERS, MobileBusiness, businessPoint, businessDirections, businessTime, safeBusinessUrl, selectBusinesses, distanceKm } from '../lib/onthego';
import { useOnTheGoDiscovery } from '../lib/useOnTheGoDiscovery';
import OnTheGoBusinessDetails from '../components/OnTheGoBusinessDetails';
import { useTranslation } from 'react-i18next';

// Map Styles Configuration - matching Home Screen
const MAP_STYLES = {
  osm: {
    name: 'Standard',
    type: 'raster',
    tileUrl: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    icon: 'map',
  },
  dark: {
    name: 'Dark',
    type: 'raster',
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    icon: 'moon',
  },
  satellite: {
    name: 'Satellite',
    type: 'raster',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    icon: 'image',
  },
};

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
  // Food
  'Food Trucks': 'fast-food',
  'Coffee': 'cafe',
  'Ice Cream': 'ice-cream',
  'BBQ': 'flame',
  'Tacos': 'restaurant',
  'Pizza': 'pizza',
  'Pop-ups': 'storefront',
  // Auto
  'Mobile Car Wash': 'car',
  'Mobile Detailing': 'sparkles',
  'Mobile Mechanic': 'build',
  'Mobile Tire Service': 'ellipse',
  // Pet
  'Mobile Pet Grooming': 'paw',
  'Mobile Dog Training': 'paw',
  'Mobile Vet': 'medkit',
  // Personal Care
  'Mobile Hair Stylist': 'cut',
  'Mobile Nail Tech': 'color-palette',
  'Mobile Massage': 'hand-left',
  // Professional
  'Mobile Notary': 'document',
  'Mobile DJ': 'musical-notes',
  'Mobile Photo Booth': 'camera',
  // General
  'Mobile Services': 'construct',
  'default': 'location',
};

export default function OnTheGoScreen() {
 const navigation=useNavigation<any>(),{isDark}=useThemeContext(),{i18n}=useTranslation();
 const cameraRef=useRef<React.ElementRef<typeof MapLibreGL.Camera>>(null);
 const discovery=useOnTheGoDiscovery(`${process.env.EXPO_PUBLIC_SUPABASE_URL||'https://scasgwrikoqdwlwlwcff.supabase.co'}/functions/v1/live-onthego-map-data?include_scheduled=true`);
 const route=useRoute<{key:string;name:string;params?:{view?:string}}>();
 const [view,setView]=useState<'list'|'map'>(route.params?.view==='map'?'map':'list'),[search,setSearch]=useState(''),[filter,setFilter]=useState('all'),[mapStyle,setMapStyle]=useState<keyof typeof MAP_STYLES>('osm');
 const [location,setLocation]=useState<[number,number]|null>(null),[nearby,setNearby]=useState(false),[locating,setLocating]=useState(false),[locationNote,setLocationNote]=useState('');
 const [showOwner,setShowOwner]=useState(false),[selected,setSelected]=useState<string|null>(null),[selectedMarker,setSelectedMarker]=useState<string|null>(null),[linkError,setLinkError]=useState('');
 const alive=useRef(true);useEffect(()=>()=>{alive.current=false;},[]);
 const colors={background:isDark?'#0e0b13':'#fff',surface:isDark?'#1b1723':'#f8f6fb',text:isDark?'#fff':'#17013a',secondary:isDark?'#b9b2c5':'#625e70',border:isDark?'#3d3448':'#d8d0e2'};
 const visible=React.useMemo(()=>selectBusinesses(discovery.businesses,filter,search,location,nearby),[discovery.businesses,filter,search,location,nearby]);
 const scope=JSON.stringify([filter,search,nearby,location]);
 const [page,setPage]=useState({scope:'',count:20});const shown=page.scope===scope?page.count:20;
 const displayed=visible.slice(0,shown),reviewSummary=useBusinessReviewSummaries(displayed);
 const selectedBusiness=visible.find(b=>b.tavvy_place_id===selectedMarker);
 const locate=async()=>{if(locating)return;setLocating(true);try{const permission=await Location.requestForegroundPermissionsAsync();if(permission.status!=='granted')throw new Error();const p=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});if(!alive.current)return;const point:[number,number]=[p.coords.latitude,p.coords.longitude];setLocation(point);setNearby(true);setLocationNote('Showing businesses within 50 km of your location.');cameraRef.current?.setCamera({centerCoordinate:[point[1],point[0]],zoomLevel:11,animationDuration:400});}catch{if(alive.current)setLocationNote('Location could not be accessed. Search a city or business, or try My location again.');}finally{if(alive.current)setLocating(false);}};
 const openLink=(url:string)=>{setLinkError('');void Linking.openURL(url).catch(()=>setLinkError('Unable to open this link. Please try again.'));};
 const action=(label:string,onPress:()=>void,active=false,disabled=false)=><TouchableOpacity accessibilityRole="button" accessibilityState={{selected:active,disabled}} disabled={disabled} onPress={onPress} style={[styles.action,{backgroundColor:active?'#70059b':colors.surface,borderColor:colors.border,opacity:disabled?.6:1}]}><Text style={{color:active?'#fff':colors.text,fontWeight:'600'}}>{label}</Text></TouchableOpacity>;
 const renderBusiness=(b:MobileBusiness)=>{const point=businessPoint(b),directions=businessDirections(b),phone=safeBusinessUrl(b.phone,'phone');return <View key={b.tavvy_place_id} style={[styles.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
  <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${b.place_name}`} onPress={()=>setSelected(b.tavvy_place_id)} style={styles.cardHeading}>{b.cover_image_url?<Image source={{uri:b.cover_image_url}} style={styles.photo}/>:<View style={[styles.photo,styles.placeholder]}><Ionicons name={(CATEGORY_ICONS[b.subcategory||b.category||'default']||'location') as any} size={27} color="#8a05be"/></View>}<View style={{flex:1,gap:5}}><Text style={[styles.name,{color:colors.text}]}>{b.place_name}</Text><Text style={{color:colors.secondary}}>{b.subcategory||b.category||'Mobile business'}</Text><Text style={{color:b.is_live?(isDark?'#ff9c9c':'#b82020'):(isDark?'#cfa9ff':'#70059b'),fontWeight:'700'}}>{b.is_live?'Live now':'Scheduled stop'}</Text></View><Ionicons name="chevron-forward" color={colors.secondary} size={20}/></TouchableOpacity>
  <PlaceReviewGrid summary={reviewSummary(b)}/>
  <Text style={{color:colors.text,lineHeight:21}}>{b.is_live?b.session_address||b.location_label||'Public address unavailable':b.next_event?.location_name}</Text><Text style={{color:colors.secondary,lineHeight:21}}>{b.is_live?`Until ${businessTime(b.scheduled_end_at,i18n.language)}`:businessTime(b.next_event?.scheduled_start,i18n.language)}</Text>{!b.is_live&&!!b.next_event?.location_address&&<Text style={{color:colors.secondary}}>{b.next_event.location_address}</Text>}{!!b.today_note&&<Text style={{color:colors.secondary}}>{b.today_note}</Text>}{!!b.service_area&&<Text style={{color:colors.secondary}}>Service area: {b.service_area}</Text>}{location&&point&&<Text style={{color:colors.secondary}}>{distanceKm(location,point).toLocaleString(i18n.language,{maximumFractionDigits:1})} km away · straight line</Text>}
  <View style={styles.actions}>{action('View place & schedule',()=>setSelected(b.tavvy_place_id))}{directions&&action('Directions',()=>openLink(directions))}{phone&&action('Call',()=>openLink(phone))}</View>
 </View>;};
 const geometry=JSON.stringify(visible.map(b=>[b.tavvy_place_id,businessPoint(b)]));
 useEffect(()=>{if(view!=='map')return;const points=visible.map(businessPoint).filter(Boolean) as [number,number][];if(nearby&&location)points.push(location);if(points.length===1)cameraRef.current?.setCamera({centerCoordinate:[points[0][1],points[0][0]],zoomLevel:12,animationDuration:400});else if(points.length>1)cameraRef.current?.fitBounds([Math.max(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0]))],[Math.min(...points.map(p=>p[1])),Math.min(...points.map(p=>p[0]))],50,400);},[geometry,nearby,location,view]);
 return <SafeAreaView style={{flex:1,backgroundColor:colors.background}} edges={['top']}><ToolHeader title="On The Go" subtitle="Find food trucks, mobile services and their next stops."/><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16,paddingBottom:100}}>
  <Text style={{color:colors.text,fontWeight:'600'}}>Search business, service or city</Text><TextInput accessibilityLabel="Search business, service or city" placeholder="Coffee, car wash, Boston…" placeholderTextColor={colors.secondary} value={search} onChangeText={value=>{setSearch(value);if(value.trim()){setNearby(false);setLocationNote('Showing all locations matching your search. Choose Within 50 km to narrow it to your location.');}}} returnKeyType="search" style={[styles.input,{color:colors.text,backgroundColor:colors.surface,borderColor:colors.border}]}/>
  <View style={styles.actions}>{action(locating?'Finding your location…':'My location',()=>void locate(),false,locating)}{action('All locations',()=>{setNearby(false);setLocationNote('Showing all locations matching your search.');},!nearby)}{location&&action('Within 50 km',()=>setNearby(true),nearby)}</View><Text accessibilityLiveRegion="polite" style={{color:colors.secondary,fontSize:12,lineHeight:18,marginVertical:8}}>{locationNote||'Search uses the published service area and stop address. Choose My location to find nearby businesses.'}</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingVertical:10}}>{BUSINESS_FILTERS.map(([id,label])=><React.Fragment key={id}>{action(label,()=>setFilter(id),filter===id)}</React.Fragment>)}</ScrollView>
  <View style={styles.resultsHeading}><Text style={{color:colors.text,fontWeight:'700',flex:1}}>{discovery.loading?'Finding businesses…':`${visible.filter(b=>b.is_live).length} live · ${visible.filter(b=>!b.is_live).length} scheduled`}</Text>{action('List',()=>setView('list'),view==='list')}{action('Map',()=>setView('map'),view==='map')}</View>
  {discovery.error&&<View style={styles.warning}><Text accessibilityRole="alert" style={{color:colors.text}}>{discovery.updatedAt?'Showing the last available update. ':''}{discovery.error}</Text>{action('Retry',()=>void discovery.refresh(),false,discovery.refreshing)}</View>}
  {view==='map'&&<><Text style={{color:colors.secondary,fontSize:12,marginVertical:8}}>Red: live · Purple: planned stop</Text><View style={styles.mapFrame}>
   {/* Small icon controls over the map: my location + Standard / Dark / Satellite layers */}
   <View style={styles.mapControls} pointerEvents="box-none">
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="My location" accessibilityState={{disabled:locating}} disabled={locating} onPress={()=>void locate()} style={[styles.mapControl,{backgroundColor:nearby&&location?'#70059b':'#fff'}]}>{locating?<ActivityIndicator size="small" color="#70059b"/>:<Ionicons name="locate" size={20} color={nearby&&location?'#fff':'#17013A'}/>}</TouchableOpacity>
    {([['osm','map-outline'],['dark','moon-outline'],['satellite','earth-outline']] as const).map(([id,icon])=><TouchableOpacity key={id} accessibilityRole="button" accessibilityLabel={MAP_STYLES[id].name} accessibilityState={{selected:mapStyle===id}} onPress={()=>setMapStyle(id)} style={[styles.mapControl,{backgroundColor:mapStyle===id?'#70059b':'#fff'}]}><Ionicons name={icon} size={20} color={mapStyle===id?'#fff':'#17013A'}/></TouchableOpacity>)}
   </View>
   <MapLibreGL.MapView style={{flex:1}} logoEnabled={false} attributionEnabled zoomEnabled scrollEnabled rotateEnabled pitchEnabled><MapLibreGL.RasterSource id="onthego-raster" tileUrlTemplates={[MAP_STYLES[mapStyle].tileUrl]} tileSize={256}><MapLibreGL.RasterLayer id="onthego-layer" sourceID="onthego-raster" style={{rasterSaturation:mapStyle==='dark'?-1:0,rasterBrightnessMax:mapStyle==='dark'?.45:1}}/></MapLibreGL.RasterSource><MapLibreGL.Camera ref={cameraRef} defaultSettings={{centerCoordinate:location?[location[1],location[0]]:[-98,39],zoomLevel:location?11:3}}/>
   {location&&<MapLibreGL.PointAnnotation id="onthego-user" coordinate={[location[1],location[0]]}><View style={{height:16,width:16,borderRadius:8,backgroundColor:'#2563eb',borderWidth:2,borderColor:'#fff'}}/></MapLibreGL.PointAnnotation>}
   {visible.map(b=>{const point=businessPoint(b);return point?<MapLibreGL.PointAnnotation key={b.tavvy_place_id} id={b.tavvy_place_id} coordinate={[point[1],point[0]]} onSelected={()=>setSelectedMarker(b.tavvy_place_id)}><View style={{height:34,width:34,borderRadius:17,backgroundColor:b.is_live?'#c52929':'#70059b',borderWidth:2,borderColor:'#fff',alignItems:'center',justifyContent:'center'}}><Ionicons name="location" size={20} color="#fff"/></View></MapLibreGL.PointAnnotation>:null;})}
   </MapLibreGL.MapView></View>{selectedBusiness&&action(`View ${selectedBusiness.place_name}`,()=>setSelected(selectedBusiness.tavvy_place_id))}</>}
  {discovery.loading?<ActivityIndicator style={{margin:30}}/>:!visible.length&&!discovery.error?<View style={{paddingVertical:25,gap:12}}><Text style={[styles.name,{color:colors.text}]}>No matching mobile businesses right now</Text><Text style={{color:colors.secondary,lineHeight:22}}>Try another city or service. Businesses appear when they share a live location or upcoming stop.</Text>{action('Clear filters',()=>{setFilter('all');setSearch('');setNearby(false);})}</View>:displayed.map(renderBusiness)}
  {visible.length>shown&&action(`Show more businesses (${visible.length-shown} remaining)`,()=>setPage({scope,count:shown+20}))}
  {!!linkError&&<Text accessibilityRole="alert" style={{color:colors.secondary}}>{linkError}</Text>}{action('Manage my mobile business',()=>setShowOwner(true))}
 </ScrollView>{showOwner&&<OnTheGoOwner visible onClose={()=>setShowOwner(false)}/>}{selected&&<OnTheGoBusinessDetails id={selected} onClose={()=>setSelected(null)}/>}</SafeAreaView>;
}
const styles=StyleSheet.create({header:{flexDirection:'row',alignItems:'center',gap:16},title:{fontSize:25,fontWeight:'700'},action:{paddingHorizontal:13,paddingVertical:11,minHeight:44,borderWidth:1,borderRadius:12,justifyContent:'center'},actions:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:10},input:{borderWidth:1,borderRadius:12,padding:14,minHeight:48,marginTop:8,marginBottom:6},resultsHeading:{flexDirection:'row',gap:6,alignItems:'center',marginVertical:10},card:{borderWidth:1,borderRadius:18,padding:14,marginVertical:8,gap:7},cardHeading:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:8,minHeight:66},name:{fontSize:18,fontWeight:'700'},photo:{height:66,width:66,borderRadius:12},placeholder:{backgroundColor:'#8a05be18',alignItems:'center',justifyContent:'center'},warning:{borderWidth:1,borderColor:'#b78038',padding:12,borderRadius:12,gap:8},mapControls:{position:'absolute',top:10,right:10,zIndex:2,gap:8},mapControl:{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(23,1,58,0.15)',shadowColor:'#000',shadowOpacity:0.15,shadowRadius:4,shadowOffset:{width:0,height:2},elevation:3},mapFrame:{height:360,borderRadius:18,overflow:'hidden'}});
