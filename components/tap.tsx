import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

type TapStyle = StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
type TapProps = Omit<PressableProps, 'style'> & { style?: TapStyle };

/**
 * A Pressable that always answers a touch. Every control in the app uses this so a tap dims the
 * control immediately and rings on Android, rather than looking inert until the next screen
 * arrives. Callers keep passing the same style prop, including the function form.
 */
export function Tap({ style, disabled, android_ripple, ...props }: TapProps) {
  return <Pressable
    {...props}
    disabled={disabled}
    android_ripple={android_ripple === undefined ? { color: 'rgba(31,91,58,.13)' } : android_ripple}
    style={(state) => [
      typeof style === 'function' ? style(state) : style,
      state.pressed && !disabled ? styles.pressed : null,
    ]}
  />;
}

const styles = StyleSheet.create({ pressed: { opacity: .72 } });
