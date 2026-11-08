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
  logoDark:'https://solidrockdublin.org/_next/image?url=%2Fimages%2Flogo-white.png&w=256&q=80',
  logoLight:'https://solidrockdublin.org/_next/image?url=%2Fimages%2Flogo-blue.png&w=256&q=80',
  worship:'https://solidrockdublin.org/_next/image?url=%2Fimages%2FDSC02972-scaled.jpg&w=1080&q=80',
  community:'https://solidrockdublin.org/_next/image?url=%2Fimages%2FDSC02880-scaled.jpg&w=1080&q=80',
  foodBank:'https://solidrockdublin.org/_next/image?url=%2Fimages%2Fministries%2Ffood-bank.jpg&w=800&q=80',
  sundaySchool:'https://solidrockdublin.org/_next/image?url=%2Fimages%2Fministries%2Fyouth-sunday-school.jpeg&w=800&q=80',
  spirituality:'https://solidrockdublin.org/_next/image?url=%2Fimages%2Fministries%2Fspirituality.jpg&w=800&q=80',
} as const;
