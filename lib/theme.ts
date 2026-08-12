export const palette = {
  green: '#17633f',
  greenDark: '#0d3b27',
  greenSoft: '#eaf4e8',
  mint: '#72b889',
  gold: '#efbe3e',
  orange: '#e86f3b',
  cream: '#f7f8f3',
  ink: '#14251b',
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
  dark: { background: '#101813', surface: '#18231c', surfaceAlt: '#223128', text: '#f1f5f2', muted: '#a4b0a8', border: '#33463a', primary: '#68ae80', primaryText: '#102217' },
};
