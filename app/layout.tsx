import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';

/**
 * As duas famílias do pacote do designer.
 *
 * `next/font/google` baixa os arquivos no build e os serve do nosso domínio —
 * nenhuma requisição ao Google em runtime, que é o que os mockups fazem com
 * `<link>` e não vale para produção.
 *
 * As duas são variáveis na origem, então um arquivo por família cobre todos os
 * pesos que o projeto usa: Cormorant 400 e 500, DM Sans 400, 500 e 700.
 *
 * **Cormorant nunca em bold.** 500 é o peso máximo do título — a fonte carrega
 * o eixo inteiro porque é variável, mas 600 e 700 não devem ser usados. Não há
 * como travar isso no carregamento; fica na revisão de código.
 */
const titulo = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fonte-titulo',
});

const corpo = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fonte-corpo',
});

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
    // As duas classes publicam `--fonte-titulo` e `--fonte-corpo`, que o
    // `globals.css` liga em `--dov-fonte-titulo` e `--dov-fonte-corpo`.
    <html lang="pt-BR" className={`${titulo.variable} ${corpo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
