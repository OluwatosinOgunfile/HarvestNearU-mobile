import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Headphones,
  MessageSquarePlus,
  Send,
  Sparkles,
  Star,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { Screen } from "@/components/screen";
import { Text, TextInput } from "@/components/typography";
import { useApp } from "@/context/app-context";
import { api } from "@/lib/api";

type Ticket = {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  updated_at: string;
  messages: {
    id: string;
    body: string;
    author_name: string;
    created_at: string;
  }[];
};
const categories = [
  "order",
  "payment",
  "delivery",
  "refund",
  "account",
  "farm",
  "technical",
  "feedback",
  "other",
];
export default function Support() {
  const router = useRouter();
  const { theme, user } = useApp();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{
    answer: string;
    sourceTitle: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [category, setCategory] = useState("order");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api<{ tickets: Ticket[] }>("/api/support/tickets");
      setTickets(result.tickets || []);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function submit() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const bodyMessage =
        category === "feedback" && rating
          ? `Experience rating: ${rating}/5\n\n${message}`
          : message;
      await api("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({ category, subject, message: bodyMessage }),
      });
      setSubject("");
      setMessage("");
      setRating(0);
      setSuccess(
        category === "feedback"
          ? "Thank you. Your feedback has been sent."
          : "Your support ticket has been created.",
      );
      await load();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function ask() {
    if (!question.trim()) return;
    setAsking(true);
    setError("");
    try {
      setAnswer(
        await api<{ answer: string; sourceTitle: string }>("/api/ai/assist", {
          method: "POST",
          body: JSON.stringify({ feature: "faq", input: question }),
        }),
      );
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setAsking(false);
    }
  }
  return (
    <Screen refreshing={loading} onRefresh={load}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.back,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ChevronLeft size={22} color={theme.text} />
        </Pressable>
        <View>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            PERSONAL SUPPORT
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Help and feedback
          </Text>
        </View>
      </View>
      <View style={styles.content}>
        <View
          style={[
            styles.intro,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          <Headphones size={28} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.introTitle, { color: theme.text }]}>
              How can we help?
            </Text>
            <Text style={{ color: theme.muted, lineHeight: 20 }}>
              Report an issue or tell us how HarvestNearU is working for you.
            </Text>
          </View>
        </View>
        <View style={[styles.aiCard,{backgroundColor:theme.surface,borderColor:theme.border}]}>
          <View style={styles.amaraHead}><Image source={require('@/assets/images/amara-avatar.png')} style={styles.amaraAvatar}/><View style={{flex:1}}><Text style={[styles.cardTitle,{color:theme.text}]}>Ask Amara</Text><Text style={[styles.amaraRole,{color:theme.primary}]}>HARVESTNEARU GUIDE</Text></View></View>
          <Text style={{color:theme.muted,lineHeight:20}}>Amara finds answers grounded in verified Help Centre guidance. Create a ticket if your situation is not covered.</Text>
          <TextInput value={question} onChangeText={setQuestion} placeholder="Ask about delivery, payments, orders, or payouts" placeholderTextColor={theme.muted} style={[styles.aiInput,{color:theme.text,borderColor:theme.border,backgroundColor:theme.background}]}/>
          <Pressable disabled={asking||!question.trim()} onPress={()=>void ask()} style={[styles.aiButton,{backgroundColor:theme.primary,opacity:question.trim()?1:.5}]}>{asking?<ActivityIndicator color={theme.primaryText}/>:<><Sparkles size={16} color={theme.primaryText}/><Text style={{color:theme.primaryText,fontWeight:"900"}}>Find an answer</Text></>}</Pressable>
          {answer?<View style={[styles.aiAnswer,{backgroundColor:theme.surfaceAlt}]}><Text style={{color:theme.text,lineHeight:21}}>{answer.answer}</Text><Text style={[styles.aiSource,{color:theme.primary}]}>Source: {answer.sourceTitle}</Text></View>:null}
        </View>
        {user ? (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.cardHead}>
              <MessageSquarePlus size={20} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Create a request
              </Text>
            </View>
            <Text style={[styles.label, { color: theme.text }]}>
              Issue category
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: categoryOpen }}
              onPress={() => setCategoryOpen((value) => !value)}
              style={[
                styles.categorySelect,
                {
                  backgroundColor: theme.background,
                  borderColor: categoryOpen ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={{ color: theme.text, fontWeight: "800" }}>
                {label(category)}
              </Text>
              <ChevronDown size={19} color={theme.primary} />
            </Pressable>
            {categoryOpen ? (
              <View
                style={[
                  styles.categoryMenu,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {categories.map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => {
                      setCategory(value);
                      setCategoryOpen(false);
                    }}
                    style={[
                      styles.categoryOption,
                      category === value && {
                        backgroundColor: theme.surfaceAlt,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.text,
                        fontWeight: category === value ? "900" : "600",
                      }}
                    >
                      {label(value)}
                    </Text>
                    {category === value ? (
                      <CheckCircle2 size={17} color={theme.primary} />
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
            {category === "feedback" ? (
              <>
                <Text style={[styles.label, { color: theme.text }]}>
                  Rate your experience
                </Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Pressable
                      accessibilityLabel={`${value} stars`}
                      key={value}
                      onPress={() => setRating(value)}
                    >
                      <Star
                        size={29}
                        color="#d99b13"
                        fill={value <= rating ? "#d99b13" : "transparent"}
                      />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
            <Field
              theme={theme}
              label="Subject"
              value={subject}
              onChangeText={setSubject}
              placeholder={
                category === "feedback"
                  ? "What should we improve?"
                  : "Briefly describe the issue"
              }
            />
            <Text style={[styles.label, { color: theme.text }]}>Details</Text>
            <TextInput
              multiline
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
              placeholder="Include an order number and what you expected when relevant."
              placeholderTextColor={theme.muted}
              style={[
                styles.textarea,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? (
              <View
                style={[styles.success, { backgroundColor: theme.surfaceAlt }]}
              >
                <CheckCircle2 size={17} color={theme.primary} />
                <Text style={{ color: theme.text, flex: 1 }}>{success}</Text>
              </View>
            ) : null}
            <Pressable
              disabled={
                busy ||
                !subject.trim() ||
                !message.trim() ||
                (category === "feedback" && !rating)
              }
              onPress={() => void submit()}
              style={[
                styles.submit,
                {
                  backgroundColor: theme.primary,
                  opacity:
                    busy ||
                    !subject.trim() ||
                    !message.trim() ||
                    (category === "feedback" && !rating)
                      ? 0.55
                      : 1,
                },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <>
                  <Send size={18} color={theme.primaryText} />
                  <Text style={{ color: theme.primaryText, fontWeight: "900" }}>
                    Send to support
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <Text
            style={[
              styles.notice,
              { color: theme.text, backgroundColor: theme.surface },
            ]}
          >
            Sign in to create and track support tickets.
          </Text>
        )}
        <View style={styles.ticketHead}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Your tickets
          </Text>
          <Text style={{ color: theme.muted }}>{tickets.length}</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
        ) : tickets.length ? (
          tickets.map((ticket) => (
            <View
              key={ticket.id}
              style={[
                styles.ticket,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.ticketTop}>
                <Text style={[styles.ticketNo, { color: theme.primary }]}>
                  {ticket.ticket_number}
                </Text>
                <Text
                  style={[
                    styles.status,
                    { color: theme.text, backgroundColor: theme.surfaceAlt },
                  ]}
                >
                  {label(ticket.status)}
                </Text>
              </View>
              <Text style={[styles.ticketTitle, { color: theme.text }]}>
                {ticket.subject}
              </Text>
              <Text style={{ color: theme.muted }}>
                {label(ticket.category)} {"\u00B7"} Updated{" "}
                {new Date(ticket.updated_at).toLocaleDateString("en-NG")}
              </Text>
              {ticket.messages?.at(-1) ? (
                <Text
                  numberOfLines={3}
                  style={[
                    styles.lastMessage,
                    { color: theme.muted, borderTopColor: theme.border },
                  ]}
                >
                  {ticket.messages.at(-1)?.body}
                </Text>
              ) : null}
            </View>
          ))
        ) : (
          <View
            style={[
              styles.empty,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <CheckCircle2 size={28} color={theme.primary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No support tickets yet
            </Text>
            <Text style={{ color: theme.muted, textAlign: "center" }}>
              Your conversations with the support team will appear here.
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
function Field({
  theme,
  label: fieldLabel,
  ...props
}: {
  theme: any;
  label: string;
  [key: string]: any;
}) {
  return (
    <View>
      <Text style={[styles.label, { color: theme.text }]}>{fieldLabel}</Text>
      <TextInput
        {...props}
        placeholderTextColor={theme.muted}
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.border,
            backgroundColor: theme.background,
          },
        ]}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  title: { fontFamily: "Georgia_Bold", fontSize: 27, marginTop: 3 },
  content: { padding: 20, gap: 16 },
  intro: {
    padding: 18,
    borderWidth: 1,
    borderRadius: 17,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  introTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  aiCard:{padding:18,borderWidth:1,borderRadius:17},
  amaraHead:{flexDirection:"row",alignItems:"center",gap:11,marginBottom:10},
  amaraAvatar:{width:48,height:48,borderRadius:16},
  amaraRole:{fontSize:9,fontWeight:"900",letterSpacing:.9,marginTop:2},
  aiInput:{height:50,borderWidth:1,borderRadius:11,paddingHorizontal:13,fontSize:15,marginTop:14},
  aiButton:{height:48,borderRadius:11,marginTop:10,flexDirection:"row",gap:8,alignItems:"center",justifyContent:"center"},
  aiAnswer:{padding:13,borderRadius:10,marginTop:12},
  aiSource:{fontSize:11,fontWeight:"900",marginTop:8},
  card: { padding: 18, borderWidth: 1, borderRadius: 17 },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
  },
  cardTitle: { fontFamily: "Georgia_Bold", fontSize: 21 },
  label: { fontSize: 12, fontWeight: "800", marginBottom: 8 },
  categorySelect: {
    height: 50,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoryMenu: {
    borderWidth: 1,
    borderRadius: 11,
    overflow: "hidden",
    marginBottom: 18,
  },
  categoryOption: {
    minHeight: 44,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stars: { flexDirection: "row", gap: 9, marginBottom: 18 },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 13,
    fontSize: 15,
    marginBottom: 16,
  },
  textarea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 11,
    padding: 13,
    fontSize: 15,
    marginBottom: 14,
  },
  error: {
    color: "#ad4437",
    backgroundColor: "#fbece8",
    padding: 11,
    borderRadius: 8,
    marginBottom: 12,
  },
  success: {
    padding: 11,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  submit: {
    height: 50,
    borderRadius: 11,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  notice: { padding: 16, borderRadius: 12 },
  ticketHead: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontFamily: "Georgia_Bold", fontSize: 24 },
  ticket: { padding: 16, borderWidth: 1, borderRadius: 15 },
  ticketTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketNo: { fontSize: 12, fontWeight: "900" },
  status: {
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 5,
  },
  lastMessage: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
    lineHeight: 20,
  },
  empty: {
    minHeight: 190,
    borderWidth: 1,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 9,
  },
  emptyTitle: { fontFamily: "Georgia_Bold", fontSize: 20 },
});
