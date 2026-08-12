import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import { AppProvider, useApp } from '@/context/app-context';
import { notificationRoute } from '@/lib/notification-route';
import { API_URL, api } from '@/lib/api';

async function openStaffConsole(){const result=await api<{handoffUrl:string}>('/api/auth/mobile-handoff',{method:'POST'});await WebBrowser.openBrowserAsync(`${API_URL}${result.handoffUrl}`,{presentationStyle:WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN})}
function Navigator(){const {dark,user}=useApp();const handedOff=useRef('');useEffect(()=>{const subscription=Notifications.addNotificationResponseReceivedListener(response=>router.push(notificationRoute(response.notification.request.content.data?.route) as never));return()=>subscription.remove()},[]);useEffect(()=>{if(!user||!['admin','support'].includes(user.role)||handedOff.current===user.id)return;handedOff.current=user.id;void openStaffConsole()},[user]);return <><StatusBar style={dark?'light':'dark'}/><Stack screenOptions={{headerShown:false,animation:'slide_from_right'}}><Stack.Screen name="(tabs)"/><Stack.Screen name="basket" options={{presentation:'modal',animation:'slide_from_bottom'}}/></Stack></>}
export default function RootLayout(){const [loaded]=useFonts({Manrope_400Regular,Manrope_500Medium,Manrope_600SemiBold,Manrope_700Bold,Manrope_800ExtraBold,Georgia_Regular:require('@/assets/fonts/georgia.ttf'),Georgia_Italic:require('@/assets/fonts/georgiai.ttf'),Georgia_Bold:require('@/assets/fonts/georgiab.ttf'),Georgia_BoldItalic:require('@/assets/fonts/georgiaz.ttf')});if(!loaded)return null;return <AppProvider><Navigator/></AppProvider>}
