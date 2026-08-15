import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { absoluteUrl } from '@/lib/api';

export function ListingImage({
  uri,
  style,
}: {
  uri?: string;
  category: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  recyclingKey?: string;
}) {
  return <View style={[styles.frame, style]}>
    {uri ? <Image
      key={uri}
      source={{ uri: absoluteUrl(uri) }}
      style={styles.remote}
      resizeMode="cover"
    /> : null}
  </View>;
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  remote: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%', zIndex: 1 },
});
