import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

// Both artwork sets are drawn on this ground, so a category row reads as one set rather than a mix
// of illustration styles. The tile that hosts this paints the same colour behind it in both themes.
export const CATEGORY_GROUND = '#d5e8d0';

// The twelve categories added in migration 041 each carry their own illustration, cut out on
// transparency so the tile ground shows through.
const illustrations = {
  'legumes-pulses': require('@/assets/images/categories/legumes-pulses.png'),
  'nuts-seeds': require('@/assets/images/categories/nuts-seeds.png'),
  'herbs-spices': require('@/assets/images/categories/herbs-spices.png'),
  'leafy-greens': require('@/assets/images/categories/leafy-greens.png'),
  'peppers-chillies': require('@/assets/images/categories/peppers-chillies.png'),
  mushrooms: require('@/assets/images/categories/mushrooms.png'),
  'oils-palm-produce': require('@/assets/images/categories/oils-palm-produce.png'),
  'fish-aquaculture': require('@/assets/images/categories/fish-aquaculture.png'),
  'livestock-meat': require('@/assets/images/categories/livestock-meat.png'),
  'dairy-products': require('@/assets/images/categories/dairy-products.png'),
  'honey-bee-products': require('@/assets/images/categories/honey-bee-products.png'),
  'seedlings-planting-material': require('@/assets/images/categories/seedlings-planting-material.png'),
} as const;

/**
 * Order is load-bearing, because several of these terms sit inside one another. Seedlings claim
 * "planting" and "seed" before nuts and seeds can; oils claim "coconut" and "groundnut" before the
 * bare "nut"; livestock claims "beef" before bee products can read the "bee" inside it.
 */
const illustrated: { match: string[]; key: keyof typeof illustrations }[] = [
  { match: ['seedling', 'planting', 'nursery', 'cutting', 'seed yam'], key: 'seedlings-planting-material' },
  { match: ['oil', 'palm', 'shea', 'coconut'], key: 'oils-palm-produce' },
  { match: ['nut', 'seed', 'cashew', 'sesame', 'tigernut'], key: 'nuts-seeds' },
  { match: ['legume', 'pulse', 'bean', 'cowpea', 'bambara'], key: 'legumes-pulses' },
  { match: ['herb', 'spice', 'ginger', 'garlic', 'turmeric', 'seasoning'], key: 'herbs-spices' },
  { match: ['leafy', 'leaf', 'ugwu', 'spinach', 'waterleaf'], key: 'leafy-greens' },
  { match: ['pepper', 'chilli', 'chili', 'tatashe', 'shombo', 'bonnet'], key: 'peppers-chillies' },
  { match: ['mushroom'], key: 'mushrooms' },
  { match: ['fish', 'aqua', 'seafood', 'catfish', 'tilapia'], key: 'fish-aquaculture' },
  { match: ['livestock', 'meat', 'beef', 'mutton', 'goat', 'ram', 'cattle'], key: 'livestock-meat' },
  { match: ['dairy', 'milk', 'yoghurt', 'yogurt', 'nono', 'wara'], key: 'dairy-products' },
  { match: ['honey', 'bee', 'apiary'], key: 'honey-bee-products' },
];

// The categories that shipped first still come from one 4x2 sheet of rendered produce.
const sheet: Record<string, { column: number; row: number }> = {
  all: { column: 0, row: 0 },
  eggs: { column: 1, row: 0 },
  fruits: { column: 2, row: 0 },
  grains: { column: 3, row: 0 },
  poultry: { column: 0, row: 1 },
  tubers: { column: 1, row: 1 },
  vegetables: { column: 2, row: 1 },
};

/**
 * Narrowed to what the sheet actually pictures. Pulses, seeds, leaves, peppers, herbs, mushrooms
 * and meat used to be routed here and borrowed a grain sack, a vegetable basket or a poultry plate;
 * they now have illustrations of their own and are matched before this runs.
 */
function sheetKey(category: string) {
  const value = category.trim().toLowerCase();
  if (value === 'all') return 'all';
  if (value.includes('egg')) return 'eggs';
  if (value.includes('fruit') || value.includes('plantain') || value.includes('banana') || value.includes('citrus')) return 'fruits';
  if (value.includes('grain') || value.includes('rice') || value.includes('cereal') || value.includes('maize')) return 'grains';
  if (value.includes('poultry') || value.includes('chicken') || value.includes('bird')) return 'poultry';
  if (value.includes('tuber') || value.includes('yam') || value.includes('cassava') || value.includes('root')) return 'tubers';
  if (value.includes('veget') || value.includes('green') || value.includes('salad')) return 'vegetables';
  return 'all';
}

export function CategoryArtwork({ category, size }: { category: string; size: number }) {
  const value = category.trim().toLowerCase();
  const illustration = illustrated.find((entry) => entry.match.some((term) => value.includes(term)));

  if (illustration) {
    return <View style={[styles.crop, { width: size, height: size }]}>
      <Image source={illustrations[illustration.key]} contentFit="contain" transition={220}
        style={{ width: size, height: size }} />
    </View>;
  }

  const position = sheet[sheetKey(category)];
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
     transition={220}/>
  </View>;
}

const styles = StyleSheet.create({
  crop: { overflow: 'hidden', backgroundColor: CATEGORY_GROUND, alignItems: 'center', justifyContent: 'center' },
});
