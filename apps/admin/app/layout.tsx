import "./style.css";
export const metadata = { title: "Solid Rock | Church office" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
