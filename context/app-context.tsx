import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { api, clearSessionToken, saveSessionToken } from '@/lib/api';
import { themes } from '@/lib/theme';

export type User = { id:string; email:string; firstName:string; lastName:string; role:'consumer'|'farmer'|'admin'|'support'; avatarUrl:string|null };
export type Product = { id:string; farmId:string; name:string; farmer:string; location:string; distance:number; price:number; unit:string; stock:number; restockTotal:number; category:string; available:string; rating:number; reviewCount:number; image:string; badge?:string };
type ContextValue = {
  user: User|null; products: Product[]; loading:boolean; error:string; cart:Record<string,number>; cartCount:number; liked:string[]; notificationCount:number;
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
  const [products,setProducts] = useState<Product[]>([]);
  const [cart,setCart] = useState<Record<string,number>>({});
  const [liked,setLiked] = useState<string[]>([]);
  const [notificationCount,setNotificationCount] = useState(0);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');

  const load = useCallback(async (coordinates?: { latitude:number; longitude:number }) => {
    setLoading(true); setError('');
    try {
      const query = coordinates ? `?origin=selected&lat=${coordinates.latitude}&lng=${coordinates.longitude}` : '';
      const market = await api<{produce:Product[]}>(`/api/produce${query}`);
      const produce = Array.isArray(market.produce) ? market.produce : [];
      setProducts(produce);
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
    }
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
  useEffect(()=>{void refreshNotifications()},[refreshNotifications]);
  useEffect(()=>{if(!user)return;let active=true;let known=new Set<string>();let initialized=false;void Notifications.requestPermissionsAsync();if(Platform.OS==='android')void Notifications.setNotificationChannelAsync('actionable',{name:'Actionable updates',importance:Notifications.AndroidImportance.HIGH,sound:'default',vibrationPattern:[0,180,120,180]});const poll=async()=>{try{const result=await api<{notifications:{id:string;title:string;message:string;action_url?:string|null}[]}>('/api/notifications');if(!active)return;const items=result.notifications||[];const arrived=initialized?items.filter(item=>!known.has(item.id)):[];known=new Set(items.map(item=>item.id));initialized=true;setNotificationCount(items.length);for(const item of arrived.slice(0,3))await Notifications.scheduleNotificationAsync({content:{title:item.title,body:item.message,sound:'default',data:{route:item.action_url||'/notifications'}},trigger:null});}catch{}};void poll();const interval=setInterval(poll,5000);return()=>{active=false;clearInterval(interval)}},[user]);
  const setDark=(value:boolean)=>{ setDarkState(value); void AsyncStorage.setItem(THEME_KEY,value?'dark':'light'); };
  const add=(product:Product)=>setCart(current=>({...current,[product.id]:Math.min(product.stock,(current[product.id]||0)+1)}));
  const updateCart=(id:string,delta:number)=>setCart(current=>{ const product=products.find(item=>item.id===id); const next=Math.max(0,Math.min(product?.stock||0,(current[id]||0)+delta)); const value={...current}; if(next)value[id]=next;else delete value[id];return value; });
  const signIn=async(identifier:string,password:string)=>{ const result=await api<{user:User;sessionToken?:string}>('/api/auth/signin',{method:'POST',body:JSON.stringify({identifier,password})});await saveSessionToken(result.sessionToken);setUser(result.user);await load(); };
  const signOut=async()=>{ try { await api('/api/auth/signout',{method:'POST'}); } finally { await clearSessionToken(); setUser(null); } };
  const signUp=async(input:Record<string,string>)=>{const result=await api<{user:User;sessionToken?:string}>('/api/auth/signup',{method:'POST',body:JSON.stringify(input)});if(result.sessionToken)await saveSessionToken(result.sessionToken);setUser(result.user);await load();};
  const clearCart=()=>setCart({});
  const toggleLike=async(id:string)=>{if(!user)throw new Error('Sign in to save favourites.');const saved=!liked.includes(id);setLiked(current=>saved?[...current,id]:current.filter(value=>value!==id));try{await api('/api/favourites',{method:'PUT',body:JSON.stringify({listingId:id,saved})})}catch(reason){setLiked(current=>saved?current.filter(value=>value!==id):[...current,id]);throw reason}};
  const loadNearby=async()=>{ const permission=await Location.requestForegroundPermissionsAsync(); if(permission.status!=='granted') throw new Error('Location permission is required to rank nearby produce.'); const result=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced}); await load(result.coords); };
  const value=useMemo(()=>({user,products,loading,error,cart,cartCount:Object.values(cart).reduce((sum,value)=>sum+value,0),liked,notificationCount,dark,theme:themes[dark?'dark':'light'],setDark,refresh:()=>load(),refreshSession:loadSession,signIn,signOut,signUp,add,updateCart,clearCart,toggleLike,loadNearby,refreshNotifications}),[user,products,loading,error,cart,liked,notificationCount,dark,load,loadSession,refreshNotifications]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp(){const value=useContext(AppContext);if(!value)throw new Error('AppProvider is missing');return value;}
