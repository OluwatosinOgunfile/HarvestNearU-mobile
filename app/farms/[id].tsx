import { Image } from 'expo-image';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BadgeCheck, ChevronLeft, ChevronRight, ExternalLink, Leaf, MapPin, Navigation, PackageOpen, Star, Store, Truck } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Header } from '@/components/header';
import { Money } from '@/components/money';
import { Screen } from '@/components/screen';
import { Text } from '@/components/typography';
import { useApp } from '@/context/app-context';
import { absoluteUrl, api } from '@/lib/api';
import { titleCase } from '@/lib/format';

type FarmData = {
  farm: { id:string; name:string; description?:string; address_text:string; city:string; state:string; latitude:number|string; longitude:number|string; offers_pickup:boolean; offers_delivery:boolean; average_rating:number; review_count:number; first_name:string; last_name:string };
  listings: { id:string; name:string; unit:string; unit_price_kobo:number; stock:number; category:string; image?:string }[];
  reviews: { id:string; rating:number; comment?:string; farmer_reply?:string; created_at:string; first_name:string; last_name:string }[];
  recommendations: { id:string; name:string; unit:string; unit_price_kobo:number; stock:number; category:string; image?:string; farm_id:string; farm_name:string }[];
};

function RatingStars({ value, size = 15 }: { value:number; size?:number }) {
  return <View style={styles.stars}>{[1, 2, 3, 4, 5].map(star => <Star key={star} size={size} color="#e4a91b" fill={star <= Math.round(value) ? '#e4a91b' : 'transparent'} />)}</View>;
}

export default function FarmDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id:string }>();
  const { theme } = useApp();
  const [data, setData] = useState<FarmData | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try { setData(await api<FarmData>(`/api/farms/${id}`)); }
    catch (reason) { setError((reason as Error).message); }
  }, [id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const leave = () => router.canGoBack() ? router.back() : router.replace('/shop');

  if (!data && !error) return <Screen><Header /><View style={styles.loading}><ActivityIndicator size="large" color={theme.primary} /><Text style={{ color:theme.muted }}>Preparing the farm store...</Text></View></Screen>;
  if (error) return <Screen><Header /><View style={styles.topbar}><Pressable accessibilityLabel="Back to shop" hitSlop={12} onPress={leave} style={[styles.back, { backgroundColor:theme.surface, borderColor:theme.border }]}><ChevronLeft size={23} color={theme.text} /></Pressable><Text style={[styles.topTitle, { color:theme.text }]}>Farm details</Text></View><View style={[styles.emptyState, { backgroundColor:theme.surface, borderColor:theme.border }]}><PackageOpen size={34} color={theme.primary} /><Text style={[styles.emptyTitle, { color:theme.text }]}>Could not load this farm</Text><Text style={[styles.emptyCopy, { color:theme.muted }]}>{error}</Text><Pressable onPress={() => void load()} style={[styles.retry, { backgroundColor:theme.primary }]}><Text style={{ color:theme.primaryText, fontWeight:'800' }}>Try again</Text></Pressable></View></Screen>;
  if (!data) return null;

  const rating = Number(data.farm.average_rating || 0);const latitude=Number(data.farm.latitude);const longitude=Number(data.farm.longitude);const hasMap=Number.isFinite(latitude)&&Number.isFinite(longitude);const mapDelta=.012;const mapEmbed=hasMap?`https://www.openstreetmap.org/export/embed.html?bbox=${longitude-mapDelta}%2C${latitude-mapDelta}%2C${longitude+mapDelta}%2C${latitude+mapDelta}&layer=mapnik&marker=${latitude}%2C${longitude}`:'';
  async function openDirections(){if(!hasMap)return;let route=`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;try{const permission=await Location.requestForegroundPermissionsAsync();if(permission.granted){const current=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});route=`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${current.coords.latitude}%2C${current.coords.longitude}%3B${latitude}%2C${longitude}`}}catch{}await WebBrowser.openBrowserAsync(route)}
  return <Screen refreshing={false} onRefresh={load}>
    <Header />
    <View style={styles.hero}>
      <Pressable accessibilityLabel="Back to shop" hitSlop={12} onPress={leave} style={styles.heroBack}><ChevronLeft size={24} color="#173322" /></Pressable>
      <View style={styles.heroContent}>
        <View style={styles.verified}><BadgeCheck size={15} color="#a8deb7" /><Text style={styles.verifiedText}>VERIFIED LOCAL FARM</Text></View>
        <Text style={styles.title}>{data.farm.name}</Text>
        <View style={styles.heroRating}><RatingStars value={rating} size={17} /><Text style={styles.ratingValue}>{rating.toFixed(1)}</Text><Text style={styles.ratingCount}>{data.farm.review_count} {data.farm.review_count === 1 ? 'review' : 'reviews'}</Text></View>
      </View>
    </View>

    <View style={styles.content}>
      <View style={[styles.aboutCard, { backgroundColor:theme.surface, borderColor:theme.border }]}>
        <Text style={[styles.eyebrow, { color:theme.primary }]}>ABOUT THE FARM</Text>
        <Text style={[styles.sectionTitle, { color:theme.text }]}>Fresh food, grown closer.</Text>
        <Text style={[styles.copy, { color:theme.muted }]}>{data.farm.description || `${data.farm.name} supplies fresh, locally grown produce to HarvestNearU customers.`}</Text>
        <View style={[styles.facts, { borderTopColor:theme.border }]}>
          <Fact icon={<MapPin size={19} color={theme.primary} />} title="Address" text={`${data.farm.address_text}, ${data.farm.city}, ${data.farm.state}`} theme={theme} />
          <Fact icon={<Store size={19} color={theme.primary} />} title="Farm owner" text={`${data.farm.first_name} ${data.farm.last_name}`} theme={theme} />
          <Fact icon={<Truck size={19} color={theme.primary} />} title="Fulfilment" text={[data.farm.offers_pickup && 'Farm pickup', data.farm.offers_delivery && 'Delivery'].filter(Boolean).join(' and ') || 'Contact farm'} theme={theme} />
        </View>
      </View>

      {hasMap?<View style={[styles.mapCard,{backgroundColor:theme.surface,borderColor:theme.border}]}><View style={styles.mapHeading}><View style={{flex:1}}><Text style={[styles.eyebrow,{color:theme.primary}]}>FARM LOCATION</Text><Text style={[styles.mapTitle,{color:theme.text}]}>Find {data.farm.name}</Text><Text style={[styles.mapAddress,{color:theme.muted}]}>{data.farm.address_text}, {data.farm.city}, {data.farm.state}</Text></View><View style={[styles.factIcon,{backgroundColor:theme.surfaceAlt}]}><Navigation size={20} color={theme.primary}/></View></View><View style={styles.mapPreview}><WebView source={{uri:mapEmbed}} originWhitelist={['https://www.openstreetmap.org']} javaScriptEnabled domStorageEnabled scrollEnabled={false} setSupportMultipleWindows={false} style={styles.mapWebView}/></View><Pressable onPress={()=>void openDirections()} style={[styles.directionButton,{backgroundColor:theme.primary}]}><Text style={{color:theme.primaryText,fontWeight:'900'}}>Open free directions</Text><ExternalLink size={18} color={theme.primaryText}/></Pressable><Text style={[styles.attribution,{color:theme.muted}]}>Map data (c) OpenStreetMap contributors</Text></View>:null}

      <SectionHeading eyebrow="AVAILABLE NOW" title={`Produce from ${data.farm.name}`} count={`${data.listings.length} active`} theme={theme} />
      {data.listings.length ? <View style={styles.grid}>{data.listings.map(item => <View key={item.id} style={[styles.listing, { backgroundColor:theme.surface, borderColor:theme.border }]}>
        <Image source={{ uri:absoluteUrl(item.image) }} style={styles.image} contentFit="cover" />
        <View style={styles.listingBody}><Text style={[styles.category, { color:theme.primary }]}>{item.category.toUpperCase()}</Text><Text style={[styles.listingName, { color:theme.text }]} numberOfLines={2}>{titleCase(item.name)}</Text><Text style={[styles.stock, { color:theme.muted }]}>{item.stock} {item.unit}{item.stock === 1 ? '' : 's'} available</Text><View style={[styles.listingPrice, { borderTopColor:theme.border }]}><Money value={Number(item.unit_price_kobo) / 100} style={{ color:theme.text, fontSize:17 }} /><Text style={{ color:theme.muted, fontSize:11 }}>/ {item.unit}</Text></View></View>
      </View>)}</View> : <EmptyPanel icon={<Leaf size={31} color={theme.primary} />} title="No produce available today" copy="This farm has no active listings right now. Please check again soon." theme={theme} />}

      <SectionHeading eyebrow="VERIFIED BUYER FEEDBACK" title="What customers say" count={data.reviews.length ? rating.toFixed(1) : 'New'} theme={theme} />
      {data.reviews.length ? data.reviews.map(review => <View key={review.id} style={[styles.review, { backgroundColor:theme.surface, borderColor:theme.border }]}>
        <View style={styles.reviewHead}><RatingStars value={Number(review.rating)} /><Text style={{ color:theme.muted, fontSize:11 }}>{new Date(review.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })}</Text></View>
        <Text style={[styles.reviewCopy, { color:theme.text }]}>{review.comment || 'Rating submitted without a written comment.'}</Text>
        <Text style={[styles.reviewer, { color:theme.muted }]}>{review.first_name} {review.last_name.slice(0, 1)}. {'\u00B7'} Verified buyer</Text>
        {review.farmer_reply ? <View style={[styles.reply, { backgroundColor:theme.surfaceAlt }]}><Text style={{ color:theme.primary, fontWeight:'800', fontSize:12 }}>{data.farm.name} replied</Text><Text style={{ color:theme.muted, marginTop:4, lineHeight:19 }}>{review.farmer_reply}</Text></View> : null}
      </View>) : <EmptyPanel icon={<Star size={31} color={theme.primary} />} title="No buyer feedback yet" copy="The first verified review for this farm will appear here." theme={theme} />}

      {data.recommendations?.length ? <>
        <SectionHeading eyebrow="YOU MAY ALSO NEED" title="More from the same categories" count={`${data.recommendations.length} picks`} theme={theme} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendations}>
          {data.recommendations.map(item => <Pressable key={item.id} onPress={() => router.push({ pathname:'/farms/[id]', params:{ id:item.farm_id } })} style={[styles.recommendation, { backgroundColor:theme.surface, borderColor:theme.border }]}>
            <Image source={{ uri:absoluteUrl(item.image) }} style={styles.recommendationImage} contentFit="cover" />
            <View style={styles.recommendationBody}><Text style={[styles.category, { color:theme.primary }]}>{item.category.toUpperCase()}</Text><Text style={[styles.recommendationName, { color:theme.text }]} numberOfLines={2}>{titleCase(item.name)}</Text><View style={styles.recommendationFarm}><Store size={13} color={theme.primary} /><Text style={{ color:theme.primary, fontSize:12, fontWeight:'700', flex:1 }} numberOfLines={1}>{item.farm_name}</Text><ChevronRight size={15} color={theme.primary} /></View><View style={[styles.listingPrice, { borderTopColor:theme.border }]}><Money value={Number(item.unit_price_kobo)/100} style={{ color:theme.text, fontSize:16 }} /><Text style={{ color:theme.muted, fontSize:11 }}>/ {item.unit}</Text></View></View>
          </Pressable>)}
        </ScrollView>
      </> : null}
    </View>
  </Screen>;
}

function Fact({ icon, title, text, theme }: { icon:React.ReactNode; title:string; text:string; theme:any }) { return <View style={styles.fact}><View style={[styles.factIcon, { backgroundColor:theme.surfaceAlt }]}>{icon}</View><View style={{ flex:1 }}><Text style={[styles.factTitle, { color:theme.primary }]}>{title}</Text><Text style={[styles.factText, { color:theme.text }]}>{text}</Text></View></View>; }
function SectionHeading({ eyebrow, title, count, theme }: { eyebrow:string; title:string; count:string; theme:any }) { return <View style={styles.sectionHead}><View style={{ flex:1 }}><Text style={[styles.eyebrow, { color:theme.primary }]}>{eyebrow}</Text><Text style={[styles.sectionTitle, { color:theme.text }]}>{title}</Text></View><View style={[styles.count, { backgroundColor:theme.surfaceAlt }]}><Text style={{ color:theme.primary, fontWeight:'800' }}>{count}</Text></View></View>; }
function EmptyPanel({ icon, title, copy, theme }: { icon:React.ReactNode; title:string; copy:string; theme:any }) { return <View style={[styles.emptyPanel, { backgroundColor:theme.surface, borderColor:theme.border }]}><View style={[styles.emptyIcon, { backgroundColor:theme.surfaceAlt }]}>{icon}</View><Text style={[styles.emptyTitle, { color:theme.text }]}>{title}</Text><Text style={[styles.emptyCopy, { color:theme.muted }]}>{copy}</Text></View>; }

const styles = StyleSheet.create({
  topbar:{height:72,paddingHorizontal:17,flexDirection:'row',alignItems:'center',gap:12},back:{width:44,height:44,borderWidth:1,borderRadius:13,alignItems:'center',justifyContent:'center'},topTitle:{fontSize:16,fontWeight:'800'},loading:{minHeight:500,alignItems:'center',justifyContent:'center',gap:14},hero:{height:230,marginHorizontal:12,paddingTop:70,borderRadius:20,overflow:'hidden',justifyContent:'flex-end',backgroundColor:'#17633f'},heroBack:{position:'absolute',left:16,top:16,width:46,height:46,borderRadius:14,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',zIndex:2},heroContent:{paddingHorizontal:24,paddingBottom:24},verified:{flexDirection:'row',alignItems:'center',gap:6},verifiedText:{color:'#b9dec4',fontSize:10,fontWeight:'900',letterSpacing:1.1},title:{maxWidth:520,color:'#fff',fontFamily:'serif',fontSize:35,lineHeight:38,fontWeight:'600',marginTop:7},heroRating:{flexDirection:'row',alignItems:'center',gap:7,marginTop:12},stars:{flexDirection:'row',gap:2},ratingValue:{color:'#fff',fontSize:16,fontWeight:'900'},ratingCount:{color:'#d7e4da',fontSize:13},content:{padding:18,paddingTop:14,paddingBottom:52},aboutCard:{padding:18,borderWidth:1,borderRadius:17},mapCard:{marginTop:14,padding:14,borderWidth:1,borderRadius:17},mapHeading:{flexDirection:'row',alignItems:'center',gap:12},mapTitle:{fontFamily:'Georgia_Regular',fontSize:22,marginTop:4},mapAddress:{fontSize:12,lineHeight:18,marginTop:4},mapPreview:{height:230,marginTop:14,borderRadius:12,overflow:'hidden',backgroundColor:'#dfe7dc'},mapWebView:{flex:1,backgroundColor:'#dfe7dc'},directionButton:{height:48,marginTop:12,borderRadius:11,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},attribution:{fontSize:10,textAlign:'center',marginTop:8},eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.05},sectionTitle:{fontFamily:'serif',fontSize:25,lineHeight:30,fontWeight:'600',marginTop:5},copy:{fontSize:14,lineHeight:22,marginTop:10},facts:{marginTop:18,paddingTop:4,borderTopWidth:1},fact:{minHeight:72,paddingVertical:11,flexDirection:'row',alignItems:'center',gap:12},factIcon:{width:42,height:42,borderRadius:11,alignItems:'center',justifyContent:'center'},factTitle:{fontSize:10,fontWeight:'900',letterSpacing:.5,textTransform:'uppercase'},factText:{fontSize:13,lineHeight:19,marginTop:3},sectionHead:{marginTop:30,marginBottom:14,flexDirection:'row',alignItems:'flex-end',gap:12},count:{paddingHorizontal:10,height:30,borderRadius:9,alignItems:'center',justifyContent:'center'},grid:{gap:12},listing:{width:'100%',borderWidth:1,borderRadius:15,overflow:'hidden'},image:{width:'100%',height:210,backgroundColor:'#dfe7dc'},listingBody:{padding:15},category:{fontSize:9,fontWeight:'900',letterSpacing:.6},listingName:{fontFamily:'serif',fontSize:21,lineHeight:25,fontWeight:'600',marginTop:5},stock:{fontSize:12,marginTop:5},listingPrice:{marginTop:12,paddingTop:11,borderTopWidth:1,flexDirection:'row',alignItems:'baseline',gap:4},review:{padding:17,borderWidth:1,borderRadius:15,marginBottom:11},reviewHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},reviewCopy:{fontFamily:'serif',fontSize:17,lineHeight:25,marginTop:14},reviewer:{fontSize:12,marginTop:12},reply:{padding:12,borderRadius:10,marginTop:14},recommendations:{gap:12,paddingRight:18},recommendation:{width:230,borderWidth:1,borderRadius:15,overflow:'hidden'},recommendationImage:{width:'100%',height:145,backgroundColor:'#dfe7dc'},recommendationBody:{padding:13},recommendationName:{minHeight:44,fontFamily:'serif',fontSize:18,lineHeight:21,fontWeight:'600',marginTop:5},recommendationFarm:{marginTop:7,flexDirection:'row',alignItems:'center',gap:5},emptyPanel:{minHeight:220,padding:24,borderWidth:1,borderRadius:16,alignItems:'center',justifyContent:'center'},emptyIcon:{width:58,height:58,borderRadius:16,alignItems:'center',justifyContent:'center'},emptyState:{margin:18,minHeight:330,padding:28,borderWidth:1,borderRadius:18,alignItems:'center',justifyContent:'center'},emptyTitle:{fontFamily:'serif',fontSize:21,fontWeight:'600',textAlign:'center',marginTop:14},emptyCopy:{fontSize:13,lineHeight:20,textAlign:'center',marginTop:6},retry:{height:44,paddingHorizontal:18,borderRadius:11,justifyContent:'center',marginTop:18}
});
