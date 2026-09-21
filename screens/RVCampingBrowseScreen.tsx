import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ScrollView, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ToolHeader from '../components/ToolHeader';
import PlaceReviewGrid from '../components/PlaceReviewGrid';
import { buildPlaceReviewSummary } from '../lib/placeReviewSummary';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { useRVCatalog } from '../hooks/useRVCatalog';
import { RV_CATEGORIES, RVCategory, RVPlace, rvPlaceCategory, rvPlacePhoto } from '../lib/rvCategories';

export default function RVCampingBrowseScreen({ navigation }: { navigation: any }) {
  const { theme } = useThemeContext(), copy = useReleaseCopy();
  const [query, setQuery] = useState(''), [category, setCategory] = useState<RVCategory>('all');
  const catalog = useRVCatalog(category, query);
  const renderPlace = ({ item: place }: { item: RVPlace }) => {
    const photo = rvPlacePhoto(place), area = [place.city, place.region].filter(Boolean).join(', ');
    return <TouchableOpacity accessibilityRole="button" accessibilityLabel={place.name} onPress={()=>navigation.navigate('PlaceDetails',{placeId:place.id})} style={[styles.card,{backgroundColor:theme.surface,borderColor:theme.border}]}>
      <View style={styles.cardHeading}>{photo?<Image source={{uri:photo}} style={[styles.photo,{backgroundColor:theme.background}]} />:<View style={[styles.photo,styles.placeholder,{backgroundColor:theme.background}]}><Ionicons name="leaf-outline" size={32} color={theme.textSecondary}/></View>}
      <View style={styles.cardText}><Text style={[styles.name,{color:theme.text}]}>{place.name}</Text><Text style={[styles.detail,{color:theme.textSecondary}]}>{[rvPlaceCategory(place),area].filter(Boolean).join(' · ')}</Text></View></View>
      <PlaceReviewGrid summary={catalog.reviewSummaries[place.id] || buildPlaceReviewSummary(null, {category:place.tavvy_category,subcategory:place.tavvy_subcategory}, 'loading')} />
    </TouchableOpacity>;
  };
  return <SafeAreaView style={[styles.screen,{backgroundColor:theme.background}]} edges={['top']}>
    <ToolHeader title="RV & Camping" subtitle="Find your perfect campsite." />
    <View style={styles.searchWrap}><TextInput accessibilityLabel={copy('Search places or cities')} placeholder={copy('Search places or cities')} placeholderTextColor={theme.textSecondary} value={query} onChangeText={setQuery} maxLength={120} returnKeyType="search" autoCorrect={false} style={[styles.input,{color:theme.text,backgroundColor:theme.surface,borderColor:theme.border}]} /></View>
    <View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{RV_CATEGORIES.map(item=><TouchableOpacity key={item.id} accessibilityRole="button" accessibilityState={{selected:category===item.id}} onPress={()=>setCategory(item.id)} style={[styles.chip,{backgroundColor:category===item.id?theme.primary:theme.surface,borderColor:theme.border}]}><Text style={{color:category===item.id?'white':theme.text}}>{item.icon} {copy(item.label)}</Text></TouchableOpacity>)}</ScrollView></View>
    <FlatList data={catalog.places} extraData={catalog.reviewSummaries} keyExtractor={item=>item.id} renderItem={renderPlace} contentContainerStyle={styles.results} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={catalog.loading} onRefresh={catalog.reload} tintColor={theme.primary}/>}
      ListHeaderComponent={<><Text style={[styles.heading,{color:theme.text}]}>{copy(query.trim()?'Search results':RV_CATEGORIES.find(c=>c.id===category&&c.id!=='all')?.label||'Places to explore')}</Text><Text style={[styles.scope,{color:theme.textSecondary}]}>{copy('Browse all locations. Search a place or city to narrow the list.')}</Text>{!!catalog.error&&<View accessibilityRole="alert" style={[styles.notice,{borderColor:theme.border}]}><Text style={{color:theme.text}}>{copy(catalog.error)}</Text><TouchableOpacity accessibilityRole="button" onPress={catalog.places.length?catalog.loadMore:catalog.reload} style={styles.action}><Text style={{color:theme.primary}}>{copy('Try again')}</Text></TouchableOpacity></View>}</>}
      ListEmptyComponent={catalog.loading?<ActivityIndicator color={theme.primary} accessibilityLabel={copy('Loading places…')}/>:!catalog.error?<View style={styles.empty}><Text style={[styles.heading,{color:theme.text}]}>{copy('No places found')}</Text><Text style={[styles.scope,{color:theme.textSecondary}]}>{copy('Try another place, city or category.')}</Text></View>:null}
      ListFooterComponent={catalog.hasMore?<TouchableOpacity accessibilityRole="button" disabled={catalog.loadingMore} onPress={catalog.loadMore} style={[styles.more,{backgroundColor:theme.surface,borderColor:theme.border}]}><Text style={{color:theme.text}}>{copy(catalog.loadingMore?'Loading places…':'Load more places')}</Text></TouchableOpacity>:null}
    />
  </SafeAreaView>;
}
const styles=StyleSheet.create({screen:{flex:1},searchWrap:{paddingHorizontal:16,paddingTop:12},input:{minHeight:48,paddingHorizontal:14,borderWidth:1,borderRadius:14,fontSize:16},filters:{padding:16,gap:8},chip:{minHeight:44,justifyContent:'center',paddingHorizontal:14,borderWidth:1,borderRadius:22},results:{paddingHorizontal:16,paddingBottom:110},heading:{fontSize:20,fontWeight:'700',marginBottom:8},scope:{fontSize:14,lineHeight:21,marginBottom:20},cardHeading:{flexDirection:'row',gap:14,alignItems:'center'},card:{gap:14,padding:14,marginBottom:12,borderWidth:1,borderRadius:18},photo:{width:84,height:84,borderRadius:12},placeholder:{alignItems:'center',justifyContent:'center'},cardText:{flex:1,minWidth:0},name:{fontSize:17,fontWeight:'600',marginBottom:5},detail:{fontSize:13,lineHeight:19},more:{alignSelf:'center',minHeight:44,borderWidth:1,borderRadius:22,padding:12,marginVertical:20},empty:{paddingVertical:20},notice:{borderWidth:1,borderRadius:12,padding:14,marginBottom:16},action:{minHeight:44,justifyContent:'center'}});
