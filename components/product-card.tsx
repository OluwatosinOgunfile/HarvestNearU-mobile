import { useRouter } from 'expo-router';
import { Heart, MapPin, Plus, Star, Store } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Product, useApp } from '@/context/app-context';
import { titleCase } from '@/lib/format';
import { Money } from './money';
import { ListingImage } from './listing-image';
import { ProductPreview } from './product-preview';
import { Text } from './typography';

const walking = (distance: number) => distance < .35 ? 'Under 5 min walk' : `About ${Math.max(5, Math.round(distance * 12 / 5) * 5)} min walk`;

export function ProductCard({ product, fullWidth = false, compact = false }: { product: Product; fullWidth?: boolean; compact?: boolean }) {
  const router = useRouter();
  const { theme, add, cart, user, liked, toggleLike } = useApp();
  const [preview, setPreview] = useState(false);
  const restockTotal = Math.max(1, product.restockTotal || product.stock);
  const stockPercent = Math.max(0, Math.min(100, product.stock / restockTotal * 100));

  return <>
    <Pressable onPress={() => setPreview(true)} style={[styles.card, fullWidth && styles.fullWidth, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.imageWrap,compact&&styles.imageWrapCompact]}>
        <ListingImage uri={product.image} category={product.category} size={176} style={styles.image} recyclingKey={product.id} />
        <View style={styles.distance}><MapPin size={13} color="#183525" /><Text>{walking(product.distance)}</Text></View>
        <Pressable accessibilityLabel={liked.includes(product.id) ? 'Remove from favourites' : 'Save to favourites'} onPress={(event) => {
          event.stopPropagation();
          if (!user) { router.push('/account'); return; }
          void toggleLike(product.id);
        }} style={styles.heart}>
          <Heart size={19} color="#284336" fill={liked.includes(product.id) ? '#6db88b' : 'transparent'} />
        </Pressable>
      </View>
      <View style={[styles.body,compact&&styles.bodyCompact]}>
        <View style={styles.identityRow}>
          <View style={styles.produceIdentity}>
            <Text style={[styles.available, { color: theme.primary }]}>{'\u25CF  '}{product.available.toUpperCase()}</Text>
            <Text numberOfLines={2} style={[styles.name,compact&&styles.nameCompact, { color: theme.text }]}>{titleCase(product.name)}</Text>
          </View>
          <View style={styles.farmIdentity}>
            <Pressable accessibilityRole="link" accessibilityLabel={`View ${product.farmer}`} onPress={(event) => {
              event.stopPropagation();
              router.push({ pathname: '/farms/[id]', params: { id: product.farmId } });
            }} style={styles.farmRow}>
              <Store size={13} color={theme.primary} />
              <Text numberOfLines={2} style={[styles.farmLink, { color: theme.primary }]}>{product.farmer}</Text>
            </Pressable>
            <View style={styles.rating}><Star size={15} color="#e7a81f" fill="#e7a81f" /><Text style={{ color: theme.text }}>{product.rating.toFixed(1)} ({product.reviewCount})</Text></View>
          </View>
        </View>
        <View style={[styles.track, { backgroundColor: theme.border }]} accessibilityLabel={`${Math.round(stockPercent)} percent of restocked quantity remaining`}>
          <View style={[styles.trackFill, { width: `${stockPercent}%`, backgroundColor: stockPercent < 20 ? '#e86f3b' : theme.primary }]} />
        </View>
        <Text style={[styles.stock, { color: theme.muted }]}>{product.stock} {product.unit}{product.stock === 1 ? '' : 's'} left</Text>
        <View style={[styles.priceRow, { borderTopColor: theme.border }]}>
          <View style={styles.moneyRow}><Money value={product.price} style={[styles.price, { color: theme.text }]} /><Text style={[styles.unit, { color: theme.muted }]}>/ {product.unit}</Text></View>
          <Pressable onPress={(event) => { event.stopPropagation(); add(product); }} disabled={(cart[product.id] || 0) >= product.stock} style={[styles.add, { backgroundColor: theme.primary }]}>
            <Plus size={17} color={theme.primaryText} /><Text style={{ color: theme.primaryText, fontWeight: '800' }}>Add</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
    <ProductPreview product={product} visible={preview} onClose={() => setPreview(false)} />
  </>;
}

const styles = StyleSheet.create({
  card:{width:268,borderWidth:1,borderRadius:16,overflow:'hidden',marginRight:14},fullWidth:{width:'100%',marginRight:0},imageWrap:{height:176,position:'relative',backgroundColor:'#dfe7dc'},imageWrapCompact:{height:142},image:{width:'100%',height:'100%'},distance:{position:'absolute',left:10,top:10,height:31,paddingHorizontal:9,flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(255,255,255,.94)',borderRadius:8},heart:{position:'absolute',right:10,top:10,width:38,height:38,borderRadius:19,backgroundColor:'rgba(255,255,255,.95)',alignItems:'center',justifyContent:'center'},body:{padding:14},bodyCompact:{padding:12},identityRow:{minHeight:57,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:10},produceIdentity:{flex:1,minWidth:0},farmIdentity:{width:'43%',alignItems:'flex-end'},available:{fontSize:10,fontWeight:'800',letterSpacing:.7},name:{marginTop:5,fontSize:19,lineHeight:23,fontFamily:'serif',fontWeight:'600'},nameCompact:{fontSize:17,lineHeight:20},farmRow:{maxWidth:'100%',flexDirection:'row',alignItems:'flex-start',justifyContent:'flex-end',gap:4},farmLink:{flexShrink:1,fontSize:11,lineHeight:15,fontWeight:'700',textAlign:'right'},rating:{marginTop:5,flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:4},track:{height:5,borderRadius:3,overflow:'hidden',marginTop:10},trackFill:{height:'100%',borderRadius:3},stock:{fontSize:12,marginTop:6},priceRow:{marginTop:11,paddingTop:11,borderTopWidth:1,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},moneyRow:{flexDirection:'row',alignItems:'baseline',gap:4},price:{fontSize:18,fontWeight:'800'},unit:{fontSize:11,fontWeight:'500'},add:{height:38,paddingHorizontal:13,borderRadius:9,flexDirection:'row',gap:5,alignItems:'center'}
});
