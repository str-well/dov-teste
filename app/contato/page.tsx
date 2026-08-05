import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FormContato } from '@/components/form-contato';
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
 * **O formulário existe desde que `/api/contato` existe.** A regra que segurava
 * ele continua valendo do outro lado: falha de envio mostra erro, nunca sucesso
 * falso. A mensagem não é gravada em lugar nenhum — se o envio falha, ela se
 * perde, então fingir que deu certo seria o pior defeito possível aqui.
 *
 * Ele **exige JavaScript**: a rota responde JSON, e sem JS o leitor veria
 * `{"ok":true}` numa tela branca. Anotado no plano como pendência de verdade.
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
      {/* O corpo do WordPress, quando diz algo além do olho. */}
      {!repetido && <div dangerouslySetInnerHTML={{ __html: pagina.conteudoHtml }} />}

      <FormContato />
    </PaginaInstitucional>
  );
}
