import { forwardRef, ReactNode } from 'react';
import { Platform, StyleSheet, Text as NativeText, TextInput as NativeTextInput, TextInputProps, TextProps } from 'react-native';

const currencyFont = Platform.OS === 'web'
  ? 'Manrope_800ExtraBold, "Segoe UI", sans-serif'
  : 'Manrope_800ExtraBold';

function manropeFor(style: TextProps['style']) {
  const weight = String(StyleSheet.flatten(style)?.fontWeight || '400');
  if (weight === '800' || weight === '900') return 'Manrope_800ExtraBold';
  if (weight === '700' || weight === 'bold') return 'Manrope_700Bold';
  if (weight === '600') return 'Manrope_600SemiBold';
  if (weight === '500') return 'Manrope_500Medium';
  return 'Manrope_400Regular';
}
function georgiaFor(style: TextProps['style']) {
  const flat = StyleSheet.flatten(style);
  const bold = ['600', '700', '800', '900', 'bold'].includes(String(flat?.fontWeight || '400'));
  const italic = flat?.fontStyle === 'italic';
  return bold ? (italic ? 'Georgia_BoldItalic' : 'Georgia_Bold') : (italic ? 'Georgia_Italic' : 'Georgia_Regular');
}
function containsNaira(value: ReactNode): boolean {
  return typeof value === 'string' ? value.includes('\u20A6') : Array.isArray(value) ? value.some(containsNaira) : false;
}
export function Text({ style, children, ...props }: TextProps) {
  const editorial = StyleSheet.flatten(style)?.fontFamily === 'serif';
  const currency = containsNaira(children);
  const resolved = currency ? [style, { fontFamily: currencyFont }] : editorial ? [style, { fontFamily: georgiaFor(style) }] : [{ fontFamily: manropeFor(style) }, style];
  return <NativeText {...props} style={resolved}>{children}</NativeText>;
}
export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function AppTextInput({ style, ...props }, ref) {
  return <NativeTextInput ref={ref} {...props} style={[{ fontFamily: 'Manrope_400Regular' }, style]} />;
});
