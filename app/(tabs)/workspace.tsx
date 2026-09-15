import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  ShieldCheck,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  LogOut,
  MessageCircle,
  PackageCheck,
  Pencil,
  Plus,
  Star,
  Store,
  Truck,
  X,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { Tap } from "@/components/tap";
import { Header, HeaderAction } from "@/components/header";
import { Screen } from "@/components/screen";
import { SelectDropdown } from "@/components/select-dropdown";
import { Text } from "@/components/typography";
import { useApp } from "@/context/app-context";
import { API_URL, api } from "@/lib/api";
import { titleCase } from "@/lib/format";
import { pageContent, pageHeading } from "@/lib/headings";
type Farm = {
  id: string;
  name: string;
  verification_status: string;
  average_rating: number;
  review_count: number;
  delivery_radius_km: number;
  offers_delivery: boolean;
};
type Item = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: string;
};
type Order = {
  id: string;
  order_id: string;
  unread_messages?: number;
  order_number: string;
  status: string;
  customer: string;
  customer_phone: string | null;
  fulfilment_method: string;
  itemTracking: Item[];
  items?: string;
  farmer_net_kobo?: number;
  subtotal_kobo?: number;
  placed_at?: string;
};
type Review = {
  id: string;
  rating: number;
  comment: string | null;
  farmer_reply: string | null;
  created_at: string;
  customer_name: string;
  order_number: string;
};
type Listing = {
  id: string;
  title: string;
  quantity_available: number;
  quantity_reserved: number;
  unit: string;
  status: string;
};
type PayoutRequest = {
  id: string;
  net_amount_kobo: number;
  status: string;
  requested_at: string;
};
type Dashboard = {
  farms: Farm[];
  farm: Farm;
  deliveryRadiusMaxKm?: number;
  metrics: Record<string, number>;
  payoutRequests: PayoutRequest[];
  listings: Listing[];
  orders: Order[];
  reviews: Review[];
};
const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
export default function Workspace() {
  const router = useRouter();
  const { theme, user, signOut } = useApp();
  const [data, setData] = useState<Dashboard | null>(null);
  const [farmId, setFarmId] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [editStock, setEditStock] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "paused">("active");
  const [closedOrdersOpen, setClosedOrdersOpen] = useState(true);
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [reviewsOpen, setReviewsOpen] = useState(true);
  const [radius, setRadius] = useState("");
  const [offersDelivery, setOffersDelivery] = useState(false);
  const [deliverySaved, setDeliverySaved] = useState("");
  const staff = user?.role === "admin" || user?.role === "support";
  const openConsole = useCallback(async () => {
    setBusy("console");
    setError("");
    try {
      const result = await api<{ handoffUrl: string }>(
        "/api/auth/mobile-handoff",
        { method: "POST", body: JSON.stringify({ password }) },
      );
      setPassword("");
      await WebBrowser.openBrowserAsync(`${API_URL}${result.handoffUrl}`, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy("");
    }
  }, [password]);
  const load = useCallback(
    async (id = farmId) => {
      if (!user || user.role !== "farmer") return;
      setLoading(true);
      setError("");
      try {
        const result = await api<Dashboard>(
          `/api/farmer/dashboard${id ? `?farmId=${id}` : ""}`,
        );
        setData(result);
        setFarmId(String(result.farm.id));
        setRadius(String(Number(result.farm.delivery_radius_km ?? 0)));
        setOffersDelivery(Boolean(result.farm.offers_delivery));
      } catch (reason) {
        setError((reason as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [user, farmId],
  );
  useFocusEffect(
    useCallback(() => {
      if (!staff) void load();
    }, [load, staff]),
  );
  async function select(id: string) {
    setFarmId(id);
    await load(id);
  }
  async function advance(item: Item, fulfilment: string) {
    const next = ["confirmed", "paid"].includes(item.status)
      ? "preparing"
      : item.status === "preparing"
        ? "ready"
        : item.status === "ready" &&
            ["doorstep", "farmer_delivery"].includes(fulfilment)
          ? "dispatched"
          : item.status === "ready" &&
              ["farm_pickup", "collection_hub"].includes(fulfilment)
            ? "collected"
          : "";
    if (!next) return;
    setBusy(item.id);
    setError("");
    try {
      await api("/api/farmer/dashboard", {
        method: "PATCH",
        body: JSON.stringify({ type: "item", id: item.id, status: next }),
      });
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy("");
    }
  }
  function openInventory(listing: Listing) {
    setEditListing(listing);
    setEditStock(
      String(
        Math.max(0, listing.quantity_available - listing.quantity_reserved),
      ),
    );
    setEditStatus(listing.status === "paused" ? "paused" : "active");
    setError("");
  }
  async function saveDelivery() {
    // The column is numeric(6,2), so above this Postgres raises an overflow the farmer cannot read.
    const cap = data?.deliveryRadiusMaxKm ?? 9999.99;
    const wanted = Number(String(radius).trim());
    if (!Number.isFinite(wanted) || wanted < 0) {
      setError("Enter the delivery radius in kilometres, for example 20.");
      return;
    }
    if (wanted > cap) {
      setError(`The delivery radius cannot be more than ${cap} km.`);
      return;
    }
    if (offersDelivery && wanted <= 0) {
      setError("Set a delivery radius above 0 km to offer doorstep delivery, or turn doorstep delivery off.");
      return;
    }
    setBusy("delivery");
    setError("");
    setDeliverySaved("");
    try {
      // The dashboard's own delivery branch, not the profile route: that one rebuilds every farm
      // column from the body, so sending just these two would blank the name, address and phone.
      await api("/api/farmer/dashboard", {
        method: "PATCH",
        body: JSON.stringify({
          type: "delivery",
          farmId,
          deliveryRadius: radius,
          offersDelivery,
        }),
      });
      setDeliverySaved("Delivery settings saved.");
      await load(farmId);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function saveInventory() {
    if (!editListing) return;
    const availableStock = Number(editStock);
    if (!Number.isInteger(availableStock) || availableStock < 0) {
      setError("Enter a whole available quantity of zero or more.");
      return;
    }
    setBusy(`inventory-${editListing.id}`);
    setError("");
    try {
      await api("/api/farmer/dashboard", {
        method: "PATCH",
        body: JSON.stringify({
          type: "inventory",
          id: editListing.id,
          availableStock,
          status: editStatus,
        }),
      });
      setEditListing(null);
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy("");
    }
  }
  if (staff)
    return (
      <Screen>
        <Header />
        <View style={styles.content}>
          <View
            style={[styles.consoleIcon, { backgroundColor: theme.surfaceAlt }]}
          >
            <LockKeyhole size={27} color={theme.primary} />
          </View>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            TEAM CONSOLE
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Secure console access
          </Text>
          <Text style={[styles.consoleCopy, { color: theme.muted }]}>
            Confirm your password each time you open the administration console.
            Browser access expires after 15 minutes.
          </Text>
          <View
            style={[
              styles.unlockCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Account password
            </Text>
            <View
              style={[
                styles.passwordField,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your password"
                placeholderTextColor={theme.muted}
                style={[styles.passwordInput, { color: theme.text }]}
              />
              <Tap
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
                onPress={() => setShowPassword((value) => !value)}
                hitSlop={10}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.primary} />
                ) : (
                  <Eye size={20} color={theme.primary} />
                )}
              </Tap>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Tap
              disabled={!password || busy === "console"}
              onPress={() => void openConsole()}
              style={[
                styles.primary,
                {
                  backgroundColor: theme.primary,
                  opacity: !password || busy === "console" ? 0.6 : 1,
                },
              ]}
            >
              {busy === "console" ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <>
                  <LockKeyhole size={18} color={theme.primaryText} />
                  <Text style={{ color: theme.primaryText, fontWeight: "800" }}>
                    Unlock web console
                  </Text>
                </>
              )}
            </Tap>
          </View>
          <Tap
            onPress={() => void signOut()}
            style={[
              styles.staffSignOut,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <LogOut size={19} color="#b64c3e" />
            <Text style={{ color: "#b64c3e", fontWeight: "800" }}>
              Sign out of HarvestNearU
            </Text>
          </Tap>
        </View>
      </Screen>
    );
  return (
    <Screen refreshing={loading} onRefresh={() => load()}>
      {/* Adding a listing is the one thing done from any part of the workspace, so it stays in the top
          bar. Verification, payouts and the farm profile are occasional, and read better as labelled
          buttons further down than as icons nobody can name. */}
      <Header
        showBasket={false}
        actions={
          <HeaderAction label="Add a listing" filled onPress={() => router.push("/listing")}>
            <Plus size={21} color={theme.primaryText} />
          </HeaderAction>
        }
      />
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>
          FARMER WORKSPACE
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>
          Manage your harvest
        </Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Track sales, fulfil orders, and keep your listings current.
        </Text>
        {data?.farms?.length ? (
          <SelectDropdown
            label="Active farm"
            value={farmId}
            options={data.farms.map((farm) => ({
              label: farm.name,
              value: farm.id,
            }))}
            disabled={loading}
            onChange={(id) => void select(id)}
          />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && !data ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 60 }} />
        ) : data ? (
          <>
            <View style={styles.metrics}>
              <Metric
                theme={theme}
                icon={<CircleDollarSign size={21} color={theme.primary} />}
                label="Today's net sales"
                value={`₦${(Number(data.metrics.today_sales_kobo || 0) / 100).toLocaleString("en-NG")}`}
              />
              <Metric
                theme={theme}
                icon={<PackageCheck size={21} color={theme.primary} />}
                label="Open orders"
                value={String(data.metrics.open_orders || 0)}
              />
              <Metric
                theme={theme}
                icon={<Leaf size={21} color={theme.primary} />}
                label="Active listings"
                value={String(data.metrics.active_listings || 0)}
              />
              <Metric
                theme={theme}
                icon={<Star size={21} color="#d99b13" />}
                label="Farm rating"
                value={`${Number(data.farm.average_rating || 0).toFixed(1)} (${data.farm.review_count || 0})`}
              />
            </View>
            <View style={styles.farmActions}>
              <Tap
                onPress={() => router.push(`/farm-verification?farmId=${farmId}` as never)}
                style={[styles.farmAction, { borderColor: theme.primary }]}
              >
                <ShieldCheck size={19} color={theme.primary} />
                <Text style={[styles.farmActionLabel, { color: theme.primary }]}>
                  Verification
                </Text>
              </Tap>
              <Tap
                onPress={() => router.push("/payouts" as never)}
                style={[styles.farmAction, { borderColor: theme.primary }]}
              >
                <CircleDollarSign size={19} color={theme.primary} />
                <Text style={[styles.farmActionLabel, { color: theme.primary }]}>
                  Payouts
                </Text>
              </Tap>
            </View>
            <Tap
              onPress={() =>
                router.push({
                  pathname: "/farm-profile",
                  params: { farmId },
                } as never)
              }
              style={[styles.manage, { borderColor: theme.primary }]}
            >
              <Store size={19} color={theme.primary} />
              <Text style={{ color: theme.primary, fontWeight: "800" }}>
                Manage farm profile and locations
              </Text>
            </Tap>
            <View
              style={[
                styles.delivery,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.deliveryHead}>
                <Truck size={19} color={theme.primary} />
                <Text style={[styles.deliveryTitle, { color: theme.text }]}>
                  Doorstep delivery
                </Text>
                <Switch
                  value={offersDelivery}
                  onValueChange={(next) => {
                    setOffersDelivery(next);
                    setDeliverySaved("");
                  }}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
              <Text style={[styles.deliveryCopy, { color: theme.muted }]}>
                Customers pay ₦250 per kilometre to reach you, so your radius also
                sets the most a delivery from this farm can cost them. Anyone
                further away is offered farm pickup instead.
              </Text>
              <Text style={[styles.deliveryLabel, { color: theme.muted }]}>
                DELIVERY RADIUS (KM)
              </Text>
              <View style={styles.deliveryRow}>
                <TextInput
                  value={radius}
                  keyboardType="numeric"
                  onChangeText={(next) => {
                    setRadius(next);
                    setDeliverySaved("");
                  }}
                  style={[
                    styles.deliveryInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                />
                <Tap
                  disabled={busy === "delivery"}
                  onPress={() => void saveDelivery()}
                  style={[
                    styles.deliverySave,
                    { backgroundColor: theme.primary, opacity: busy === "delivery" ? 0.6 : 1 },
                  ]}
                >
                  {busy === "delivery" ? (
                    <ActivityIndicator color={theme.primaryText} />
                  ) : (
                    <Text style={{ color: theme.primaryText, fontWeight: "800" }}>
                      Save
                    </Text>
                  )}
                </Tap>
              </View>
              <Text style={[styles.deliveryCopy, { color: theme.muted }]}>
                {offersDelivery && Number(radius) > 0
                  ? `Delivering up to ${Number(radius)} km · longest delivery ₦${(Math.max(1, Number(radius) || 1) * 250).toLocaleString("en-NG")}`
                  : "Pickup only. Turn doorstep delivery on and set a radius above 0 km to deliver."}
              </Text>
              {deliverySaved ? (
                <Text style={[styles.deliverySaved, { color: theme.primary }]}>
                  {deliverySaved}
                </Text>
              ) : null}
            </View>
            <Section
              theme={theme}
              title="Orders to fulfil"
              subtitle="Advance each product as work progresses"
            >
              {data.orders.filter(
                (order) =>
                  !["delivered", "collected", "cancelled", "refunded"].includes(
                    order.status,
                  ),
              ).length ? (
                data.orders
                  .filter(
                    (order) =>
                      ![
                        "delivered",
                        "collected",
                        "cancelled",
                        "refunded",
                      ].includes(order.status),
                  )
                  .map((order) => (
                    <View
                      key={order.id}
                      style={[styles.order, { borderTopColor: theme.border }]}
                    >
                      <Text style={[styles.orderNo, { color: theme.text }]}>
                        Order #{order.order_number}
                      </Text>
                      <Text style={[styles.copy, { color: theme.muted }]}>
                        {order.customer}
                        {order.customer_phone
                          ? ` · ${order.customer_phone}`
                          : ""}{" "}
                        · {label(order.fulfilment_method)}
                      </Text>
                      {order.itemTracking.map((item) => {
                        const next = ["confirmed", "paid"].includes(item.status)
                          ? "Start preparing"
                          : item.status === "preparing"
                            ? "Mark ready"
                            : item.status === "ready" &&
                                ["doorstep", "farmer_delivery"].includes(
                                  order.fulfilment_method,
                                )
                              ? "Dispatch"
                              : item.status === "ready" &&
                                  ["farm_pickup", "collection_hub"].includes(
                                    order.fulfilment_method,
                                  )
                                ? "Mark collected"
                              : "";
                        return (
                          <View key={item.id} style={styles.item}>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{ color: theme.text, fontWeight: "800" }}
                              >
                                {titleCase(item.name)}
                              </Text>
                              <Text style={{ color: theme.muted }}>
                                {item.quantity} {item.unit} ·{" "}
                                {label(item.status)}
                              </Text>
                            </View>
                            {next ? (
                              <Tap
                                disabled={busy === item.id}
                                onPress={() =>
                                  void advance(item, order.fulfilment_method)
                                }
                                style={[
                                  styles.advance,
                                  { backgroundColor: theme.primary },
                                ]}
                              >
                                {busy === item.id ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={theme.primaryText}
                                  />
                                ) : (
                                  <Text
                                    style={{
                                      color: theme.primaryText,
                                      fontWeight: "800",
                                    }}
                                  >
                                    {next}
                                  </Text>
                                )}
                              </Tap>
                            ) : null}
                          </View>
                        );
                      })}
                      {order.fulfilment_method === "farmer_delivery" ? <Tap onPress={() => router.push({ pathname: "/order-chat", params: { orderId: order.order_id, farmId } } as never)} style={[styles.orderChat, { borderColor: theme.primary }]}><MessageCircle size={16} color={theme.primary}/><Text style={{ color: theme.primary, fontWeight: "900" }}>Chat with customer</Text>{Number(order.unread_messages) > 0 ? <Text style={styles.chatUnread}>{Number(order.unread_messages) > 9 ? "9+" : order.unread_messages}</Text> : null}</Tap> : null}
                    </View>
                  ))
              ) : (
                <Empty
                  theme={theme}
                  text="No paid orders are waiting for fulfilment."
                />
              )}
            </Section>
            <Section
              theme={theme}
              title="Closed orders"
              subtitle="Completed, cancelled, and refunded farm orders"
              open={closedOrdersOpen}
              onToggle={() => setClosedOrdersOpen((value) => !value)}
            >
              {data.orders.filter((order) =>
                ["delivered", "collected", "cancelled", "refunded"].includes(
                  order.status,
                ),
              ).length ? (
                data.orders
                  .filter((order) =>
                    [
                      "delivered",
                      "collected",
                      "cancelled",
                      "refunded",
                    ].includes(order.status),
                  )
                  .slice(0, 10)
                  .map((order) => (
                    <View
                      key={order.id}
                      style={[
                        styles.closedOrder,
                        { borderTopColor: theme.border },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: "800" }}>
                          Order #{order.order_number}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={{
                            color: theme.muted,
                            fontSize: 12,
                            marginTop: 3,
                          }}
                        >
                          {order.customer} ·{" "}
                          {order.items ||
                            `${order.itemTracking.length} products`}
                        </Text>
                        <Text
                          style={{
                            color: theme.muted,
                            fontSize: 11,
                            marginTop: 3,
                          }}
                        >
                          {order.placed_at
                            ? new Date(order.placed_at).toLocaleDateString(
                                "en-NG",
                              )
                            : ""}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          style={{ color: theme.primary, fontWeight: "800" }}
                        >
                          {label(order.status)}
                        </Text>
                        <Text
                          style={{
                            color: theme.text,
                            fontWeight: "900",
                            marginTop: 4,
                          }}
                        >
                          ₦
                          {(
                            Number(
                              ["delivered", "collected"].includes(order.status)
                                ? order.farmer_net_kobo
                                : order.subtotal_kobo || 0,
                            ) / 100
                          ).toLocaleString("en-NG")}
                        </Text>
                      </View>
                    </View>
                  ))
              ) : (
                <Empty theme={theme} text="No closed farm orders yet." />
              )}
            </Section>
            <Section
              theme={theme}
              title="Inventory"
              subtitle={`${data.listings.length} listings for ${data.farm.name}`}
              open={inventoryOpen}
              onToggle={() => setInventoryOpen((value) => !value)}
            >
              {data.listings.length ? (
                data.listings.map((listing) => (
                  <View
                    key={listing.id}
                    style={[styles.inventory, { borderTopColor: theme.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: "800" }}>
                        {titleCase(listing.title)}
                      </Text>
                      <Text style={{ color: theme.muted }}>
                        {Math.max(
                          0,
                          listing.quantity_available -
                            listing.quantity_reserved,
                        )}{" "}
                        {listing.unit} available
                      </Text>
                    </View>
                    <View style={styles.inventoryAction}>
                      <Text style={{ color: theme.primary, fontWeight: "800" }}>
                        {label(listing.status)}
                      </Text>
                      <Tap
                        accessibilityLabel={`Update ${listing.title} inventory`}
                        hitSlop={8}
                        onPress={() => openInventory(listing)}
                        style={[
                          styles.editInventory,
                          {
                            backgroundColor: theme.surfaceAlt,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Pencil size={16} color={theme.primary} />
                      </Tap>
                    </View>
                  </View>
                ))
              ) : (
                <Empty theme={theme} text="No produce listings yet." />
              )}
              <Tap
                onPress={() => router.push("/listing")}
                style={[styles.primary, { backgroundColor: theme.primary }]}
              >
                <Plus size={18} color={theme.primaryText} />
                <Text style={{ color: theme.primaryText, fontWeight: "800" }}>
                  Add produce listing
                </Text>
              </Tap>
            </Section>
            <Section
              theme={theme}
              title="Customer reviews"
              subtitle={`Feedback for ${data.farm.name}`}
              open={reviewsOpen}
              onToggle={() => setReviewsOpen((value) => !value)}
            >
              {data.reviews?.length ? (
                data.reviews.map((review) => (
                  <View
                    key={review.id}
                    style={[styles.review, { borderTopColor: theme.border }]}
                  >
                    <View style={styles.reviewHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: "800" }}>
                          {review.customer_name}
                        </Text>
                        <Text style={{ color: theme.muted, fontSize: 11 }}>
                          Order #{review.order_number} ·{" "}
                          {new Date(review.created_at).toLocaleDateString(
                            "en-NG",
                          )}
                        </Text>
                      </View>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Star
                            key={value}
                            size={14}
                            color="#d99b13"
                            fill={
                              value <= Number(review.rating)
                                ? "#d99b13"
                                : "transparent"
                            }
                          />
                        ))}
                      </View>
                    </View>
                    <Text
                      style={{
                        color: theme.text,
                        lineHeight: 19,
                        marginTop: 8,
                      }}
                    >
                      {review.comment ||
                        "The customer submitted a rating without a written comment."}
                    </Text>
                    {review.farmer_reply ? (
                      <View
                        style={[
                          styles.reply,
                          { backgroundColor: theme.surfaceAlt },
                        ]}
                      >
                        <Text
                          style={{
                            color: theme.primary,
                            fontSize: 10,
                            fontWeight: "900",
                          }}
                        >
                          YOUR REPLY
                        </Text>
                        <Text style={{ color: theme.text, marginTop: 3 }}>
                          {review.farmer_reply}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))
              ) : (
                <Empty
                  theme={theme}
                  text="Customer reviews will appear after fulfilled orders."
                />
              )}
            </Section>
          </>
        ) : null}
      </View>
      <Modal
        visible={Boolean(editListing)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditListing(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.inventoryModal,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeading}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: theme.primary }]}>
                  UPDATE INVENTORY
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {editListing
                    ? titleCase(editListing.title)
                    : "Produce listing"}
                </Text>
              </View>
              <Tap
                accessibilityLabel="Close inventory editor"
                onPress={() => setEditListing(null)}
                style={[styles.modalClose, { borderColor: theme.border }]}
              >
                <X size={19} color={theme.text} />
              </Tap>
            </View>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Available to sell
            </Text>
            <TextInput
              value={editStock}
              onChangeText={(value) =>
                setEditStock(value.replace(/[^0-9]/g, ""))
              }
              keyboardType="number-pad"
              selectTextOnFocus
              placeholder="0"
              placeholderTextColor={theme.muted}
              style={[
                styles.inventoryInput,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            />
            <Text style={[styles.inventoryHint, { color: theme.muted }]}>
              Reserved customer quantities are protected and are not included
              here.
            </Text>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
              Marketplace status
            </Text>
            <View style={styles.statusRow}>
              {(["active", "paused"] as const).map((status) => (
                <Tap
                  key={status}
                  onPress={() => setEditStatus(status)}
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor:
                        editStatus === status
                          ? theme.surfaceAlt
                          : theme.background,
                      borderColor:
                        editStatus === status ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: editStatus === status ? theme.primary : theme.text,
                      fontWeight: "800",
                    }}
                  >
                    {status === "active" ? "Available" : "Paused"}
                  </Text>
                </Tap>
              ))}
            </View>
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            <Tap
              disabled={Boolean(
                editListing && busy === `inventory-${editListing.id}`,
              )}
              onPress={() => void saveInventory()}
              style={[styles.primary, { backgroundColor: theme.primary }]}
            >
              {editListing && busy === `inventory-${editListing.id}` ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <Text style={{ color: theme.primaryText, fontWeight: "900" }}>
                  Save inventory
                </Text>
              )}
            </Tap>
            <Tap
              onPress={() => {
                const id = editListing?.id;
                setEditListing(null);
                if (id)
                  router.push({
                    pathname: "/listing-edit",
                    params: { id, farmId },
                  } as never);
              }}
              style={[styles.manage, { borderColor: theme.primary }]}
            >
              <Pencil size={17} color={theme.primary} />
              <Text style={{ color: theme.primary, fontWeight: "900" }}>
                Edit all listing details
              </Text>
            </Tap>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
function Metric({
  theme,
  icon,
  label,
  value,
}: {
  theme: any;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View
      style={[
        styles.metric,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.metricHead}>
        {icon}
        <Text
          numberOfLines={1}
          style={[styles.metricLabel, { color: theme.muted }]}
        >
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.metricValue,
          { fontFamily: "Manrope_700Bold", color: theme.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
function Section({
  theme,
  title,
  subtitle,
  children,
  open,
  onToggle,
}: {
  theme: any;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  open?: boolean;
  onToggle?: () => void;
}) {
  const collapsible = Boolean(onToggle);
  const expanded = open !== false;
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Tap
        disabled={!collapsible}
        accessibilityRole={collapsible ? "button" : undefined}
        accessibilityState={collapsible ? { expanded } : undefined}
        accessibilityLabel={collapsible ? `${expanded ? "Collapse" : "Expand"} ${title}` : undefined}
        onPress={onToggle}
        style={styles.sectionHeading}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.sectionCopy, { color: theme.muted, marginBottom: collapsible && !expanded ? 0 : 12 }]}>{subtitle}</Text>
        </View>
        {/* The arrow is swapped rather than rotated: a rotate transform on the icon stops it drawing
            entirely, which left an empty button and no way to collapse a section again. */}
        {collapsible ? <View style={[styles.sectionToggle, { borderColor: theme.border }]}>{expanded ? <ChevronUp size={18} color={theme.text}/> : <ChevronDown size={18} color={theme.text}/>}</View> : null}
      </Tap>
      {expanded ? children : null}
    </View>
  );
}
function Empty({ theme, text }: { theme: any; text: string }) {
  return (
    <View style={styles.empty}>
      <PackageCheck size={25} color={theme.primary} />
      <Text style={{ color: theme.muted, textAlign: "center" }}>{text}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  content: { ...pageContent, paddingBottom: 45 },
  eyebrow: pageHeading.kicker,
  title: pageHeading.title,
  subtitle: pageHeading.subtitle,
  copy: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  consoleIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  consoleCopy: { fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 520 },
  unlockCard: { marginTop: 24, padding: 16, borderWidth: 1, borderRadius: 16 },
  inputLabel: { fontSize: 12, fontWeight: "800", marginBottom: 8 },
  passwordField: {
    height: 51,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: { flex: 1, fontSize: 15 },
  staffSignOut: {
    height: 52,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  farms: { gap: 8, paddingVertical: 16 },
  farmChoice: {
    height: 42,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  error: {
    color: "#a84335",
    backgroundColor: "#fff0ed",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  // The label now shares the icon's line, which is what lets the tile come down from 118 to 80:
  // 12 of padding twice, a 21 icon row, 6, then the 21 value on its own line. The widest label,
  // "Today's net sales", measures 80dp of the 118dp left beside the icon, so none of them wrap.
  metric: {
    width: "48%",
    minHeight: 80,
    padding: 12,
    borderWidth: 1,
    borderRadius: 14,
  },
  metricHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  metricLabel: { flex: 1, fontSize: 11 },
  metricValue: {
    fontFamily: "serif",
    fontSize: 21,
    fontWeight: "600",
    marginTop: 6,
  },
  section: { marginTop: 14, padding: 16, borderWidth: 1, borderRadius: 16 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionToggle: { width: 36, height: 36, borderWidth: 1, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontFamily: "serif", fontSize: 22, fontWeight: "600" },
  sectionCopy: { fontSize: 12, marginTop: 4, marginBottom: 12 },
  order: { paddingVertical: 13, borderTopWidth: 1 },
  orderNo: { fontSize: 14, fontWeight: "900" },
  closedOrder: {
    minHeight: 78,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  review: { paddingVertical: 14, borderTopWidth: 1 },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewStars: { flexDirection: "row", gap: 2 },
  reply: { marginTop: 9, padding: 10, borderRadius: 9 },
  item: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  advance: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  orderChat:{minHeight:42,marginTop:12,paddingHorizontal:12,borderWidth:1,borderRadius:9,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},
  inventory: {
    minHeight: 58,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inventoryAction: { alignItems: "flex-end", gap: 7 },
  editInventory: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    padding: 20,
    backgroundColor: "rgba(0, 20, 12, 0.62)",
    justifyContent: "center",
  },
  inventoryModal: { borderWidth: 1, borderRadius: 16, padding: 18 },
  modalHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "serif",
    fontSize: 25,
    fontWeight: "600",
    marginTop: 4,
  },
  modalClose: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  inventoryInput: {
    height: 52,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 14,
    fontSize: 17,
  },
  inventoryHint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    marginBottom: 17,
  },
  statusRow: { flexDirection: "row", gap: 9 },
  statusButton: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalError: { color: "#a84335", marginTop: 12, fontSize: 12, lineHeight: 18 },
  empty: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primary: {
    height: 48,
    marginTop: 12,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  chatUnread: { minWidth: 19, height: 19, marginLeft: 6, paddingHorizontal: 5, borderRadius: 10, backgroundColor: "#b64337", color: "#fff", fontSize: 10, fontWeight: "900", lineHeight: 19, textAlign: "center", overflow: "hidden" },
  farmActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  delivery: { marginTop: 10, padding: 14, borderWidth: 1, borderRadius: 14 },
  deliveryHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  deliveryTitle: { flex: 1, fontSize: 15, fontWeight: "900" },
  deliveryCopy: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  deliveryLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 12 },
  deliveryRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  deliveryInput: { flex: 1, height: 46, paddingHorizontal: 12, borderWidth: 1, borderRadius: 11, fontSize: 14 },
  deliverySave: { minWidth: 84, height: 46, paddingHorizontal: 16, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  deliverySaved: { fontSize: 12, fontWeight: "800", marginTop: 8 },
  farmAction: {
    width: "48%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  farmActionLabel: { fontSize: 14, fontWeight: "800" },
  manage: {
    height: 50,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
