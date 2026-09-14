import { Children } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import { KeyboardAwareScrollView, type KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/app-context';

export function Screen({children,refreshing=false,onRefresh,scrollRef,floating,stickyHeader=true}:{children:React.ReactNode;refreshing?:boolean;onRefresh?:()=>void;scrollRef?:React.RefObject<ScrollView|null>;floating?:React.ReactNode;stickyHeader?:boolean}){
  const {theme}=useApp();
  const items=Children.toArray(children);
  const fixedHeader=stickyHeader&&items.length?items[0]:null;
  const scrollContent=stickyHeader?items.slice(1):items;
  // Every screen scrolls through here. The app draws edge to edge, which means Android no longer
  // resizes the window for the keyboard and the platform's own avoiding view does nothing, so the
  // scroller itself tracks the keyboard and keeps the focused field above it on both platforms.
  // The forwarded ref is a ScrollView with one extra method, so callers keep their ScrollView ref
  // type and every scrollTo they already make still works.
  return <SafeAreaView style={[styles.safe,{backgroundColor:theme.background}]} edges={['top']}>{fixedHeader?<View style={[styles.sticky,{backgroundColor:theme.surface,borderBottomColor:theme.border}]}>{fixedHeader}</View>:null}<KeyboardAwareScrollView ref={scrollRef as React.RefObject<KeyboardAwareScrollViewRef|null>} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" bottomOffset={24} refreshControl={onRefresh?<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary}/>:undefined}>{scrollContent}</KeyboardAwareScrollView>{floating}</SafeAreaView>;
}
export function Section({children,style,...props}:ViewProps){return <View {...props} style={[styles.section,style]}>{children}</View>}
const styles=StyleSheet.create({safe:{flex:1},scroll:{flex:1},content:{paddingBottom:112},sticky:{zIndex:20,elevation:5,borderBottomWidth:1},section:{paddingHorizontal:18,marginTop:24}});
