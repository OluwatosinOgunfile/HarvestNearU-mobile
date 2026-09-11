import { Image } from 'expo-image';
import { Bean, Beef, Droplets, Fish, Flame, Flower, Leaf, Milk, Nut, Shell, Sprout, TreePalm } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { palette } from '@/lib/theme';

const artwork: Record<string, { column: number; row: number }> = {
  all: { column: 0, row: 0 },
  eggs: { column: 1, row: 0 },
  fruits: { column: 2, row: 0 },
  grains: { column: 3, row: 0 },
  poultry: { column: 0, row: 1 },
  tubers: { column: 1, row: 1 },
  vegetables: { column: 2, row: 1 },
};

// Categories the photographic sheet does not cover get their own drawn mark, so a farm selling
// catfish or honey is never illustrated with somebody else's produce.
const marks: { match: string[]; Icon: typeof Leaf; tint: string }[] = [
  { match: ['legume', 'pulse', 'bean'], Icon: Bean, tint: palette.greenAccent },
  { match: ['nut', 'seedling', 'planting'], Icon: Nut, tint: palette.gold },
  { match: ['seed'], Icon: Sprout, tint: palette.greenAccent },
  { match: ['herb', 'spice'], Icon: Flower, tint: palette.greenAccent },
  { match: ['leafy', 'green'], Icon: Leaf, tint: palette.green },
  { match: ['pepper', 'chilli', 'chili'], Icon: Flame, tint: palette.orange },
  { match: ['mushroom'], Icon: Shell, tint: palette.muted },
  { match: ['oil', 'palm'], Icon: TreePalm, tint: palette.gold },
  { match: ['fish', 'aqua', 'seafood'], Icon: Fish, tint: palette.greenAccent },
  { match: ['livestock', 'meat', 'goat', 'ram', 'beef'], Icon: Beef, tint: palette.orange },
  { match: ['dairy', 'milk', 'yoghurt'], Icon: Milk, tint: palette.greenAccent },
  { match: ['honey', 'bee', 'apiary'], Icon: Droplets, tint: palette.gold },
];

function photographKey(category: string) {
  const value = category.trim().toLowerCase();
  if (value === 'all') return 'all';
  if (value.includes('egg')) return 'eggs';
  if (value.includes('fruit') || value.includes('plantain') || value.includes('banana') || value.includes('citrus')) return 'fruits';
  if (value.includes('grain') || value.includes('rice') || value.includes('cereal') || value.includes('maize')) return 'grains';
  if (value.includes('poultry') || value.includes('chicken') || value.includes('bird')) return 'poultry';
  if (value.includes('tuber') || value.includes('yam') || value.includes('cassava') || value.includes('root')) return 'tubers';
  if (value.includes('veget')) return 'vegetables';
  return null;
}

function markFor(category: string) {
  const value = category.trim().toLowerCase();
  return marks.find((mark) => mark.match.some((term) => value.includes(term))) || null;
}

export function CategoryArtwork({ category, size }: { category: string; size: number }) {
  const photograph = photographKey(category);

  if (!photograph) {
    const mark = markFor(category);
    const Icon = mark?.Icon || Sprout;
    const tint = mark?.tint || palette.green;
    return <View style={[styles.crop, styles.mark, { width: size, height: size }]}>
      <Icon size={Math.round(size * 0.46)} color={tint} strokeWidth={1.7} />
    </View>;
  }

  const position = artwork[photograph];
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
  mark: { alignItems: 'center', justifyContent: 'center' },
});
