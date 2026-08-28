import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, ChevronLeft, ImagePlus, Save, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/screen';
import { SelectDropdown } from '@/components/select-dropdown';
import { Text, TextInput } from '@/components/typography';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api';

type Option = { id: string; name: string; verification_status?: string };

export default function Listing() {
  const router = useRouter();
  const { theme } = useApp();
  const [farms, setFarms] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [form, setForm] = useState({ farmId:'', categoryId:'', name:'', unit:'', price:'', stock:'', harvestDate:new Date().toISOString().slice(0,10), badge:'' });
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assisting, setAssisting] = useState(false);
  const [notes, setNotes] = useState('');
  const [photoNote, setPhotoNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { api<{farms:Option[];categories:Option[]}>('/api/farmer/dashboard').then((data) => {
    setFarms(data.farms || []); setCategories(data.categories || []);
    const farm = data.farms?.find((item) => item.verification_status === 'verified');
    setForm((value) => ({ ...value, farmId:farm?.id || '', categoryId:data.categories?.[0]?.id || '' }));
  }).catch((reason) => setError((reason as Error).message)).finally(() => setLoading(false)); }, []);
  const set = (key:keyof typeof form) => (value:string) => setForm((current) => ({ ...current, [key]:value }));

  async function chooseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('Allow photo access to select a produce picture.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes:['images'], quality:.8, allowsEditing:true, aspect:[4,3], base64:true });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 3 * 1024 * 1024) { setError('Choose a produce picture smaller than 3 MB.'); return; }
    setError(''); setImage(asset); setPhotoNote('Checking picture quality...');
    api<{quality:string;warnings:string[];categoryId?:string}>('/api/ai/assist',{method:'POST',body:JSON.stringify({feature:'photo',input:asset.fileName||form.name||'produce picture',metadata:{width:asset.width,height:asset.height,fileSize:asset.fileSize||0}})}).then(check=>{setPhotoNote(check.warnings?.[0]||'Picture size and framing look ready for the marketplace.');if(check.categoryId&&!form.categoryId)setForm(value=>({...value,categoryId:check.categoryId!}))}).catch(()=>setPhotoNote('Picture selected. You can continue without the smart check.'));
  }

  async function assist(){if(!notes.trim()){setError('Describe the produce, packaging, and when it was harvested.');return}setAssisting(true);setError('');try{const suggestion=await api<{title:string;unit:string;badge:string;categoryId:string}>('/api/ai/assist',{method:'POST',body:JSON.stringify({feature:'listing',input:notes})});setForm(value=>({...value,name:suggestion.title||value.name,unit:suggestion.unit||value.unit,badge:suggestion.badge||value.badge,categoryId:suggestion.categoryId||value.categoryId}))}catch(reason){setError((reason as Error).message)}finally{setAssisting(false)}}

  async function save() {
    if (!image) { setError('Select a produce picture before publishing.'); return; }
    if (!image.base64) { setError('The selected picture could not be read. Please choose it again.'); return; }
    if (!form.farmId || !form.categoryId) { setError('Select a verified farm and produce category.'); return; }
    setSaving(true); setError(''); let uploadedUrl = '';
    try {
      const uploaded = await api<{url:string}>('/api/uploads/listing-image', { method:'POST', body:JSON.stringify({ imageBase64:image.base64, mimeType:image.mimeType || 'image/jpeg', fileName:image.fileName || 'produce-picture.jpg' }) });
      uploadedUrl = uploaded.url;
      await api('/api/farmer/dashboard', { method:'POST', body:JSON.stringify({ ...form, imageUrl:uploaded.url }) });
      router.back();
    } catch (reason) {
      if (uploadedUrl) void api('/api/uploads/listing-image', { method:'DELETE', body:JSON.stringify({ url:uploadedUrl }) }).catch(() => {});
      setError((reason as Error).message);
    } finally { setSaving(false); }
  }

  const verifiedFarms = farms.filter((item) => item.verification_status === 'verified');
  return <Screen><View style={styles.header}><Pressable onPress={() => router.back()} style={[styles.back,{borderColor:theme.border}]}><ChevronLeft size={22} color={theme.text}/></Pressable><View><Text style={[styles.eyebrow,{color:theme.primary}]}>FARM INVENTORY</Text><Text style={[styles.title,{color:theme.text}]}>Add produce listing</Text></View></View>
    {loading ? <ActivityIndicator color={theme.primary} style={{marginTop:70}}/> : <View style={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <SelectDropdown label="Verified farm" value={form.farmId} options={verifiedFarms.map((item) => ({ label:item.name, value:item.id }))} onChange={set('farmId')}/>
      <SelectDropdown label="Produce category" value={form.categoryId} options={categories.map((item) => ({ label:item.name, value:item.id }))} onChange={set('categoryId')}/>
      <View style={[styles.assistant,{backgroundColor:theme.surfaceAlt,borderColor:theme.border}]}><View style={styles.assistantTitle}><Image source={require('@/assets/images/amara-avatar.png')} style={styles.assistantAvatar}/><View><Text style={[styles.uploadTitle,{color:theme.text}]}>Ask Amara</Text><Text style={[styles.assistantRole,{color:theme.primary}]}>LISTING GUIDE</Text></View></View><Text style={{color:theme.muted,lineHeight:19}}>Describe the produce in your own words. Amara will suggest details for you to review before publishing.</Text><TextInput multiline value={notes} onChangeText={setNotes} placeholder="Example: fresh tomatoes harvested today, sold by basket" placeholderTextColor={theme.muted} style={[styles.notes,{color:theme.text,borderColor:theme.border,backgroundColor:theme.background}]}/><Pressable disabled={assisting} onPress={()=>void assist()} style={[styles.assistButton,{backgroundColor:theme.primary}]}>{assisting?<ActivityIndicator color={theme.primaryText}/>:<><Sparkles size={16} color={theme.primaryText}/><Text style={{color:theme.primaryText,fontWeight:'900'}}>Ask Amara to suggest details</Text></>}</Pressable></View>
      <View style={[styles.card,{backgroundColor:theme.surface,borderColor:theme.border}]}>
        <Field theme={theme} label="Listing title" value={form.name} onChangeText={set('name')}/>
        <View style={styles.row}><Field theme={theme} label="Unit" value={form.unit} placeholder="basket" onChangeText={set('unit')}/><Field theme={theme} label="Price (NGN)" value={form.price} keyboardType="numeric" onChangeText={set('price')}/></View>
        <View style={styles.row}><Field theme={theme} label="Stock quantity" value={form.stock} keyboardType="numeric" onChangeText={set('stock')}/><Field theme={theme} label="Harvest date" value={form.harvestDate} placeholder="YYYY-MM-DD" onChangeText={set('harvestDate')}/></View>
        <Field theme={theme} label="Badge (optional)" value={form.badge} onChangeText={set('badge')}/>
        <Pressable onPress={() => void chooseImage()} style={[styles.upload,{borderColor:theme.primary,backgroundColor:theme.surfaceAlt}]}>{image ? <Image source={{uri:image.uri}} style={styles.preview}/> : <View style={styles.imageIcon}><ImagePlus size={26} color={theme.primary}/></View>}<View style={{flex:1}}><Text style={[styles.uploadTitle,{color:theme.text}]}>{image ? 'Change produce picture' : 'Choose produce picture'}</Text><Text style={{color:theme.muted}}>JPG, PNG, or WebP up to 3 MB</Text></View><Camera size={20} color={theme.primary}/></Pressable>{photoNote?<Text style={[styles.photoNote,{color:theme.muted}]}>{photoNote}</Text>:null}
        <Pressable disabled={saving} onPress={() => void save()} style={[styles.save,{backgroundColor:theme.primary}]}>{saving ? <ActivityIndicator color={theme.primaryText}/> : <><Save size={18} color={theme.primaryText}/><Text style={{color:theme.primaryText,fontWeight:'800'}}>Publish listing</Text></>}</Pressable>
      </View>
    </View>}
  </Screen>;
}

function Field({theme,label,...props}:{theme:any;label:string;[key:string]:any}) { return <View style={{flex:1}}><Text style={[styles.fieldLabel,{color:theme.muted}]}>{label}</Text><TextInput {...props} placeholderTextColor={theme.muted} style={[styles.input,{color:theme.text,borderColor:theme.border,backgroundColor:theme.background}]}/></View>; }
const styles=StyleSheet.create({header:{height:94,paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:13},back:{width:42,height:42,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center'},eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.1},title:{fontFamily:'Georgia_Regular',fontSize:27},content:{padding:18},error:{padding:12,color:'#a84335',backgroundColor:'#fff0ed',borderRadius:10,marginBottom:13},assistant:{padding:15,borderWidth:1,borderRadius:15,marginBottom:14},assistantTitle:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:8},assistantAvatar:{width:44,height:44,borderRadius:15},assistantRole:{fontSize:9,fontWeight:'900',letterSpacing:.8},notes:{minHeight:76,borderWidth:1,borderRadius:10,padding:11,fontSize:14,textAlignVertical:'top',marginTop:11},assistButton:{minHeight:44,paddingHorizontal:12,borderRadius:10,marginTop:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},card:{padding:16,borderWidth:1,borderRadius:16},row:{flexDirection:'row',gap:9},fieldLabel:{fontSize:11,fontWeight:'800',marginBottom:6},input:{height:48,borderWidth:1,borderRadius:10,paddingHorizontal:12,fontSize:14,marginBottom:13},upload:{minHeight:78,padding:10,borderWidth:1,borderStyle:'dashed',borderRadius:12,flexDirection:'row',alignItems:'center',gap:11},imageIcon:{width:52,height:52,alignItems:'center',justifyContent:'center'},preview:{width:58,height:58,borderRadius:9},uploadTitle:{fontSize:13,fontWeight:'800',marginBottom:3},photoNote:{fontSize:12,lineHeight:18,marginTop:7},save:{height:50,marginTop:15,borderRadius:11,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8}});
