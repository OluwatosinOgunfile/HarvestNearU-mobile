import { Children } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/app-context';

export function Screen({children,refreshing=false,onRefresh,scrollRef,floating,stickyHeader=true}:{children:React.ReactNode;refreshing?:boolean;onRefresh?:()=>void;scrollRef?:React.RefObject<ScrollView|null>;floating?:React.ReactNode;stickyHeader?:boolean}){
  const {theme}=useApp();
  const items=Children.toArray(children);
  return <SafeAreaView style={[styles.safe,{backgroundColor:theme.background}]} edges={['top']}><ScrollView ref={scrollRef} contentContainerStyle={styles.content} stickyHeaderIndices={stickyHeader&&items.length?[0]:undefined} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" refreshControl={onRefresh?<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary}/>:undefined}>{stickyHeader&&items.length?<View style={[styles.sticky,{backgroundColor:theme.surface,borderBottomColor:theme.border}]}>{items[0]}</View>:items[0]}{items.slice(1)}</ScrollView>{floating}</SafeAreaView>;
}
export function Section({children,style,...props}:ViewProps){return <View {...props} style={[styles.section,style]}>{children}</View>}
const styles=StyleSheet.create({safe:{flex:1},content:{paddingBottom:112},sticky:{zIndex:20,elevation:5,borderBottomWidth:1},section:{paddingHorizontal:18,marginTop:24}});
