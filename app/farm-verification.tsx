import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BadgeCheck, Check, ChevronLeft, Clock3, FileCheck2, ShieldCheck, Upload, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Tap } from '@/components/tap';
import { Screen } from '@/components/screen';
import { SelectDropdown } from '@/components/select-dropdown';
import { Text, TextInput } from '@/components/typography';
import { useApp } from '@/context/app-context';
import { api, multipartFile } from '@/lib/api';

type DocumentRow = { document_type:string; content_type:string; byte_size:number; uploaded_at:string };
type Submission = {
  id:string; status:string; legal_first_name:string|null; legal_last_name:string|null; date_of_birth:string|null;
  identity_type:string|null; identity_number_last4:string|null; business_type:string; cac_number:string|null;
  bank_matched:boolean|null; bank_match_note:string|null; review_note:string|null; submitted_at:string|null;
};
type Policy = {
  identityTypes:{ value:string; label:string }[];
  businessTypes:{ value:string; label:string; requiresCac:boolean }[];
  requiredDocuments:string[]; optionalDocuments:string[]; maxDocumentBytes:number;
};
type VerificationData = {
  farm:{ id:string; name:string; verificationStatus:string; exempt:boolean };
  submission:Submission|null; documents:DocumentRow[]; payoutAccountName:string|null; policy:Policy;
};

const DOCUMENT_LABELS: Record<string,string> = {
  identity_front: 'Identity document (front)',
  identity_back: 'Identity document (back)',
  selfie: 'Photo of you holding the document',
  cac_certificate: 'CAC certificate',
  address_proof: 'Proof of farm address',
};

export default function FarmVerification() {
  const router = useRouter();
  const { theme } = useApp();
  const { farmId } = useLocalSearchParams<{ farmId?:string }>();
  const [data, setData] = useState<VerificationData|null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [form, setForm] = useState({ legalFirstName:'', legalLastName:'', dateOfBirth:'', identityType:'nin', identityNumber:'', businessType:'individual', cacNumber:'' });

  const load = useCallback(async () => {
    if (!farmId) { setError('Select a farm first.'); return; }
    setError('');
    try {
      const result = await api<VerificationData>(`/api/farmer/verification?farmId=${encodeURIComponent(farmId)}`);
      setData(result);
      if (result.submission) setForm(current => ({
        ...current,
        legalFirstName: result.submission?.legal_first_name || current.legalFirstName,
        legalLastName: result.submission?.legal_last_name || current.legalLastName,
        dateOfBirth: result.submission?.date_of_birth?.slice(0, 10) || current.dateOfBirth,
        identityType: result.submission?.identity_type || current.identityType,
        businessType: result.submission?.business_type || current.businessType,
        cacNumber: result.submission?.cac_number || current.cacNumber,
      }));
    } catch (reason) { setError((reason as Error).message); }
  }, [farmId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const submission = data?.submission || null;
  const decided = submission?.status === 'approved';
  const locked = decided || submission?.status === 'submitted' || submission?.status === 'under_review';
  const uploaded = new Set((data?.documents || []).map(document => document.document_type));
  const requiresCac = Boolean(data?.policy.businessTypes.find(entry => entry.value === form.businessType)?.requiresCac);
  const missing = (data?.policy.requiredDocuments || []).filter(type => !uploaded.has(type));

  async function save(submit: boolean) {
    if (!farmId) return;
    setBusy(submit ? 'submit' : 'save'); setError(''); setMessage('');
    try {
      const result = await api<{ submissionId:string; status:string; bankMatchNote:string }>('/api/farmer/verification', {
        method:'POST',
        body: JSON.stringify({ farmId, ...form, identityNumber: form.identityNumber.trim(), submit }),
      });
      setMessage(submit ? 'Verification submitted for review.' : `Saved. ${result.bankMatchNote}`);
      await load();
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(''); }
  }

  async function upload(documentType: string) {
    if (!submission?.id) { setError('Save your details before uploading documents.'); return; }
    const picked = await DocumentPicker.getDocumentAsync({ type:['image/jpeg','image/png','image/webp','application/pdf'], copyToCacheDirectory:true });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    if (asset.size && asset.size > (data?.policy.maxDocumentBytes || 6291456)) { setError('Each document must be 6 MB or smaller.'); return; }
    setBusy(documentType); setError(''); setMessage('');
    try {
      const body = new FormData();
      body.append('file', multipartFile(asset.uri));
      body.append('submissionId', submission.id);
      body.append('documentType', documentType);
      await api('/api/farmer/verification/document', { method:'POST', body });
      setMessage(`${DOCUMENT_LABELS[documentType]} uploaded.`);
      await load();
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(''); }
  }

  const statusBanner = () => {
    if (data?.farm.exempt) return { icon:BadgeCheck, tone:theme.primary, title:'Already verified', copy:'This farm was verified before documented checks were introduced, so no submission is required.' };
    if (submission?.status === 'approved') return { icon:BadgeCheck, tone:theme.primary, title:'Verified', copy:'This farm is verified. You can list produce and receive payouts.' };
    if (submission?.status === 'under_review') return { icon:Clock3, tone:'#c58d00', title:'Under review', copy:'A reviewer is checking your documents. We will notify you as soon as there is a decision.' };
    if (submission?.status === 'submitted') return { icon:Clock3, tone:'#c58d00', title:'Submitted', copy:'Your documents are queued for review.' };
    if (submission?.status === 'rejected') return { icon:X, tone:'#a94335', title:'Not approved', copy:submission.review_note || 'Please correct the details and submit again.' };
    return { icon:ShieldCheck, tone:theme.primary, title:'Verification required', copy:'Confirm who owns this farm before you can sell produce or receive payouts.' };
  };
  const banner = statusBanner();
  const BannerIcon = banner.icon;

  return <Screen>
    <View style={[styles.topbar, { backgroundColor:theme.surface, borderBottomColor:theme.border }]}>
      <Tap accessibilityLabel="Go back" hitSlop={12} onPress={() => router.canGoBack() ? router.back() : router.replace('/workspace')} style={[styles.back, { backgroundColor:theme.background, borderColor:theme.border }]}><ChevronLeft size={22} color={theme.text} /></Tap>
      <Text style={[styles.topTitle, { color:theme.text }]}>Farm verification</Text>
    </View>

    <View style={styles.content}>
      {!data ? <ActivityIndicator color={theme.primary} style={{ marginTop:40 }} /> : <>
        <View style={[styles.banner, { backgroundColor:theme.surface, borderColor:theme.border }]}>
          <View style={[styles.bannerIcon, { backgroundColor:theme.surfaceAlt }]}><BannerIcon size={22} color={banner.tone} /></View>
          <View style={{ flex:1 }}>
            <Text style={[styles.bannerTitle, { color:theme.text }]}>{banner.title}</Text>
            <Text style={[styles.bannerCopy, { color:theme.muted }]}>{banner.copy}</Text>
            <Text style={[styles.bannerFarm, { color:theme.primary }]}>{data.farm.name}</Text>
          </View>
        </View>

        {data.farm.exempt ? null : <>
          <Text style={[styles.sectionTitle, { color:theme.text }]}>Who owns this farm</Text>
          <Text style={[styles.sectionCopy, { color:theme.muted }]}>Enter the names exactly as they appear on the identity document. We store only the last four digits of the number.</Text>

          <View style={styles.row}>
            <View style={{ flex:1 }}><Field label="First name" theme={theme} value={form.legalFirstName} editable={!locked} onChange={value => setForm({ ...form, legalFirstName:value })} /></View>
            <View style={{ flex:1 }}><Field label="Last name" theme={theme} value={form.legalLastName} editable={!locked} onChange={value => setForm({ ...form, legalLastName:value })} /></View>
          </View>
          <DateOfBirthPicker value={form.dateOfBirth} disabled={locked} onChange={value => setForm({ ...form, dateOfBirth:value })} />

          <SelectDropdown label="IDENTITY DOCUMENT" disabled={locked} value={form.identityType} options={data.policy.identityTypes.map(entry => ({ label:entry.label, value:entry.value }))} onChange={value => setForm({ ...form, identityType:value })} />
          <Field label={submission?.identity_number_last4 ? `Identity number (saved ending ${submission.identity_number_last4})` : 'Identity number'} theme={theme} value={form.identityNumber} editable={!locked} onChange={value => setForm({ ...form, identityNumber:value })} placeholder="Enter the number on the document" />

          <SelectDropdown label="HOW THE FARM IS REGISTERED" disabled={locked} value={form.businessType} options={data.policy.businessTypes.map(entry => ({ label:entry.label, value:entry.value }))} onChange={value => setForm({ ...form, businessType:value })} />
          {requiresCac ? <Field label="CAC registration number" theme={theme} value={form.cacNumber} editable={!locked} onChange={value => setForm({ ...form, cacNumber:value })} placeholder="RC1234567" /> : null}

          {data.payoutAccountName ? <View style={[styles.bankNote, { backgroundColor:theme.surfaceAlt, borderColor:theme.border }]}>
            <FileCheck2 size={17} color={submission?.bank_matched === false ? '#a94335' : theme.primary} />
            <Text style={[styles.bankCopy, { color:theme.muted }]}>{submission?.bank_match_note || `Your payout account is held by ${data.payoutAccountName}. The name must match the identity document.`}</Text>
          </View> : null}

          {!locked ? <Tap disabled={Boolean(busy)} onPress={() => void save(false)} style={[styles.secondary, { borderColor:theme.primary }]}>
            {busy === 'save' ? <ActivityIndicator color={theme.primary} /> : <Text style={{ color:theme.primary, fontWeight:'900' }}>Save details</Text>}
          </Tap> : null}

          <Text style={[styles.sectionTitle, { color:theme.text, marginTop:26 }]}>Documents</Text>
          <Text style={[styles.sectionCopy, { color:theme.muted }]}>JPG, PNG, WebP, or PDF up to 6 MB. Only reviewers can open them, and every view is recorded.</Text>
          {[...data.policy.requiredDocuments, ...data.policy.optionalDocuments].map(type => {
            const done = uploaded.has(type);
            const required = data.policy.requiredDocuments.includes(type);
            return <Tap key={type} disabled={locked || Boolean(busy) || !submission?.id} onPress={() => void upload(type)} style={[styles.document, { backgroundColor:theme.surface, borderColor:done ? theme.primary : theme.border, opacity:locked || !submission?.id ? .6 : 1 }]}>
              <View style={[styles.documentIcon, { backgroundColor:theme.surfaceAlt }]}>{busy === type ? <ActivityIndicator size="small" color={theme.primary} /> : done ? <Check size={18} color={theme.primary} /> : <Upload size={18} color={theme.muted} />}</View>
              <View style={{ flex:1 }}>
                <Text style={[styles.documentTitle, { color:theme.text }]}>{DOCUMENT_LABELS[type]}</Text>
                <Text style={[styles.documentMeta, { color:theme.muted }]}>{done ? 'Uploaded' : required ? 'Required' : 'Optional'}</Text>
              </View>
            </Tap>;
          })}
          {!submission?.id ? <Text style={[styles.hint, { color:theme.muted }]}>Save your details first to enable document uploads.</Text> : null}

          {!locked ? <Tap disabled={Boolean(busy) || missing.length > 0} onPress={() => void save(true)} style={[styles.primary, { backgroundColor:theme.primary, opacity:missing.length ? .5 : 1 }]}>
            {busy === 'submit' ? <ActivityIndicator color={theme.primaryText} /> : <><ShieldCheck size={18} color={theme.primaryText} /><Text style={{ color:theme.primaryText, fontWeight:'900' }}>Submit for review</Text></>}
          </Tap> : null}
          {missing.length && !locked ? <Text style={[styles.hint, { color:theme.muted }]}>Still needed: {missing.map(type => DOCUMENT_LABELS[type]).join(', ')}</Text> : null}
        </>}

        {message ? <Text style={[styles.success, { color:theme.primary, backgroundColor:theme.surfaceAlt }]}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </>}
    </View>
  </Screen>;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * A date of birth chosen from lists rather than typed. The document date has to match exactly, and
 * asking someone to type YYYY-MM-DD on a phone keyboard invites the format mistakes that get a
 * verification rejected.
 */
function DateOfBirthPicker({ value, onChange, disabled }: { value:string; onChange:(value:string)=>void; disabled?:boolean }) {
  const [year, month, day] = value.split('-');
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 83 }, (_, index) => String(thisYear - 18 - index));
  const daysInMonth = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, index) => String(index + 1).padStart(2, '0'));
  const set = (next: { y?:string; m?:string; d?:string }) => {
    const y = next.y ?? year ?? '';
    const m = next.m ?? month ?? '';
    let d = next.d ?? day ?? '';
    // Moving to a shorter month must not leave an impossible day behind.
    if (y && m && d && Number(d) > new Date(Number(y), Number(m), 0).getDate()) d = String(new Date(Number(y), Number(m), 0).getDate()).padStart(2, '0');
    onChange(y && m && d ? `${y}-${m}-${d}` : '');
  };
  return <View style={styles.dobRow}>
    <View style={styles.dobDay}><SelectDropdown label="DAY" disabled={disabled} value={day || ''} options={days.map(item => ({ label:String(Number(item)), value:item }))} onChange={next => set({ d:next })} /></View>
    <View style={styles.dobMonth}><SelectDropdown label="MONTH" disabled={disabled} value={month || ''} options={MONTHS.map((name, index) => ({ label:name, value:String(index + 1).padStart(2, '0') }))} onChange={next => set({ m:next })} /></View>
    <View style={styles.dobYear}><SelectDropdown label="YEAR" disabled={disabled} value={year || ''} options={years.map(item => ({ label:item, value:item }))} onChange={next => set({ y:next })} /></View>
  </View>;
}

function Field({ label, value, onChange, theme, editable = true, placeholder }: { label:string; value:string; onChange:(value:string)=>void; theme:{ text:string; muted:string; surface:string; border:string }; editable?:boolean; placeholder?:string }) {
  return <View style={styles.field}>
    <Text style={[styles.label, { color:theme.muted }]}>{label.toUpperCase()}</Text>
    <TextInput value={value} onChangeText={onChange} editable={editable} placeholder={placeholder} placeholderTextColor={theme.muted} style={[styles.input, { color:theme.text, backgroundColor:theme.surface, borderColor:theme.border, opacity:editable ? 1 : .65 }]} />
  </View>;
}

const styles = StyleSheet.create({
  topbar:{height:70,paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1},back:{width:42,height:42,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center'},topTitle:{fontFamily:'serif',fontSize:22,fontWeight:'600'},
  content:{paddingHorizontal:18,paddingTop:16},
  banner:{padding:14,borderWidth:1,borderRadius:15,flexDirection:'row',gap:12,alignItems:'flex-start'},bannerIcon:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center'},bannerTitle:{fontSize:16,fontWeight:'900'},bannerCopy:{fontSize:13,lineHeight:19,marginTop:3},bannerFarm:{fontSize:12,fontWeight:'800',marginTop:7},
  sectionTitle:{fontFamily:'serif',fontSize:22,fontWeight:'600',marginTop:24},sectionCopy:{fontSize:13,lineHeight:19,marginTop:5,marginBottom:10},
  row:{flexDirection:'row',gap:10},dobRow:{flexDirection:'row',gap:8,alignItems:'flex-end'},dobDay:{width:86},dobMonth:{flex:1},dobYear:{width:104},field:{marginTop:12},label:{fontSize:10,fontWeight:'900',letterSpacing:.8,marginTop:14,marginBottom:7},
  input:{minHeight:48,paddingHorizontal:13,borderWidth:1,borderRadius:11,fontSize:15,outlineWidth:0,outlineColor:'transparent'},
  bankNote:{marginTop:14,padding:12,borderWidth:1,borderRadius:11,flexDirection:'row',gap:9,alignItems:'flex-start'},bankCopy:{flex:1,fontSize:12,lineHeight:18},
  document:{minHeight:64,marginTop:9,padding:12,borderWidth:1,borderRadius:12,flexDirection:'row',alignItems:'center',gap:11},documentIcon:{width:40,height:40,borderRadius:11,alignItems:'center',justifyContent:'center'},documentTitle:{fontSize:14,fontWeight:'800'},documentMeta:{fontSize:11,marginTop:2},
  primary:{minHeight:52,marginTop:20,borderRadius:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
  secondary:{minHeight:48,marginTop:18,borderWidth:1.5,borderRadius:12,alignItems:'center',justifyContent:'center'},
  hint:{fontSize:12,lineHeight:18,marginTop:9},
  success:{marginTop:14,padding:12,borderRadius:10,fontSize:13,fontWeight:'700'},
  error:{marginTop:14,padding:12,borderRadius:10,color:'#ad4437',backgroundColor:'#fbece8',fontSize:13},
});
