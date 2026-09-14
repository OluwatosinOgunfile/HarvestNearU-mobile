import { useFocusEffect, useRouter } from "expo-router";
import { BellRing, ChevronLeft, Heart, ShoppingBag } from "lucide-react-native";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Tap } from "@/components/tap";
import { ProductCard } from "@/components/product-card";
import { Screen } from "@/components/screen";
import { Text } from "@/components/typography";
import { useApp } from "@/context/app-context";
import { ListingImage } from "@/components/listing-image";
import { Money } from "@/components/money";
import { api } from "@/lib/api";

type RestockAlert = { listingId:string; title:string; unit:string; price:number; stock:number; farmId:string; farmName:string; image:string; notified:boolean };

export default function SavedProduce() {
  const router = useRouter();
  const { theme, products, liked, loading, refresh } = useApp();
  const saved = products.filter((product) => liked.includes(product.id));
  const [watching, setWatching] = useState<RestockAlert[]>([]);
  // Watching a sold-out harvest is a promise the customer made to themselves; it belongs beside
  // their favourites rather than only on the farm page where it was set.
  const loadWatching = useCallback(async () => {
    try { setWatching(((await api<{ alerts:RestockAlert[] }>("/api/restock-alerts")).alerts || []).filter((alert) => !alert.notified)); }
    catch { setWatching([]); }
  }, []);
  useFocusEffect(useCallback(() => { void loadWatching(); }, [loadWatching]));
  async function stopWatching(listingId: string) {
    setWatching((current) => current.filter((alert) => alert.listingId !== listingId));
    try { await api("/api/restock-alerts", { method:"PUT", body:JSON.stringify({ listingId, watching:false }) }); }
    catch { void loadWatching(); }
  }
  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <View style={styles.header}>
        <Tap
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={[styles.back, { borderColor: theme.border }]}
        >
          <ChevronLeft size={21} color={theme.text} />
        </Tap>
        <View>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            SAVED HARVESTS
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Your favourites
          </Text>
        </View>
      </View>
      <View style={styles.content}>
        {watching.length ? (
          <View style={styles.watchBlock}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Waiting to come back</Text>
            <Text style={[styles.sectionCopy, { color: theme.muted }]}>We will notify you the moment these are restocked.</Text>
            {watching.map((alert) => (
              <View key={alert.listingId} style={[styles.watchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <ListingImage uri={alert.image} category="All" size={58} style={styles.watchImage} recyclingKey={alert.listingId} />
                <Tap onPress={() => router.push({ pathname: "/farms/[id]", params: { id: alert.farmId } })} style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[styles.watchName, { color: theme.text }]}>{alert.title}</Text>
                  <Text numberOfLines={1} style={[styles.watchFarm, { color: theme.muted }]}>{alert.farmName}</Text>
                  <Money value={alert.price} style={[styles.watchPrice, { color: theme.text }]} />
                </Tap>
                <Tap accessibilityLabel={`Stop watching ${alert.title}`} onPress={() => void stopWatching(alert.listingId)} style={[styles.watchStop, { borderColor: theme.border }]}>
                  <BellRing size={17} color={theme.primary} />
                </Tap>
              </View>
            ))}
          </View>
        ) : null}
        {saved.length ? (
          <View style={styles.list}>
            {saved.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                fullWidth
                compact
              />
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.empty,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: theme.surfaceAlt }]}>
              <Heart size={30} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No saved produce yet
            </Text>
            <Text style={[styles.copy, { color: theme.muted }]}>
              Tap the heart on a harvest to keep it here for later.
            </Text>
            <Tap
              onPress={() => router.replace("/shop")}
              style={[styles.shop, { backgroundColor: theme.primary }]}
            >
              <ShoppingBag size={17} color={theme.primaryText} />
              <Text style={{ color: theme.primaryText, fontWeight: "900" }}>
                Browse produce
              </Text>
            </Tap>
          </View>
        )}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: {
    minHeight: 90,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  title: { fontFamily: "serif", fontSize: 29 },
  content: { padding: 18, paddingTop: 4, paddingBottom: 45 },
  watchBlock: { marginBottom: 22, gap: 9 },
  sectionTitle: { fontFamily: "serif", fontSize: 21, fontWeight: "600" },
  sectionCopy: { fontSize: 12, lineHeight: 18, marginTop: -4, marginBottom: 3 },
  watchRow: { padding: 11, borderWidth: 1, borderRadius: 13, flexDirection: "row", alignItems: "center", gap: 11 },
  watchImage: { width: 58, height: 58, borderRadius: 10 },
  watchName: { fontSize: 14, fontWeight: "800" },
  watchFarm: { fontSize: 11, marginTop: 2 },
  watchPrice: { fontSize: 13, fontWeight: "900", marginTop: 4 },
  watchStop: { width: 44, height: 44, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  list: { gap: 11 },
  empty: {
    minHeight: 320,
    borderWidth: 1,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontFamily: "serif", fontSize: 24, marginTop: 16 },
  copy: { textAlign: "center", lineHeight: 20, marginTop: 7 },
  shop: {
    minHeight: 46,
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
