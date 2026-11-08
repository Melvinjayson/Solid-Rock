// Solid Rock Dublin website visual identity, observed 8 November 2026.
// Site font families: Poppins headings, Mulish body.
// Preserve the original church identity; Reveta governance does not override church branding.
export type ThemeMode = 'dark' | 'light';
export const palettes = {
  dark: {
    ink:'#F8F4E9', muted:'#C0B5A5', brand:'#C9A24A', blue:'#E6BF6B',
    pale:'#29231C', gold:'#C9A24A', background:'#100F0D', white:'#1D1915',
    border:'#3D352B', green:'#65C3AA', radius:18,
  },
  light: {
    ink:'#20160F', muted:'#655A4C', brand:'#5B3F16', blue:'#80601F',
    pale:'#F3ECDD', gold:'#C9A24A', background:'#FAF8F4', white:'#FFFFFF',
    border:'#E4DDD1', green:'#287D68', radius:18,
  },
} as const;
export const theme: {
  ink:string;muted:string;brand:string;blue:string;pale:string;gold:string;
  background:string;white:string;border:string;green:string;radius:number;
}={...palettes.dark};
export function setActiveTheme(mode:ThemeMode){Object.assign(theme,palettes[mode]);}
export const churchAssets={
  logoDark:'https://solidrockdublin.org/images/logo-white.png',
  logoLight:'https://solidrockdublin.org/images/logo-blue.png',
  worship:'https://solidrockdublin.org/images/DSC02972-scaled.jpg',
  community:'https://solidrockdublin.org/images/DSC02880-scaled.jpg',
  foodBank:'https://solidrockdublin.org/images/ministries/food-bank.jpg',
  sundaySchool:'https://solidrockdublin.org/images/ministries/youth-sunday-school.jpeg',
  spirituality:'https://solidrockdublin.org/images/ministries/spirituality.jpg',
} as const;
