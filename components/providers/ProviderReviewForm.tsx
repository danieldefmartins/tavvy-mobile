import React,{useState,useRef} from 'react';
import {View,Text,TextInput,TouchableOpacity,ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useThemeContext} from '../../contexts/ThemeContext';
import {supabase} from '../../lib/supabaseClient';
import {PROVIDER_TAPS,ProviderTapDimension,ProviderTapKind} from '../../lib/providerReviewTaps';

export default function ProviderReviewForm({providerId,kind,signedIn,onSaved}:{providerId:string;kind:ProviderTapKind;signedIn:boolean;onSaved:()=>void}){
  const {theme}=useThemeContext(),navigation=useNavigation<any>();
  const saveLock=useRef(false);
  const [main,setMain]=useState(''),[good,setGood]=useState(''),[vibe,setVibe]=useState(''),[headsUp,setHeadsUp]=useState('');
  const [rating,setRating]=useState(0),[title,setTitle]=useState(''),[content,setContent]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const choose=(dimension:ProviderTapDimension,value:string)=>({main:setMain,good:setGood,vibe:setVibe,heads_up:setHeadsUp}[dimension])(value);
  const chip=(label:string,selected:boolean,onPress:()=>void,key:string)=><TouchableOpacity key={key} accessibilityRole="button" accessibilityState={{selected,disabled:busy}} disabled={busy} onPress={onPress} style={{borderWidth:1,borderColor:selected?theme.primary:theme.border,backgroundColor:selected?theme.surface:theme.background,paddingVertical:10,paddingHorizontal:14,borderRadius:12,marginRight:8,marginBottom:8,minHeight:44,justifyContent:'center'}}><Text style={{color:theme.text,fontWeight:selected?'700':'400'}}>{label}</Text></TouchableOpacity>;
  const field=(dimension:ProviderTapDimension,label:string,value:string,optional=false)=><View style={{marginTop:16}}><Text accessibilityRole="header" style={{color:theme.text,fontSize:17,fontWeight:'700',marginBottom:8}}>{label}{optional?' · optional':''}</Text><View style={{flexDirection:'row',flexWrap:'wrap'}}>{optional?chip('Skip',!value,()=>choose(dimension,''),'skip'):null}{PROVIDER_TAPS[kind][dimension].map(option=>chip(option.label,value===option.code,()=>choose(dimension,value===option.code?'':option.code),option.code))}</View></View>;
  async function submit(){if(saveLock.current)return;setError('');setSaved(false);if(!main||!rating||content.trim().length<20){setError('Choose what mattered most, your overall experience, and describe your experience in at least 20 characters.');return;}saveLock.current=true;setBusy(true);try{const {data,error:rpcError}=await supabase.rpc('submit_pro_provider_review_v1',{p_provider_id:providerId,p_rating:rating,p_title:title.trim(),p_content:content.trim(),p_main_tap:main,p_good_tap:good||null,p_vibe_tap:vibe||null,p_heads_up_tap:headsUp||null});if(rpcError||typeof data!=='string')throw rpcError||new Error('Your review could not be confirmed.');setSaved(true);onSaved();}catch(e){setError(e instanceof Error?e.message:'Your review could not be saved. Please try again.');}finally{saveLock.current=false;setBusy(false);}}
  return <View style={{paddingVertical:18}}><Text accessibilityRole="header" style={{color:theme.text,fontSize:20,fontWeight:'700'}}>Review this {kind==='realtor'?'Realtor':'professional'}</Text>{!signedIn?<TouchableOpacity accessibilityRole="button" onPress={()=>navigation.navigate('Login')} style={{paddingVertical:14}}><Text style={{color:theme.primary}}>Sign in to share your experience</Text></TouchableOpacity>:<>
    <Text style={{color:theme.textSecondary,marginTop:8}}>Start with what mattered most. The Good, style and Heads Up are optional.</Text>
    {field('main',kind==='realtor'?'The real estate service':'The work',main)}{field('good','The Good',good,true)}{field('vibe',kind==='realtor'?'Their Style':'The Vibe',vibe,true)}{field('heads_up','Heads Up',headsUp,true)}
    <Text style={{color:theme.text,fontWeight:'700',marginTop:16}}>Overall experience</Text><View style={{flexDirection:'row',flexWrap:'wrap'}}>{['Very poor','Poor','Mixed','Good','Excellent'].map((label,index)=>chip(label,rating===index+1,()=>setRating(index+1),label))}</View>
    <Text style={{color:theme.text,marginTop:12}}>Short title · optional</Text><TextInput accessibilityLabel="Review title" value={title} onChangeText={setTitle} maxLength={120} style={{color:theme.text,borderColor:theme.border,borderWidth:1,borderRadius:10,padding:12,marginTop:6}}/>
    <Text style={{color:theme.text,marginTop:12}}>What happened? (at least 20 characters)</Text><TextInput accessibilityLabel="Review details" multiline value={content} onChangeText={setContent} maxLength={4000} style={{color:theme.text,borderColor:theme.border,borderWidth:1,borderRadius:10,padding:12,minHeight:130,textAlignVertical:'top',marginTop:6}}/>
    <Text style={{color:theme.textSecondary,marginTop:10}}>You can update your review later. Choose a concern only if you experienced it.</Text>
    <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={()=>void submit()} style={{backgroundColor:theme.primary,borderRadius:10,padding:14,alignItems:'center',marginTop:16,minHeight:48}}>{busy?<ActivityIndicator color="white"/>:<Text style={{color:'white',fontWeight:'700'}}>Post review</Text>}</TouchableOpacity>
    {error?<Text accessibilityRole="alert" style={{color:theme.text,marginTop:10}}>{error}</Text>:null}{saved?<Text accessibilityRole="alert" style={{color:theme.text,marginTop:10}}>Your review was saved.</Text>:null}
  </>}</View>;
}
