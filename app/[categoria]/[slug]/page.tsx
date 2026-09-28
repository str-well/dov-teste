import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Compartilhar } from '@/components/compartilhar';
import { ImagemWp } from '@/components/imagem-wp';
import { Migalhas } from '@/components/migalhas';
import { Sumario } from '@/components/sumario';
import { prepararArtigo } from '@/lib/artigo';
import { dataCurta, dataLonga, dataParaAtributo, tempoDeLeitura } from '@/lib/formato';
import {
  autorPorId,
  categoriaPorSlug,
  categoriaPrincipal,
  categoriasPorIds,
  imagem,
  listarCategorias,
  listarMaterias,
  materiaPorSlug,
  materiasRelacionadas,
  tagsPorIds,
  verbetesPorIds,
  type Materia,
  type Termo,
} from '@/lib/wp';

type Parametros = { categoria: string; slug: string };
type Props = { params: Promise<Parametros> };

/**
 * Template de matéria — `/[categoria]/[slug]`.
 *
 * O mais complexo do portal, e por isso o primeiro: sumário "Neste texto",
 * citação, imagem com legenda e crédito, caixa "Do Almanaque", newsletter,
 * tags e relacionados.
 *
 * **Sobre a versão mobile:** a prancha `06-materia-mobile` descarta a lateral
 * inteira — sem sumário, sem "Do Almanaque", sem compartilhar. Duas dessas
 * omissões foram mantidas e uma não:
 *
 * - o **sumário** sai no mobile, como na prancha: um índice de quatro linhas no
 *   alto de um texto longo, num telefone, empurra o conteúdo para baixo;
 * - a **newsletter** sai, porque o rodapé já tem o mesmo formulário em toda tela;
 * - **"Do Almanaque" fica.** É o elo entre matéria e Almanaque, que é a metade
 *   editorial do projeto. Perdê-lo no mobile — de onde vem a maior parte do
 *   tráfego — cortaria justamente o que liga as duas seções;
 * - **compartilhar fica.** Foi decidido usar `navigator.share`, e o telefone é
 *   exatamente onde ele funciona.
 */

/**
 * Resolve categoria e matéria, e garante que a URL é a canônica.
 *
 * A mesma matéria não pode ser alcançável por várias URLs: seria conteúdo
 * duplicado aos olhos do buscador. Se o slug de categoria da URL é uma
 * categoria da matéria mas não a principal, redireciona para a principal.
 */
async function resolver({ categoria: slugCategoria, slug }: Parametros) {
  const categoriaDaUrl = await categoriaPorSlug(slugCategoria);

  if (!categoriaDaUrl) notFound();

  const materia = await materiaPorSlug(slug);

  if (!materia) notFound();

  const categorias = await categoriasPorIds(materia.categorias);
  const principal = categorias[0];

  // Matéria publicada sem editoria não tem URL possível.
  if (!principal) notFound();

  if (principal.slug !== slugCategoria) {
    // A URL usa uma categoria que a matéria tem, mas não a principal:
    // manda para a canônica. Se não tem nem isso, é 404.
    if (!categorias.some((c) => c.slug === slugCategoria)) notFound();

    redirect(`/${principal.slug}/${materia.slug}`);
  }

  return { materia, categoria: principal, categorias };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria, slug } = await params;
  const materia = await materiaPorSlug(slug);

  if (!materia) return {};

  // Vazio significa "usar o título e o resumo" — a decisão é aqui, não na API.
  const titulo = materia.seo.titulo || materia.titulo;
  const descricao = materia.seo.descricao || materia.resumo;
  const capa = imagem(materia.imagens, 'dov_destaque', 'dov_card_4x3', 'dov_card');

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: `/${categoria}/${slug}` },
    openGraph: {
      type: 'article',
      title: titulo,
      description: descricao,
      url: `/${categoria}/${slug}`,
      publishedTime: dataParaAtributo(materia.dataUtc),
      modifiedTime: dataParaAtributo(materia.modificadoUtc),
      images: capa ? [{ url: capa.url, width: capa.largura, height: capa.altura }] : undefined,
    },
  };
}

/**
 * Pré-gera as matérias existentes no build.
 *
 * `dynamicParams` fica no padrão (`true`), então matéria publicada depois do
 * build é gerada na primeira visita — não é preciso rebuild para publicar.
 */
export async function generateStaticParams(): Promise<Parametros[]> {
  const [{ itens }, categorias] = await Promise.all([
    listarMaterias({ porPagina: 100 }),
    listarCategorias(),
  ]);

  const porId = new Map(categorias.map((categoria) => [categoria.id, categoria]));

  return itens.flatMap((materia) => {
    const categoria = porId.get(materia.categorias[0] ?? -1);

    return categoria ? [{ categoria: categoria.slug, slug: materia.slug }] : [];
  });
}

export default async function Page({ params }: Props) {
  const { categoria: slugCategoria, slug } = await params;
  const { materia, categoria } = await resolver({ categoria: slugCategoria, slug });

  const { html, sumario } = prepararArtigo(materia.conteudoHtml);

  const [autor, tags, verbetes, relacionadas] = await Promise.all([
    autorPorId(materia.autorId),
    tagsPorIds(materia.tags),
    verbetesPorIds(materia.verbetesRelacionados),
    materiasRelacionadas(materia, 3),
  ]);

  const caminho = `/${categoria.slug}/${materia.slug}`;
  const capa = materia.imagens;

  return (
    <main>
      <article>
        <div className="limite materia__cabeca">
          <div className="materia__cabeca-interno">
            {/* O último item é o título, não uma tag: migalha final é a página
                atual. A prancha usa a primeira tag ali, o que daria
                `aria-current="page"` a algo que não é a página. */}
            <Migalhas
              className="materia__migalhas"
              itens={[
                { rotulo: 'Home', href: '/' },
                { rotulo: categoria.nome, href: `/${categoria.slug}` },
                { rotulo: materia.titulo },
              ]}
            />

            <p className="kicker materia__kicker">{categoria.nome}</p>

            <h1 className="materia__titulo">{materia.titulo}</h1>

            {materia.resumo && <p className="materia__lead">{materia.resumo}</p>}

            <div className="assinatura-autor">
              {autor?.retratoUrl && (
                <div className="assinatura-autor__retrato">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={autor.retratoUrl} alt={autor.nome} width={240} height={240} />
                </div>
              )}

              <div>
                {autor && <p className="assinatura-autor__nome">por {autor.nome}</p>}
                <p className="assinatura-autor__meta">
                  <time dateTime={dataParaAtributo(materia.dataUtc)}>
                    {dataLonga(materia.dataUtc)}
                  </time>
                  {' · '}
                  {tempoDeLeitura(materia.tempoLeitura)}
                </p>
              </div>

              <Compartilhar titulo={materia.titulo} caminho={caminho} />
            </div>
          </div>
        </div>

        {/* A foto de destaque só entra quando existe: sem ela, a moldura vazia
            de 1600×1067 no topo seria um buraco, não um estado vazio. */}
        {capa && (
          <div className="limite materia__destaque">
            <figure>
              <div className="moldura">
                <ImagemWp
                  imagens={capa}
                  preferencia={['dov_destaque', 'dov_hero', 'dov_card_4x3']}
                  alt={materia.titulo}
                  prioridade
                  proporcao="3x2"
                />
              </div>
              {materia.creditoFoto && (
                <figcaption className="legenda">{materia.creditoFoto}</figcaption>
              )}
            </figure>
          </div>
        )}

        <div className="limite materia__corpo">
          <div className="artigo">
            {/* HTML do editor de blocos, com os `id` dos títulos acrescentados
                por `prepararArtigo`. Sai cru de propósito — decodificar as
                entidades aqui transformaria texto em marcação. */}
            <div className="artigo__texto" dangerouslySetInnerHTML={{ __html: html }} />

            {tags.length > 0 && (
              <div className="artigo__tags">
                <p className="artigo__tags-rotulo">Tags</p>
                {tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    className="etiqueta etiqueta--roxa"
                    href={`/${categoria.slug}?tag=${tag.slug}`}
                  >
                    {tag.nome}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="lateral" aria-label="Complementos da matéria">
            {/* Sumário e newsletter só no tablet para cima — ver o comentário
                no topo do arquivo. */}
            <div className="hidden tablet:block">
              <Sumario itens={sumario} />
            </div>

            {verbetes.map((verbete) => (
              <div key={verbete.slug} className="caixa caixa--contorno">
                <p className="kicker kicker--pequeno kicker--verde caixa__titulo">Do Almanaque</p>
                <h2 className="caixa__verbete">{verbete.titulo}</h2>
                {verbete.definicaoCurta && (
                  <p className="caixa__texto caixa__texto--definicao">{verbete.definicaoCurta}</p>
                )}
                <Link className="link-texto" href={`/almanaque/${verbete.slug}`}>
                  Ver verbete
                </Link>
              </div>
            ))}

            <div className="caixa caixa--escura hidden tablet:block">
              <p className="kicker kicker--pequeno kicker--menta caixa__titulo" id="lateral-newsletter">
                Newsletter
              </p>
              <p className="caixa__texto">Uma carta por semana, com o que vale ler e beber.</p>
              {/* O envio entra na Fase 4, com /api/newsletter e o Resend. */}
              <form aria-labelledby="lateral-newsletter">
                <label className="visualmente-oculto" htmlFor="lateral-email">
                  Seu e-mail
                </label>
                <input
                  className="rodape__campo"
                  id="lateral-email"
                  type="email"
                  name="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                />
                <button className="botao botao--verde" type="submit">
                  Assinar
                </button>
              </form>
            </div>
          </aside>
        </div>
      </article>

      {relacionadas.length > 0 && (
        <Relacionados categoria={categoria} itens={relacionadas} />
      )}
    </main>
  );
}

/**
 * "Continue lendo" — três matérias da mesma editoria.
 *
 * Não reaproveita o `CartaoMateria`: a prancha desenha um cartão próprio aqui,
 * com fundo branco sobre off-white, sem resumo e com a moldura sem raio.
 *
 * A categoria de cada item é resolvida individualmente, e não herdada da
 * matéria atual: uma matéria pode estar em mais de uma editoria, e usar a
 * categoria errada na URL geraria um redirecionamento a cada clique.
 */
async function Relacionados({
  categoria,
  itens,
}: {
  categoria: Termo;
  itens: Materia[];
}) {
  const comCategoria = await Promise.all(
    itens.map(async (item) => ({ item, propria: await categoriaPrincipal(item) })),
  );

  return (
    <section className="relacionados" aria-labelledby="relacionados-titulo">
      <div className="limite">
        <div className="secao__cabeca">
          <div>
            <p className="kicker">Continue lendo</p>
            <h2 className="titulo-secao" id="relacionados-titulo">
              Conteúdos relacionados
            </h2>
          </div>
          <Link className="link-texto" href={`/${categoria.slug}`}>
            Tudo em {categoria.nome}
          </Link>
        </div>

        <div className="relacionados__grade">
          {comCategoria.map(({ item, propria }) =>
            propria ? (
              <Link
                key={item.slug}
                className="relacionados__item"
                href={`/${propria.slug}/${item.slug}`}
              >
                <div className="relacionados__midia">
                  <ImagemWp
                    imagens={item.imagens}
                    preferencia={['dov_card', 'dov_card_4x3']}
                    alt={item.titulo}
                    proporcao="3x2"
                  />
                </div>
                <div className="relacionados__texto">
                  <p className="kicker kicker--pequeno">{propria.nome}</p>
                  <h3 className="relacionados__titulo">{item.titulo}</h3>
                  <p className="cartao__meta">
                    <time dateTime={dataParaAtributo(item.dataUtc)}>
                      {dataCurta(item.dataUtc)}
                    </time>
                    {' \u00b7 '}
                    {tempoDeLeitura(item.tempoLeitura)}
                  </p>
                </div>
              </Link>
            ) : null,
          )}
        </div>
      </div>
    </section>
  );
}
