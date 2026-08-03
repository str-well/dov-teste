import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Descubra o Vinho',
  description: 'Portal editorial de vinho.',

  // Site em construção. REMOVER ANTES DO LANÇAMENTO —
  // está no checklist da Fase 5 do plano.
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
