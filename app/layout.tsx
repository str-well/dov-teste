import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Teste de hospedagem — Descubra o Vinho',
  description: 'Projeto descartável para validar Node.js + ISR na Hostinger.',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
