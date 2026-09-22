import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ScrollView, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapLibreGL from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import ToolHeader from '../components/ToolHeader';
import PlaceReviewGrid from '../components/PlaceReviewGrid';
import { buildPlaceReviewSummary } from '../lib/placeReviewSummary';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { useRVCatalog } from '../hooks/useRVCatalog';
import { RV_CATEGORIES, RVCategory, RVPlace, rvPlaceCategory, rvPlacePhoto, rvPlacePoint } from '../lib/rvCategories';

const MAP_TILES = {
  standard: { name: 'Standard', tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' },
  dark: { name: 'Dark', tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' },
  satellite: { name: 'Satellite', tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
} as const;

export default function RVCampingBrowseScreen({ navigation, route }: { navigation: any; route?: { params?: { view?: string } } }) {
  const { theme } = useThemeContext(), copy = useReleaseCopy();
  const [query, setQuery] = useState(''), [category, setCategory] = useState<RVCategory>('all');
  const [view, setView] = useState<'list' | 'map'>(route?.params?.view === 'map' ? 'map' : 'list'), [mapStyle, setMapStyle] = useState<keyof typeof MAP_TILES>('standard');
  const [location, setLocation] = useState<[number, number] | null>(null), [locating, setLocating] = useState(false), [locationNote, setLocationNote] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null), [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => { setFiltersOpen(false); }, [category]);
  const cameraRef = useRef<React.ElementRef<typeof MapLibreGL.Camera>>(null);
  const alive = useRef(true); useEffect(() => () => { alive.current = false; }, []);
  const catalog = useRVCatalog(category, query);
  const mappable = catalog.places.filter(place => rvPlacePoint(place));
  const selected = mappable.find(place => place.id === selectedId);
  // Reframe the map only when the geographic result set changes (not on every render or review update).
  const geometry = JSON.stringify(mappable.map(place => [place.id, rvPlacePoint(place)]));
  useEffect(() => {
    if (view !== 'map') return;
    const points = mappable.map(place => rvPlacePoint(place)!);
    if (location) points.push(location);
    if (points.length === 1) cameraRef.current?.setCamera({ centerCoordinate: [points[0][1], points[0][0]], zoomLevel: 11, animationDuration: 400 });
    else if (points.length > 1) cameraRef.current?.fitBounds([Math.max(...points.map(p => p[1])), Math.max(...points.map(p => p[0]))], [Math.min(...points.map(p => p[1])), Math.min(...points.map(p => p[0]))], 50, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, location, view]);
  const locate = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error();
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!alive.current) return;
      setLocation([p.coords.latitude, p.coords.longitude]); setLocationNote('');
    } catch {
      if (alive.current) setLocationNote(copy('Location could not be accessed. Search a city instead.'));
    } finally { if (alive.current) setLocating(false); }
  };
  const chip = (label: string, onPress: () => void, active = false, disabled = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: active, disabled }} disabled={disabled} onPress={onPress} style={[styles.chip, { backgroundColor: active ? theme.primary : theme.surface, borderColor: theme.border, opacity: disabled ? .6 : 1 }]}><Text style={{ color: active ? '#fff' : theme.text, fontWeight: '600' }}>{label}</Text></TouchableOpacity>;
  const renderPlace = ({ item: place }: { item: RVPlace }) => {
    const photo = rvPlacePhoto(place), area = [place.city, place.region].filter(Boolean).join(', ');
    return <TouchableOpacity accessibilityRole="button" accessibilityLabel={place.name} onPress={()=>navigation.navigate('PlaceDetails',{placeId:place.id})} style={[styles.card,{backgroundColor:theme.surface,borderColor:theme.border}]}>
      <View style={styles.cardHeading}>{photo?<Image source={{uri:photo}} style={[styles.photo,{backgroundColor:theme.background}]} />:<View style={[styles.photo,styles.placeholder,{backgroundColor:theme.background}]}><Ionicons name="leaf-outline" size={32} color={theme.textSecondary}/></View>}
      <View style={styles.cardText}><Text style={[styles.name,{color:theme.text}]}>{place.name}</Text><Text style={[styles.detail,{color:theme.textSecondary}]}>{[rvPlaceCategory(place),area].filter(Boolean).join(' · ')}</Text></View></View>
      <PlaceReviewGrid summary={catalog.reviewSummaries[place.id] || buildPlaceReviewSummary(null, {category:place.tavvy_category,subcategory:place.tavvy_subcategory}, 'loading')} />
    </TouchableOpacity>;
  };
  const header = <>
    <View style={styles.resultsHeading}><Text style={[styles.heading,{color:theme.text,flex:1}]}>{copy(query.trim()?'Search results':RV_CATEGORIES.find(c=>c.id===category&&c.id!=='all')?.label||'Places to explore')}</Text>
      <View accessibilityRole="tablist" style={styles.viewSwitch}>{chip(copy('List'),()=>setView('list'),view==='list')}{chip(copy('Map'),()=>setView('map'),view==='map')}</View></View>
    <Text style={[styles.scope,{color:theme.textSecondary}]}>{copy('Browse all locations. Search a place or city to narrow the list.')}</Text>
    {!!catalog.error&&<View accessibilityRole="alert" style={[styles.notice,{borderColor:theme.border}]}><Text style={{color:theme.text}}>{copy(catalog.error)}</Text><TouchableOpacity accessibilityRole="button" onPress={catalog.places.length?catalog.loadMore:catalog.reload} style={styles.action}><Text style={{color:theme.primary}}>{copy('Try again')}</Text></TouchableOpacity></View>}
  </>;
  if (view === 'map') return <SafeAreaView style={[styles.screen,{backgroundColor:theme.background}]} edges={['top']}>
    <ToolHeader title="RV & Camping" subtitle="Find your perfect campsite." />
    <View style={styles.mapScreen}>
      <MapLibreGL.MapView style={StyleSheet.absoluteFill} logoEnabled={false} attributionEnabled zoomEnabled scrollEnabled rotateEnabled pitchEnabled onPress={()=>{setFiltersOpen(false);setSelectedId(null);}}>
        <MapLibreGL.RasterSource id="rv-raster" tileUrlTemplates={[MAP_TILES[mapStyle].tileUrl]} tileSize={256}><MapLibreGL.RasterLayer id="rv-layer" sourceID="rv-raster" style={{rasterSaturation:mapStyle==='dark'?-1:0,rasterBrightnessMax:mapStyle==='dark'?.45:1}}/></MapLibreGL.RasterSource>
        <MapLibreGL.Camera ref={cameraRef} defaultSettings={{centerCoordinate:location?[location[1],location[0]]:[-98,39],zoomLevel:location?10:3}}/>
        {location&&<MapLibreGL.PointAnnotation id="rv-user" coordinate={[location[1],location[0]]}><View style={styles.userDot}/></MapLibreGL.PointAnnotation>}
        {mappable.map(place=>{const point=rvPlacePoint(place)!;return <MapLibreGL.PointAnnotation key={place.id} id={place.id} coordinate={[point[1],point[0]]} onSelected={()=>setSelectedId(place.id)}><View style={[styles.marker,selectedId===place.id&&styles.markerSelected]}><Ionicons name="location" size={18} color="#fff"/></View></MapLibreGL.PointAnnotation>;})}
      </MapLibreGL.MapView>
      {/* Floating search + filter button; the category chips open from the filter icon so the map keeps the space. */}
      <View style={styles.mapTop} pointerEvents="box-none">
        <View style={styles.mapSearchRow}>
          <View style={[styles.mapSearch,{backgroundColor:theme.surface,borderColor:theme.border}]}><Ionicons name="search" size={18} color={theme.textSecondary}/><View style={{flex:1}}><TextInput accessibilityLabel={copy('Search places or cities')} placeholder={copy('Search places or cities')} placeholderTextColor={theme.textSecondary} value={query} onChangeText={setQuery} maxLength={120} returnKeyType="search" autoCorrect={false} style={[styles.mapSearchInput,{color:theme.text}]} /></View></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('Filters')} accessibilityState={{expanded:filtersOpen,selected:category!=='all'}} onPress={()=>setFiltersOpen(open=>!open)} style={[styles.mapControl,{backgroundColor:filtersOpen||category!=='all'?theme.primary:'#fff'}]}><Ionicons name="options-outline" size={20} color={filtersOpen||category!=='all'?'#fff':'#17013A'}/></TouchableOpacity>
        </View>
        {filtersOpen&&<View style={[styles.mapFilterPanel,{backgroundColor:theme.surface,borderColor:theme.border}]}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{RV_CATEGORIES.map(item=><TouchableOpacity key={item.id} accessibilityRole="button" accessibilityState={{selected:category===item.id}} onPress={()=>setCategory(item.id)} style={[styles.chip,{backgroundColor:category===item.id?theme.primary:theme.surface,borderColor:theme.border}]}><Text style={{color:category===item.id?'white':theme.text}}>{item.icon} {copy(item.label)}</Text></TouchableOpacity>)}</ScrollView></View>}
        {!!catalog.error&&<View accessibilityRole="alert" style={[styles.notice,styles.mapNotice,{borderColor:theme.border,backgroundColor:theme.surface}]}><Text style={{color:theme.text}}>{copy(catalog.error)}</Text><TouchableOpacity accessibilityRole="button" onPress={catalog.places.length?catalog.loadMore:catalog.reload} style={styles.action}><Text style={{color:theme.primary}}>{copy('Try again')}</Text></TouchableOpacity></View>}
      </View>
      {/* Small icon controls over the map: my location + Standard / Dark / Satellite layers */}
      <View style={[styles.mapControls,{top:filtersOpen?128:70}]} pointerEvents="box-none">
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('My location')} accessibilityState={{disabled:locating}} disabled={locating} onPress={()=>void locate()} style={[styles.mapControl,{backgroundColor:location?theme.primary:'#fff'}]}>{locating?<ActivityIndicator size="small" color={theme.primary}/>:<Ionicons name="locate" size={20} color={location?'#fff':'#17013A'}/>}</TouchableOpacity>
        {([['standard','map-outline'],['dark','moon-outline'],['satellite','earth-outline']] as const).map(([id,icon])=><TouchableOpacity key={id} accessibilityRole="button" accessibilityLabel={copy(MAP_TILES[id].name)} accessibilityState={{selected:mapStyle===id}} onPress={()=>setMapStyle(id)} style={[styles.mapControl,{backgroundColor:mapStyle===id?theme.primary:'#fff'}]}><Ionicons name={icon} size={20} color={mapStyle===id?'#fff':'#17013A'}/></TouchableOpacity>)}
      </View>
      {/* Bottom: selected place, then List / Load more pills */}
      <View style={styles.mapBottom} pointerEvents="box-none">
        {selected&&<TouchableOpacity accessibilityRole="button" accessibilityLabel={selected.name} onPress={()=>navigation.navigate('PlaceDetails',{placeId:selected.id})} style={[styles.card,styles.mapCard,{backgroundColor:theme.surface,borderColor:theme.primary}]}>
          <View style={styles.cardHeading}>{rvPlacePhoto(selected)?<Image source={{uri:rvPlacePhoto(selected)!}} style={[styles.photo,{backgroundColor:theme.background}]}/>:<View style={[styles.photo,styles.placeholder,{backgroundColor:theme.background}]}><Ionicons name="leaf-outline" size={32} color={theme.textSecondary}/></View>}
          <View style={styles.cardText}><Text style={[styles.name,{color:theme.text}]}>{selected.name}</Text><Text style={[styles.detail,{color:theme.textSecondary}]}>{[rvPlaceCategory(selected),[selected.city,selected.region].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</Text><Text style={{color:theme.primary,fontWeight:'700',marginTop:6}}>{copy('View place')}</Text></View></View>
        </TouchableOpacity>}
        {!!locationNote&&<Text style={[styles.mapNoteText,{backgroundColor:theme.surface,color:theme.textSecondary}]}>{locationNote}</Text>}
        {!catalog.loading&&!catalog.error&&!mappable.length&&<Text style={[styles.mapNoteText,{backgroundColor:theme.surface,color:theme.textSecondary}]}>{copy(catalog.places.length?'No places with map coordinates in this list yet. Load more places or search a city.':'No places found')}</Text>}
        <View style={styles.mapBottomRow}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('List')} onPress={()=>setView('list')} style={styles.pill}><Ionicons name="list" size={18} color="#17013A"/><Text style={styles.pillText}>{copy('List')} · {catalog.loading?'…':`${mappable.length}/${catalog.places.length}`}</Text></TouchableOpacity>
          {catalog.hasMore&&<TouchableOpacity accessibilityRole="button" disabled={catalog.loadingMore} onPress={catalog.loadMore} style={[styles.pill,{opacity:catalog.loadingMore?.6:1}]}>{catalog.loadingMore?<ActivityIndicator size="small" color={theme.primary}/>:<Ionicons name="add" size={18} color="#17013A"/>}<Text style={styles.pillText}>{copy(catalog.loadingMore?'Loading places…':'Load more')}</Text></TouchableOpacity>}
        </View>
      </View>
      {catalog.loading&&<View style={styles.mapLoading} pointerEvents="none"><ActivityIndicator color={theme.primary} accessibilityLabel={copy('Loading places…')}/></View>}
    </View>
  </SafeAreaView>;
  return <SafeAreaView style={[styles.screen,{backgroundColor:theme.background}]} edges={['top']}>
    <ToolHeader title="RV & Camping" subtitle="Find your perfect campsite." />
    <View style={styles.searchWrap}><TextInput accessibilityLabel={copy('Search places or cities')} placeholder={copy('Search places or cities')} placeholderTextColor={theme.textSecondary} value={query} onChangeText={setQuery} maxLength={120} returnKeyType="search" autoCorrect={false} style={[styles.input,{color:theme.text,backgroundColor:theme.surface,borderColor:theme.border}]} /></View>
    <View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{RV_CATEGORIES.map(item=><TouchableOpacity key={item.id} accessibilityRole="button" accessibilityState={{selected:category===item.id}} onPress={()=>setCategory(item.id)} style={[styles.chip,{backgroundColor:category===item.id?theme.primary:theme.surface,borderColor:theme.border}]}><Text style={{color:category===item.id?'white':theme.text}}>{item.icon} {copy(item.label)}</Text></TouchableOpacity>)}</ScrollView></View>
    <FlatList data={catalog.places} extraData={catalog.reviewSummaries} keyExtractor={item=>item.id} renderItem={renderPlace} contentContainerStyle={styles.results} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={catalog.loading} onRefresh={catalog.reload} tintColor={theme.primary}/>}
      ListHeaderComponent={header}
      ListEmptyComponent={catalog.loading?<ActivityIndicator color={theme.primary} accessibilityLabel={copy('Loading places…')}/>:!catalog.error?<View style={styles.empty}><Text style={[styles.heading,{color:theme.text}]}>{copy('No places found')}</Text><Text style={[styles.scope,{color:theme.textSecondary}]}>{copy('Try another place, city or category.')}</Text></View>:null}
      ListFooterComponent={catalog.hasMore?<TouchableOpacity accessibilityRole="button" disabled={catalog.loadingMore} onPress={catalog.loadMore} style={[styles.more,{backgroundColor:theme.surface,borderColor:theme.border}]}><Text style={{color:theme.text}}>{copy(catalog.loadingMore?'Loading places…':'Load more places')}</Text></TouchableOpacity>:null}
    />
  </SafeAreaView>;
}
const styles=StyleSheet.create({screen:{flex:1},resultsHeading:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4},viewSwitch:{flexDirection:'row',gap:6},mapScreen:{flex:1,overflow:'hidden'},mapTop:{position:'absolute',top:10,left:12,right:12,zIndex:3,gap:8},mapSearchRow:{flexDirection:'row',alignItems:'center',gap:8},mapSearch:{flex:1,flexDirection:'row',alignItems:'center',gap:8,minHeight:44,paddingLeft:12,paddingRight:6,borderWidth:1,borderRadius:22,shadowColor:'#000',shadowOpacity:0.15,shadowRadius:4,shadowOffset:{width:0,height:2},elevation:3},mapSearchInput:{minHeight:42,fontSize:16,paddingVertical:8},mapFilterPanel:{marginRight:48,borderWidth:1,borderRadius:16,paddingVertical:2,shadowColor:'#000',shadowOpacity:0.15,shadowRadius:4,shadowOffset:{width:0,height:2},elevation:3},mapNotice:{marginTop:4},mapBottom:{position:'absolute',left:12,right:12,bottom:14,zIndex:3,gap:8},mapBottomRow:{flexDirection:'row',gap:8,justifyContent:'center',flexWrap:'wrap'},mapCard:{marginVertical:0,shadowColor:'#000',shadowOpacity:0.15,shadowRadius:6,shadowOffset:{width:0,height:3},elevation:4},mapNoteText:{alignSelf:'center',paddingHorizontal:12,paddingVertical:6,borderRadius:12,fontSize:13,overflow:'hidden'},pill:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:16,minHeight:44,borderRadius:22,backgroundColor:'#fff',borderWidth:1,borderColor:'rgba(23,1,58,0.15)',shadowColor:'#000',shadowOpacity:0.15,shadowRadius:4,shadowOffset:{width:0,height:2},elevation:3},pillText:{color:'#17013A',fontWeight:'700'},mapLoading:{position:'absolute',top:'45%',alignSelf:'center',padding:14,borderRadius:16,backgroundColor:'rgba(255,255,255,0.9)'},mapControls:{position:'absolute',right:12,zIndex:3,gap:8},mapControl:{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(23,1,58,0.15)',shadowColor:'#000',shadowOpacity:0.15,shadowRadius:4,shadowOffset:{width:0,height:2},elevation:3},marker:{height:32,width:32,borderRadius:16,backgroundColor:'#8A05BE',borderWidth:2,borderColor:'#fff',alignItems:'center',justifyContent:'center'},markerSelected:{backgroundColor:'#00C2CB'},userDot:{height:16,width:16,borderRadius:8,backgroundColor:'#2563eb',borderWidth:2,borderColor:'#fff'},searchWrap:{paddingHorizontal:16,paddingTop:12},input:{minHeight:48,paddingHorizontal:14,borderWidth:1,borderRadius:14,fontSize:16},filters:{padding:16,gap:8},chip:{minHeight:44,justifyContent:'center',paddingHorizontal:14,borderWidth:1,borderRadius:22},results:{paddingHorizontal:16,paddingBottom:110},heading:{fontSize:20,fontWeight:'700',marginBottom:8},scope:{fontSize:14,lineHeight:21,marginBottom:20},cardHeading:{flexDirection:'row',gap:14,alignItems:'center'},card:{gap:14,padding:14,marginBottom:12,borderWidth:1,borderRadius:18},photo:{width:84,height:84,borderRadius:12},placeholder:{alignItems:'center',justifyContent:'center'},cardText:{flex:1,minWidth:0},name:{fontSize:17,fontWeight:'600',marginBottom:5},detail:{fontSize:13,lineHeight:19},more:{alignSelf:'center',minHeight:44,borderWidth:1,borderRadius:22,padding:12,marginVertical:20},empty:{paddingVertical:20},notice:{borderWidth:1,borderRadius:12,padding:14,marginBottom:16},action:{minHeight:44,justifyContent:'center'}});
