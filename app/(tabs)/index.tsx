import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, LocateFixed, ShoppingBag, Truck } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Header } from '@/components/header';
import { ProductCard } from '@/components/product-card';
import { Screen, Section } from '@/components/screen';
import { Text } from '@/components/typography';
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
  const { theme, products, loading, error, refresh, loadNearby, user } = useApp();
  const wideJourney = width >= 760;
  const heroHeight = width >= 760
    ? Math.min(560, Math.max(440, width * 0.42))
    : Math.min(480, Math.max(400, (width - 24) * 1.2));

  return <Screen refreshing={loading} onRefresh={refresh}>
    <Header />
    <View style={[styles.hero, { height: heroHeight }]}>
      <Image source={require('@/assets/images/hero-produce.webp')} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.shade} />
      <View style={styles.heroContent}>
        <Text style={styles.eyebrow}>FRESH LOCAL PRODUCE</Text>
        <Text style={styles.heroTitle}>Good food should not travel so far.</Text>
        <Text style={styles.heroCopy}>{"Order today's harvest from trusted nearby farms, in practical quantities."}</Text>
        <Pressable onPress={() => router.push('/shop')} style={styles.heroButton}>
          <Text>Explore nearby harvests</Text><ArrowRight size={18} />
        </Pressable>
      </View>
    </View>

    <Section>
      <View style={styles.greeting}>
        <View>
          <Text style={[styles.kicker, { color: theme.primary }]}>{user ? `WELCOME BACK, ${user.firstName.toUpperCase()}` : 'HARVESTS NEAR YOU'}</Text>
          <Text style={[styles.heading, { color: theme.text }]}>Fresh picks for today</Text>
        </View>
        <Pressable onPress={() => loadNearby().catch(() => {})} style={[styles.location, { borderColor: theme.border }]}>
          <LocateFixed size={18} color={theme.primary} />
        </Pressable>
      </View>
      {loading ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : error ?
        <View style={[styles.message, { backgroundColor: theme.surface }]}>
          <Text style={{ color: theme.text, fontWeight: '800' }}>Could not load harvests</Text>
          <Text style={{ color: theme.muted }}>{error}</Text>
        </View> :
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productScroll}>
          {products.slice(0, 8).map(product => <ProductCard key={product.id} product={product} />)}
        </ScrollView>}
    </Section>

    <Section>
      <Text style={[styles.kicker, { color: theme.primary }]}>HOW HARVESTNEARU WORKS</Text>
      <Text style={[styles.heading, { color: theme.text }]}>From farm gate to your plate.</Text>
      <View style={[styles.journey, wideJourney ? styles.journeyWide : styles.journeyMobile]}>
        {wideJourney && <View style={[styles.horizontalLine, { backgroundColor: theme.border }]} />}
        {steps.map(([Icon, title, copy], index) => <View key={title} style={wideJourney ? styles.stepWide : styles.stepMobile}>
          <View style={wideJourney ? styles.wideRail : styles.mobileRail}>
            {!wideJourney && index < steps.length - 1 && <View style={[styles.verticalLine, { backgroundColor: theme.border }]} />}
            <View style={[styles.stepNumber, { backgroundColor: theme.surfaceAlt, borderColor: theme.primary }]}>
              <Text style={[styles.stepNumberText, { color: theme.primary }]}>{index + 1}</Text>
            </View>
          </View>
          <View style={[styles.stepContent, wideJourney && styles.stepContentWide]}>
            <View style={[styles.featureIcon, { backgroundColor: theme.surfaceAlt }]}>
              <Icon size={22} color={theme.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.featureCopy, { color: theme.muted }]}>{copy}</Text>
          </View>
        </View>)}
      </View>
    </Section>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { marginHorizontal: 12, borderRadius: 22, overflow: 'hidden', justifyContent: 'flex-end' },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(6,40,22,.58)' },
  heroContent: { padding: 24, paddingBottom: 30 },
  eyebrow: { color: palette.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  heroTitle: { maxWidth: 320, marginTop: 12, color: '#fff', fontSize: 42, lineHeight: 45, fontFamily: 'serif', fontWeight: '600' },
  heroCopy: { maxWidth: 300, marginTop: 14, color: '#e7eee9', fontSize: 15, lineHeight: 22 },
  heroButton: { height: 50, alignSelf: 'flex-start', marginTop: 22, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.gold, borderRadius: 12 },
  greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  heading: { marginTop: 5, fontSize: 28, fontFamily: 'serif', fontWeight: '600' },
  location: { width: 44, height: 44, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  loader: { marginTop: 50 },
  message: { padding: 20, borderRadius: 14, marginTop: 15, gap: 5 },
  productScroll: { paddingTop: 14 },
  journey: { marginTop: 24 },
  journeyWide: { flexDirection: 'row', paddingTop: 1 },
  journeyMobile: { gap: 0 },
  horizontalLine: { position: 'absolute', top: 18, left: '12.5%', right: '12.5%', height: 2 },
  stepWide: { width: '25%', alignItems: 'center', paddingHorizontal: 10 },
  stepMobile: { flexDirection: 'row', minHeight: 142 },
  wideRail: { height: 42, alignItems: 'center', zIndex: 1 },
  mobileRail: { width: 48, alignItems: 'center' },
  verticalLine: { position: 'absolute', top: 36, bottom: -6, width: 2 },
  stepNumber: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 14, fontWeight: '900' },
  stepContent: { flex: 1, paddingBottom: 22 },
  stepContentWide: { alignItems: 'center', paddingTop: 15, paddingBottom: 0 },
  featureIcon: { width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 16, fontWeight: '800', marginTop: 12 },
  featureCopy: { fontSize: 13, lineHeight: 19, marginTop: 5 },
});
