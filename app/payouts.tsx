import { useFocusEffect, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import { ChevronDown, ChevronLeft, CircleDollarSign, Clock3, CreditCard, Printer, Send, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Money } from '@/components/money';
import { Screen } from '@/components/screen';
import { SelectDropdown } from '@/components/select-dropdown';
import { Text, TextInput } from '@/components/typography';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api';

type Farm = { id: string; name: string };
type Request = { id: string; net_amount_kobo: number; status: string; requested_at: string; order_count: number };
type Bank={name:string;code:string};type Account={bank_name?:string;account_name?:string;account_last4?:string}|null;
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
  const [accountOpen,setAccountOpen]=useState(false);const [account,setAccount]=useState<Account>(null);const [banks,setBanks]=useState<Bank[]>([]);const [bank,setBank]=useState<Bank|null>(null);const [accountNumber,setAccountNumber]=useState('');

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
  async function openAccount(){if(!data)return;setBusy(true);setError('');try{const result=await api<{account:Account;banks:Bank[]}>(`/api/farmer/payout-account?farmId=${data.farm.id}`);setAccount(result.account);setBanks(result.banks||[]);setBank(null);setAccountNumber('');setAccountOpen(true)}catch(reason){setError((reason as Error).message)}finally{setBusy(false)}}
  async function saveAccount(){if(!data||!bank)return;setBusy(true);setError('');try{const result=await api<{account:Account}>('/api/farmer/payout-account',{method:'PUT',body:JSON.stringify({farmId:data.farm.id,bankCode:bank.code,bankName:bank.name,accountNumber})});setAccount(result.account);setAccountOpen(false)}catch(reason){setError((reason as Error).message)}finally{setBusy(false)}}
  async function printPayout(id:string){setBusy(true);setError('');try{const result=await api<{request:Record<string,unknown>&{orders:Record<string,unknown>[]}}>(`/api/farmer/payouts?id=${id}`);const payout=result.request;const money=(value:unknown)=>`&#8358;${(Number(value)/100).toLocaleString('en-NG')}`;const rows=payout.orders.map(order=>`<tr><td>Order #${String(order.order_number)}</td><td>${money(order.gross_kobo)}</td><td>-${money(order.fee_kobo)}</td><td>${money(order.net_kobo)}</td></tr>`).join('');await Print.printAsync({html:`<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>@page{size:A4;margin:14mm}body{font-family:Arial;color:#19271e}header{display:flex;justify-content:space-between;padding-bottom:22px;border-bottom:2px solid #1f673f}img{width:210px;object-fit:contain}h1{font:38px Georgia;margin:8px 0}small{color:#637067}section{padding:22px 0}table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:12px 8px;border-bottom:1px solid #dde4dc;text-align:right}th:first-child,td:first-child{text-align:left}.totals{width:330px;margin:22px 0 0 auto}.totals div{display:flex;justify-content:space-between;padding:8px}.net{font-size:18px;border-top:2px solid #1f673f}footer{margin-top:35px;padding-top:18px;border-top:1px solid #dde4dc;text-align:center}</style></head><body><header><img src="https://www.harvestnearu.com/brand/harvestnearu-opaque-seal-se2-lockup.png"><div><small>${label(String(payout.status))}</small><h1>Payout statement</h1><span>${String(payout.farm_name)}</span></div></header><section><strong>${String(payout.account_name||'Payout account')}</strong><br><small>${String(payout.bank_name||'')} ${payout.account_last4?`ending ${payout.account_last4}`:''}</small></section><table><thead><tr><th>Included order</th><th>Gross</th><th>Fee</th><th>Net</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div><span>Gross sales</span><b>${money(payout.gross_amount_kobo)}</b></div><div><span>Platform fee</span><b>-${money(payout.platform_fee_kobo)}</b></div><div class="net"><span>Net payout</span><b>${money(payout.net_amount_kobo)}</b></div></div><footer>HarvestNearU | harvestnearu.com | hello@harvestnearu.com</footer></body></html>`})}catch(reason){setError((reason as Error).message)}finally{setBusy(false)}}

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
        {data?.farms?.length ? <SelectDropdown label="Payout farm" value={farmId} options={data.farms.map((farm) => ({ label:farm.name, value:farm.id }))} disabled={busy} onChange={(id) => void load(id)}/> : null}

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
                <View style={styles.historyActions}><Text style={[styles.status, { color: theme.primary, backgroundColor: theme.surfaceAlt }]}>{label(request.status)}</Text><Pressable accessibilityLabel="Print payout statement" onPress={()=>void printPayout(request.id)} style={[styles.print,{borderColor:theme.border}]}><Printer size={16} color={theme.primary}/></Pressable></View>
              </View>
            )) : (
              <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.historyIcon, { backgroundColor: theme.surfaceAlt }]}><Clock3 size={22} color={theme.primary} /></View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No payout requests yet</Text>
                <Text style={[styles.emptyCopy, { color: theme.muted }]}>Submitted requests and their progress will appear here.</Text>
              </View>
            )}
            <Pressable onPress={()=>void openAccount()} style={[styles.accountButton,{borderColor:theme.primary}]}><CreditCard size={18} color={theme.primary}/><Text style={{color:theme.primary,fontWeight:'900'}}>Configure payout account</Text></Pressable>
          </>
        ) : busy ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : null}
      </View>
      <Modal transparent visible={accountOpen} animationType="slide" onRequestClose={()=>setAccountOpen(false)}><View style={styles.modalBackdrop}><View style={[styles.modal,{backgroundColor:theme.surface,borderColor:theme.border}]}><View style={styles.modalHead}><View><Text style={[styles.eyebrow,{color:theme.primary}]}>PAYOUT ACCOUNT</Text><Text style={[styles.modalTitle,{color:theme.text}]}>{data?.farm.name}</Text></View><Pressable onPress={()=>setAccountOpen(false)} style={[styles.modalClose,{borderColor:theme.border}]}><X size={20} color={theme.text}/></Pressable></View>{account?.account_last4?<View style={[styles.currentAccount,{backgroundColor:theme.surfaceAlt}]}><CreditCard size={20} color={theme.primary}/><View><Text style={{color:theme.text,fontWeight:'800'}}>{account.account_name}</Text><Text style={{color:theme.muted}}>{account.bank_name} · ending {account.account_last4}</Text></View></View>:null}<Text style={[styles.fieldLabel,{color:theme.muted}]}>Bank</Text><ScrollView style={[styles.bankList,{borderColor:theme.border}]}>{banks.map(item=><Pressable key={item.code} onPress={()=>setBank(item)} style={[styles.bankRow,{borderColor:theme.border,backgroundColor:bank?.code===item.code?theme.surfaceAlt:theme.surface}]}><Text style={{color:theme.text}}>{item.name}</Text>{bank?.code===item.code?<ChevronDown size={16} color={theme.primary}/>:null}</Pressable>)}</ScrollView><Text style={[styles.fieldLabel,{color:theme.muted}]}>Account number</Text><TextInput value={accountNumber} onChangeText={value=>setAccountNumber(value.replace(/\D/g,'').slice(0,10))} keyboardType="number-pad" placeholder="10-digit NUBAN account" placeholderTextColor={theme.muted} style={[styles.input,{color:theme.text,borderColor:theme.border,backgroundColor:theme.surfaceAlt}]}/>{error?<Text style={[styles.error,{color:dark?'#ffb4a8':'#a84335'}]}>{error}</Text>:null}<Pressable disabled={busy||!bank||accountNumber.length!==10} onPress={()=>void saveAccount()} style={[styles.request,{backgroundColor:theme.primary},(busy||!bank||accountNumber.length!==10)&&styles.disabled]}>{busy?<ActivityIndicator color={theme.primaryText}/>:<Text style={[styles.requestText,{color:theme.primaryText}]}>Verify and save account</Text>}</Pressable></View></View></Modal>
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
  historyActions:{alignItems:'flex-end',gap:7},print:{width:36,height:34,borderWidth:1,borderRadius:8,alignItems:'center',justifyContent:'center'},accountButton:{minHeight:48,marginTop:14,borderWidth:1,borderRadius:11,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
  historyAmount: { fontSize: 17, fontWeight: '900' },
  meta: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  status: { overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, fontSize: 10, fontWeight: '900' },
  empty: { minHeight: 190, padding: 24, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontFamily: 'Georgia_Regular', fontSize: 20, textAlign: 'center' },
  emptyCopy: { maxWidth: 270, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  loader: { marginTop: 70 },
  modalBackdrop:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,.55)'},modal:{maxHeight:'88%',padding:20,borderTopWidth:1,borderTopLeftRadius:24,borderTopRightRadius:24},modalHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16},modalTitle:{fontFamily:'Georgia_Regular',fontSize:25},modalClose:{width:40,height:40,borderWidth:1,borderRadius:10,alignItems:'center',justifyContent:'center'},currentAccount:{padding:13,borderRadius:11,flexDirection:'row',gap:10,alignItems:'center',marginBottom:14},fieldLabel:{fontSize:11,fontWeight:'800',marginVertical:8},bankList:{maxHeight:220,borderWidth:1,borderRadius:10},bankRow:{minHeight:45,paddingHorizontal:12,borderBottomWidth:1,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},input:{minHeight:48,paddingHorizontal:13,borderWidth:1,borderRadius:10},
});
