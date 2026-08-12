import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import { AppProvider, useApp } from '@/context/app-context';

function notificationRoute(value:unknown){const path=typeof value==='string'?value:'';if(path.startsWith('/orders'))return '/orders';if(path.startsWith('/farmer')||path.startsWith('/admin'))return '/workspace';if(path.startsWith('/profile'))return '/profile';if(path.startsWith('/help')||path.startsWith('/support'))return '/support';return '/notifications'}
function Navigator(){const {dark}=useApp();useEffect(()=>{const subscription=Notifications.addNotificationResponseReceivedListener(response=>router.push(notificationRoute(response.notification.request.content.data?.route) as never));return()=>subscription.remove()},[]);return <><StatusBar style={dark?'light':'dark'}/><Stack screenOptions={{headerShown:false,animation:'slide_from_right'}}><Stack.Screen name="(tabs)"/><Stack.Screen name="basket" options={{presentation:'modal',animation:'slide_from_bottom'}}/></Stack></>}
export default function RootLayout(){const [loaded]=useFonts({Manrope_400Regular,Manrope_500Medium,Manrope_600SemiBold,Manrope_700Bold,Manrope_800ExtraBold,Georgia_Regular:require('@/assets/fonts/georgia.ttf'),Georgia_Italic:require('@/assets/fonts/georgiai.ttf'),Georgia_Bold:require('@/assets/fonts/georgiab.ttf'),Georgia_BoldItalic:require('@/assets/fonts/georgiaz.ttf')});if(!loaded)return null;return <AppProvider><Navigator/></AppProvider>}
