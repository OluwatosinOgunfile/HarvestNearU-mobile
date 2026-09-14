import type { TextStyle, ViewStyle } from 'react-native';

/**
 * The one page heading scale, so the five tabs cannot drift apart again.
 *
 * They had: Georgia Bold at 28 on Home, Georgia Bold at 31 on Shop, Georgia Regular at 35 on Orders,
 * Georgia Bold at 32 on Workspace and Georgia Regular at 35 on Account, with the subtitle present on
 * two of them and spaced differently on each. Four sizes and two weights for the same role.
 *
 * Every screen spreads these instead of restating them. The kicker was already identical everywhere
 * and is kept here so the whole block lives in one place.
 *
 * 30 rather than the largest of the old sizes because the titles have to fit. Measured in Georgia
 * Bold, "Manage your harvest" needs 324dp of the 356dp a 392dp screen leaves inside the gutters, and
 * 35 would have taken it to 378dp. Two lines is fine where a title genuinely is long, such as
 * "Sign in to HarvestNearU", which needs 376dp and wraps at any size worth using.
 */
/**
 * The block the heading sits in. Sharing the type without sharing the box left the three lines
 * starting at different heights and different distances from the edge: Shop inset the content by 14
 * at the top and 18 at the side, Orders and Account by 20 on every side, Workspace by 18. 18 is the
 * gutter the sticky header, the hero copy and every Section already use, so the page heading lines
 * up with the content below it.
 */
export const pageContent = { paddingHorizontal: 18, paddingTop: 18 } as ViewStyle;

export const pageHeading = {
  kicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 } as TextStyle,
  title: { fontFamily: 'Georgia_Bold', fontSize: 30, lineHeight: 35, marginTop: 6 } as TextStyle,
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 18 } as TextStyle,
};
