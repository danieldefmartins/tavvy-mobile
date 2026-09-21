import React from 'react';
import {View,Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ToolHeader from '../components/ToolHeader';
import {useThemeContext} from '../contexts/ThemeContext';
/** Legacy provider tap route has no compatible backend. Never write provider IDs to place reviews. */
export default function SignalReviewScreen(){const {theme}=useThemeContext();return <SafeAreaView style={{flex:1,backgroundColor:theme.background}}><ToolHeader title="Review unavailable"/><View style={{padding:24,gap:14}}><Text accessibilityRole="header" style={{fontSize:24,fontWeight:'700',color:theme.text}}>Provider experience taps are not available yet.</Text><Text style={{fontSize:16,lineHeight:24,color:theme.textSecondary}}>You can view existing customer reviews on the professional’s profile.</Text></View></SafeAreaView>;}
