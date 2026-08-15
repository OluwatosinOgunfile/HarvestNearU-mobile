import { RefreshControl, ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/app-context';

export function Screen({children,refreshing=false,onRefresh,scrollRef,floating}:{children:React.ReactNode;refreshing?:boolean;onRefresh?:()=>void;scrollRef?:React.RefObject<ScrollView|null>;floating?:React.ReactNode}){
  const {theme}=useApp();
  return <SafeAreaView style={[styles.safe,{backgroundColor:theme.background}]} edges={['top']}><ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" refreshControl={onRefresh?<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary}/>:undefined}>{children}</ScrollView>{floating}</SafeAreaView>;
}
export function Section({children,style,...props}:ViewProps){return <View {...props} style={[styles.section,style]}>{children}</View>}
const styles=StyleSheet.create({safe:{flex:1},content:{paddingBottom:112},section:{paddingHorizontal:18,marginTop:24}});
