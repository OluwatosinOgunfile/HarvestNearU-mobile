import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

const artwork: Record<string, { column: number; row: number }> = {
  all: { column: 0, row: 0 },
  eggs: { column: 1, row: 0 },
  fruits: { column: 2, row: 0 },
  grains: { column: 3, row: 0 },
  poultry: { column: 0, row: 1 },
  tubers: { column: 1, row: 1 },
  vegetables: { column: 2, row: 1 },
};

// The artwork sheet holds seven illustrations, so a category without a close match falls back to the
// mixed-produce basket rather than borrowing a picture that misdescribes it.
function categoryKey(category: string) {
  const value = category.trim().toLowerCase();
  if (value === 'all') return 'all';
  if (value.includes('egg')) return 'eggs';
  if (value.includes('fruit') || value.includes('plantain') || value.includes('banana') || value.includes('citrus')) return 'fruits';
  if (value.includes('grain') || value.includes('rice') || value.includes('cereal') || value.includes('maize')
    || value.includes('legume') || value.includes('pulse') || value.includes('bean')
    || value.includes('nut') || value.includes('seed')) return 'grains';
  if (value.includes('poultry') || value.includes('chicken') || value.includes('bird')) return 'poultry';
  if (value.includes('tuber') || value.includes('yam') || value.includes('cassava') || value.includes('root')) return 'tubers';
  if (value.includes('veget') || value.includes('herb') || value.includes('spice') || value.includes('pepper')
    || value.includes('leaf') || value.includes('green') || value.includes('mushroom')) return 'vegetables';
  return 'all';
}

export function CategoryArtwork({ category, size }: { category: string; size: number }) {
  const position = artwork[categoryKey(category)];
  const sheetSize = size * 4;
  const topOffset = position.row === 0 ? size * 0.67 : size * 1.91;

  return <View style={[styles.crop, { width: size, height: size }]}>
    <Image
      source={require('@/assets/images/category-artwork-sheet.png')}
      contentFit="fill"
      style={{
        position: 'absolute',
        width: sheetSize,
        height: sheetSize,
        transform: [
          { translateX: -position.column * size },
          { translateY: -topOffset },
        ],
      }}
    />
  </View>;
}

const styles = StyleSheet.create({
  crop: { overflow: 'hidden' },
});
