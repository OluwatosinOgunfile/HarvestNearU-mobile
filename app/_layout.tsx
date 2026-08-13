import { Redirect, Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import { AppProvider, useApp } from '@/context/app-context';
import { notificationRoute } from '@/lib/notification-route';
function Navigator(){const {dark,user,sessionReady}=useApp();const pathname=usePathname();useEffect(()=>{const subscription=Notifications.addNotificationResponseReceivedListener(response=>router.push(notificationRoute(response.notification.request.content.data?.route) as never));return()=>subscription.remove()},[]);if(!sessionReady)return null;const staff=user?.role==='admin'||user?.role==='support';const publicRoute=pathname==='/account'||pathname==='/forgot-password';if(!user&&!publicRoute)return <Redirect href="/account"/>;if(staff&&pathname!=='/workspace')return <Redirect href="/workspace"/>;return <><StatusBar style={dark?'light':'dark'}/><Stack screenOptions={{headerShown:false,animation:'slide_from_right'}}><Stack.Screen name="(tabs)"/><Stack.Screen name="basket" options={{presentation:'modal',animation:'slide_from_bottom'}}/></Stack></>}
export default function RootLayout(){const [loaded]=useFonts({Manrope_400Regular,Manrope_500Medium,Manrope_600SemiBold,Manrope_700Bold,Manrope_800ExtraBold,Georgia_Regular:require('@/assets/fonts/georgia.ttf'),Georgia_Italic:require('@/assets/fonts/georgiai.ttf'),Georgia_Bold:require('@/assets/fonts/georgiab.ttf'),Georgia_BoldItalic:require('@/assets/fonts/georgiaz.ttf')});if(!loaded)return null;return <AppProvider><Navigator/></AppProvider>}
