import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { IconeSetaDireita } from '@/components/icones';
import { ImagemWp } from '@/components/imagem-wp';
import { separarLead } from '@/lib/artigo';
import { contarVerbetes, listarCategorias, listarMaterias, paginaPorSlug } from '@/lib/wp';

const SLUG = 'quem-somos';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const pagina = await paginaPorSlug(SLUG);

  if (!pagina) return {};

  return {
    title: 'Quem somos',
    description: pagina.resumo,
    alternates: { canonical: `/${SLUG}` },
  };
}

/**
 * Quem Somos — `/quem-somos`.
 *
 * **Rota estática de propósito.** `app/[categoria]/page.tsx` capturaria este
 * caminho e devolveria 404, porque `quem-somos` não é categoria. Rota estática
 * vence a dinâmica por precedência no App Router, e é o que traz esta página de
 * volta. O mesmo vale para `/contato` e para as duas páginas legais.
 *
 * O conteúdo vem do WordPress.
 *
 * **A foto da equipe.** `dov_imagens` passou a ser registrado para `page` no
 * mu-plugin, então a foto da prancha tem de onde vir. O layout de duas colunas
 * só aparece **quando existe imagem** — sem ela, um retângulo vazio ocupando
 * metade da tela seria pior que texto em largura de leitura. Nenhuma página tem
 * foto ainda, então hoje é uma coluna.
 *
 * A prancha pede 4:5 (1000×1250), e **não existe tamanho 4:5 no mu-plugin**. O
 * `dov_corpo` tem largura fixa de 1200 e altura livre, então preserva a
 * proporção do arquivo enviado — é o único que serve para retrato.
 *
 * **Os números eram fictícios** ("418 verbetes", "2019"). Verbetes e editorias
 * vêm da API; o ano sai da matéria mais antiga publicada.
 *
 * Os números aparecem no topo do texto, e não no meio como na prancha: o corpo
 * é um bloco de HTML do editor, e fatiá-lo ao meio para injetar a faixa seria
 * frágil — quebraria no dia em que alguém reordenasse os títulos.
 */
export default async function Page() {
  const pagina = await paginaPorSlug(SLUG);

  if (!pagina) notFound();

  const [verbetes, categorias, maisAntiga] = await Promise.all([
    contarVerbetes(),
    listarCategorias(),
    listarMaterias({ ordenar: 'antigas', porPagina: 1 }),
  ]);

  const { lead, corpo } = separarLead(pagina.conteudoHtml);
  const primeiroAno = maisAntiga.itens[0]?.dataUtc.slice(0, 4);

  return (
    <main>
      <section className="cabeca-institucional secao--empilhada" aria-labelledby="quem-somos-titulo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="blob blob--roxo cabeca-institucional__blob"
          src="/blobs/dov-blob-roxo.svg"
          alt=""
          aria-hidden="true"
        />

        <div className="limite secao__conteudo">
          <div className="cabeca-institucional__conteudo">
            <p className="kicker">Quem somos</p>

            <h1 className="cabeca-institucional__titulo" id="quem-somos-titulo">
              {pagina.titulo}
            </h1>

            {(lead || pagina.resumo) && (
              <p className="cabeca-institucional__lead">{lead || pagina.resumo}</p>
            )}
          </div>
        </div>
      </section>

      <section
        className={`limite institucional${pagina.imagens ? '' : ' institucional--sem-figura'}`}
        aria-label="Sobre o portal"
      >
        {pagina.imagens && (
          <figure>
            <div className="moldura">
              <ImagemWp
                imagens={pagina.imagens}
                preferencia={['dov_corpo', 'dov_destaque']}
                alt={pagina.titulo}
                proporcao="4x5"
              />
            </div>
          </figure>
        )}

        <div>
          <dl className="numeros">
            <div>
              <dt className="visualmente-oculto">Verbetes no Almanaque</dt>
              <dd className="numeros__valor">{verbetes}</dd>
              <dd className="numeros__rotulo">
                {verbetes === 1 ? 'verbete no Almanaque' : 'verbetes no Almanaque'}
              </dd>
            </div>
            <div>
              <dt className="visualmente-oculto">Editorias</dt>
              <dd className="numeros__valor">{categorias.length}</dd>
              <dd className="numeros__rotulo">
                {categorias.length === 1 ? 'editoria' : 'editorias'}, atualizadas toda semana
              </dd>
            </div>
            {primeiroAno && (
              <div>
                <dt className="visualmente-oculto">Ano da primeira publicação</dt>
                <dd className="numeros__valor">{primeiroAno}</dd>
                <dd className="numeros__rotulo">ano da primeira publicação</dd>
              </div>
            )}
          </dl>

          {/* HTML do editor de blocos. O `<ul>` de "No que acreditamos" recebe a
              bolinha verde por seletor de elemento — o editor não emite classe. */}
          <div
            className="prosa institucional__corpo"
            dangerouslySetInnerHTML={{ __html: corpo }}
          />
        </div>
      </section>

      <section className="secao--escura" aria-labelledby="contato-titulo">
        <div className="limite contato">
          <div>
            <h2 className="contato__titulo" id="contato-titulo">
              Quer sugerir uma pauta?
            </h2>
            <p className="contato__texto">
              Escreva para a redação — lemos tudo, respondemos o que der.
            </p>
          </div>

          <Link className="botao botao--claro" href="/contato">
            Falar com a redação
            <IconeSetaDireita className="botao__icone" />
          </Link>
        </div>
      </section>
    </main>
  );
}
