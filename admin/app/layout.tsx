import type { Metadata } from 'next';
import './styles.css';
export const metadata: Metadata={title:'Solid Rock · Church Operations',description:'Staff-only content and community administration'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
