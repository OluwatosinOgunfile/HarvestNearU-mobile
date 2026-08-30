import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, ChevronLeft, Plus, Save } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/screen";
import { SelectDropdown } from "@/components/select-dropdown";
import { Text, TextInput } from "@/components/typography";
import { useApp } from "@/context/app-context";
import { api } from "@/lib/api";

type Option = { id: string; name: string };
type Listing = {
  id: string;
  title: string;
  unit: string;
  unit_price_kobo: number;
  quantity_available: number;
  quantity_reserved: number;
  status: string;
  harvest_date: string;
  available_from: string | null;
  available_until: string | null;
  category_id: string;
  image_url: string | null;
  stored_image_url: string | null;
  badge?: string | null;
};
type Dashboard = { listings: Listing[]; categories: Option[] };

const dateTimeValue = (value: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

export default function ListingEdit() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; farmId?: string }>();
  const { theme } = useApp();
  const [listing, setListing] = useState<Listing | null>(null);
  const [categories, setCategories] = useState<Option[]>([]);
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    unit: "",
    price: "",
    stock: "",
    harvestDate: "",
    availableFrom: "",
    availableUntil: "",
    badge: "",
    status: "active",
  });
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [showCategory, setShowCategory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Dashboard>(
      `/api/farmer/dashboard${params.farmId ? `?farmId=${params.farmId}` : ""}`,
    )
      .then((data) => {
        const found = data.listings.find((item) => item.id === params.id);
        if (!found) throw new Error("Listing not found");
        setListing(found);
        setCategories(data.categories || []);
        setForm({
          categoryId: found.category_id,
          name: found.title,
          unit: found.unit,
          price: String(Number(found.unit_price_kobo) / 100),
          stock: String(found.quantity_available),
          harvestDate: String(found.harvest_date).slice(0, 10),
          availableFrom: dateTimeValue(found.available_from),
          availableUntil: dateTimeValue(found.available_until),
          badge: found.badge || "",
          status: found.status === "paused" ? "paused" : "active",
        });
      })
      .catch((reason) => setError((reason as Error).message))
      .finally(() => setLoading(false));
  }, [params.farmId, params.id]);
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.82,
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 3 * 1024 * 1024)
      return setError("Choose a produce picture smaller than 3 MB.");
    setImage(asset);
    setError("");
  }

  async function createCategory() {
    if (categoryName.trim().length < 2)
      return setError("Enter a category name of at least two characters.");
    setSaving(true);
    setError("");
    try {
      const result = await api<{ category: Option; existing?: boolean }>(
        "/api/produce/categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: categoryName,
            description: categoryDescription,
          }),
        },
      );
      setCategories((current) =>
        [
          ...current.filter((item) => item.id !== result.category.id),
          result.category,
        ].sort((a, b) => a.name.localeCompare(b.name)),
      );
      set("categoryId")(result.category.id);
      setCategoryName("");
      setCategoryDescription("");
      setShowCategory(false);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    if (!listing) return;
    setSaving(true);
    setError("");
    let uploadedUrl = "";
    try {
      let imageUrl = listing.stored_image_url || "";
      if (image) {
        if (!image.base64)
          throw new Error("The selected picture could not be read.");
        const uploaded = await api<{ url: string }>(
          "/api/uploads/listing-image",
          {
            method: "POST",
            body: JSON.stringify({
              imageBase64: image.base64,
              mimeType: image.mimeType || "image/jpeg",
              fileName: image.fileName || "produce-picture.jpg",
            }),
          },
        );
        uploadedUrl = uploaded.url;
        imageUrl = uploaded.url;
      }
      await api("/api/farmer/dashboard", {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          imageUrl,
          type: "listing",
          id: listing.id,
        }),
      });
      router.back();
    } catch (reason) {
      if (uploadedUrl)
        void api("/api/uploads/listing-image", {
          method: "DELETE",
          body: JSON.stringify({ url: uploadedUrl }),
        }).catch(() => {});
      setError((reason as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
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
            EDIT HARVEST
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Listing details
          </Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 70 }} />
      ) : listing ? (
        <View style={styles.content}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <SelectDropdown
            label="Produce category"
            value={form.categoryId}
            options={categories.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            onChange={set("categoryId")}
          />
          <Pressable
            onPress={() => setShowCategory((value) => !value)}
            style={styles.categoryToggle}
          >
            <Plus size={16} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: "800" }}>
              Category not listed?
            </Text>
          </Pressable>
          {showCategory ? (
            <View
              style={[
                styles.categoryCard,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <Field
                theme={theme}
                label="Category name"
                value={categoryName}
                onChangeText={setCategoryName}
              />
              <Field
                theme={theme}
                label="Description (optional)"
                value={categoryDescription}
                onChangeText={setCategoryDescription}
              />
              <Pressable
                disabled={saving}
                onPress={() => void createCategory()}
                style={[styles.smallButton, { backgroundColor: theme.primary }]}
              >
                <Text style={{ color: theme.primaryText, fontWeight: "800" }}>
                  Add category
                </Text>
              </Pressable>
            </View>
          ) : null}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Field
              theme={theme}
              label="Produce name"
              value={form.name}
              onChangeText={set("name")}
            />
            <View style={styles.row}>
              <Field
                theme={theme}
                label="Unit"
                value={form.unit}
                onChangeText={set("unit")}
              />
              <Field
                theme={theme}
                label="Price (NGN)"
                keyboardType="numeric"
                value={form.price}
                onChangeText={set("price")}
              />
            </View>
            <View style={styles.row}>
              <Field
                theme={theme}
                label="Total stock"
                keyboardType="number-pad"
                value={form.stock}
                onChangeText={set("stock")}
              />
              <Field
                theme={theme}
                label="Harvest date"
                value={form.harvestDate}
                onChangeText={set("harvestDate")}
              />
            </View>
            <Field
              theme={theme}
              label="Available from (optional)"
              value={form.availableFrom}
              placeholder="YYYY-MM-DDTHH:mm"
              onChangeText={set("availableFrom")}
            />
            <Field
              theme={theme}
              label="Available until (optional)"
              value={form.availableUntil}
              placeholder="YYYY-MM-DDTHH:mm"
              onChangeText={set("availableUntil")}
            />
            <Field
              theme={theme}
              label="Badge (optional)"
              value={form.badge}
              onChangeText={set("badge")}
            />
            <SelectDropdown
              label="Listing status"
              value={form.status}
              options={[
                { label: "Active", value: "active" },
                { label: "Paused", value: "paused" },
              ]}
              onChange={set("status")}
            />
            <Pressable
              onPress={() => void chooseImage()}
              style={[
                styles.photo,
                {
                  borderColor: theme.primary,
                  backgroundColor: theme.surfaceAlt,
                },
              ]}
            >
              <Image
                source={
                  image ? { uri: image.uri } : { uri: listing.image_url || "" }
                }
                style={styles.preview}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: "800" }}>
                  Change produce picture
                </Text>
                <Text style={{ color: theme.muted, fontSize: 12 }}>
                  Leave unchanged to keep the current picture.
                </Text>
              </View>
              <Camera size={20} color={theme.primary} />
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={() => void save()}
              style={[
                styles.save,
                { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 },
              ]}
            >
              {saving ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <>
                  <Save size={18} color={theme.primaryText} />
                  <Text style={{ color: theme.primaryText, fontWeight: "900" }}>
                    Save listing details
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <Text style={styles.error}>{error || "Listing not found"}</Text>
      )}
    </Screen>
  );
}

function Field({
  theme,
  label,
  ...props
}: {
  theme: any;
  label: string;
  [key: string]: any;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={theme.muted}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
        ]}
      />
    </View>
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
  title: { fontFamily: "serif", fontSize: 28 },
  content: { padding: 18, paddingTop: 4, paddingBottom: 45 },
  error: {
    color: "#a84335",
    backgroundColor: "#fff0ed",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  categoryToggle: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  categoryCard: {
    padding: 13,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  card: { padding: 15, borderWidth: 1, borderRadius: 15 },
  row: { flexDirection: "row", gap: 9 },
  label: { fontSize: 11, fontWeight: "800", marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 13,
  },
  smallButton: {
    height: 42,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    minHeight: 76,
    padding: 9,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  preview: { width: 58, height: 58, borderRadius: 9 },
  save: {
    height: 50,
    marginTop: 14,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
