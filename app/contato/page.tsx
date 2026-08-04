import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PaginaInstitucional } from '@/components/pagina-institucional';
import { paginaPorSlug } from '@/lib/wp';

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
 * Enquanto não existir, a página mostra o texto da redação: melhor que um
 * formulário que engole a mensagem sem enviar.
 */
export default async function Page() {
  const pagina = await paginaPorSlug(SLUG);

  if (!pagina) notFound();

  return (
    <PaginaInstitucional
      kicker="Contato"
      titulo={pagina.titulo}
      lead={pagina.resumo}
      aviso={
        <>
          <strong>O formulário ainda não está no ar.</strong> O envio de e-mail entra na
          Fase 4 do projeto, com a rota <code>/api/contato</code>. Até lá, esta página é
          informativa.
        </>
      }
    >
      <div dangerouslySetInnerHTML={{ __html: pagina.conteudoHtml }} />
    </PaginaInstitucional>
  );
}
