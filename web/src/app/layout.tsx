import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Oson Savdo POS - Do'kon Boshqaruv Tizimi",
  description: "POS kassa, ombor qoldig'i, nasiya daftari va moliya kirim-chiqim admin paneli",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
