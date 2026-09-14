import type { TextStyle } from 'react-native';

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
export const pageHeading = {
  kicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 } as TextStyle,
  title: { fontFamily: 'Georgia_Bold', fontSize: 30, lineHeight: 35, marginTop: 6 } as TextStyle,
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 18 } as TextStyle,
};
