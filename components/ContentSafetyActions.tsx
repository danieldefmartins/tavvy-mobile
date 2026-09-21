import React,{useState} from 'react';
import {View,Text,TouchableOpacity,Modal,ScrollView,SafeAreaView,DeviceEventEmitter} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../contexts/AuthContext';
import {useThemeContext} from '../contexts/ThemeContext';
import {useReleaseCopy} from '../hooks/useReleaseCopy';
import {ContentKind,ContentReportReason,CONTENT_BLOCK_SCOPE,reportContent,blockContentAuthor} from '../lib/contentSafety';
export const CONTENT_SAFETY_CHANGED='tavvy-content-safety-changed';
export function notifyContentSafetyChanged(){DeviceEventEmitter.emit(CONTENT_SAFETY_CHANGED)}
const reasons:[ContentReportReason,string][]=[['spam','Spam'],['fake','Fake experience'],['offensive','Offensive content'],['harassment','Harassment'],['sexual','Sexual content'],['violent','Violence'],['wrong_place','Wrong place'],['conflict_of_interest','Conflict of interest'],['other','Other']];
export default function ContentSafetyActions({kind,contentId,onChanged,onSignIn}:{kind:ContentKind;contentId:string;onChanged?:()=>void;onSignIn?:()=>void}){
 const {user}=useAuth();const {theme}=useThemeContext();const copy=useReleaseCopy();const navigation=useNavigation<any>();
 const [mode,setMode]=useState<'closed'|'menu'|'report'|'block'>('closed'),[reason,setReason]=useState<ContentReportReason>('spam'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contentId))return null;
 const button={backgroundColor:theme.surface,minHeight:44,padding:12,borderWidth:1,borderColor:theme.border,borderRadius:10,marginVertical:4};
 function choose(next:'report'|'block'){if(!user){setMode('closed');if(onSignIn)onSignIn();else navigation.navigate('Login');return}setError('');setMessage('');setMode(next)}
 async function submit(){if(busy)return;setBusy(true);setError('');try{if(mode==='report'){await reportContent(kind,contentId,reason);setMessage(copy('Report sent to Tavvy for review.'));setMode('closed')}else if(mode==='block'){await blockContentAuthor(kind,contentId);setMode('closed');setMessage(copy('Author blocked.'));notifyContentSafetyChanged();onChanged?.()}}catch(e){setError(e instanceof Error?e.message:copy('This action could not be completed. Please try again.'))}finally{setBusy(false)}}
 return <View><TouchableOpacity accessibilityRole="button" onPress={()=>setMode('menu')} style={button}><Text style={{color:theme.text,fontSize:13}}>{copy('Report or block')}</Text></TouchableOpacity>{message&&<Text accessibilityLiveRegion="polite" style={{color:theme.text}}>{message}</Text>}
 <Modal visible={mode!=='closed'} animationType="slide" onRequestClose={()=>{if(!busy)setMode('closed')}}><SafeAreaView style={{flex:1,backgroundColor:theme.background}}><ScrollView contentContainerStyle={{padding:24}}><Text style={{color:theme.text,fontWeight:'700',fontSize:22}}>{copy(mode==='block'?'Block author':mode==='report'?'Report content':'Content options')}</Text>
 {mode==='menu'&&<><TouchableOpacity style={button} onPress={()=>choose('report')}><Text style={{color:theme.text}}>{copy('Report content')}</Text></TouchableOpacity><TouchableOpacity style={button} onPress={()=>choose('block')}><Text style={{color:theme.text}}>{copy('Block author')}</Text></TouchableOpacity></>}
 {mode==='report'&&<><Text style={{color:theme.textSecondary,marginVertical:12}}>{copy('Reports are reviewed by Tavvy. Reporting does not automatically remove content.')}</Text>{reasons.map(([id,label])=><TouchableOpacity key={id} disabled={busy} style={button} accessibilityRole="radio" accessibilityState={{checked:reason===id}} onPress={()=>setReason(id)}><Text style={{color:theme.text}}>{reason===id?'●':'○'} {copy(label)}</Text></TouchableOpacity>)}</>}
 {mode==='block'&&<><Text style={{color:theme.text,lineHeight:23,marginVertical:12}}>{copy(CONTENT_BLOCK_SCOPE)}</Text><Text style={{color:theme.textSecondary}}>{copy('You can unblock authors in Settings.')}</Text></>}
 {error&&<Text accessibilityRole="alert" style={{color:theme.text,marginVertical:12}}>{error}</Text>}{(mode==='report'||mode==='block')&&<TouchableOpacity disabled={busy} style={button} onPress={submit}><Text style={{color:theme.primary,fontWeight:'700'}}>{copy(busy?'Saving…':mode==='report'?'Send report':'Confirm block')}</Text></TouchableOpacity>}<TouchableOpacity disabled={busy} style={button} onPress={()=>setMode('closed')}><Text style={{color:theme.text}}>{copy('Cancel')}</Text></TouchableOpacity></ScrollView></SafeAreaView></Modal></View>;
}
