import { Image } from 'expo-image';
import { Droplets, Fish, Milk, TreePalm } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

// The illustration sheet is a photographic 3D render set on this ground. Anything drawn in place of
// a photograph sits on the same colour in both themes, so a category row reads as one set rather
// than a mix of artwork and interface chrome.
export const CATEGORY_GROUND = '#d5e8d0';
const SHEET_GROUND = CATEGORY_GROUND;
const MARK_TINT = '#1f5b3a';

const artwork: Record<string, { column: number; row: number }> = {
  all: { column: 0, row: 0 },
  eggs: { column: 1, row: 0 },
  fruits: { column: 2, row: 0 },
  grains: { column: 3, row: 0 },
  poultry: { column: 0, row: 1 },
  tubers: { column: 1, row: 1 },
  vegetables: { column: 2, row: 1 },
};

/**
 * Maps a category onto the closest illustration that honestly depicts it: pulses and seeds onto the
 * grain sack and its bowl of seed, leaves, peppers, herbs and mushrooms onto the vegetable basket,
 * meat onto the poultry plate. Only produce the sheet does not show at all falls through.
 */
function photographKey(category: string) {
  const value = category.trim().toLowerCase();
  if (value === 'all') return 'all';
  if (value.includes('egg')) return 'eggs';
  if (value.includes('fruit') || value.includes('plantain') || value.includes('banana') || value.includes('citrus')) return 'fruits';
  if (value.includes('grain') || value.includes('rice') || value.includes('cereal') || value.includes('maize')
    || value.includes('legume') || value.includes('pulse') || value.includes('bean')
    || value.includes('nut') || value.includes('seed') || value.includes('planting')) return 'grains';
  if (value.includes('poultry') || value.includes('chicken') || value.includes('bird')
    || value.includes('livestock') || value.includes('meat') || value.includes('goat') || value.includes('ram')) return 'poultry';
  if (value.includes('tuber') || value.includes('yam') || value.includes('cassava') || value.includes('root')) return 'tubers';
  if (value.includes('veget') || value.includes('herb') || value.includes('spice') || value.includes('pepper')
    || value.includes('chilli') || value.includes('chili') || value.includes('leaf') || value.includes('green')
    || value.includes('mushroom')) return 'vegetables';
  return null;
}

// Produce the sheet does not picture at all. These want their own rendered illustrations; until
// then they carry a drawn mark on the sheet's ground rather than borrowing another category's food.
const marks: { match: string[]; Icon: typeof Fish }[] = [
  { match: ['fish', 'aqua', 'seafood'], Icon: Fish },
  { match: ['dairy', 'milk', 'yoghurt', 'nono', 'wara'], Icon: Milk },
  { match: ['honey', 'bee', 'apiary'], Icon: Droplets },
  { match: ['oil', 'palm', 'shea', 'coconut'], Icon: TreePalm },
];

function markFor(category: string) {
  const value = category.trim().toLowerCase();
  return marks.find((mark) => mark.match.some((term) => value.includes(term))) || null;
}

export function CategoryArtwork({ category, size }: { category: string; size: number }) {
  const photograph = photographKey(category);

  if (!photograph) {
    const Icon = markFor(category)?.Icon || TreePalm;
    return <View style={[styles.crop, styles.mark, { width: size, height: size }]}>
      <Icon size={Math.round(size * 0.44)} color={MARK_TINT} strokeWidth={1.5} />
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
     transition={220}/>
  </View>;
}

const styles = StyleSheet.create({
  crop: { overflow: 'hidden', backgroundColor: SHEET_GROUND },
  mark: { alignItems: 'center', justifyContent: 'center' },
});
