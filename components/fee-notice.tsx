import { Info } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from './typography';
import { useApp } from '@/context/app-context';

export type FeePolicy = { rate: number; percent: number; label: string };
export const DEFAULT_FEE_POLICY: FeePolicy = { rate: 0.1, percent: 10, label: '10%' };

const naira = (value: number) => `₦${Math.round(value).toLocaleString('en-NG')}`;

/**
 * States the administration and processing fee beside the price a farmer is setting, and works out
 * what they will actually receive as they type, so the deduction is never a surprise at payout.
 */
export function FeeNotice({ price, fee = DEFAULT_FEE_POLICY }: { price: string; fee?: FeePolicy }) {
  const { theme } = useApp();
  const amount = Number(String(price).replace(/[^\d.]/g, ''));
  const receives = Number.isFinite(amount) && amount > 0 ? amount - amount * fee.rate : null;

  return <View style={[styles.notice, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
    <Info size={15} color={theme.primary} />
    <Text style={[styles.copy, { color: theme.muted }]}>
      A <Text style={{ color: theme.text, fontWeight: '800' }}>{fee.label}</Text> administration and processing fee is deducted from each sale.
      {receives === null
        ? ' The rate may be reviewed in future.'
        : <> You receive <Text style={{ color: theme.text, fontWeight: '800' }}>{naira(receives)}</Text> per unit sold. The rate may be reviewed in future.</>}
    </Text>
  </View>;
}

const styles = StyleSheet.create({
  notice: { marginTop: 10, padding: 11, borderWidth: 1, borderRadius: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  copy: { flex: 1, fontSize: 12, lineHeight: 18 },
});
