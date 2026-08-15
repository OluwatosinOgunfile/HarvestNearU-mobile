import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, LocateFixed, MapPin, Search, ShoppingBag, Star, Store, Truck, X } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, TextInput as NativeTextInput, useWindowDimensions, View } from 'react-native';
import { Header } from '@/components/header';
import { CategoryArtwork } from '@/components/category-artwork';
import { ListingImage } from '@/components/listing-image';
import { ProductCard } from '@/components/product-card';
import { Screen, Section } from '@/components/screen';
import { Text, TextInput } from '@/components/typography';
import { useApp } from '@/context/app-context';
import { palette } from '@/lib/theme';

const steps = [
  [LocateFixed, 'Discover'],
  [ShoppingBag, 'Order'],
  [Truck, 'Deliver'],
  [Check, 'Pay'],
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { theme, products, bestSellingFarms, loading, error, refresh, loadNearby, user, cartCount } = useApp();
  const [searchOpen,setSearchOpen] = useState(false);
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('All');
  const [searchProgress] = useState(() => new Animated.Value(0));
  const pageRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<NativeTextInput>(null);
  const searchSectionY = useRef(0);
  const heroHeight = width >= 760 ? Math.min(410,Math.max(350,width*.3)) : Math.min(350,Math.max(330,(width-24)*.86));

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(product => product.category))).sort()];
  },[products]);

  const visibleProducts = useMemo(() => {
    const term=query.trim().toLowerCase();
    return products.filter(product => (category==='All'||product.category===category)&&(!term||[product.name,product.farmer,product.category,product.location].some(value=>value.toLowerCase().includes(term))));
  },[products,category,query]);

  function toggleSearch(open:boolean){if(open){setSearchOpen(true);Animated.spring(searchProgress,{toValue:1,useNativeDriver:false,damping:18,stiffness:190}).start();requestAnimationFrame(()=>{pageRef.current?.scrollTo({y:Math.max(0,searchSectionY.current-12),animated:true});setTimeout(()=>searchInputRef.current?.focus(),280)});return}searchInputRef.current?.blur();Animated.timing(searchProgress,{toValue:0,duration:160,useNativeDriver:false}).start(()=>{setSearchOpen(false);setQuery('')});}
  const searchWidth=searchProgress.interpolate({inputRange:[0,1],outputRange:[48,Math.max(240,width-36)]});

  return <Screen scrollRef={pageRef} refreshing={loading} onRefresh={refresh} floating={cartCount>0?<Pressable accessibilityLabel={`Open basket with ${cartCount} ${cartCount===1?'item':'items'}`} onPress={()=>router.push('/basket')} style={[styles.floatingCart,{backgroundColor:theme.primary,borderColor:theme.background}]}><ShoppingBag size={21} color={theme.primaryText}/><Text style={[styles.floatingCartText,{color:theme.primaryText}]}>View basket</Text><View style={[styles.floatingCartCount,{backgroundColor:theme.primaryText}]}><Text style={[styles.floatingCartCountText,{color:theme.primary}]}>{cartCount>99?'99+':cartCount}</Text></View></Pressable>:null}>
    <Header home onSearch={()=>toggleSearch(!searchOpen)}/>
    <View style={[styles.hero,{height:heroHeight}]}><Image source={require('@/assets/images/hero-produce.webp')} style={StyleSheet.absoluteFill} contentFit="cover"/><View style={styles.shade}/><View style={styles.heroContent}><Text style={styles.eyebrow}>FRESH LOCAL PRODUCE</Text><Text style={styles.heroTitle}>Good food should not travel so far.</Text><Text style={styles.heroCopy}>{"Order today's harvest from trusted nearby farms, in practical quantities."}</Text><Pressable onPress={()=>router.push('/shop')} style={styles.heroButton}><Text>Explore nearby harvests</Text><ArrowRight size={18}/></Pressable></View></View>

    <Section onLayout={(event)=>{searchSectionY.current=event.nativeEvent.layout.y}}>
      <View style={styles.marketHead}><View style={{flex:1}}><Text style={[styles.kicker,{color:theme.primary}]}>{user?`WELCOME BACK, ${user.firstName.toUpperCase()}`:'THE MARKET, MADE LOCAL'}</Text><Text style={[styles.heading,{color:theme.text}]}>Discover today&apos;s harvest</Text></View></View>
      {searchOpen?<Animated.View style={[styles.searchBar,{width:searchWidth,opacity:searchProgress,backgroundColor:theme.surface,borderColor:theme.primary}]}><Search size={19} color={theme.primary}/><TextInput ref={searchInputRef} value={query} onChangeText={setQuery} placeholder="Search produce, categories, or farms" placeholderTextColor={theme.muted} style={[styles.searchInput,{color:theme.text}]}/><Pressable accessibilityLabel="Close search" hitSlop={10} onPress={()=>toggleSearch(false)}><X size={19} color={theme.muted}/></Pressable></Animated.View>:null}
    </Section>

    <Section>
      <View style={styles.sectionHead}><View><Text style={[styles.kicker,{color:theme.primary}]}>SHOP BY CATEGORY</Text><Text style={[styles.sectionTitle,{color:theme.text}]}>What are you looking for?</Text></View><Pressable onPress={()=>router.push('/shop')}><Text style={[styles.viewAll,{color:theme.primary}]}>View all</Text></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>{categories.map(item=>{const active=category===item;return <Pressable key={item} onPress={()=>{setCategory(item);router.push({pathname:'/shop',params:item==='All'?{}:{category:item}})}} style={styles.categoryItem}><View style={[styles.categoryImageWrap,{borderColor:active?theme.primary:theme.border,backgroundColor:theme.surfaceAlt}]}><CategoryArtwork category={item} size={68}/></View><Text numberOfLines={1} style={[styles.categoryLabel,{color:active?theme.primary:theme.text}]}>{item}</Text></Pressable>})}</ScrollView>
    </Section>

    <Section>
      <View style={styles.sectionHead}><View><Text style={[styles.kicker,{color:theme.primary}]}>CUSTOMER FAVOURITES</Text><Text style={[styles.sectionTitle,{color:theme.text}]}>Best-selling farms</Text></View></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.farmScroll}>{bestSellingFarms.map(farm=><Pressable key={farm.id} onPress={()=>router.push({pathname:'/farms/[id]',params:{id:farm.id}})} style={[styles.farmCard,{backgroundColor:theme.surface,borderColor:theme.border}]}><ListingImage uri={farm.image} category={farm.category} size={116} style={styles.farmImage}/><View style={styles.farmBody}><View style={styles.farmNameRow}><Store size={15} color={theme.primary}/><Text numberOfLines={1} style={[styles.farmName,{color:theme.text}]}>{farm.name}</Text></View><View style={styles.farmMeta}><Star size={14} color="#e7a81f" fill="#e7a81f"/><Text style={{color:theme.text,fontWeight:'800'}}>{farm.rating.toFixed(1)}</Text><Text style={{color:theme.muted}}>({farm.reviewCount})</Text></View><View style={styles.farmLocation}><MapPin size={13} color={theme.muted}/><Text numberOfLines={1} style={{color:theme.muted,fontSize:11,flex:1}}>{farm.location}</Text></View><Text style={[styles.sales,{color:theme.primary}]}>{farm.sold.toLocaleString('en-NG')} units sold {'\u00B7'} {farm.listings} active</Text></View></Pressable>)}</ScrollView>
    </Section>

    <Section>
      <View style={styles.sectionHead}><View><Text style={[styles.kicker,{color:theme.primary}]}>FRESH PICKS</Text><Text style={[styles.sectionTitle,{color:theme.text}]}>{category==='All'?'Available near you':category}</Text></View><Pressable accessibilityLabel="Use current location" onPress={()=>loadNearby().catch(()=>{})} style={[styles.location,{borderColor:theme.border}]}><LocateFixed size={18} color={theme.primary}/></Pressable></View>
      {loading?<ActivityIndicator color={theme.primary} style={styles.loader}/>:error?<View style={[styles.message,{backgroundColor:theme.surface}]}><Text style={{color:theme.text,fontWeight:'800'}}>Could not load harvests</Text><Text style={{color:theme.muted}}>{error}</Text></View>:visibleProducts.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productScroll}>{visibleProducts.slice(0,8).map(product=><ProductCard key={product.id} product={product}/>)}</ScrollView>:<View style={[styles.message,{backgroundColor:theme.surface}]}><Text style={{color:theme.text,fontWeight:'800'}}>No matching harvests</Text><Text style={{color:theme.muted}}>Try another search or category.</Text></View>}
    </Section>

    <Section><Text style={[styles.kicker,{color:theme.primary}]}>HOW HARVESTNEARU WORKS</Text><Text style={[styles.journeyHeading,{color:theme.text}]}>Farm to table, simply.</Text><View style={styles.journey}><View style={[styles.journeyLine,{backgroundColor:theme.border}]}/>{steps.map(([Icon,title])=><View key={title} style={styles.journeyStep}><View style={[styles.journeyIcon,{backgroundColor:theme.surfaceAlt,borderColor:theme.primary}]}><Icon size={20} color={theme.primary}/></View><Text numberOfLines={1} style={[styles.journeyLabel,{color:theme.text}]}>{title}</Text></View>)}</View></Section>
  </Screen>;
}

const styles=StyleSheet.create({
  hero:{marginHorizontal:12,borderRadius:22,overflow:'hidden',justifyContent:'center'},shade:{...StyleSheet.absoluteFill,backgroundColor:'rgba(6,40,22,.58)'},heroContent:{paddingHorizontal:24,paddingVertical:22},eyebrow:{color:palette.gold,fontSize:11,fontWeight:'900',letterSpacing:1.4},heroTitle:{maxWidth:320,marginTop:8,color:'#fff',fontSize:39,lineHeight:42,fontFamily:'Georgia_Bold'},heroCopy:{maxWidth:300,marginTop:10,color:'#e7eee9',fontSize:15,lineHeight:21},heroButton:{height:48,alignSelf:'flex-start',marginTop:16,paddingHorizontal:17,flexDirection:'row',alignItems:'center',gap:8,backgroundColor:palette.gold,borderRadius:12},
  marketHead:{flexDirection:'row',alignItems:'center',gap:12},kicker:{fontSize:11,fontWeight:'900',letterSpacing:1.2},heading:{marginTop:5,fontSize:28,fontFamily:'Georgia_Bold'},searchBar:{height:52,alignSelf:'flex-end',marginTop:14,paddingHorizontal:14,borderWidth:1,borderRadius:15,flexDirection:'row',alignItems:'center',gap:9,overflow:'hidden'},searchInput:{flex:1,height:'100%',fontSize:14,outlineWidth:0,outlineColor:'transparent'},
  sectionHead:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:12},sectionTitle:{fontFamily:'Georgia_Bold',fontSize:24,marginTop:4},viewAll:{fontSize:12,fontWeight:'900',paddingVertical:6},categoryScroll:{paddingTop:14,paddingRight:18,gap:12},categoryItem:{width:76,alignItems:'center'},categoryImageWrap:{width:68,height:68,borderWidth:2,borderRadius:20,overflow:'hidden',alignItems:'center',justifyContent:'center'},categoryLabel:{width:'100%',fontSize:11,fontWeight:'800',textAlign:'center',marginTop:7},
  farmScroll:{paddingTop:14,paddingRight:18,gap:12},farmCard:{width:220,borderWidth:1,borderRadius:16,overflow:'hidden'},farmImage:{width:'100%',height:116},farmBody:{padding:13},farmNameRow:{flexDirection:'row',alignItems:'center',gap:6},farmName:{flex:1,fontFamily:'Georgia_Bold',fontSize:17},farmMeta:{flexDirection:'row',alignItems:'center',gap:4,marginTop:8},farmLocation:{flexDirection:'row',alignItems:'center',gap:4,marginTop:7},sales:{fontSize:11,fontWeight:'900',marginTop:9},
  location:{width:44,height:44,borderWidth:1,borderRadius:13,alignItems:'center',justifyContent:'center'},loader:{marginTop:50},message:{padding:20,borderRadius:14,marginTop:15,gap:5},productScroll:{paddingTop:14},journeyHeading:{marginTop:4,fontFamily:'Georgia_Bold',fontSize:23},journey:{marginTop:16,marginBottom:4,flexDirection:'row',alignItems:'flex-start',position:'relative'},journeyLine:{position:'absolute',top:20,left:'12.5%',right:'12.5%',height:2},journeyStep:{width:'25%',alignItems:'center',zIndex:1},journeyIcon:{width:42,height:42,borderRadius:13,borderWidth:1.5,alignItems:'center',justifyContent:'center'},journeyLabel:{maxWidth:'100%',fontSize:12,fontWeight:'800',marginTop:7,textAlign:'center'},floatingCart:{position:'absolute',right:18,bottom:18,minHeight:50,paddingLeft:16,paddingRight:8,borderWidth:3,borderRadius:25,flexDirection:'row',alignItems:'center',gap:8,shadowColor:'#000',shadowOffset:{width:0,height:5},shadowOpacity:.22,shadowRadius:10,elevation:8},floatingCartText:{fontSize:13,fontWeight:'900'},floatingCartCount:{minWidth:34,height:34,paddingHorizontal:8,borderRadius:17,alignItems:'center',justifyContent:'center'},floatingCartCountText:{fontSize:12,fontWeight:'900'},
});
