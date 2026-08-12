import { Platform, StyleProp, TextStyle } from 'react-native';
import { Text } from './typography';

const currencyFont = Platform.OS === 'web'
  ? 'Manrope_800ExtraBold, "Segoe UI", sans-serif'
  : 'Manrope_800ExtraBold';

export function Money({ value, style }: { value: number; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ fontFamily: currencyFont, fontWeight: '800' }, style]}>{`\u20A6${value.toLocaleString('en-NG')}`}</Text>;
}
