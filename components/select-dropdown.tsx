import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from './typography';
import { useApp } from '@/context/app-context';

type Option = { label: string; value: string };

export function SelectDropdown({ label, value, options, onChange, disabled = false }: { label: string; value: string; options: Option[]; onChange: (value: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const { theme } = useApp();
  const selected = options.find((option) => option.value === value);
  return <>
    <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open, disabled }} disabled={disabled} onPress={() => setOpen(true)} style={[styles.field, { backgroundColor: theme.surface, borderColor: open ? theme.primary : theme.border }, disabled && styles.disabled]}>
      <Text numberOfLines={1} style={[styles.value, { color: selected ? theme.text : theme.muted }]}>{selected?.label || `Select ${label.toLowerCase()}`}</Text>
      <ChevronDown size={19} color={theme.primary} />
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
        <Pressable onPress={(event) => event.stopPropagation()} style={[styles.menu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.menuTitle, { color: theme.text }]}>{label}</Text>
          <ScrollView style={[styles.list, { borderTopColor: theme.border }]}>
            {options.map((option) => <Pressable key={option.value} onPress={() => { onChange(option.value); setOpen(false); }} style={[styles.option, { borderBottomColor: theme.border }, option.value === value && { backgroundColor: theme.surfaceAlt }]}>
              <Text style={[styles.optionText, { color: theme.text }]}>{option.label}</Text>
              {option.value === value ? <Check size={18} color={theme.primary} /> : null}
            </Pressable>)}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}

const styles = StyleSheet.create({label:{fontSize:12,fontWeight:'800',marginBottom:7},field:{minHeight:50,paddingHorizontal:14,borderWidth:1,borderRadius:12,flexDirection:'row',alignItems:'center',gap:10,marginBottom:15},value:{flex:1,fontSize:14,fontWeight:'800'},disabled:{opacity:.55},backdrop:{flex:1,padding:22,justifyContent:'center',backgroundColor:'rgba(0,0,0,.55)'},menu:{maxHeight:'68%',borderWidth:1,borderRadius:18,overflow:'hidden'},menuTitle:{padding:18,fontFamily:'Georgia_Regular',fontSize:22},list:{borderTopWidth:1},option:{minHeight:52,paddingHorizontal:18,borderBottomWidth:1,flexDirection:'row',alignItems:'center',gap:10},optionText:{flex:1,fontSize:14,fontWeight:'700'}});
