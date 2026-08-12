import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/app-context';

export function Screen({children,refreshing=false,onRefresh}:{children:React.ReactNode;refreshing?:boolean;onRefresh?:()=>void}){
  const {theme}=useApp();
  return <SafeAreaView style={[styles.safe,{backgroundColor:theme.background}]} edges={['top']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={onRefresh?<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary}/>:undefined}>{children}</ScrollView></SafeAreaView>;
}
export function Section({children}:{children:React.ReactNode}){return <View style={styles.section}>{children}</View>}
const styles=StyleSheet.create({safe:{flex:1},content:{paddingBottom:112},section:{paddingHorizontal:18,marginTop:24}});
