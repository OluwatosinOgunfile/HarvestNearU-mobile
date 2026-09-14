import { Children } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/app-context';

export function Screen({children,refreshing=false,onRefresh,scrollRef,floating,stickyHeader=true}:{children:React.ReactNode;refreshing?:boolean;onRefresh?:()=>void;scrollRef?:React.RefObject<ScrollView|null>;floating?:React.ReactNode;stickyHeader?:boolean}){
  const {theme}=useApp();
  const items=Children.toArray(children);
  const fixedHeader=stickyHeader&&items.length?items[0]:null;
  const scrollContent=stickyHeader?items.slice(1):items;
  // Every screen scrolls through here, so lifting the content above the keyboard once keeps the
  // field someone is typing in visible across the whole app instead of screen by screen.
  return <SafeAreaView style={[styles.safe,{backgroundColor:theme.background}]} edges={['top']}><KeyboardAvoidingView style={styles.safe} behavior={Platform.OS==='ios'?'padding':undefined}>{fixedHeader?<View style={[styles.sticky,{backgroundColor:theme.surface,borderBottomColor:theme.border}]}>{fixedHeader}</View>:null}<ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets refreshControl={onRefresh?<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary}/>:undefined}>{scrollContent}</ScrollView>{floating}</KeyboardAvoidingView></SafeAreaView>;
}
export function Section({children,style,...props}:ViewProps){return <View {...props} style={[styles.section,style]}>{children}</View>}
const styles=StyleSheet.create({safe:{flex:1},scroll:{flex:1},content:{paddingBottom:112},sticky:{zIndex:20,elevation:5,borderBottomWidth:1},section:{paddingHorizontal:18,marginTop:24}});
