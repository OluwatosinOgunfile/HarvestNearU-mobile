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

function categoryKey(category: string) {
  const value = category.trim().toLowerCase();
  if (value.includes('egg')) return 'eggs';
  if (value.includes('fruit')) return 'fruits';
  if (value.includes('grain') || value.includes('rice')) return 'grains';
  if (value.includes('poultry') || value.includes('chicken') || value.includes('bird')) return 'poultry';
  if (value.includes('tuber') || value.includes('yam') || value.includes('cassava')) return 'tubers';
  if (value === 'all') return 'all';
  return 'vegetables';
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
