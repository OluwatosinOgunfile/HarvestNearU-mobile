// Brand-documented roles come from BRAND.md; keep the two in step.
export const palette = {
  green: '#1f5b3a',
  greenAccent: '#2d7650',
  greenDark: '#0d3b27',
  greenSoft: '#eaf4e8',
  mint: '#72b889',
  gold: '#c58d00',
  // Harvest gold lightened for legibility over dark photography; BRAND.md documents no dark-surface gold.
  goldOnDark: '#efbe3e',
  // The solid gold call to action, matching the web landing buttons. Lighter than the documented
  // brand gold, which is what lets the dark green ink below reach 7.9:1 on it. BRAND.md records only
  // the darker #C58D00, so record this there too if it becomes the standard button colour.
  goldButton: '#f0c354',
  goldButtonInk: '#183622',
  orange: '#e9763d',
  cream: '#f7f8f3',
  night: '#111713',
  ink: '#17231b',
  muted: '#68766d',
  white: '#ffffff',
  line: '#dce4da',
  danger: '#a94335',
};

export type AppTheme = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primaryText: string;
};

export const themes: Record<'light' | 'dark', AppTheme> = {
  light: { background: palette.cream, surface: palette.white, surfaceAlt: '#eff4ec', text: palette.ink, muted: palette.muted, border: palette.line, primary: palette.green, primaryText: palette.white },
  dark: { background: palette.night, surface: '#18231c', surfaceAlt: '#223128', text: '#f1f5f2', muted: '#a4b0a8', border: '#33463a', primary: '#68ae80', primaryText: '#102217' },
};
