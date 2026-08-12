import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, ChevronLeft, PackageCheck } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Text } from '@/components/typography';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api';

type Notification={id:string;title:string;message:string;type:string;action_url?:string|null;created_at:string;read_at:string|null};

export default function Notifications() {
  const router=useRouter();
  const {theme,user,refreshNotifications}=useApp();
  const [items,setItems]=useState<Notification[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const load=useCallback(async()=>{if(!user)return;setLoading(true);setError('');try{const result=await api<{notifications:Notification[]}>('/api/notifications');setItems(result.notifications||[])}catch(reason){setError((reason as Error).message)}finally{setLoading(false)}},[user]);
  useFocusEffect(useCallback(()=>{void load()},[load]));
  async function open(item:Notification) {
    setItems(current=>current.filter(value=>value.id!==item.id));
    await api('/api/notifications',{method:'PATCH',body:JSON.stringify({id:item.id})}).catch(()=>{});
    await refreshNotifications();
    const route=item.action_url==='/farmer'?'/workspace':item.action_url==='/orders'?'/orders':item.action_url==='/profile'?'/profile':null;
    if(route)router.push(route as never);
  }
  return <Screen refreshing={loading} onRefresh={load}>
    <View style={styles.header}><Pressable onPress={()=>router.canGoBack()?router.back():router.replace('/')} style={[styles.back,{borderColor:theme.border,backgroundColor:theme.surface}]}><ChevronLeft size={22} color={theme.text}/></Pressable><View><Text style={[styles.title,{color:theme.text}]}>Notifications</Text><Text style={{color:theme.muted}}>{items.length} unread updates</Text></View></View>
    <View style={styles.content}>{error?<Text style={styles.error}>{error}</Text>:null}{!user?<Empty theme={theme} title="Sign in for updates" text="Order, payment, delivery, and farm notifications will appear here."/>:loading?<ActivityIndicator color={theme.primary} style={{marginTop:70}}/>:items.length?items.map(item=><Pressable key={item.id} onPress={()=>void open(item)} style={[styles.item,{backgroundColor:theme.surface,borderColor:theme.primary}]}><View style={[styles.icon,{backgroundColor:theme.surfaceAlt}]}>{item.type==='order'?<PackageCheck size={20} color={theme.primary}/>:<Bell size={20} color={theme.primary}/>}</View><View style={{flex:1}}><Text style={[styles.itemTitle,{color:theme.text}]}>{item.title}</Text><Text style={[styles.message,{color:theme.muted}]}>{item.message}</Text><Text style={[styles.date,{color:theme.muted}]}>{new Date(item.created_at).toLocaleString('en-NG')}</Text></View><View style={[styles.dot,{backgroundColor:theme.primary}]}/></Pressable>):<Empty theme={theme} title="You are all caught up" text="New order, payment, farm, and delivery updates will appear here."/>}</View>
  </Screen>;
}
function Empty({theme,title,text}:{theme:any;title:string;text:string}){return <View style={[styles.empty,{backgroundColor:theme.surface,borderColor:theme.border}]}><View style={[styles.emptyIcon,{backgroundColor:theme.surfaceAlt}]}><Bell size={31} color={theme.primary}/></View><Text style={[styles.emptyTitle,{color:theme.text}]}>{title}</Text><Text style={[styles.emptyText,{color:theme.muted}]}>{text}</Text></View>}
const styles=StyleSheet.create({header:{height:82,paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:13},back:{width:42,height:42,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center'},title:{fontFamily:'serif',fontSize:27,fontWeight:'600'},content:{padding:18},error:{color:'#a84335',backgroundColor:'#fff0ed',padding:11,borderRadius:9,marginBottom:10},item:{minHeight:112,padding:14,borderWidth:1,borderRadius:15,marginBottom:10,flexDirection:'row',alignItems:'flex-start',gap:12},icon:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center'},itemTitle:{fontSize:14,fontWeight:'800'},message:{fontSize:13,lineHeight:19,marginTop:4},date:{fontSize:10,marginTop:8},dot:{width:9,height:9,borderRadius:5,marginTop:5},empty:{minHeight:420,padding:30,borderWidth:1,borderRadius:18,alignItems:'center',justifyContent:'center'},emptyIcon:{width:64,height:64,borderRadius:19,alignItems:'center',justifyContent:'center'},emptyTitle:{fontFamily:'serif',fontSize:24,fontWeight:'600',marginTop:17},emptyText:{fontSize:14,lineHeight:21,textAlign:'center',marginTop:7}});
