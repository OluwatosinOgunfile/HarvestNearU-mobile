import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { Camera, ChevronLeft, CreditCard, MapPin, Plus, Save, Store, UserRound } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Text, TextInput } from '@/components/typography';
import { useApp } from '@/context/app-context';
import { absoluteUrl, api } from '@/lib/api';

type EmailPreferences={delivery_updates:boolean;support_updates:boolean;farm_updates:boolean;rating_updates:boolean;nearby_produce:boolean;offers_and_promotions:boolean;weekly_digest:boolean};
type ProfileData={user:{first_name:string;last_name:string;email:string;phone:string|null;avatar_url:string|null;role:string};addresses:{line1:string;city:string;state:string}[];stats:{total_orders:number;farms_supported:number;completed_orders:number};storeCredit:{balance_kobo:number};emailPreferences:EmailPreferences;farms?:{id:string;name:string;city:string;state:string;verification_status:string;average_rating:number;review_count:number}[]};

export default function UserProfile(){
  const router=useRouter();
  const {theme,refreshSession}=useApp();
  const [data,setData]=useState<ProfileData|null>(null);
  const [form,setForm]=useState({firstName:'',lastName:'',email:'',phone:''});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [message,setMessage]=useState('');

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const result=await api<ProfileData>('/api/profile');
      setData(result);
      setForm({firstName:result.user.first_name,lastName:result.user.last_name,email:result.user.email,phone:result.user.phone||''});
    }catch(reason){setMessage((reason as Error).message)}finally{setLoading(false)}
  },[]);
  useFocusEffect(useCallback(()=>{void load()},[load]));
  const change=(key:keyof typeof form)=>(value:string)=>setForm(current=>({...current,[key]:value}));

  async function choosePicture(){
    setMessage('');
    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:.82,base64:true});
    if(result.canceled)return;
    const asset=result.assets[0];
    if(asset.fileSize&&asset.fileSize>3*1024*1024){setMessage('Choose a profile picture smaller than 3 MB.');return}
    setUploading(true);
    try{
      if(!asset.base64)throw new Error('The selected picture could not be read. Please choose it again.');
      const response=await api<{avatarUrl:string}>('/api/profile/avatar',{method:'POST',body:JSON.stringify({
        imageBase64:asset.base64,
        mimeType:asset.mimeType||'image/jpeg',
        fileName:asset.fileName||'profile-picture.jpg',
      })});
      setData(current=>current?{...current,user:{...current.user,avatar_url:response.avatarUrl}}:current);
      await refreshSession();
      setMessage('Profile picture updated successfully.');
    }catch(reason){setMessage((reason as Error).message)}finally{setUploading(false)}
  }

  async function save(){
    setSaving(true);setMessage('');
    try{await api('/api/profile',{method:'PATCH',body:JSON.stringify(form)});await refreshSession();setMessage('Profile updated successfully.')}catch(reason){setMessage((reason as Error).message)}finally{setSaving(false)}
  }

  return <Screen refreshing={loading} onRefresh={load}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={()=>router.back()} style={[styles.back,{borderColor:theme.border}]}><ChevronLeft size={22} color={theme.text}/></Pressable><View><Text style={[styles.eyebrow,{color:theme.primary}]}>YOUR ACCOUNT</Text><Text style={[styles.title,{color:theme.text}]}>Profile</Text></View></View>
    {loading?<ActivityIndicator color={theme.primary} style={{marginTop:80}}/>:<View style={styles.content}>
      <View style={[styles.identity,{backgroundColor:theme.surface,borderColor:theme.border}]}>
        <View style={[styles.avatar,{backgroundColor:theme.surfaceAlt}]}>{data?.user.avatar_url?<Image source={{uri:absoluteUrl(data.user.avatar_url)}} style={styles.avatarImage} contentFit="cover"/>:<UserRound size={42} color={theme.primary}/>}</View>
        <View style={styles.identityCopy}><Text style={[styles.identityName,{color:theme.text}]}>{data?.user.first_name} {data?.user.last_name}</Text><Text style={[styles.identityRole,{color:theme.muted}]}>{data?.user.role.replace(/^./,value=>value.toUpperCase())} account</Text></View>
        <Pressable accessibilityLabel="Change profile picture" disabled={uploading} onPress={()=>void choosePicture()} style={[styles.photoButton,{backgroundColor:theme.primary}]}>{uploading?<ActivityIndicator size="small" color={theme.primaryText}/>:<Camera size={19} color={theme.primaryText}/>}</Pressable>
      </View>
      {message?<Text accessibilityLiveRegion="polite" style={[styles.message,{color:message.includes('successfully')?theme.primary:'#a84335',backgroundColor:theme.surface,borderColor:theme.border}]}>{message}</Text>:null}
      <View style={styles.stats}><Stat theme={theme} label="Orders" value={data?.stats.total_orders||0}/><Stat theme={theme} label="Completed" value={data?.stats.completed_orders||0}/><Stat theme={theme} label="Farms" value={data?.stats.farms_supported||0}/></View>
      <View style={[styles.credit,{backgroundColor:theme.surfaceAlt,borderColor:theme.border}]}><CreditCard size={22} color={theme.primary}/><View><Text style={[styles.small,{color:theme.muted}]}>ACCOUNT CREDIT</Text><Text style={[styles.creditValue,{color:theme.text}]}>₦{((data?.storeCredit.balance_kobo||0)/100).toLocaleString('en-NG')}</Text></View></View>
      <View style={[styles.card,{backgroundColor:theme.surface,borderColor:theme.border}]}><Title theme={theme} icon={<UserRound size={20} color={theme.primary}/>} text="Personal details"/><View style={styles.row}><Field theme={theme} label="First name" value={form.firstName} onChangeText={change('firstName')}/><Field theme={theme} label="Last name" value={form.lastName} onChangeText={change('lastName')}/></View><Field theme={theme} label="Email" value={form.email} onChangeText={change('email')}/><Field theme={theme} label="Phone" value={form.phone} onChangeText={change('phone')}/><Pressable disabled={saving} onPress={()=>void save()} style={[styles.save,{backgroundColor:theme.primary}]}>{saving?<ActivityIndicator color={theme.primaryText}/>:<><Save size={18} color={theme.primaryText}/><Text style={{color:theme.primaryText,fontWeight:'800'}}>Save profile</Text></>}</Pressable></View>
      <Pressable onPress={()=>router.push('/location')} style={[styles.location,{backgroundColor:theme.surface,borderColor:theme.border}]}><MapPin size={22} color={theme.primary}/><View style={{flex:1}}><Text style={[styles.locationTitle,{color:theme.text}]}>Saved delivery location</Text><Text style={{color:theme.muted}}>{data?.addresses[0]?`${data.addresses[0].line1}, ${data.addresses[0].city}, ${data.addresses[0].state}`:'Add your home delivery address'}</Text></View></Pressable>
      {data?.user.role==='farmer'?<Pressable onPress={()=>router.push('/farm-new' as never)} style={[styles.location,{backgroundColor:theme.primary,borderColor:theme.primary}]}><Plus size={22} color={theme.primaryText}/><Text style={{color:theme.primaryText,fontWeight:'900',flex:1}}>Add another farm</Text></Pressable>:null}
      {data?.farms?.length?<View style={[styles.card,{backgroundColor:theme.surface,borderColor:theme.border}]}><Title theme={theme} icon={<Store size={20} color={theme.primary}/>} text="Your farms"/>{data.farms.map(farm=><View key={farm.id} style={[styles.farm,{borderTopColor:theme.border}]}><View style={{flex:1}}><Text style={[styles.farmName,{color:theme.text}]}>{farm.name}</Text><Text style={{color:theme.muted}}>{farm.city}, {farm.state}</Text></View><View style={{alignItems:'flex-end'}}><Text style={{color:theme.primary,fontWeight:'800'}}>{farm.verification_status.replace(/^./,c=>c.toUpperCase())}</Text><Text style={{color:theme.muted}}>{Number(farm.average_rating||0).toFixed(1)} · {farm.review_count||0} reviews</Text></View></View>)}</View>:null}
    </View>}
  </Screen>
}

function Field({theme,label,value,onChangeText}:{theme:any;label:string;value:string;onChangeText:(value:string)=>void}){return <View style={{flex:1}}><Text style={[styles.label,{color:theme.muted}]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} style={[styles.input,{color:theme.text,borderColor:theme.border,backgroundColor:theme.background}]}/></View>}
function Title({theme,icon,text}:{theme:any;icon:React.ReactNode;text:string}){return <View style={styles.cardTitle}>{icon}<Text style={[styles.sectionTitle,{color:theme.text}]}>{text}</Text></View>}
function Stat({theme,label,value}:{theme:any;label:string;value:number}){return <View style={[styles.stat,{backgroundColor:theme.surface,borderColor:theme.border}]}><Text style={[styles.statValue,{color:theme.text}]}>{value}</Text><Text style={[styles.small,{color:theme.muted}]}>{label}</Text></View>}

const styles=StyleSheet.create({header:{height:90,paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:13},back:{width:42,height:42,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center'},eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.1},title:{fontFamily:'Georgia_Regular',fontSize:29},content:{padding:18,paddingBottom:45},identity:{minHeight:96,padding:14,borderWidth:1,borderRadius:17,flexDirection:'row',alignItems:'center',gap:13},avatar:{width:68,height:68,borderRadius:22,alignItems:'center',justifyContent:'center',overflow:'hidden'},avatarImage:{width:'100%',height:'100%'},identityCopy:{flex:1},identityName:{fontFamily:'Georgia_Bold',fontSize:20},identityRole:{fontSize:12,fontWeight:'700',marginTop:4},photoButton:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center'},message:{padding:12,borderWidth:1,borderRadius:10,marginTop:12},stats:{flexDirection:'row',gap:8,marginTop:13},stat:{flex:1,padding:12,borderWidth:1,borderRadius:13},statValue:{fontSize:21,fontWeight:'800'},small:{fontSize:10,fontWeight:'800',marginTop:3},credit:{marginTop:12,padding:15,borderWidth:1,borderRadius:14,flexDirection:'row',alignItems:'center',gap:12},creditValue:{fontSize:21,fontWeight:'800'},card:{marginTop:14,padding:16,borderWidth:1,borderRadius:16},cardTitle:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:14},sectionTitle:{fontFamily:'Georgia_Regular',fontSize:21},row:{flexDirection:'row',gap:9},label:{fontSize:11,fontWeight:'800',marginBottom:6},input:{height:48,borderWidth:1,borderRadius:10,paddingHorizontal:12,fontSize:14,marginBottom:13},save:{height:48,borderRadius:11,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},location:{marginTop:14,padding:16,borderWidth:1,borderRadius:16,flexDirection:'row',alignItems:'center',gap:12},locationTitle:{fontSize:15,fontWeight:'800',marginBottom:4},farm:{paddingVertical:13,borderTopWidth:1,flexDirection:'row',gap:10},farmName:{fontSize:14,fontWeight:'800'}});
