import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Save, Store } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { Screen } from "@/components/screen";
import { Text, TextInput } from "@/components/typography";
import { useApp } from "@/context/app-context";
import { api } from "@/lib/api";

type Farm = {
  id: string;
  name: string;
  description: string | null;
  phone: string;
  email: string | null;
  address_text: string;
  city: string;
  state: string;
  delivery_radius_km: number;
  offers_pickup: boolean;
  offers_delivery: boolean;
  verification_status: string;
};
type Profile = {
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  farms: Farm[];
};

export default function FarmProfile() {
  const router = useRouter();
  const params = useLocalSearchParams<{ farmId?: string }>();
  const { theme } = useApp();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    deliveryRadius: "",
    offersPickup: true,
    offersDelivery: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api<Profile>("/api/profile")
      .then((data) => {
        const selected =
          data.farms.find((item) => item.id === params.farmId) || data.farms[0];
        if (!selected) throw new Error("Farm not found");
        setProfile(data);
        setFarm(selected);
        setForm({
          name: selected.name,
          description: selected.description || "",
          phone: selected.phone || "",
          email: selected.email || "",
          address: selected.address_text || "",
          city: selected.city || "",
          state: selected.state || "",
          deliveryRadius: String(selected.delivery_radius_km || 0),
          offersPickup: Boolean(selected.offers_pickup),
          offersDelivery: Boolean(selected.offers_delivery),
        });
      })
      .catch((reason) => setMessage((reason as Error).message))
      .finally(() => setLoading(false));
  }, [params.farmId]);
  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function save() {
    if (!profile || !farm) return;
    setSaving(true);
    setMessage("");
    try {
      await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: profile.user.first_name,
          lastName: profile.user.last_name,
          email: profile.user.email,
          phone: profile.user.phone || "",
          farmId: farm.id,
          farmName: form.name,
          description: form.description,
          farmPhone: form.phone,
          farmEmail: form.email,
          address: form.address,
          city: form.city,
          state: form.state,
          deliveryRadius: form.deliveryRadius,
          offersPickup: form.offersPickup,
          offersDelivery: form.offersDelivery,
        }),
      });
      setMessage("Farm profile updated.");
    } catch (reason) {
      setMessage((reason as Error).message);
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
            FARM PROFILE
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Public farm details
          </Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 70 }} />
      ) : farm ? (
        <View style={styles.content}>
          <View
            style={[
              styles.notice,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
          >
            <Store size={21} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: "900" }}>
                {farm.name}
              </Text>
              <Text style={{ color: theme.muted }}>
                Verification:{" "}
                {farm.verification_status.replace(/^./, (value) =>
                  value.toUpperCase(),
                )}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Field
              theme={theme}
              label="Farm name"
              value={form.name}
              onChangeText={set("name")}
            />
            <Field
              theme={theme}
              label="Description"
              value={form.description}
              multiline
              style={styles.multiline}
              onChangeText={set("description")}
            />
            <View style={styles.row}>
              <Field
                theme={theme}
                label="Phone"
                value={form.phone}
                keyboardType="phone-pad"
                onChangeText={set("phone")}
              />
              <Field
                theme={theme}
                label="Public email"
                value={form.email}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={set("email")}
              />
            </View>
            <Field
              theme={theme}
              label="Address"
              value={form.address}
              onChangeText={set("address")}
            />
            <View style={styles.row}>
              <Field
                theme={theme}
                label="City"
                value={form.city}
                onChangeText={set("city")}
              />
              <Field
                theme={theme}
                label="State"
                value={form.state}
                onChangeText={set("state")}
              />
            </View>
            <Field
              theme={theme}
              label="Delivery radius (km)"
              value={form.deliveryRadius}
              keyboardType="numeric"
              onChangeText={set("deliveryRadius")}
            />
            <Toggle
              theme={theme}
              label="Farm pickup"
              copy="Customers can collect directly from this farm."
              value={form.offersPickup}
              onValueChange={set("offersPickup")}
            />
            <Toggle
              theme={theme}
              label="Farm delivery"
              copy="Offer delivery within the radius above."
              value={form.offersDelivery}
              onValueChange={set("offersDelivery")}
            />
            {message ? (
              <Text
                style={[
                  styles.message,
                  {
                    color: message.includes("updated")
                      ? theme.primary
                      : "#a84335",
                  },
                ]}
              >
                {message}
              </Text>
            ) : null}
            <Pressable
              disabled={saving}
              onPress={() => void save()}
              style={[styles.save, { backgroundColor: theme.primary }]}
            >
              {saving ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <>
                  <Save size={18} color={theme.primaryText} />
                  <Text style={{ color: theme.primaryText, fontWeight: "900" }}>
                    Save farm profile
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <Text style={styles.message}>{message}</Text>
      )}
    </Screen>
  );
}
function Field({
  theme,
  label,
  style,
  ...props
}: {
  theme: any;
  label: string;
  style?: object;
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
          style,
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
function Toggle({
  theme,
  label,
  copy,
  value,
  onValueChange,
}: {
  theme: any;
  label: string;
  copy: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={[styles.toggle, { borderTopColor: theme.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontWeight: "800" }}>{label}</Text>
        <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
          {copy}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.primary }}
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
  title: { fontFamily: "serif", fontSize: 27 },
  content: { padding: 18, paddingTop: 4, paddingBottom: 45 },
  notice: {
    padding: 13,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  multiline: { minHeight: 90, paddingTop: 12, textAlignVertical: "top" },
  toggle: {
    minHeight: 65,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  message: { marginVertical: 10, fontWeight: "700" },
  save: {
    height: 50,
    marginTop: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
