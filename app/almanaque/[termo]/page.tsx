import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Busca } from '@/components/busca';
import { CaixaDestacada } from '@/components/caixa-destacada';
import { IconeSetaDireita, IconeSetaEsquerda } from '@/components/icones';
import { Migalhas } from '@/components/migalhas';
import { ALMANAQUE, SITE } from '@/lib/site';
import {
  categoriaPrincipal,
  listarVerbetes,
  materiasQueCitam,
  verbetePorSlug,
  verbetesPorIds,
  verbeteVizinhos,
  type Materia,
} from '@/lib/wp';

type Props = { params: Promise<{ termo: string }> };

/**
 * Verbete do Almanaque — `/almanaque/[termo]`.
 *
 * A linha de gramática é `classe · etimologia · pronúncia`: compõe com o que
 * existir e desaparece inteira quando os três faltam — o caso da maioria dos 22
 * verbetes. `dov_classe_gramatical` entrou no mu-plugin e já chega pela API,
 * vazio em todos, então a linha se comporta como antes até alguém preencher.
 *
 * **Uma coisa da prancha que a API ainda não entrega:** a caixa da lateral diz
 * "Buscar outro verbete", e uma busca restrita ao Almanaque é a do índice A–Z
 * com Fuse.js. A caixa aponta para a busca geral, com o texto ajustado para não
 * prometer um escopo que não existe.
 */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { termo } = await params;
  const verbete = await verbetePorSlug(termo);

  if (!verbete) return {};

  return {
    title: `${verbete.titulo} — Almanaque`,
    description:
      verbete.definicaoCurta || `O que é ${verbete.titulo}, no Almanaque do ${SITE.nome}.`,
    alternates: { canonical: `/almanaque/${termo}` },
    openGraph: {
      type: 'article',
      title: `${verbete.titulo} — Almanaque do ${SITE.nome}`,
      description: verbete.definicaoCurta,
      url: `/almanaque/${termo}`,
    },
  };
}

/**
 * Cinco minutos, declarado e não inferido.
 *
 * O Next deduz o `revalidate` da rota a partir dos `next: { revalidate }` dos
 * fetches — mas só consegue deduzir das páginas que ele renderiza no build, e
 * esta rota não pré-gera nenhuma. Sem a linha abaixo o valor fica implícito e
 * some da tabela de rotas, que é onde a gente confere.
 *
 * `dynamicParams` fica no padrão (`true`): verbete que não existia é gerado na
 * primeira visita.
 */
export const revalidate = 300;

/**
 * **Nenhum verbete é pré-gerado no build, e isso mudou com a importação.**
 *
 * Com 22 verbetes, pré-gerar todos era barato e era o que esta função fazia.
 * Com 141 deixou de ser: cada página dispara um `search=` no `/posts` para
 * montar "matérias que usam o termo", que no WordPress é `LIKE` sobre o corpo
 * do texto e não se repete entre verbetes — 141 consultas caras e distintas,
 * em rajada, num plano cujos processos PHP são divididos com o WordPress e
 * outros 6 sites de clientes. A API passou a responder 500 e o build morria.
 *
 * Não é só o nosso build que sofre: saturar os processos PHP durante o deploy
 * aparece como lentidão nos outros sites do plano. "Evitar consultas
 * desnecessárias não é otimização prematura, é requisito" — e 141 páginas
 * regeradas a cada deploy, quando o conteúdo mal muda, são desnecessárias.
 *
 * O custo: a primeira visita a cada verbete paga uma ida ao WordPress. Depois
 * disso o `revalidate` de 300s mantém a página estática, e o mu-plugin
 * revalida no save. É o mesmo mecanismo que já aceitamos para matéria
 * publicada depois do build.
 *
 * O índice `/almanaque` **continua pré-gerado** — ele é uma página só, e é por
 * onde quase todo mundo entra.
 */
export function generateStaticParams() {
  return [];
}

export default async function Page({ params }: Props) {
  const { termo } = await params;
  const verbete = await verbetePorSlug(termo);

  if (!verbete) notFound();

  const [relacionados, mencoes, vizinhos] = await Promise.all([
    verbetesPorIds(verbete.relacionados),
    // Busca do WordPress sobre título, resumo e corpo. Verbete cujo termo não
    // aparece escrito em nenhuma matéria devolve vazio, e isso é comum.
    materiasQueCitam(verbete.titulo, 4),
    verbeteVizinhos(verbete.slug),
  ]);

  const gramatica = [
    verbete.classeGramatical,
    verbete.etimologia,
    verbete.pronuncia && `pronuncia-se “${verbete.pronuncia}”`,
  ].filter(Boolean);

  return (
    <main>
      <article className="limite verbete">
        <div className="verbete__principal">
          <Migalhas
            className="verbete__migalhas"
            itens={[
              { rotulo: 'Home', href: '/' },
              { rotulo: 'Almanaque', href: ALMANAQUE.href },
              // A letra leva à seção do índice A–Z. O `id` casa com o que o
              // template do índice vai gerar.
              { rotulo: verbete.letra, href: `${ALMANAQUE.href}#letra-${verbete.letra.toLowerCase()}` },
              { rotulo: verbete.titulo },
            ]}
          />

          <div className="verbete__titulo-linha">
            {/* Decorativa: a letra já está no h1 e nas migalhas. */}
            <span className="verbete__inicial" aria-hidden="true">
              {verbete.letra}
            </span>
            <h1 className="verbete__termo">{verbete.titulo}</h1>
          </div>

          {gramatica.length > 0 && (
            <p className="verbete__gramatica">{gramatica.join(' · ')}</p>
          )}

          {verbete.definicaoCurta && (
            <p className="verbete__definicao">{verbete.definicaoCurta}</p>
          )}

          {verbete.conteudoHtml && (
            <div
              className="verbete__corpo"
              dangerouslySetInnerHTML={{ __html: verbete.conteudoHtml }}
            />
          )}

          {verbete.naPratica && (
            <CaixaDestacada rotulo="Na prática">{verbete.naPratica}</CaixaDestacada>
          )}

          {/* Independente de "Na prática": um verbete pode ter as duas, e a
              ordem é a da prancha — o que o termo significa na vida real antes
              do que é curioso sobre ele. */}
          {verbete.curiosidade && (
            <CaixaDestacada rotulo="Curiosidade">{verbete.curiosidade}</CaixaDestacada>
          )}

          {(vizinhos.anterior || vizinhos.proximo) && (
            <nav className="percurso" aria-label="Verbetes adjacentes">
              {vizinhos.anterior && (
                <Link className="percurso__link" href={`/almanaque/${vizinhos.anterior.slug}`}>
                  <IconeSetaEsquerda />
                  <span>
                    <span className="percurso__rotulo">Anterior</span>
                    <span className="percurso__termo">{vizinhos.anterior.titulo}</span>
                  </span>
                </Link>
              )}

              {vizinhos.proximo && (
                <Link
                  className="percurso__link percurso__link--proximo"
                  href={`/almanaque/${vizinhos.proximo.slug}`}
                >
                  <span>
                    <span className="percurso__rotulo">Próximo</span>
                    <span className="percurso__termo">{vizinhos.proximo.titulo}</span>
                  </span>
                  <IconeSetaDireita />
                </Link>
              )}
            </nav>
          )}
        </div>

        <aside className="lateral-verbete" aria-label="Complementos do verbete">
          {relacionados.length > 0 && (
            <nav className="caixa caixa--contorno" aria-labelledby="relacionados-titulo">
              <p className="kicker kicker--pequeno caixa__titulo" id="relacionados-titulo">
                Verbetes relacionados
              </p>
              <div className="vizinhos">
                {relacionados.map((outro) => (
                  <Link
                    key={outro.slug}
                    className="vizinhos__link"
                    href={`/almanaque/${outro.slug}`}
                  >
                    {outro.titulo}
                  </Link>
                ))}
              </div>
            </nav>
          )}

          {mencoes.length > 0 && <Mencoes itens={mencoes} />}

          {/* Aponta para a busca geral até o índice A–Z existir — ver o
              comentário no topo do arquivo. */}
          <Busca
            id="busca-verbete"
            tamanho="compacta"
            rotulo="Buscar no portal"
            placeholder="Buscar no portal…"
            semBotao
          />
        </aside>
      </article>
    </main>
  );
}

/**
 * "Matérias que usam o termo".
 *
 * Mantida no mobile, ao contrário da prancha `10-verbete-mobile`, que a
 * descarta: é o elo do Almanaque de volta para as matérias, e cortá-lo no
 * telefone romperia metade do vaivém entre as duas seções do portal.
 */
async function Mencoes({ itens }: { itens: Materia[] }) {
  const comCategoria = await Promise.all(
    itens.map(async (materia) => ({ materia, categoria: await categoriaPrincipal(materia) })),
  );

  return (
    <div className="caixa caixa--alternativa">
      <p className="kicker kicker--pequeno kicker--verde caixa__titulo">
        Matérias que usam o termo
      </p>
      <div className="mencoes">
        {comCategoria.map(({ materia, categoria }) =>
          categoria ? (
            <Link
              key={materia.slug}
              className="mencoes__link"
              href={`/${categoria.slug}/${materia.slug}`}
            >
              <p className="kicker kicker--mini">{categoria.nome}</p>
              <p className="mencoes__titulo">{materia.titulo}</p>
            </Link>
          ) : null,
        )}
      </div>
    </div>
  );
}
