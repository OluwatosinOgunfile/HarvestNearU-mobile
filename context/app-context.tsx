import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { ShoppingBag } from 'lucide-react-native';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View, useColorScheme } from 'react-native';
import { Text } from '@/components/typography';
import { api, clearSessionToken, saveSessionToken } from '@/lib/api';
import { themes } from '@/lib/theme';

export type User = { id:string; email:string; firstName:string; lastName:string; role:'consumer'|'farmer'|'admin'|'support'; avatarUrl:string|null };
export type Product = { id:string; farmId:string; name:string; farmer:string; location:string; distance:number; price:number; unit:string; stock:number; sold:number; restockTotal:number; category:string; available:string; rating:number; reviewCount:number; image:string; badge?:string };
export type FarmSummary = { id:string; name:string; location:string; image:string; category:string; rating:number; reviewCount:number; sold:number; listings:number };
type ContextValue = {
  user: User|null; sessionReady:boolean; products: Product[]; bestSellingFarms:FarmSummary[]; loading:boolean; error:string; cart:Record<string,number>; cartCount:number; liked:string[]; notificationCount:number;
  dark:boolean; theme:typeof themes.light; setDark:(value:boolean)=>void; refresh:()=>Promise<void>; refreshSession:()=>Promise<void>;
  signIn:(identifier:string,password:string)=>Promise<void>; signOut:()=>Promise<void>; signUp:(input:Record<string,string>)=>Promise<void>;
  add:(product:Product)=>void; updateCart:(id:string,delta:number)=>void; clearCart:()=>void; toggleLike:(id:string)=>Promise<void>;
  loadNearby:()=>Promise<void>; refreshNotifications:()=>Promise<void>;
};

const AppContext = createContext<ContextValue|null>(null);
const CART_KEY = 'harvestnearu.native.cart';
const THEME_KEY = 'harvestnearu.native.theme';
Notifications.setNotificationHandler({handleNotification:async()=>({shouldPlaySound:true,shouldSetBadge:true,shouldShowBanner:true,shouldShowList:true})});

export function AppProvider({ children }: PropsWithChildren) {
  const systemDark = useColorScheme() === 'dark';
  const [dark,setDarkState] = useState(systemDark);
  const [user,setUser] = useState<User|null>(null);
  const [sessionReady,setSessionReady] = useState(false);
  const [products,setProducts] = useState<Product[]>([]);
  const [bestSellingFarms,setBestSellingFarms] = useState<FarmSummary[]>([]);
  const [cart,setCart] = useState<Record<string,number>>({});
  const [liked,setLiked] = useState<string[]>([]);
  const [notificationCount,setNotificationCount] = useState(0);
  const [pushToken,setPushToken] = useState<string|null>(null);
  const [cartNotice,setCartNotice] = useState<{message:string;key:number}|null>(null);
  const noticeProgress = useRef(new Animated.Value(0)).current;
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');

  const load = useCallback(async (coordinates?: { latitude:number; longitude:number }) => {
    setLoading(true); setError('');
    try {
      const query = coordinates ? `?origin=selected&lat=${coordinates.latitude}&lng=${coordinates.longitude}` : '';
      const market = await api<{produce:Product[];bestSellingFarms?:FarmSummary[]}>(`/api/produce${query}`);
      const produce = Array.isArray(market.produce) ? market.produce : [];
      setProducts(produce);
      setBestSellingFarms(Array.isArray(market.bestSellingFarms) ? market.bestSellingFarms : []);
      setCart(current => Object.fromEntries(Object.entries(current).map(([id,quantity]) => {
        const product=produce.find(item=>item.id===id); return [id,Math.min(quantity,product?.stock||0)];
      }).filter(([,quantity])=>Number(quantity)>0)));
    } catch (reason) { setError((reason as Error).message); }
    finally { setLoading(false); }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const session = await api<{user:User|null}>('/api/auth/session');
      setUser(session.user);
    } catch {
      // The public marketplace must remain usable when session recovery fails.
      setUser(null);
    } finally { setSessionReady(true); }
  }, []);
  const refreshNotifications = useCallback(async () => {
    if (!user) { setNotificationCount(0); return; }
    try {
      const result = await api<{notifications:unknown[]}>('/api/notifications');
      setNotificationCount(Array.isArray(result.notifications) ? result.notifications.length : 0);
    } catch { setNotificationCount(0); }
  }, [user]);

  useEffect(() => { Promise.all([AsyncStorage.getItem(CART_KEY),AsyncStorage.getItem(THEME_KEY)]).then(([savedCart,savedTheme]) => {
    if(savedCart) setCart(JSON.parse(savedCart)); if(savedTheme) setDarkState(savedTheme==='dark');
  }).finally(()=>{ void load(); void loadSession(); }); }, [load,loadSession]);
  useEffect(()=>{ void AsyncStorage.setItem(CART_KEY,JSON.stringify(cart)); },[cart]);
  useEffect(()=>{if(!user){setLiked([]);return}api<{favourites:string[]}>('/api/favourites').then(result=>setLiked(result.favourites||[])).catch(()=>setLiked([]))},[user]);
  useEffect(()=>{if(!user)return;api<{recommendations:{id:string}[]}>('/api/recommendations').then(result=>{const rank=new Map((result.recommendations||[]).map((item,index)=>[item.id,index]));setProducts(current=>[...current].sort((a,b)=>(rank.get(a.id)??999)-(rank.get(b.id)??999))) }).catch(()=>undefined)},[user]);
  useEffect(()=>{void refreshNotifications()},[refreshNotifications]);
  useEffect(()=>{if(!user||Platform.OS==='web'||!Device.isDevice)return;let active=true;const register=async()=>{try{if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('actionable',{name:'Actionable updates',importance:Notifications.AndroidImportance.HIGH,sound:'default',vibrationPattern:[0,180,120,180]});const permission=await Notifications.requestPermissionsAsync();if(!permission.granted)return;const projectId=Constants.expoConfig?.extra?.eas?.projectId||Constants.easConfig?.projectId;if(!projectId)return;const token=(await Notifications.getExpoPushTokenAsync({projectId})).data;if(!active)return;setPushToken(token);await api('/api/notifications/push-token',{method:'POST',body:JSON.stringify({token,platform:Platform.OS,deviceName:Device.modelName})})}catch{}};void register();return()=>{active=false}},[user]);
  useEffect(()=>{if(!user)return;const interval=setInterval(()=>void refreshNotifications(),30000);return()=>clearInterval(interval)},[user,refreshNotifications]);
  const setDark=(value:boolean)=>{ setDarkState(value); void AsyncStorage.setItem(THEME_KEY,value?'dark':'light'); };
  const add=(product:Product)=>{
    const currentQuantity=cart[product.id]||0;
    if(currentQuantity>=product.stock)return;
    setCart(current=>({...current,[product.id]:Math.min(product.stock,(current[product.id]||0)+1)}));
    setCartNotice({message:`${product.name} added to your basket`,key:Date.now()});
  };
  const updateCart=(id:string,delta:number)=>setCart(current=>{ const product=products.find(item=>item.id===id); const next=Math.max(0,Math.min(product?.stock||0,(current[id]||0)+delta)); const value={...current}; if(next)value[id]=next;else delete value[id];return value; });
  const signIn=async(identifier:string,password:string)=>{ const result=await api<{user:User;sessionToken?:string}>('/api/auth/signin',{method:'POST',body:JSON.stringify({identifier,password})});await saveSessionToken(result.sessionToken);await load();setUser(result.user); };
  const signOut=async()=>{ try { if(pushToken)await api('/api/notifications/push-token',{method:'DELETE',body:JSON.stringify({token:pushToken})}).catch(()=>undefined);await api('/api/auth/signout',{method:'POST'}); } finally { setPushToken(null);await clearSessionToken(); setUser(null); } };
  const signUp=async(input:Record<string,string>)=>{const result=await api<{user:User;sessionToken?:string}>('/api/auth/signup',{method:'POST',body:JSON.stringify(input)});if(result.sessionToken)await saveSessionToken(result.sessionToken);await load();setUser(result.user);};
  const clearCart=()=>setCart({});
  const toggleLike=async(id:string)=>{if(!user)throw new Error('Sign in to save favourites.');const saved=!liked.includes(id);setLiked(current=>saved?[...current,id]:current.filter(value=>value!==id));try{await api('/api/favourites',{method:'PUT',body:JSON.stringify({listingId:id,saved})})}catch(reason){setLiked(current=>saved?current.filter(value=>value!==id):[...current,id]);throw reason}};
  const loadNearby=async()=>{ const permission=await Location.requestForegroundPermissionsAsync(); if(permission.status!=='granted') throw new Error('Location permission is required to rank nearby produce.'); const result=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced}); await load(result.coords); };
  const theme=themes[dark?'dark':'light'];
  const value=useMemo(()=>({user,sessionReady,products,bestSellingFarms,loading,error,cart,cartCount:Object.values(cart).reduce((sum,value)=>sum+value,0),liked,notificationCount,dark,theme,setDark,refresh:()=>load(),refreshSession:loadSession,signIn,signOut,signUp,add,updateCart,clearCart,toggleLike,loadNearby,refreshNotifications}),[user,sessionReady,products,bestSellingFarms,loading,error,cart,liked,notificationCount,dark,theme,load,loadSession,refreshNotifications]);
  useEffect(()=>{
    if(!cartNotice)return;
    noticeProgress.stopAnimation();
    noticeProgress.setValue(0);
    Animated.sequence([
      Animated.spring(noticeProgress,{toValue:1,useNativeDriver:true,damping:18,stiffness:210,mass:.8}),
      Animated.delay(2200),
      Animated.timing(noticeProgress,{toValue:0,duration:180,useNativeDriver:true}),
    ]).start(({finished})=>{if(finished)setCartNotice(null)});
  },[cartNotice,noticeProgress]);
  return <AppContext.Provider value={value}><View style={styles.app}>{children}</View>{cartNotice?<Animated.View key={cartNotice.key} accessibilityLiveRegion="polite" pointerEvents="none" style={[styles.toast,{backgroundColor:theme.surface,borderColor:theme.border,opacity:noticeProgress,transform:[{translateY:noticeProgress.interpolate({inputRange:[0,1],outputRange:[-18,0]})}]}]}><View style={[styles.toastIcon,{backgroundColor:theme.primary}]}><ShoppingBag size={17} color={theme.primaryText}/></View><View style={styles.toastCopy}><Text style={[styles.toastTitle,{color:theme.text}]}>Added to basket</Text><Text numberOfLines={1} style={[styles.toastText,{color:theme.muted}]}>{cartNotice.message}</Text></View></Animated.View>:null}</AppContext.Provider>;
}
export function useApp(){const value=useContext(AppContext);if(!value)throw new Error('AppProvider is missing');return value;}

const styles=StyleSheet.create({app:{flex:1},toast:{position:'absolute',zIndex:1000,elevation:12,top:56,left:18,right:18,minHeight:66,padding:11,borderWidth:1,borderRadius:15,flexDirection:'row',alignItems:'center',gap:11,shadowColor:'#000',shadowOpacity:.16,shadowRadius:14,shadowOffset:{width:0,height:7}},toastIcon:{width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center'},toastCopy:{flex:1},toastTitle:{fontSize:14,fontWeight:'800'},toastText:{fontSize:12,marginTop:2}});
