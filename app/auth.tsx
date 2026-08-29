import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/typography';
import { useApp } from '@/context/app-context';
import { saveSessionToken } from '@/lib/api';

export default function AuthCallback(){
  const router=useRouter();
  const params=useLocalSearchParams<{token?:string;newAccount?:string;error?:string}>();
  const {theme,refreshSession}=useApp();
  const handled=useRef(false);
  const [message,setMessage]=useState('Finishing your sign in...');
  useEffect(()=>{
    if(handled.current)return;
    const token=Array.isArray(params.token)?params.token[0]:params.token;
    const error=Array.isArray(params.error)?params.error[0]:params.error;
    if(error){handled.current=true;router.replace('/account');return}
    if(!token)return;
    handled.current=true;
    void (async()=>{
      try{
        await saveSessionToken(token);
        await refreshSession();
        router.replace(params.newAccount==='1'?'/account?onboarding=photo':'/');
      }catch{
        setMessage('Sign in could not be completed. Returning to your account.');
        setTimeout(()=>router.replace('/account'),900);
      }
    })();
  },[params.error,params.newAccount,params.token,refreshSession,router]);
  return <View style={[styles.page,{backgroundColor:theme.background}]}><ActivityIndicator size="large" color={theme.primary}/><Text style={[styles.text,{color:theme.text}]}>{message}</Text></View>;
}
const styles=StyleSheet.create({page:{flex:1,alignItems:'center',justifyContent:'center',padding:28,gap:15},text:{fontSize:15,fontWeight:'700',textAlign:'center'}});
