import { useFocusEffect, useRouter } from 'expo-router';
import { BadgeCheck, MapPin, PackageOpen, RefreshCw, Search, Sprout, Star, Store, Truck } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Header } from '@/components/header';
import { ListingImage } from '@/components/listing-image';
import { Screen } from '@/components/screen';
import { Text, TextInput } from '@/components/typography';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api';
import { proximityLabel, titleCase } from '@/lib/format';

type FarmEntry = {
  id:string; name:string; location:string; description:string|null; distance:number;
  rating:number; reviewCount:number; inStock:number; outOfStock:number;
  categories:string[]; offersPickup:boolean; offersDelivery:boolean; image:string;
};

export default function Farms() {
  const router = useRouter();
  const { theme } = useApp();
  const [farms, setFarms] = useState<FarmEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setFarms((await api<{ farms:FarmEntry[] }>('/api/farms')).farms || []); }
    catch (reason) { setError((reason as Error).message); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const term = query.trim().toLowerCase();
  const shown = useMemo(() => !term ? farms : farms.filter(farm =>
    `${farm.name} ${farm.location} ${farm.categories.join(' ')}`.toLowerCase().includes(term)), [farms, term]);
  const stocked = shown.filter(farm => farm.inStock > 0).length;

  return <Screen refreshing={loading} onRefresh={load}>
    <Header />
    <View style={styles.content}>
      <Text style={[styles.eyebrow, { color:theme.primary }]}>EVERY VERIFIED FARM</Text>
      <Text style={[styles.title, { color:theme.text }]}>Explore farms</Text>
      <Text style={[styles.subtitle, { color:theme.muted }]}>{shown.length} farms{shown.length ? ` · ${stocked} with produce ready today` : ''}.</Text>
      <View style={[styles.search, { backgroundColor:theme.surface, borderColor:theme.border }]}>
        <Search size={20} color={theme.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search farms, towns, or produce" placeholderTextColor={theme.muted} style={[styles.input, { color:theme.text }]} />
      </View>
      {loading && !farms.length ? <ActivityIndicator color={theme.primary} style={{ marginTop:50 }} />
        : error ? <View style={[styles.empty, { backgroundColor:theme.surface, borderColor:theme.border }]}>
            <RefreshCw size={25} color={theme.primary} />
            <Text style={[styles.emptyTitle, { color:theme.text }]}>Could not load farms</Text>
            <Text style={[styles.emptyCopy, { color:theme.muted }]}>{error}</Text>
            <Pressable onPress={() => void load()} style={[styles.retry, { backgroundColor:theme.primary }]}><Text style={{ color:theme.primaryText, fontWeight:'800' }}>Try again</Text></Pressable>
          </View>
        : !shown.length ? <View style={[styles.empty, { backgroundColor:theme.surface, borderColor:theme.border }]}>
            <Sprout size={27} color={theme.primary} />
            <Text style={[styles.emptyTitle, { color:theme.text }]}>No farms match that search</Text>
            <Text style={[styles.emptyCopy, { color:theme.muted }]}>Try a farm name, a town, or a kind of produce.</Text>
          </View>
        : <View style={styles.list}>{shown.map(farm => <Pressable key={farm.id} accessibilityRole="link" accessibilityLabel={`${farm.name}, ${farm.inStock} in stock`} onPress={() => router.push({ pathname:'/farms/[id]', params:{ id:farm.id } })} style={[styles.card, { backgroundColor:theme.surface, borderColor:theme.border }]}>
            <ListingImage uri={farm.image} category={farm.categories[0] || 'All'} size={96} style={styles.image} recyclingKey={farm.id} />
            <View style={styles.body}>
              <View style={styles.nameRow}>
                <Store size={14} color={theme.primary} />
                <Text numberOfLines={1} style={[styles.name, { color:theme.text }]}>{farm.name}</Text>
                <BadgeCheck size={14} strokeWidth={2.4} color={theme.primary} accessibilityLabel="Verified farm" />
              </View>
              <View style={styles.metaRow}>
                <MapPin size={12} color={theme.muted} />
                <Text numberOfLines={1} style={[styles.meta, { color:theme.muted }]}>{farm.location} {'·'} {proximityLabel(farm.distance)}</Text>
              </View>
              <View style={styles.metaRow}>
                {farm.reviewCount
                  ? <><Star size={13} color="#e7a81f" fill="#e7a81f" /><Text style={[styles.meta, { color:theme.text, fontWeight:'800' }]}>{farm.rating.toFixed(1)} ({farm.reviewCount})</Text></>
                  : <View style={[styles.newFarm, { backgroundColor:theme.surfaceAlt }]}><Text style={[styles.newFarmText, { color:theme.primary }]}>NEW FARM</Text></View>}
                {farm.offersDelivery ? <><Truck size={13} color={theme.muted} /><Text style={[styles.meta, { color:theme.muted }]}>Delivers</Text></> : null}
              </View>
              <View style={styles.stockRow}>
                <View style={[styles.stockPill, { backgroundColor:farm.inStock ? theme.surfaceAlt : 'transparent', borderColor:theme.border }]}>
                  <Text style={[styles.stockText, { color:farm.inStock ? theme.primary : theme.muted }]}>{farm.inStock} in stock</Text>
                </View>
                {farm.outOfStock ? <View style={[styles.stockPill, { borderColor:theme.border }]}>
                  <PackageOpen size={12} color={theme.muted} />
                  <Text style={[styles.stockText, { color:theme.muted }]}>{farm.outOfStock} out of stock</Text>
                </View> : null}
              </View>
              {farm.categories.length ? <Text numberOfLines={1} style={[styles.categories, { color:theme.muted }]}>{farm.categories.slice(0, 3).map(titleCase).join(' · ')}</Text> : null}
            </View>
          </Pressable>)}</View>}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  content:{paddingHorizontal:18,paddingTop:14},eyebrow:{fontSize:11,fontWeight:'900',letterSpacing:1.2},title:{fontFamily:'serif',fontSize:31,fontWeight:'600',marginTop:5},subtitle:{fontSize:13,marginTop:5},search:{height:52,marginTop:16,marginBottom:14,borderWidth:1,borderRadius:14,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:9},input:{flex:1,fontSize:15,outlineWidth:0,outlineColor:'transparent'},
  list:{gap:11},card:{borderWidth:1,borderRadius:15,overflow:'hidden',flexDirection:'row',gap:12,padding:12},image:{width:96,height:96,borderRadius:11},body:{flex:1,minWidth:0,gap:5},nameRow:{flexDirection:'row',alignItems:'center',gap:5},name:{flexShrink:1,fontFamily:'serif',fontSize:18,fontWeight:'600'},metaRow:{flexDirection:'row',alignItems:'center',gap:4},meta:{flexShrink:1,fontSize:12},
  newFarm:{height:20,paddingHorizontal:7,borderRadius:6,justifyContent:'center'},newFarmText:{fontSize:10,fontWeight:'900',letterSpacing:.6},
  stockRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:1},stockPill:{minHeight:24,paddingHorizontal:9,borderWidth:1,borderRadius:12,flexDirection:'row',alignItems:'center',gap:4},stockText:{fontSize:11,fontWeight:'800'},categories:{fontSize:11},
  empty:{minHeight:240,borderWidth:1,borderRadius:16,alignItems:'center',justifyContent:'center',padding:28,gap:8},emptyTitle:{fontFamily:'serif',fontSize:23,fontWeight:'600',textAlign:'center'},emptyCopy:{fontSize:14,lineHeight:21,textAlign:'center'},retry:{height:46,borderRadius:10,paddingHorizontal:20,alignItems:'center',justifyContent:'center',marginTop:10},
});
