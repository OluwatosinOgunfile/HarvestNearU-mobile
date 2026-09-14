import { Image } from 'expo-image';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { absoluteUrl } from '@/lib/api';

// Produce photography is the heaviest thing on a card, so it loads through expo-image for its
// memory and disk cache, fades in over a tinted placeholder rather than popping, and passes the
// recycling key through so a scrolled list reuses views instead of flashing the previous photo.
export function ListingImage({
  uri,
  style,
  recyclingKey,
}: {
  uri?: string;
  category: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  recyclingKey?: string;
}) {
  return <View style={[styles.frame, style]}>
    {uri ? <Image
      source={{ uri: absoluteUrl(uri) }}
      style={styles.remote}
      contentFit="cover"
      transition={220}
      recyclingKey={recyclingKey || uri}
      placeholder={{ blurhash: 'L6B|W.00?bWB4n%MofRj00_3~qRj' }}
      placeholderContentFit="cover"
      cachePolicy="memory-disk"
      accessible={false}
    /> : null}
  </View>;
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#dfe7dc' },
  remote: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%', zIndex: 1 },
});
