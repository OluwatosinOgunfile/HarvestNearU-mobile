import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, LocateFixed, MapPin, Search, ShoppingBag, Star, Store, Truck, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Header } from '@/components/header';
import { CategoryArtwork } from '@/components/category-artwork';
import { ListingImage } from '@/components/listing-image';
import { ProductCard } from '@/components/product-card';
import { Screen, Section } from '@/components/screen';
import { Text, TextInput } from '@/components/typography';
import { useApp } from '@/context/app-context';
import { palette } from '@/lib/theme';

const steps = [
  [LocateFixed, 'Discover nearby', 'Share your area and see available produce ranked by travel time.'],
  [ShoppingBag, 'Order what you need', 'Buy practical quantities while live farmer inventory lasts.'],
  [Truck, 'Choose fulfilment', 'Select doorstep delivery, farmer delivery, or local pickup.'],
  [Check, 'Pay securely', 'Complete payment in naira and follow every item to delivery.'],
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { theme, products, bestSellingFarms, loading, error, refresh, loadNearby, user } = useApp();
  const [searchOpen,setSearchOpen] = useState(false);
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('All');
  const [searchProgress] = useState(() => new Animated.Value(0));
  const wideJourney = width >= 760;
  const heroHeight = width >= 760 ? Math.min(410,Math.max(350,width*.3)) : Math.min(350,Math.max(330,(width-24)*.86));

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(product => product.category))).sort()];
  },[products]);

  const visibleProducts = useMemo(() => {
    const term=query.trim().toLowerCase();
    return products.filter(product => (category==='All'||product.category===category)&&(!term||[product.name,product.farmer,product.category,product.location].some(value=>value.toLowerCase().includes(term))));
  },[products,category,query]);

  function toggleSearch(open:boolean){if(open){setSearchOpen(true);Animated.spring(searchProgress,{toValue:1,useNativeDriver:false,damping:18,stiffness:190}).start();return}Animated.timing(searchProgress,{toValue:0,duration:160,useNativeDriver:false}).start(()=>{setSearchOpen(false);setQuery('')});}
  const searchWidth=searchProgress.interpolate({inputRange:[0,1],outputRange:[48,Math.max(240,width-36)]});

  return <Screen refreshing={loading} onRefresh={refresh}>
    <Header home onSearch={()=>toggleSearch(!searchOpen)}/>
    <View style={[styles.hero,{height:heroHeight}]}><Image source={require('@/assets/images/hero-produce.webp')} style={StyleSheet.absoluteFill} contentFit="cover"/><View style={styles.shade}/><View style={styles.heroContent}><Text style={styles.eyebrow}>FRESH LOCAL PRODUCE</Text><Text style={styles.heroTitle}>Good food should not travel so far.</Text><Text style={styles.heroCopy}>{"Order today's harvest from trusted nearby farms, in practical quantities."}</Text><Pressable onPress={()=>router.push('/shop')} style={styles.heroButton}><Text>Explore nearby harvests</Text><ArrowRight size={18}/></Pressable></View></View>

    <Section>
      <View style={styles.marketHead}><View style={{flex:1}}><Text style={[styles.kicker,{color:theme.primary}]}>{user?`WELCOME BACK, ${user.firstName.toUpperCase()}`:'THE MARKET, MADE LOCAL'}</Text><Text style={[styles.heading,{color:theme.text}]}>Discover today&apos;s harvest</Text></View></View>
      {searchOpen?<Animated.View style={[styles.searchBar,{width:searchWidth,opacity:searchProgress,backgroundColor:theme.surface,borderColor:theme.primary}]}><Search size={19} color={theme.primary}/><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search produce, categories, or farms" placeholderTextColor={theme.muted} style={[styles.searchInput,{color:theme.text}]}/><Pressable accessibilityLabel="Close search" hitSlop={10} onPress={()=>toggleSearch(false)}><X size={19} color={theme.muted}/></Pressable></Animated.View>:null}
    </Section>

    <Section>
      <View style={styles.sectionHead}><View><Text style={[styles.kicker,{color:theme.primary}]}>SHOP BY CATEGORY</Text><Text style={[styles.sectionTitle,{color:theme.text}]}>What are you looking for?</Text></View><Pressable onPress={()=>router.push('/shop')}><Text style={[styles.viewAll,{color:theme.primary}]}>View all</Text></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>{categories.map(item=>{const active=category===item;return <Pressable key={item} onPress={()=>setCategory(item)} style={styles.categoryItem}><View style={[styles.categoryImageWrap,{borderColor:active?theme.primary:theme.border,backgroundColor:theme.surfaceAlt}]}><CategoryArtwork category={item} size={68}/></View><Text numberOfLines={1} style={[styles.categoryLabel,{color:active?theme.primary:theme.text}]}>{item}</Text></Pressable>})}</ScrollView>
    </Section>

    <Section>
      <View style={styles.sectionHead}><View><Text style={[styles.kicker,{color:theme.primary}]}>CUSTOMER FAVOURITES</Text><Text style={[styles.sectionTitle,{color:theme.text}]}>Best-selling farms</Text></View></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.farmScroll}>{bestSellingFarms.map(farm=><Pressable key={farm.id} onPress={()=>router.push({pathname:'/farms/[id]',params:{id:farm.id}})} style={[styles.farmCard,{backgroundColor:theme.surface,borderColor:theme.border}]}><ListingImage uri={farm.image} category={farm.category} size={116} style={styles.farmImage}/><View style={styles.farmBody}><View style={styles.farmNameRow}><Store size={15} color={theme.primary}/><Text numberOfLines={1} style={[styles.farmName,{color:theme.text}]}>{farm.name}</Text></View><View style={styles.farmMeta}><Star size={14} color="#e7a81f" fill="#e7a81f"/><Text style={{color:theme.text,fontWeight:'800'}}>{farm.rating.toFixed(1)}</Text><Text style={{color:theme.muted}}>({farm.reviewCount})</Text></View><View style={styles.farmLocation}><MapPin size={13} color={theme.muted}/><Text numberOfLines={1} style={{color:theme.muted,fontSize:11,flex:1}}>{farm.location}</Text></View><Text style={[styles.sales,{color:theme.primary}]}>{farm.sold.toLocaleString('en-NG')} units sold {'\u00B7'} {farm.listings} active</Text></View></Pressable>)}</ScrollView>
    </Section>

    <Section>
      <View style={styles.sectionHead}><View><Text style={[styles.kicker,{color:theme.primary}]}>FRESH PICKS</Text><Text style={[styles.sectionTitle,{color:theme.text}]}>{category==='All'?'Available near you':category}</Text></View><Pressable accessibilityLabel="Use current location" onPress={()=>loadNearby().catch(()=>{})} style={[styles.location,{borderColor:theme.border}]}><LocateFixed size={18} color={theme.primary}/></Pressable></View>
      {loading?<ActivityIndicator color={theme.primary} style={styles.loader}/>:error?<View style={[styles.message,{backgroundColor:theme.surface}]}><Text style={{color:theme.text,fontWeight:'800'}}>Could not load harvests</Text><Text style={{color:theme.muted}}>{error}</Text></View>:visibleProducts.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productScroll}>{visibleProducts.slice(0,8).map(product=><ProductCard key={product.id} product={product}/>)}</ScrollView>:<View style={[styles.message,{backgroundColor:theme.surface}]}><Text style={{color:theme.text,fontWeight:'800'}}>No matching harvests</Text><Text style={{color:theme.muted}}>Try another search or category.</Text></View>}
    </Section>

    <Section><Text style={[styles.kicker,{color:theme.primary}]}>HOW HARVESTNEARU WORKS</Text><Text style={[styles.heading,{color:theme.text}]}>From farm gate to your plate.</Text><View style={[styles.journey,wideJourney?styles.journeyWide:styles.journeyMobile]}>{wideJourney&&<View style={[styles.horizontalLine,{backgroundColor:theme.border}]}/>}{steps.map(([Icon,title,copy],index)=><View key={title} style={wideJourney?styles.stepWide:styles.stepMobile}><View style={wideJourney?styles.wideRail:styles.mobileRail}>{!wideJourney&&index<steps.length-1&&<View style={[styles.verticalLine,{backgroundColor:theme.border}]}/>}<View style={[styles.stepNumber,{backgroundColor:theme.surfaceAlt,borderColor:theme.primary}]}><Text style={[styles.stepNumberText,{color:theme.primary}]}>{index+1}</Text></View></View><View style={[styles.stepContent,wideJourney&&styles.stepContentWide]}><View style={[styles.featureIcon,{backgroundColor:theme.surfaceAlt}]}><Icon size={22} color={theme.primary}/></View><Text style={[styles.featureTitle,{color:theme.text}]}>{title}</Text><Text style={[styles.featureCopy,{color:theme.muted}]}>{copy}</Text></View></View>)}</View></Section>
  </Screen>;
}

const styles=StyleSheet.create({
  hero:{marginHorizontal:12,borderRadius:22,overflow:'hidden',justifyContent:'center'},shade:{...StyleSheet.absoluteFill,backgroundColor:'rgba(6,40,22,.58)'},heroContent:{paddingHorizontal:24,paddingVertical:22},eyebrow:{color:palette.gold,fontSize:11,fontWeight:'900',letterSpacing:1.4},heroTitle:{maxWidth:320,marginTop:8,color:'#fff',fontSize:39,lineHeight:42,fontFamily:'Georgia_Bold'},heroCopy:{maxWidth:300,marginTop:10,color:'#e7eee9',fontSize:15,lineHeight:21},heroButton:{height:48,alignSelf:'flex-start',marginTop:16,paddingHorizontal:17,flexDirection:'row',alignItems:'center',gap:8,backgroundColor:palette.gold,borderRadius:12},
  marketHead:{flexDirection:'row',alignItems:'center',gap:12},kicker:{fontSize:11,fontWeight:'900',letterSpacing:1.2},heading:{marginTop:5,fontSize:28,fontFamily:'Georgia_Bold'},searchBar:{height:52,alignSelf:'flex-end',marginTop:14,paddingHorizontal:14,borderWidth:1,borderRadius:15,flexDirection:'row',alignItems:'center',gap:9,overflow:'hidden'},searchInput:{flex:1,height:'100%',fontSize:14},
  sectionHead:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:12},sectionTitle:{fontFamily:'Georgia_Bold',fontSize:24,marginTop:4},viewAll:{fontSize:12,fontWeight:'900',paddingVertical:6},categoryScroll:{paddingTop:14,paddingRight:18,gap:12},categoryItem:{width:76,alignItems:'center'},categoryImageWrap:{width:68,height:68,borderWidth:2,borderRadius:20,overflow:'hidden',alignItems:'center',justifyContent:'center'},categoryLabel:{width:'100%',fontSize:11,fontWeight:'800',textAlign:'center',marginTop:7},
  farmScroll:{paddingTop:14,paddingRight:18,gap:12},farmCard:{width:220,borderWidth:1,borderRadius:16,overflow:'hidden'},farmImage:{width:'100%',height:116},farmBody:{padding:13},farmNameRow:{flexDirection:'row',alignItems:'center',gap:6},farmName:{flex:1,fontFamily:'Georgia_Bold',fontSize:17},farmMeta:{flexDirection:'row',alignItems:'center',gap:4,marginTop:8},farmLocation:{flexDirection:'row',alignItems:'center',gap:4,marginTop:7},sales:{fontSize:11,fontWeight:'900',marginTop:9},
  location:{width:44,height:44,borderWidth:1,borderRadius:13,alignItems:'center',justifyContent:'center'},loader:{marginTop:50},message:{padding:20,borderRadius:14,marginTop:15,gap:5},productScroll:{paddingTop:14},journey:{marginTop:24},journeyWide:{flexDirection:'row',paddingTop:1},journeyMobile:{gap:0},horizontalLine:{position:'absolute',top:18,left:'12.5%',right:'12.5%',height:2},stepWide:{width:'25%',alignItems:'center',paddingHorizontal:10},stepMobile:{flexDirection:'row',minHeight:142},wideRail:{height:42,alignItems:'center',zIndex:1},mobileRail:{width:48,alignItems:'center'},verticalLine:{position:'absolute',top:36,bottom:-6,width:2},stepNumber:{width:36,height:36,borderRadius:18,borderWidth:2,alignItems:'center',justifyContent:'center'},stepNumberText:{fontSize:14,fontWeight:'900'},stepContent:{flex:1,paddingBottom:22},stepContentWide:{alignItems:'center',paddingTop:15,paddingBottom:0},featureIcon:{width:44,height:44,borderRadius:11,alignItems:'center',justifyContent:'center'},featureTitle:{fontSize:16,fontWeight:'800',marginTop:12},featureCopy:{fontSize:13,lineHeight:19,marginTop:5},
});
