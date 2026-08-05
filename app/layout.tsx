import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';

import { Cabecalho } from '@/components/cabecalho';
import { Consentimento } from '@/components/consentimento';
import { Rodape } from '@/components/rodape';
import { PERMITIR_INDEXACAO, SITE } from '@/lib/site';

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
  // Necessário para as URLs canônicas e de Open Graph saírem absolutas.
  metadataBase: new URL(SITE.url),
  title: SITE.nome,
  description: 'Portal editorial de vinho.',

  // Sai de `PERMITIR_INDEXACAO` em `lib/site.ts`, o mesmo interruptor que o
  // `app/robots.ts` lê. **Não editar aqui:** trocar a constante é o que põe o
  // site no ar para os buscadores, e é um interruptor só de propósito.
  robots: PERMITIR_INDEXACAO ? undefined : { index: false, follow: false },
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
      <body>
        <Cabecalho />
        {children}
        <Rodape />

        {/* No fim do documento: o banner não bloqueia a leitura, e o teclado o
            alcança depois do rodapé em vez de antes do conteúdo. Não renderiza
            nada sem `NEXT_PUBLIC_GA_ID`. */}
        <Consentimento />
      </body>
    </html>
  );
}
