import React from 'react';
import {View,Text,ScrollView,TouchableOpacity} from 'react-native';
import {BROWSE_CATEGORIES,BrowsePlan} from '../../../lib/ecard/templateSelection';
import {useReleaseCopy} from '../../../hooks/useReleaseCopy';
export default function TemplateBrowseFilters({category,plan,onChange,isDark}:{category:string;plan:BrowsePlan;onChange:(category:string,plan:BrowsePlan)=>void;isDark:boolean}){
 const copy=useReleaseCopy(),text=isDark?'#F8FAFC':'#202124',border=isDark?'#756080':'#B2A0BC';
 const button=(id:string,label:string,selected:boolean,action:()=>void)=><TouchableOpacity key={id} accessibilityRole="button" accessibilityState={{selected}} onPress={action} style={{minHeight:44,justifyContent:'center',paddingHorizontal:12,borderWidth:1,borderColor:selected?'#8A4CAC':border,borderRadius:10,backgroundColor:selected?(isDark?'#42294F':'#EFE3F4'):'transparent'}}><Text style={{color:text,fontSize:13,fontWeight:selected?'700':'400'}}>{copy(label)}</Text></TouchableOpacity>;
 return <View style={{paddingBottom:10,gap:8}}><ScrollView horizontal accessibilityLabel={copy('Design category')} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:20,gap:8}}>{BROWSE_CATEGORIES.map(item=>button(item.id,item.label,category===item.id,()=>onChange(item.id,plan)))}</ScrollView><View accessibilityLabel={copy('Design plan')} style={{flexDirection:'row',gap:8,paddingHorizontal:20}}>{(['all','free','pro'] as const).map(value=>button(value,value==='all'?'All plans':value==='free'?'Free':'Pro',plan===value,()=>onChange(category,value)))}</View></View>;
}
