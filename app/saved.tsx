import { useRouter } from "expo-router";
import { ChevronLeft, Heart, ShoppingBag } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { ProductCard } from "@/components/product-card";
import { Screen } from "@/components/screen";
import { Text } from "@/components/typography";
import { useApp } from "@/context/app-context";

export default function SavedProduce() {
  const router = useRouter();
  const { theme, products, liked, loading, refresh } = useApp();
  const saved = products.filter((product) => liked.includes(product.id));
  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={[styles.back, { borderColor: theme.border }]}
        >
          <ChevronLeft size={21} color={theme.text} />
        </Pressable>
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
            <Pressable
              onPress={() => router.replace("/shop")}
              style={[styles.shop, { backgroundColor: theme.primary }]}
            >
              <ShoppingBag size={17} color={theme.primaryText} />
              <Text style={{ color: theme.primaryText, fontWeight: "900" }}>
                Browse produce
              </Text>
            </Pressable>
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
