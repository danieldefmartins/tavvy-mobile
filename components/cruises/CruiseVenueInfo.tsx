import {useReleaseCopy} from '../../hooks/useReleaseCopy';
import React from 'react';
import {Alert,Linking,Text,TouchableOpacity,View} from 'react-native';
import {useThemeContext} from '../../contexts/ThemeContext';
import {CruiseVenueContext} from '../../lib/cruises/venueContext';
export default function CruiseVenueInfo({context,onShip}:{context:CruiseVenueContext;onShip:()=>void}) {
 const {theme}=useThemeContext();
 const copy=useReleaseCopy();
 return <View accessibilityLabel={copy('Onboard place information')} style={{marginTop:16,padding:16,borderWidth:1,borderColor:theme.border,borderRadius:16,gap:9,backgroundColor:theme.surface}}>
  <TouchableOpacity accessibilityRole="link" onPress={onShip} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:theme.primary,fontWeight:'700',fontSize:16}}>← {context.ship_name}</Text></TouchableOpacity>
  <Text style={{color:theme.textSecondary}}>{context.operator_name}{context.deck_label?` · ${context.deck_label}`:''}</Text>
  {context.included!==null&&<Text style={{color:theme.text}}>{copy(context.included?'Included':'Additional charge')}</Text>}
  {!!context.availability_note&&<Text style={{color:theme.text,lineHeight:22}}>{context.availability_note}</Text>}
  <Text style={{color:theme.textSecondary,lineHeight:20,fontSize:13}}>{copy('These reviews describe this place on board. Whole-ship reviews are on the ship page.')}</Text>
  {!!context.official_url&&<TouchableOpacity accessibilityRole="link" onPress={()=>void Linking.openURL(context.official_url!).catch(()=>Alert.alert(copy('Link unavailable'),copy('Try again')))} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:theme.primary,fontWeight:'700'}}>{copy('Official ship website ↗')}</Text></TouchableOpacity>}
 </View>;
}
