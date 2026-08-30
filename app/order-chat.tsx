import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Send } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { Screen } from "@/components/screen";
import { Text, TextInput } from "@/components/typography";
import { useApp } from "@/context/app-context";
import { api } from "@/lib/api";

type Message = { id: string; body: string; sender_id: string; sender_name: string; created_at: string };
type Response = { thread: { order_number: string; farm_name: string }; messages: Message[] };

export default function OrderChat() {
  const router = useRouter();
  const { orderId = "", farmId = "" } = useLocalSearchParams<{ orderId: string; farmId: string }>();
  const { theme, user } = useApp();
  const [data, setData] = useState<Response | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setError("");
      setData(await api<Response>(`/api/orders/messages?orderId=${encodeURIComponent(orderId)}&farmId=${encodeURIComponent(farmId)}`));
    } catch (reason) { setError((reason as Error).message); }
    finally { setLoading(false); }
  }, [farmId, orderId]);
  useEffect(() => {
    let active = true;
    void api<Response>(`/api/orders/messages?orderId=${encodeURIComponent(orderId)}&farmId=${encodeURIComponent(farmId)}`)
      .then((result) => { if (active) setData(result); })
      .catch((reason: Error) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [farmId, orderId]);
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
  return <Screen refreshing={loading} onRefresh={load}>
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={21} color={theme.text}/></Pressable>
      <View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: theme.primary }]}>ARRANGE DELIVERY</Text><Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>{data?.thread.farm_name || "Farmer conversation"}</Text></View>
    </View>
    <View style={styles.content}>
      {data ? <><Text style={[styles.order, { color: theme.muted }]}>Order #{data.thread.order_number}</Text>
        <View style={styles.thread}>{data.messages.length ? data.messages.map(message => {
          const mine = message.sender_id === user?.id;
          return <View key={message.id} style={[styles.message, { alignSelf: mine ? "flex-end" : "flex-start", backgroundColor: mine ? theme.surfaceAlt : theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.author, { color: theme.primary }]}>{mine ? "You" : message.sender_name}</Text><Text style={{ color: theme.text, lineHeight: 20 }}>{message.body}</Text><Text style={[styles.time, { color: theme.muted }]}>{new Date(message.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</Text>
          </View>;
        }) : <Text style={[styles.empty, { color: theme.muted }]}>Start the conversation about timing, location, and the delivery charge.</Text>}</View>
        <View style={[styles.composer, { backgroundColor: theme.surface, borderColor: theme.border }]}><TextInput value={draft} onChangeText={setDraft} multiline maxLength={2000} placeholder="Message the farmer" placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text }]}/><Pressable disabled={sending || !draft.trim()} onPress={() => void send()} style={[styles.send, { backgroundColor: theme.primary, opacity: sending || !draft.trim() ? .55 : 1 }]}>{sending ? <ActivityIndicator size="small" color={theme.primaryText}/> : <Send size={18} color={theme.primaryText}/>}</Pressable></View>
      </> : loading ? <ActivityIndicator color={theme.primary} style={{ marginTop: 70 }}/> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  </Screen>;
}
const styles = StyleSheet.create({ header:{minHeight:82,paddingHorizontal:16,borderBottomWidth:1,flexDirection:"row",alignItems:"center",gap:10},back:{width:38,height:38,alignItems:"center",justifyContent:"center"},eyebrow:{fontSize:10,fontWeight:"900",letterSpacing:1.1},title:{fontFamily:"Georgia_Regular",fontSize:22,marginTop:2},content:{padding:18,paddingBottom:36},order:{fontSize:12,marginBottom:14},thread:{gap:10,minHeight:260},message:{maxWidth:"88%",padding:12,borderWidth:1,borderRadius:12},author:{fontSize:11,fontWeight:"900",marginBottom:5},time:{fontSize:9,marginTop:7},empty:{textAlign:"center",lineHeight:21,paddingVertical:70},composer:{marginTop:18,minHeight:58,padding:7,paddingLeft:13,borderWidth:1,borderRadius:13,flexDirection:"row",alignItems:"flex-end",gap:8},input:{flex:1,maxHeight:120,paddingVertical:10},send:{width:44,height:44,borderRadius:10,alignItems:"center",justifyContent:"center"},error:{color:"#a84335",backgroundColor:"#fff0ed",padding:11,borderRadius:9,marginTop:12} });
