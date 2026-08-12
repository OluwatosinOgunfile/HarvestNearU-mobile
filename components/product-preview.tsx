import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Plus, Store, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { absoluteUrl } from '@/lib/api';
import { titleCase } from '@/lib/format';
import { Product, useApp } from '@/context/app-context';
import { Money } from './money';
import { Text } from './typography';

export function ProductPreview({ product, visible, onClose }: { product:Product; visible:boolean; onClose:()=>void }) {
  const router = useRouter();
  const { theme, add } = useApp();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={[styles.modal, { backgroundColor: theme.surface }]} onPress={() => {}}>
        <Pressable onPress={onClose} style={styles.close}><X size={22} /></Pressable>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={styles.scrollContent}>
          <Image source={{ uri: absoluteUrl(product.image) }} style={styles.image} contentFit="contain" />
          <View style={styles.info}>
            <Text style={[styles.kicker, { color: theme.primary }]}>{product.available.toUpperCase()} {'\u00B7'} {product.category.toUpperCase()}</Text>
            <Text style={[styles.title, { color: theme.text }]}>{titleCase(product.name)}</Text>
            <Pressable accessibilityRole="link" onPress={() => { onClose(); router.push({ pathname:'/farms/[id]', params:{ id:product.farmId } }); }} style={styles.farmLink}>
              <Store size={15} color={theme.primary} /><Text style={{ color:theme.primary, fontWeight:'700' }}>{product.farmer}</Text>
            </Pressable>
            <Text style={{ color:theme.muted, marginTop:4 }}>{product.location}</Text>
            <View style={styles.action}>
              <View style={styles.priceRow}><Money value={product.price} style={[styles.price, { color:theme.text }]} /><Text style={{ fontSize:12, color:theme.muted }}>/ {product.unit}</Text></View>
              <Pressable onPress={() => { add(product); onClose(); }} style={[styles.add, { backgroundColor:theme.primary }]}><Plus size={18} color={theme.primaryText} /><Text style={{ color:theme.primaryText, fontWeight:'800' }}>Add to basket</Text></Pressable>
            </View>
          </View>
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>;
}

const styles=StyleSheet.create({backdrop:{flex:1,padding:14,justifyContent:'center',backgroundColor:'rgba(5,14,9,.82)'},modal:{height:'92%',overflow:'hidden',borderRadius:20},scrollContent:{flexGrow:1},close:{position:'absolute',right:13,top:13,zIndex:2,width:42,height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,.94)',alignItems:'center',justifyContent:'center'},image:{width:'100%',height:430,backgroundColor:'#101712'},info:{padding:20,paddingBottom:34},kicker:{fontSize:11,fontWeight:'900',letterSpacing:1},title:{fontSize:27,fontFamily:'serif',fontWeight:'600',marginVertical:6},farmLink:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6},action:{marginTop:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},priceRow:{flexDirection:'row',alignItems:'baseline',gap:4},price:{fontSize:19,fontWeight:'900'},add:{minHeight:45,paddingHorizontal:14,borderRadius:10,flexDirection:'row',alignItems:'center',gap:6}});
