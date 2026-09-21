import React,{useEffect,useState,useRef} from 'react';
import {View,Text,TouchableOpacity,Modal,SafeAreaView,ScrollView} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useThemeContext} from '../contexts/ThemeContext';
import {useReleaseCopy} from '../hooks/useReleaseCopy';
import {BlockedAuthor,CONTENT_BLOCK_SCOPE,listBlockedAuthors,unblockAuthor} from '../lib/contentSafety';
import {notifyContentSafetyChanged} from './ContentSafetyActions';
export default function BlockedAuthors(){const {user}=useAuth();const {theme}=useThemeContext();const copy=useReleaseCopy();const [open,setOpen]=useState(false);
 const owner=user?.id||null;
 const [state,setState]=useState<{owner:string|null;rows:BlockedAuthor[];error:string;loading:boolean;busy:string}>({owner:null,rows:[],error:'',loading:false,busy:''});
 const scope=useRef({owner,open,generation:0,mounted:true,busy:false});
 // Invalidate synchronously during an identity/visibility change, before effects.
 if(scope.current.owner!==owner||scope.current.open!==open){scope.current.owner=owner;scope.current.open=open;scope.current.generation++;scope.current.busy=false;}
 const visible=open&&owner!==null&&state.owner===owner;
 const rows=visible?state.rows:[],error=visible?state.error:'',busy=visible?state.busy:'',loading=!!owner&&open&&(!visible||state.loading);
 const current=(generation:number,actor:string)=>scope.current.mounted&&scope.current.open&&scope.current.owner===actor&&scope.current.generation===generation;
 function changeOpen(next:boolean){scope.current.generation++;scope.current.open=next;scope.current.busy=false;setOpen(next);}
 async function load(){
  const actor=scope.current.owner;if(!actor||!scope.current.open||!scope.current.mounted)return;
  const generation=++scope.current.generation;scope.current.busy=false;
  setState({owner:actor,rows:[],error:'',loading:true,busy:''});
  try{const result=await listBlockedAuthors();if(current(generation,actor))setState({owner:actor,rows:result,error:'',loading:false,busy:''});}
  catch(e){if(current(generation,actor))setState({owner:actor,rows:[],error:(e as Error).message,loading:false,busy:''});}
 }
 useEffect(()=>{scope.current.mounted=true;return()=>{scope.current.mounted=false;scope.current.generation++;}},[]);
 useEffect(()=>{if(open&&owner)void load();return()=>{scope.current.generation++;scope.current.busy=false;}},[open,owner]);
 async function unblock(id:string){
  const actor=scope.current.owner;if(!actor||!scope.current.open||!scope.current.mounted||scope.current.busy||state.owner!==actor||!state.rows.some(row=>row.id===id))return;
  const generation=++scope.current.generation;scope.current.busy=true;
  setState(previous=>({...previous,error:'',busy:id}));
  try{await unblockAuthor(id);if(current(generation,actor)){setState(previous=>previous.owner===actor?{...previous,rows:previous.rows.filter(row=>row.id!==id)}:previous);notifyContentSafetyChanged();}}
  catch(e){if(current(generation,actor))setState(previous=>({...previous,error:(e as Error).message}));}
  finally{if(current(generation,actor)){scope.current.busy=false;setState(previous=>({...previous,busy:''}));}}
 }
 const button={padding:14,minHeight:44,borderWidth:1,borderColor:theme.border,borderRadius:10,marginVertical:8};
 return <View style={{padding:16}}><TouchableOpacity style={button} onPress={()=>changeOpen(true)}><Text style={{color:theme.text}}>{copy('Blocked authors')}</Text></TouchableOpacity><Modal visible={open} animationType="slide" onRequestClose={()=>changeOpen(false)}><SafeAreaView style={{flex:1,backgroundColor:theme.background}}><ScrollView contentContainerStyle={{padding:24}}><Text style={{color:theme.text,fontSize:24,fontWeight:'700'}}>{copy('Blocked authors')}</Text><Text style={{color:theme.textSecondary,lineHeight:23,marginVertical:12}}>{copy(CONTENT_BLOCK_SCOPE)}</Text>{!user?<Text style={{color:theme.text}}>{copy('Sign in to manage content and blocked authors.')}</Text>:<>{loading&&<Text style={{color:theme.text}}>{copy('Loading…')}</Text>}{!loading&&!error&&!rows.length&&<Text style={{color:theme.text}}>{copy('No blocked authors.')}</Text>}{error&&<><Text accessibilityRole="alert" style={{color:theme.text}}>{error}</Text><TouchableOpacity style={button} onPress={load}><Text style={{color:theme.text}}>{copy('Try again')}</Text></TouchableOpacity></>}{rows.map(row=><View key={row.id}><Text style={{color:theme.text}}>{row.displayName}</Text><TouchableOpacity disabled={!!busy} style={button} onPress={()=>unblock(row.id)}><Text style={{color:theme.text}}>{copy(busy===row.id?'Saving…':'Unblock')}</Text></TouchableOpacity></View>)}</>}<TouchableOpacity style={button} onPress={()=>changeOpen(false)}><Text style={{color:theme.text}}>{copy('Close')}</Text></TouchableOpacity></ScrollView></SafeAreaView></Modal></View>;
}
