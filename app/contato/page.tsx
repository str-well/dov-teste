import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PaginaInstitucional } from '@/components/pagina-institucional';
import { paraTextoSimples, paginaPorSlug } from '@/lib/wp';

const SLUG = 'contato';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const pagina = await paginaPorSlug(SLUG);

  if (!pagina) return {};

  return {
    title: 'Contato',
    description: pagina.resumo || 'Fale com a redação do Descubra o Vinho.',
    alternates: { canonical: `/${SLUG}` },
  };
}

/**
 * Contato — `/contato`.
 *
 * Rota estática pelo mesmo motivo de `/quem-somos`: sem ela, `[categoria]`
 * captura o caminho e devolve 404.
 *
 * A página não tem prancha própria — reaproveita a casca institucional. O
 * conteúdo é um parágrafo no WordPress.
 *
 * **Falta o formulário.** A rota `/api/contato` com o Resend é da Fase 4.
 * Enquanto não existir, a página mostra o texto da redação — melhor que um
 * formulário que engole a mensagem sem enviar. A pendência fica aqui e no
 * `docs/PLANO-IMPLEMENTACAO.md`, não na tela do leitor.
 */
export default async function Page() {
  const pagina = await paginaPorSlug(SLUG);

  if (!pagina) notFound();

  // A página de contato é um parágrafo só, e o resumo que a API gera é aquele
  // mesmo parágrafo. Renderizar os dois mostraria o texto duas vezes — então o
  // corpo só entra quando diz algo além do olho.
  const corpo = paraTextoSimples(pagina.conteudoHtml);
  const repetido = corpo === pagina.resumo;

  return (
    <PaginaInstitucional kicker="Contato" titulo={pagina.titulo} lead={pagina.resumo}>
      {/* Nada de texto de enfeite aqui: não há formulário, endereço nem e-mail
          para oferecer, e as redes não estão confirmadas. Quando o cliente
          escrever mais na página do WordPress, o corpo aparece sozinho. */}
      {!repetido && <div dangerouslySetInnerHTML={{ __html: pagina.conteudoHtml }} />}
    </PaginaInstitucional>
  );
}
