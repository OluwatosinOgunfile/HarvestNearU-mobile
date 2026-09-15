import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, MessageCircle, Send } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Tap } from "@/components/tap";
import { Text, TextInput } from "@/components/typography";
import { useApp } from "@/context/app-context";
import { api } from "@/lib/api";

type Message = { id: string; body: string; sender_id: string; sender_name: string; created_at: string };
type Response = { thread: { order_number: string; farm_name: string }; messages: Message[] };

const dayOf = (value: string) => new Date(value).toLocaleDateString("en-NG", { dateStyle: "medium" });
const timeOf = (value: string) => new Date(value).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

export default function OrderChat() {
  const router = useRouter();
  const { orderId = "", farmId = "" } = useLocalSearchParams<{ orderId: string; farmId: string }>();
  const { theme, dark, user } = useApp();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Response | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<ScrollView>(null);

  // A background refresh stays quiet: a dropped poll on a patchy connection should not put an error
  // under a conversation that is working, and the next poll will pick it up.
  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setError("");
      setData(await api<Response>(`/api/orders/messages?orderId=${encodeURIComponent(orderId)}&farmId=${encodeURIComponent(farmId)}`));
    } catch (reason) { if (!silent) setError((reason as Error).message); }
    finally { if (!silent) setLoading(false); }
  }, [farmId, orderId]);

  useEffect(() => {
    // Deferred a tick so the first load does not set state straight out of the effect body.
    const first = setTimeout(() => { void load(); }, 0);
    // Ten seconds is plenty for two people agreeing a handover, and it stops while the app is in the
    // background so a screen left open does not poll all day.
    const poll = setInterval(() => { if (AppState.currentState === "active") void load(true); }, 10000);
    return () => { clearTimeout(first); clearInterval(poll); };
  }, [load]);

  // Keep the newest message in view, on opening and whenever one arrives or is sent.
  useEffect(() => {
    if (!data?.messages.length) return;
    const timer = setTimeout(() => threadRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(timer);
  }, [data?.messages.length]);

  async function send() {
    const message = draft.trim();
    if (!message) return;
    setSending(true); setError("");
    try {
      await api("/api/orders/messages", { method: "POST", body: JSON.stringify({ orderId, farmId, message }) });
      setDraft(""); await load();
    } catch (reason) { setError((reason as Error).message); }
    finally { setSending(false); }
  }

  const messages = data?.messages ?? [];
  const ready = Boolean(draft.trim()) && !sending;

  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["top"]}>
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <Tap accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={22} color={theme.text} /></Tap>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>ARRANGE DELIVERY</Text>
        <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>{data?.thread.farm_name || "Farmer conversation"}</Text>
      </View>
      {data ? <Text style={[styles.order, { color: theme.muted }]}>#{data.thread.order_number}</Text> : null}
    </View>

    {/* The thread takes the room the screen has and the composer stays on the bottom edge, rather
        than the whole screen scrolling and leaving the composer stranded mid-screen under a short
        conversation. */}
    <ScrollView ref={threadRef} style={styles.thread} contentContainerStyle={styles.threadContent}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
      {loading && !data ? <ActivityIndicator color={theme.primary} style={{ marginTop: 70 }} /> : null}
      {data && !messages.length ? <View style={styles.empty}>
        <View style={[styles.emptyMark, { backgroundColor: theme.surfaceAlt }]}><MessageCircle size={22} color={theme.primary} /></View>
        <Text style={[styles.emptyText, { color: theme.muted }]}>Agree the timing, the handover place, and any delivery charge.</Text>
      </View> : null}
      {messages.map((message, index) => {
        const mine = message.sender_id === user?.id;
        const day = dayOf(message.created_at);
        const newDay = index === 0 || dayOf(messages[index - 1].created_at) !== day;
        // The name belongs at the top of a run, not on every bubble, and a run is broken by a new
        // day as well as by the other person speaking.
        const startsRun = newDay || messages[index - 1].sender_id !== message.sender_id;
        return <View key={message.id}>
          {newDay ? <View style={styles.dayRow}>
            <Text style={[styles.day, { color: theme.muted, backgroundColor: theme.surface, borderColor: theme.border }]}>{day}</Text>
          </View> : null}
          <View style={[
            styles.bubble,
            startsRun ? null : styles.runOn,
            mine
              ? [styles.mine, { backgroundColor: dark ? "#274232" : "#e7f1e4", borderColor: dark ? "#3c6048" : "#c6dcc4" }]
              : [styles.theirs, { backgroundColor: theme.surface, borderColor: theme.border }],
          ]}>
            {startsRun ? <Text style={[styles.author, { color: theme.primary }]}>{mine ? "You" : message.sender_name}</Text> : null}
            <Text style={[styles.body, { color: theme.text }]}>{message.body}</Text>
            <Text style={[styles.time, { color: theme.muted }]}>{timeOf(message.created_at)}</Text>
          </View>
        </View>;
      })}
      {error ? <Text style={[styles.error, { color: dark ? "#ffb4a8" : "#a84335", backgroundColor: dark ? "#2d1b18" : "#fff0ed" }]}>{error}</Text> : null}
    </ScrollView>

    <KeyboardStickyView>
      <View style={[styles.composerBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={[styles.composer, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <TextInput value={draft} onChangeText={setDraft} multiline maxLength={2000}
            placeholder="Message the farmer" placeholderTextColor={theme.muted}
            style={[styles.input, { color: theme.text }]} />
        </View>
        <Tap accessibilityLabel="Send message" disabled={!ready} onPress={() => void send()}
          style={[styles.send, { backgroundColor: ready ? theme.primary : theme.surfaceAlt }]}>
          {sending ? <ActivityIndicator size="small" color={theme.primaryText} /> : <Send size={19} color={ready ? theme.primaryText : theme.muted} />}
        </Tap>
      </View>
    </KeyboardStickyView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 68, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  title: { fontFamily: "Georgia_Bold", fontSize: 19, marginTop: 1 },
  order: { fontSize: 11, fontWeight: "700", marginLeft: 4 },
  thread: { flex: 1 },
  threadContent: { padding: 14, paddingBottom: 6, gap: 4 },
  dayRow: { alignItems: "center", marginVertical: 10 },
  day: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, borderWidth: 1, overflow: "hidden", fontSize: 10, fontWeight: "800" },
  // One squared corner on the speaker's side is what makes a bubble read as coming from someone.
  bubble: { maxWidth: "82%", marginTop: 8, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderRadius: 16 },
  runOn: { marginTop: 3 },
  mine: { alignSelf: "flex-end", borderBottomRightRadius: 5 },
  theirs: { alignSelf: "flex-start", borderBottomLeftRadius: 5 },
  author: { fontSize: 11, fontWeight: "900", marginBottom: 3 },
  body: { fontSize: 14, lineHeight: 20 },
  time: { fontSize: 10, marginTop: 5, alignSelf: "flex-end" },
  empty: { alignItems: "center", paddingTop: 70, paddingHorizontal: 30, gap: 14 },
  emptyMark: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  emptyText: { textAlign: "center", fontSize: 13, lineHeight: 19 },
  composerBar: { paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, flexDirection: "row", alignItems: "flex-end", gap: 9 },
  composer: { flex: 1, minHeight: 46, maxHeight: 120, justifyContent: "center", paddingHorizontal: 13, borderWidth: 1, borderRadius: 23 },
  input: { fontSize: 14, paddingVertical: 11 },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  error: { marginTop: 14, padding: 11, borderRadius: 10, fontSize: 13, lineHeight: 18 },
});
