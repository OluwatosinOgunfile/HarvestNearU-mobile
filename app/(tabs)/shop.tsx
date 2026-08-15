import { useLocalSearchParams } from 'expo-router';
import { Check, ChevronDown, RefreshCw, Search, SlidersHorizontal, Sprout, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Header } from '@/components/header';
import { ProductCard } from '@/components/product-card';
import { Screen } from '@/components/screen';
import { Text, TextInput } from '@/components/typography';
import { useApp } from '@/context/app-context';

type Sort = 'distance' | 'price_low' | 'price_high' | 'rating';

export default function Shop() {
  const { theme, products, loading, error, refresh } = useApp();
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const requestedCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(requestedCategory || 'All');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<Sort>('distance');
  const [maxWalk, setMaxWalk] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);
  const categories = useMemo(() => ['All', ...new Set(products.map(product => product.category))], [products]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!requestedCategory) { setCategory('All'); return; }
      const match = categories.find(item => item.toLowerCase() === requestedCategory.toLowerCase());
      if (match) { setCategory(match); setVisibleCount(12); }
    }, 0);
    return () => clearTimeout(timer);
  }, [requestedCategory, categories]);

  const shown = useMemo(() => products
    .filter(product => (category === 'All' || product.category === category)
      && `${product.name} ${product.farmer}`.toLowerCase().includes(query.trim().toLowerCase())
      && (!maxWalk || product.distance * 12 <= maxWalk)
      && product.rating >= minRating)
    .sort((a, b) => sort === 'price_low' ? a.price - b.price
      : sort === 'price_high' ? b.price - a.price
        : sort === 'rating' ? b.rating - a.rating
          : a.distance - b.distance), [products, category, query, maxWalk, minRating, sort]);
  const visible = shown.slice(0, visibleCount);
  const activeFilters = Number(maxWalk > 0) + Number(minRating > 0) + Number(sort !== 'distance');
  const reset = () => { setSort('distance'); setMaxWalk(0); setMinRating(0); };

  return <Screen refreshing={loading} onRefresh={refresh}>
    <Header />
    <View style={styles.content}>
      <Text style={[styles.eyebrow, { color:theme.primary }]}>THE MARKET, MADE LOCAL</Text>
      <Text style={[styles.title, { color:theme.text }]}>Shop fresh harvests</Text>
      <Text style={[styles.subtitle, { color:theme.muted }]}>{shown.length} available listings, ranked {sort === 'distance' ? 'nearest first' : 'by your filters'}.</Text>
      <View style={[styles.search, { backgroundColor:theme.surface, borderColor:theme.border }]}>
        <Search size={20} color={theme.muted} />
        <TextInput value={query} onChangeText={value => { setQuery(value); setVisibleCount(12); }} placeholder="Search produce or farms" placeholderTextColor={theme.muted} style={[styles.input, { color:theme.text }]} />
        <Pressable accessibilityLabel="Open produce filters" onPress={() => { setFiltersOpen(value => !value); setCategoryOpen(false); }} style={[styles.filterButton, { backgroundColor:filtersOpen ? theme.primary : theme.surfaceAlt }]}>
          <SlidersHorizontal size={19} color={filtersOpen ? theme.primaryText : theme.primary} />
          {activeFilters ? <View style={styles.filterCount}><Text style={styles.filterCountText}>{activeFilters}</Text></View> : null}
        </Pressable>
      </View>
      {filtersOpen ? <FilterPanel theme={theme} shown={shown.length} sort={sort} maxWalk={maxWalk} minRating={minRating} onSort={value => { setSort(value); setVisibleCount(12); }} onWalk={value => { setMaxWalk(value); setVisibleCount(12); }} onRating={value => { setMinRating(value); setVisibleCount(12); }} onReset={reset} onClose={() => setFiltersOpen(false)} /> : null}
      <View style={styles.categoryArea}>
        <Text style={[styles.categoryCaption, { color:theme.muted }]}>PRODUCE CATEGORY</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded:categoryOpen }} onPress={() => { setCategoryOpen(value => !value); setFiltersOpen(false); }} style={[styles.categorySelect, { backgroundColor:theme.surface, borderColor:categoryOpen ? theme.primary : theme.border }]}>
          <Text style={[styles.categoryValue, { color:theme.text }]}>{category === 'All' ? 'All produce' : category}</Text>
          <ChevronDown size={19} color={theme.primary} style={{ transform:[{ rotate:categoryOpen ? '180deg' : '0deg' }] }} />
        </Pressable>
        {categoryOpen ? <View style={[styles.categoryMenu, { backgroundColor:theme.surface, borderColor:theme.border }]}>{categories.map(item => <Pressable key={item} onPress={() => { setCategory(item); setVisibleCount(12); setCategoryOpen(false); }} style={[styles.categoryOption, item === category && { backgroundColor:theme.surfaceAlt }]}><Text style={{ color:theme.text, fontWeight:item === category ? '900' : '600' }}>{item === 'All' ? 'All produce' : item}</Text>{item === category ? <Check size={17} color={theme.primary} /> : null}</Pressable>)}</View> : null}
      </View>
      {loading ? <ActivityIndicator color={theme.primary} style={{ marginTop:50 }} />
        : error ? <Empty theme={theme} title="Could not load the market" copy={error} retry={refresh} />
          : shown.length === 0 ? <Empty theme={theme} title="No matching harvests" copy="Clear the search or adjust your filters." />
            : <><View style={styles.list}>{visible.map(product => <ProductCard key={product.id} product={product} fullWidth compact />)}</View>{visible.length < shown.length ? <Pressable onPress={() => setVisibleCount(count => count + 12)} style={[styles.loadMore, { backgroundColor:theme.surface, borderColor:theme.border }]}><Text style={{ color:theme.primary, fontWeight:'900' }}>Load more harvests</Text><Text style={{ color:theme.muted, fontSize:11 }}>{shown.length - visible.length} remaining</Text></Pressable> : null}</>}
    </View>
  </Screen>;
}

function FilterPanel({ theme, shown, sort, maxWalk, minRating, onSort, onWalk, onRating, onReset, onClose }:{ theme:any; shown:number; sort:Sort; maxWalk:number; minRating:number; onSort:(value:Sort)=>void; onWalk:(value:number)=>void; onRating:(value:number)=>void; onReset:()=>void; onClose:()=>void }) {
  return <View style={[styles.filterPanel, { backgroundColor:theme.surface, borderColor:theme.border }]}><View style={styles.filterHead}><Text style={[styles.filterTitle, { color:theme.text }]}>Sort and filter</Text><Pressable onPress={onClose} style={styles.close}><X size={18} color={theme.text} /></Pressable></View><Text style={[styles.filterLabel, { color:theme.muted }]}>SORT BY</Text><View style={styles.options}>{([['distance', 'Nearest'], ['price_low', 'Lowest price'], ['price_high', 'Highest price'], ['rating', 'Best rated']] as [Sort, string][]).map(([value, title]) => <Option key={value} active={sort === value} theme={theme} title={title} onPress={() => onSort(value)} />)}</View><Text style={[styles.filterLabel, { color:theme.muted }]}>MAXIMUM WALK</Text><View style={styles.options}>{[[0, 'Any time'], [15, '15 min'], [30, '30 min'], [60, '1 hour']].map(([value, title]) => <Option key={String(value)} active={maxWalk === value} theme={theme} title={String(title)} onPress={() => onWalk(Number(value))} />)}</View><Text style={[styles.filterLabel, { color:theme.muted }]}>MINIMUM RATING</Text><View style={styles.options}>{[[0, 'Any'], [3, '3+ stars'], [4, '4+ stars'], [4.5, '4.5+ stars']].map(([value, title]) => <Option key={String(value)} active={minRating === value} theme={theme} title={String(title)} onPress={() => onRating(Number(value))} />)}</View><View style={styles.actions}><Pressable onPress={onReset} style={[styles.reset, { borderColor:theme.border }]}><Text style={{ color:theme.text, fontWeight:'800' }}>Reset</Text></Pressable><Pressable onPress={onClose} style={[styles.apply, { backgroundColor:theme.primary }]}><Check size={17} color={theme.primaryText} /><Text style={{ color:theme.primaryText, fontWeight:'800' }}>Show {shown} results</Text></Pressable></View></View>;
}
function Option({ active, theme, title, onPress }:{ active:boolean; theme:any; title:string; onPress:()=>void }) { return <Pressable onPress={onPress} style={[styles.option, { backgroundColor:active ? theme.surfaceAlt : theme.background, borderColor:active ? theme.primary : theme.border }]}>{active ? <Check size={14} color={theme.primary} /> : null}<Text style={{ color:theme.text, fontWeight:'700' }}>{title}</Text></Pressable>; }
function Empty({ theme, title, copy, retry }:{ theme:any; title:string; copy:string; retry?:()=>Promise<void> }) { return <View style={[styles.empty, { backgroundColor:theme.surface, borderColor:theme.border }]}><View style={[styles.emptyIcon, { backgroundColor:theme.surfaceAlt }]}>{retry ? <RefreshCw size={25} color={theme.primary} /> : <Sprout size={27} color={theme.primary} />}</View><Text style={[styles.emptyTitle, { color:theme.text }]}>{title}</Text><Text style={[styles.emptyCopy, { color:theme.muted }]}>{copy}</Text>{retry ? <Pressable onPress={() => void retry()} style={[styles.retry, { backgroundColor:theme.primary }]}><RefreshCw size={18} color={theme.primaryText} /><Text style={{ color:theme.primaryText, fontWeight:'800' }}>Try again</Text></Pressable> : null}</View>; }

const styles = StyleSheet.create({
  content:{paddingHorizontal:18,paddingTop:14},eyebrow:{fontSize:11,fontWeight:'900',letterSpacing:1.2},title:{fontFamily:'serif',fontSize:31,fontWeight:'600',marginTop:5},subtitle:{fontSize:13,marginTop:5},search:{height:52,marginTop:16,borderWidth:1,borderRadius:14,paddingLeft:14,paddingRight:5,flexDirection:'row',alignItems:'center',gap:9},input:{flex:1,fontSize:15,outlineWidth:0,outlineColor:'transparent'},filterButton:{width:41,height:41,borderRadius:10,alignItems:'center',justifyContent:'center'},filterCount:{position:'absolute',right:-3,top:-4,minWidth:17,height:17,paddingHorizontal:4,borderRadius:9,backgroundColor:'#d99b13',alignItems:'center',justifyContent:'center'},filterCountText:{color:'#17231b',fontSize:9,fontWeight:'900'},filterPanel:{marginTop:10,padding:15,borderWidth:1,borderRadius:14},filterHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},filterTitle:{fontFamily:'serif',fontSize:21,fontWeight:'600'},close:{width:34,height:34,alignItems:'center',justifyContent:'center'},filterLabel:{fontSize:10,fontWeight:'900',letterSpacing:.8,marginTop:14,marginBottom:7},options:{flexDirection:'row',flexWrap:'wrap',gap:7},option:{minHeight:38,paddingHorizontal:11,borderWidth:1,borderRadius:9,flexDirection:'row',alignItems:'center',gap:5},actions:{marginTop:17,flexDirection:'row',gap:8},reset:{height:44,paddingHorizontal:15,borderWidth:1,borderRadius:10,alignItems:'center',justifyContent:'center'},apply:{flex:1,height:44,borderRadius:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},categoryArea:{marginVertical:13,zIndex:2},categoryCaption:{fontSize:10,fontWeight:'900',letterSpacing:.8,marginBottom:6},categorySelect:{height:48,paddingHorizontal:14,borderWidth:1,borderRadius:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},categoryValue:{fontSize:14,fontWeight:'800'},categoryMenu:{marginTop:6,borderWidth:1,borderRadius:12,overflow:'hidden'},categoryOption:{minHeight:43,paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},list:{gap:11},loadMore:{height:56,marginTop:14,borderWidth:1,borderRadius:13,alignItems:'center',justifyContent:'center',gap:2},empty:{minHeight:240,borderWidth:1,borderRadius:16,alignItems:'center',justifyContent:'center',padding:28},emptyIcon:{width:54,height:54,borderRadius:14,alignItems:'center',justifyContent:'center',marginBottom:16},emptyTitle:{fontFamily:'serif',fontSize:23,fontWeight:'600',textAlign:'center'},emptyCopy:{fontSize:14,lineHeight:21,textAlign:'center',marginTop:7},retry:{height:46,borderRadius:10,paddingHorizontal:20,flexDirection:'row',alignItems:'center',gap:8,marginTop:18}
});
