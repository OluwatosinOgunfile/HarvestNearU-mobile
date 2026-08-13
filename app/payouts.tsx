import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, CircleDollarSign, Clock3, Send, Store } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Money } from '@/components/money';
import { Screen } from '@/components/screen';
import { Text } from '@/components/typography';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api';

type Farm = { id: string; name: string };
type Request = { id: string; net_amount_kobo: number; status: string; requested_at: string; order_count: number };
type Dashboard = { farm: Farm; farms: Farm[]; metrics: Record<string, number> };

const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());

export default function Payouts() {
  const router = useRouter();
  const { theme, dark } = useApp();
  const [data, setData] = useState<Dashboard | null>(null);
  const [farmId, setFarmId] = useState('');
  const [requests, setRequests] = useState<Request[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (id = farmId) => {
    setBusy(true);
    setError('');
    try {
      const dashboard = await api<Dashboard>(`/api/farmer/dashboard${id ? `?farmId=${id}` : ''}`);
      const history = await api<{ requests: Request[] }>(`/api/farmer/payouts?farmId=${dashboard.farm.id}`);
      setData(dashboard);
      setFarmId(dashboard.farm.id);
      setRequests(history.requests || []);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }, [farmId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function submit() {
    if (!data) return;
    setBusy(true);
    setError('');
    try {
      await api('/api/farmer/payouts', { method: 'POST', body: JSON.stringify({ farmId: data.farm.id }) });
      await load(data.farm.id);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const available = Number(data?.metrics.next_payout_kobo || 0);

  return (
    <Screen refreshing={busy} onRefresh={() => load()}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={[styles.back, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <ChevronLeft size={22} color={theme.text} />
        </Pressable>
        <View>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>FARM EARNINGS</Text>
          <Text style={[styles.title, { color: theme.text }]}>Payouts</Text>
        </View>
      </View>

      <View style={styles.content}>
        {data?.farms?.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.farms}>
            {data.farms.map((farm) => {
              const selected = farm.id === farmId;
              return (
                <Pressable disabled={busy} key={farm.id} onPress={() => void load(farm.id)} style={[styles.farm, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : theme.surface }]}>
                  <Store size={16} color={selected ? theme.primaryText : theme.primary} />
                  <Text style={[styles.farmText, { color: selected ? theme.primaryText : theme.text }]}>{farm.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: dark ? '#ffb4a8' : '#a84335', backgroundColor: dark ? '#43251f' : '#fff0ed', borderColor: dark ? '#744237' : '#f0c5bd' }]}>{error}</Text> : null}

        {data ? (
          <>
            <View style={[styles.balance, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.balanceIcon, { backgroundColor: theme.surfaceAlt }]}><CircleDollarSign size={24} color={theme.primary} /></View>
              <Text style={[styles.balanceLabel, { color: theme.muted }]}>AVAILABLE NET PAYOUT</Text>
              <Money value={available / 100} style={[styles.balanceValue, { color: theme.text }]} />
              <View style={[styles.breakdown, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
                <View style={styles.breakdownRow}><Text style={{ color: theme.muted }}>Gross sales</Text><Money value={Number(data.metrics.payout_gross_kobo || 0) / 100} style={{ color: theme.text }} /></View>
                <View style={[styles.breakdownRow, styles.breakdownDivider, { borderColor: theme.border }]}><Text style={{ color: theme.muted }}>Platform fee (10%)</Text><Money value={-Number(data.metrics.payout_fee_kobo || 0) / 100} style={{ color: dark ? '#ffb4a8' : '#a84335' }} /></View>
                <View style={[styles.breakdownRow, styles.breakdownDivider, { borderColor: theme.border }]}><Text style={[styles.netLabel, { color: theme.primary }]}>Net payout</Text><Money value={available / 100} style={[styles.netLabel, { color: theme.primary }]} /></View>
              </View>
              <Pressable disabled={busy || available <= 0} onPress={() => void submit()} style={({ pressed }) => [styles.request, { backgroundColor: theme.primary }, (busy || available <= 0) && styles.disabled, pressed && available > 0 && styles.pressed]}>
                {busy ? <ActivityIndicator color={theme.primaryText} /> : <><Send size={18} color={theme.primaryText} /><Text style={[styles.requestText, { color: theme.primaryText }]}>Request payout</Text></>}
              </Pressable>
              {available <= 0 ? <Text style={[styles.helper, { color: theme.muted }]}>Fulfilled orders awaiting settlement will appear here.</Text> : null}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Request history</Text>
            {requests.length ? requests.map((request) => (
              <View key={request.id} style={[styles.history, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.historyIcon, { backgroundColor: theme.surfaceAlt }]}><Clock3 size={19} color={theme.primary} /></View>
                <View style={styles.historyCopy}>
                  <Money value={Number(request.net_amount_kobo) / 100} style={[styles.historyAmount, { color: theme.text }]} />
                  <Text style={[styles.meta, { color: theme.muted }]}>{request.order_count} fulfilled {request.order_count === 1 ? 'order' : 'orders'} {'\u00B7'} {new Date(request.requested_at).toLocaleDateString('en-NG')}</Text>
                </View>
                <Text style={[styles.status, { color: theme.primary, backgroundColor: theme.surfaceAlt }]}>{label(request.status)}</Text>
              </View>
            )) : (
              <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.historyIcon, { backgroundColor: theme.surfaceAlt }]}><Clock3 size={22} color={theme.primary} /></View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No payout requests yet</Text>
                <Text style={[styles.emptyCopy, { color: theme.muted }]}>Submitted requests and their progress will appear here.</Text>
              </View>
            )}
          </>
        ) : busy ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 94, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 13 },
  back: { width: 44, height: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  title: { fontFamily: 'Georgia_Regular', fontSize: 32 },
  content: { paddingHorizontal: 18, paddingBottom: 36 },
  farms: { gap: 8, paddingBottom: 15 },
  farm: { minHeight: 42, paddingHorizontal: 13, borderWidth: 1, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  farmText: { fontWeight: '800' },
  error: { padding: 13, borderWidth: 1, borderRadius: 11, marginBottom: 12 },
  balance: { padding: 20, borderWidth: 1, borderRadius: 17 },
  balanceIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  balanceLabel: { fontSize: 11, fontWeight: '900', letterSpacing: .7, marginTop: 15 },
  balanceValue: { fontSize: 34, fontWeight: '900', marginTop: 4 },
  breakdown: { marginTop: 18, paddingHorizontal: 14, borderWidth: 1, borderRadius: 12 },
  breakdownRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  breakdownDivider: { borderTopWidth: 1 },
  netLabel: { fontWeight: '900' },
  request: { minHeight: 52, marginTop: 18, paddingHorizontal: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  disabled: { opacity: .48 },
  pressed: { transform: [{ scale: .985 }] },
  requestText: { fontWeight: '900', fontSize: 15 },
  helper: { marginTop: 10, textAlign: 'center', fontSize: 12, lineHeight: 18 },
  sectionTitle: { fontFamily: 'Georgia_Regular', fontSize: 24, marginTop: 26, marginBottom: 11 },
  history: { minHeight: 82, padding: 14, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 9 },
  historyIcon: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  historyCopy: { flex: 1 },
  historyAmount: { fontSize: 17, fontWeight: '900' },
  meta: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  status: { overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, fontSize: 10, fontWeight: '900' },
  empty: { minHeight: 190, padding: 24, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontFamily: 'Georgia_Regular', fontSize: 20, textAlign: 'center' },
  emptyCopy: { maxWidth: 270, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  loader: { marginTop: 70 },
});
