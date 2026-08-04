import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CartaoMateria } from '@/components/cartao';
import { ChipsRolagem } from '@/components/chips-rolagem';
import { EstadoVazio } from '@/components/estado-vazio';
import { Migalhas } from '@/components/migalhas';
import { Ordenacao } from '@/components/ordenacao';
import { Paginacao } from '@/components/paginacao';
import { ALMANAQUE, ordenarEditorias } from '@/lib/site';
import { plural } from '@/lib/formato';
import {
  categoriaPorSlug,
  listarCategorias,
  listarMaterias,
  tagPorSlug,
  tagsDaCategoria,
  type Ordenacao as Ordem,
} from '@/lib/wp';

const POR_PAGINA = 12;

const ORDENS: Ordem[] = ['recentes', 'antigas', 'alfabetica'];

type Props = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ pagina?: string; tag?: string; ordem?: string }>;
};

/**
 * Arquivo de categoria — `/[categoria]`.
 *
 * Um template para as 7 editorias, resolvido pela URL. Os slugs são contrato:
 * `saude-e-ciencia`, com o "e".
 *
 * **Esta rota também captura `/quem-somos` e `/contato`**, que são páginas do
 * WordPress e ainda não têm template. Hoje as duas caem no `notFound()` daqui,
 * que é o mesmo 404 de antes — mas quando o template institucional entrar
 * (item 6 da Fase 3), elas precisam de rota estática própria, que vence a
 * dinâmica por precedência. As páginas legais já são estáticas e não passam
 * por aqui.
 */
function normalizarOrdem(valor: string | undefined): Ordem {
  return ORDENS.includes(valor as Ordem) ? (valor as Ordem) : 'recentes';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria: slug } = await params;
  const categoria = await categoriaPorSlug(slug);

  if (!categoria) return {};

  return {
    title: categoria.nome,
    description:
      categoria.descricao ||
      `Tudo o que publicamos em ${categoria.nome}, no Descubra o Vinho.`,
    alternates: { canonical: `/${slug}` },
  };
}

export async function generateStaticParams() {
  const categorias = await listarCategorias();

  return categorias.map((categoria) => ({ categoria: categoria.slug }));
}

export default async function Page({ params, searchParams }: Props) {
  const { categoria: slug } = await params;
  const { pagina: paginaBruta, tag: slugTag, ordem: ordemBruta } = await searchParams;

  const categoria = await categoriaPorSlug(slug);

  if (!categoria) notFound();

  const pagina = Math.max(1, Number(paginaBruta) || 1);
  const ordem = normalizarOrdem(ordemBruta);

  // Filtro por tag que não existe é URL inventada: melhor 404 que lista vazia
  // sem explicação.
  const tag = slugTag ? await tagPorSlug(slugTag) : null;

  if (slugTag && !tag) notFound();

  const [lista, tagsDisponiveis, editorias] = await Promise.all([
    listarMaterias({
      categoria: categoria.id,
      tag: tag?.id,
      pagina,
      porPagina: POR_PAGINA,
      ordenar: ordem,
    }),
    tagsDaCategoria(categoria.id),
    listarCategorias(),
  ]);

  // Página fora de alcance numa categoria que tem conteúdo: é URL digitada
  // errada, não estado vazio.
  if (pagina > 1 && lista.itens.length === 0) notFound();

  const caminho = `/${categoria.slug}`;

  const query = (extra: Record<string, string | number | undefined>) => {
    const busca = new URLSearchParams();

    if (tag) busca.set('tag', tag.slug);
    if (ordem !== 'recentes') busca.set('ordem', ordem);

    for (const [chave, valor] of Object.entries(extra)) {
      if (valor === undefined) busca.delete(chave);
      else busca.set(chave, String(valor));
    }

    const texto = busca.toString();

    return texto ? `${caminho}?${texto}` : caminho;
  };

  return (
    <main>
      <section className="cabeca-categoria" aria-labelledby="categoria-titulo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="blob blob--lilas cabeca-categoria__blob"
          src="/blobs/dov-blob-lilas.svg"
          alt=""
          aria-hidden="true"
        />

        <div className="limite secao__conteudo">
          <Migalhas
            itens={[{ rotulo: 'Home', href: '/' }, { rotulo: categoria.nome }]}
          />

          <h1 className="cabeca-categoria__titulo" id="categoria-titulo">
            {categoria.nome}
          </h1>

          {categoria.descricao && (
            <p className="cabeca-categoria__descricao">{categoria.descricao}</p>
          )}

          {/* A contagem vem do header da API, e é a da consulta atual — com o
              filtro aplicado, se houver. "128 matérias" da prancha é fictício. */}
          <p className="cabeca-categoria__contagem">
            {plural(lista.total, 'matéria', 'matérias')}
            {tag ? ` em ${tag.nome}` : ' nesta editoria'}
          </p>
        </div>
      </section>

      {tagsDisponiveis.length > 0 && (
        <div className="filtros">
          <div className="limite filtros__interno">
            <p className="filtros__rotulo">Filtrar por tema</p>

            {/* A tira rola no mobile e quebra em linhas no desktop; ao carregar
                com filtro ativo, rola até ele. [ESPEC] §4 */}
            <ChipsRolagem>
              <Link
                className={`chip${!tag ? ' chip--ativo' : ''}`}
                href={query({ tag: undefined, pagina: undefined })}
                aria-current={!tag ? 'true' : undefined}
              >
                Tudo
              </Link>

              {tagsDisponiveis.map((disponivel) => (
                <Link
                  key={disponivel.slug}
                  className={`chip${tag?.slug === disponivel.slug ? ' chip--ativo' : ''}`}
                  href={query({ tag: disponivel.slug, pagina: undefined })}
                  aria-current={tag?.slug === disponivel.slug ? 'true' : undefined}
                >
                  {disponivel.nome}
                </Link>
              ))}
            </ChipsRolagem>

            <Ordenacao
              atual={ordem}
              caminho={caminho}
              preservar={{ tag: tag?.slug }}
            />
          </div>
        </div>
      )}

      <section className="arquivo" aria-label={`Matérias em ${categoria.nome}`}>
        <div className="limite">
          {lista.itens.length > 0 ? (
            <>
              <div className="arquivo__grade">
                {lista.itens.map((materia, indice) => (
                  <CartaoMateria
                    key={materia.id}
                    materia={materia}
                    nivel={2}
                    prioridade={indice === 0}
                  />
                ))}
              </div>

              <div className="arquivo__paginacao">
                <Paginacao
                  pagina={lista.pagina}
                  totalPaginas={lista.totalPaginas}
                  href={(p) => query({ pagina: p === 1 ? undefined : p })}
                  rotulo={`Páginas de ${categoria.nome}`}
                />
              </div>
            </>
          ) : tag ? (
            // Filtro sem resultado — [ESPEC] §7
            <EstadoVazio
              titulo="Nenhuma matéria com esse filtro"
              orientacao={
                <>
                  Tente outro tema ou volte para <strong>Tudo</strong>.
                </>
              }
              acao={{
                rotulo: 'Limpar filtro',
                href: query({ tag: undefined, pagina: undefined }),
                variacao: 'contorno',
              }}
            />
          ) : (
            // Categoria vazia — [ESPEC] §7
            <EstadoVazio
              titulo={<>Ainda não publicamos em {categoria.nome}</>}
              orientacao="Estamos preparando as primeiras matérias desta editoria."
              rotuloDosAtalhos="Enquanto isso"
              atalhos={[
                ...ordenarEditorias(editorias)
                  .filter((outra) => outra.slug !== categoria.slug && outra.quantidade > 0)
                  .slice(0, 3)
                  .map((outra) => ({ rotulo: outra.nome, href: `/${outra.slug}` })),
                { rotulo: 'Almanaque A–Z', href: ALMANAQUE.href },
              ]}
              acao={{ rotulo: 'Ver as últimas publicações', href: '/' }}
            />
          )}
        </div>
      </section>
    </main>
  );
}
