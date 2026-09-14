import { Redirect, Tabs, usePathname } from 'expo-router';
import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { useEffect } from 'react';
import { Home, PackageCheck, ShoppingBag, Store, UserRound } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/app-context';

// Long-pressing the launcher icon opens the few places people actually return to. The list follows
// the signed-in role, and Android keeps the shortcuts after the app closes.
function useHomeScreenShortcuts(){
  const {user}=useApp();
  useQuickActionRouting();
  useEffect(()=>{
    const role=user?.role;
    if(role==='admin'||role==='support')return;
    const shopper=[
      {id:'shop',title:'Shop produce',params:{href:'/shop'}},
      {id:'basket',title:'Your basket',params:{href:'/basket'}},
      {id:'orders',title:'My orders',params:{href:'/orders'}},
      {id:'saved',title:'Saved harvests',params:{href:'/saved'}},
    ];
    const farming=[
      {id:'workspace',title:'Farm workspace',params:{href:'/workspace'}},
      {id:'listing',title:'Add a listing',params:{href:'/listing'}},
      {id:'shop',title:'Shop produce',params:{href:'/shop'}},
      {id:'orders',title:'My orders',params:{href:'/orders'}},
    ];
    const items=role==='farmer'?farming:shopper;
    const limit=QuickActions.maxCount ?? items.length;
    void QuickActions.setItems(items.slice(0,limit)).catch(()=>undefined);
  },[user?.role]);
}
export default function TabLayout(){
  useHomeScreenShortcuts();
  const {theme,user,sessionReady}=useApp();
  const insets=useSafeAreaInsets();
  const pathname=usePathname();
  if(!sessionReady)return null;
  const staff=user?.role==='admin'||user?.role==='support';
  const farmer=user?.role==='farmer';
  if(!user&&pathname!=='/account')return <Redirect href="/account"/>;
  if(staff&&pathname!=='/workspace')return <Redirect href="/workspace"/>;
  const bottomInset=Math.max(insets.bottom,Platform.OS==='android'?8:0);
  return <Tabs safeAreaInsets={{bottom:bottomInset}} screenOptions={{headerShown:false,tabBarActiveTintColor:theme.primary,tabBarInactiveTintColor:theme.muted,tabBarStyle:!user?{display:'none'}:{height:62+bottomInset,paddingTop:7,paddingBottom:bottomInset,backgroundColor:theme.surface,borderTopColor:theme.border},tabBarItemStyle:{paddingBottom:2},tabBarLabelStyle:{fontSize:11,fontWeight:'700',marginBottom:0}}}>
    <Tabs.Protected guard={Boolean(user&&!staff)}>
      <Tabs.Screen name="index" options={{title:'Home',tabBarIcon:({color})=><Home size={22} color={color}/>}}/>
      <Tabs.Screen name="shop" options={{title:'Shop',tabBarIcon:({color})=><ShoppingBag size={22} color={color}/>}}/>
      <Tabs.Screen name="orders" options={{title:'Orders',tabBarIcon:({color})=><PackageCheck size={22} color={color}/>}}/>
    </Tabs.Protected>
    <Tabs.Protected guard={Boolean(farmer||staff)}>
      <Tabs.Screen name="workspace" options={{title:staff?'Console':'Workspace',tabBarIcon:({color})=><Store size={22} color={color}/>}}/>
    </Tabs.Protected>
    <Tabs.Protected guard={!staff}>
      <Tabs.Screen name="account" options={{title:user?'Account':'Sign in',tabBarIcon:({color})=><UserRound size={22} color={color}/>}}/>
    </Tabs.Protected>
  </Tabs>
}
