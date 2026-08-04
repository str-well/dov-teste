import type { Metadata } from 'next';
import Link from 'next/link';

import { BuscaComSugestoes } from '@/components/busca-com-sugestoes';
import { CartaoCompacto, CartaoMateria } from '@/components/cartao';
import { IconeSetaDireita } from '@/components/icones';
import { ImagemWp } from '@/components/imagem-wp';
import { dataCurta, dataParaAtributo, intervaloDeDatas, plural, tempoDeLeitura } from '@/lib/formato';
import {
  ALMANAQUE,
  HOME_EDITORIAS_DUPLAS,
  HOME_EDITORIA_DESTAQUE,
  ordenarEditorias,
} from '@/lib/site';
import {
  categoriaPrincipal,
  listarCategorias,
  listarEventos,
  listarMaterias,
  listarTags,
  listarVerbetes,
  type Evento,
  type Materia,
  type Termo,
} from '@/lib/wp';

export const metadata: Metadata = {
  title: { absolute: 'Descubra o Vinho — vinho sem solenidade' },
  description:
    'Uvas, harmonizações, destinos e um almanaque de A a Z. Portal editorial de ' +
    'vinho, escrito para quem está começando e para quem já bebe há anos.',
  alternates: { canonical: '/' },
};

/**
 * Home — `/`.
 *
 * A maior composição do portal, e a última a ser construída de propósito: quase
 * tudo aqui é peça que já nasceu testada nos templates anteriores.
 *
 * Ordem das seções, conforme a prancha: hero de busca, matéria de capa, últimas,
 * bloco de uma editoria, chamada do Almanaque, duas editorias lado a lado, agenda.
 *
 * **Três coisas que a prancha pede e o dado não sustenta**, resolvidas abaixo:
 * os chips de "mais buscados", as letras do Almanaque e o destino dos eventos.
 */
export default async function Page() {
  const [lista, categorias, verbetes, eventos, tags] = await Promise.all([
    // Uma consulta serve capa e últimas: a mais recente é a capa, as três
    // seguintes são as últimas.
    listarMaterias({ porPagina: 4 }),
    listarCategorias(),
    listarVerbetes(),
    listarEventos({ apenasFuturos: true, quantidade: 3 }),
    listarTags(),
  ]);

  const [capa, ...ultimas] = lista.itens;

  const porSlug = new Map(categorias.map((categoria) => [categoria.slug, categoria]));
  const emOrdem = ordenarEditorias(categorias);

  // Slug ausente cai para a primeira editoria da ordem editorial — a home não
  // fica com um buraco se o cliente renomear ou apagar uma editoria.
  const destaque = porSlug.get(HOME_EDITORIA_DESTAQUE) ?? emOrdem[0];

  const duplas = HOME_EDITORIAS_DUPLAS.map((slug) => porSlug.get(slug)).filter(
    (categoria): categoria is Termo => categoria !== undefined,
  );

  // As letras que **têm** verbete. A prancha mostra A–N como se todas
  // funcionassem; aqui só entra letra que leva a algum lugar.
  const letras = [...new Set(verbetes.map((verbete) => verbete.letra))]
    .filter((letra) => letra !== '#')
    .sort()
    .slice(0, 14);

  // "Mais buscados" da prancha exigiria dado de busca, que não existe — não há
  // analytics no projeto. O que a API sustenta é "mais publicados": as tags com
  // mais matérias. O rótulo mudou para não prometer o que não medimos.
  const temas = [...tags].sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

  return (
    <main>
      {/* ---------------------------------------------------------- hero */}
      <section className="hero-busca secao--empilhada" aria-labelledby="hero-titulo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="blob blob--lilas hero-busca__blob--lilas"
          src="/blobs/dov-blob-lilas.svg"
          alt=""
          aria-hidden="true"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="blob blob--menta hero-busca__blob--menta"
          src="/blobs/dov-blob-menta.svg"
          alt=""
          aria-hidden="true"
        />

        <div className="limite secao__conteudo">
          <div className="hero-busca__conteudo">
            <p className="kicker">Descubra o vinho</p>

            <h1 className="hero-busca__titulo" id="hero-titulo">
              O que você quer descobrir sobre vinho hoje?
            </h1>

            <p className="lead hero-busca__lead">
              Uvas, harmonizações, destinos, verbetes do almanaque — tudo em um só lugar.
            </p>

            <div className="hero-busca__form">
              <BuscaComSugestoes id="busca-hero" />
            </div>

            {temas.length > 0 && (
              <div className="chips hero-busca__sugestoes">
                <span className="hero-busca__rotulo">Comece por aqui:</span>
                {temas.map((tema) => (
                  <Link
                    key={tema.slug}
                    className="chip chip--sugestao"
                    href={`/busca?q=${encodeURIComponent(tema.nome)}`}
                  >
                    {tema.nome}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- capa */}
      {capa && <Capa materia={capa} />}

      {/* ------------------------------------------------------- últimas */}
      {ultimas.length > 0 && (
        <section className="secao secao--ultimas" aria-labelledby="ultimas-titulo">
          <div className="limite">
            <div className="secao__cabeca">
              <div>
                <p className="kicker secao__kicker">Agora no portal</p>
                <h2 className="titulo-secao" id="ultimas-titulo">
                  Últimas publicações
                </h2>
              </div>
              {/* A prancha tem um "Ver todas" aqui, e **não existe rota que
                  signifique "todas as publicações"** — o `Anexo C` do plano não
                  prevê nenhuma. Apontar para a primeira editoria seria mentir
                  sobre o destino, então o link sai. Volta quando a página de
                  busca existir e puder listar tudo sem termo. */}
            </div>

            <div className="grade-cartoes">
              {ultimas.map((materia) => (
                <CartaoMateria key={materia.id} materia={materia} nivel={3} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------- bloco de uma editoria */}
      {destaque && <BlocoEditoria categoria={destaque} />}

      {/* --------------------------------------------- chamada do Almanaque */}
      <section
        className="secao--escura secao--empilhada chamada-almanaque"
        aria-labelledby="chamada-almanaque-titulo"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="blob blob--menta chamada-almanaque__blob"
          src="/blobs/dov-blob-menta.svg"
          alt=""
          aria-hidden="true"
        />

        <div className="limite secao__conteudo">
          <div className="chamada-almanaque__grade">
            <div>
              <p className="kicker kicker--menta">Consulta permanente</p>

              <h2 className="chamada-almanaque__titulo" id="chamada-almanaque-titulo">
                O Almanaque do Vinho, de A a Z
              </h2>

              <p className="chamada-almanaque__texto">
                {plural(verbetes.length, 'verbete', 'verbetes')} explicando uvas, técnicas,
                regiões e aquele termo que o sommelier falou rápido demais.
              </p>

              <Link className="botao botao--claro" href={ALMANAQUE.href}>
                Abrir o Almanaque
                <IconeSetaDireita className="botao__icone" />
              </Link>
            </div>

            {letras.length > 0 && (
              <nav className="alfabeto" aria-label="Índice do Almanaque">
                {letras.map((letra) => (
                  <Link
                    key={letra}
                    className="alfabeto__letra"
                    href={`${ALMANAQUE.href}#letra-${letra.toLowerCase()}`}
                  >
                    {letra}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------- duas editorias lado a lado */}
      {duplas.length > 0 && (
        <section className="secao" aria-label={duplas.map((c) => c.nome).join(' e ')}>
          <div className="limite">
            <div className="duplas">
              {duplas.map((categoria) => (
                <Dupla key={categoria.slug} categoria={categoria} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------- agenda */}
      {eventos.length > 0 && (
        <section className="secao secao--agenda" aria-labelledby="agenda-titulo">
          <div className="limite">
            <div className="secao__cabeca">
              <div>
                <p className="kicker secao__kicker">Programe-se</p>
                <h2 className="titulo-secao" id="agenda-titulo">
                  Agenda das próximas semanas
                </h2>
              </div>
              {porSlug.has('programe-se') && (
                <Link className="link-texto" href="/programe-se">
                  Agenda completa
                </Link>
              )}
            </div>

            <div className="agenda">
              {eventos.map((evento) => (
                <ItemDaAgenda key={evento.id} evento={evento} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

/**
 * A matéria de capa: meia tela de texto, meia de foto sangrando até a borda.
 *
 * O título é `<h2>` e não `<h1>`: o `<h1>` da home é a pergunta do hero, e uma
 * página tem um só.
 */
async function Capa({ materia }: { materia: Materia }) {
  const categoria = await categoriaPrincipal(materia);

  if (!categoria) return null;

  const href = `/${categoria.slug}/${materia.slug}`;

  return (
    <section className="capa" aria-labelledby="capa-titulo">
      <div className="capa__texto">
        <p className="kicker kicker--verde">Matéria de capa · {categoria.nome}</p>

        <h2 className="capa__titulo" id="capa-titulo">
          <Link href={href}>{materia.titulo}</Link>
        </h2>

        {materia.resumo && <p className="capa__resumo">{materia.resumo}</p>}

        <div className="capa__acoes">
          <Link className="botao botao--primario" href={href}>
            Ler a matéria
            <IconeSetaDireita className="botao__icone" />
          </Link>

          <p className="capa__meta">
            <time dateTime={dataParaAtributo(materia.dataUtc)}>
              {dataCurta(materia.dataUtc)}
            </time>
            {' · '}
            {tempoDeLeitura(materia.tempoLeitura)}
          </p>
        </div>
      </div>

      <div className="capa__midia">
        <ImagemWp
          imagens={materia.imagens}
          preferencia={['dov_hero', 'dov_destaque', 'dov_card_4x3']}
          alt={materia.titulo}
          prioridade
          proporcao="16x9"
        />
      </div>
    </section>
  );
}

/** Bloco de editoria: um destaque grande e três compactos na lateral. */
async function BlocoEditoria({ categoria }: { categoria: Termo }) {
  const { itens } = await listarMaterias({ categoria: categoria.id, porPagina: 4 });

  if (itens.length === 0) return null;

  const [principal, ...lateral] = itens;

  return (
    <section className="secao" style={{ paddingTop: 0 }} aria-labelledby={`editoria-${categoria.slug}`}>
      <div className="limite">
        <div className="editoria">
          <div>
            <div className="editoria__cabeca">
              <h2 className="editoria__titulo" id={`editoria-${categoria.slug}`}>
                {categoria.nome}
              </h2>
              {categoria.descricao && (
                <p className="editoria__descricao">{categoria.descricao}</p>
              )}
            </div>

            <CartaoMateria
              materia={principal}
              variacao="destaque"
              nivel={3}
            />
          </div>

          <div className="editoria__lateral">
            {lateral.map((materia) => (
              <CartaoCompacto key={materia.id} materia={materia} nivel={4} />
            ))}

            <Link className="link-texto" href={`/${categoria.slug}`}>
              Ver tudo em {categoria.nome}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Uma coluna do par: destaque com foto e três títulos numerados. */
async function Dupla({ categoria }: { categoria: Termo }) {
  const { itens } = await listarMaterias({ categoria: categoria.id, porPagina: 4 });

  if (itens.length === 0) return null;

  const [principal, ...resto] = itens;
  const href = (materia: Materia) => `/${categoria.slug}/${materia.slug}`;

  return (
    <div>
      <div className="editoria__cabeca">
        <h2 className="editoria__titulo">{categoria.nome}</h2>
        {categoria.descricao && <p className="editoria__descricao">{categoria.descricao}</p>}
      </div>

      <article className="cartao duplas__destaque">
        <Link className="cartao__link" href={href(principal)}>
          <div className="cartao__midia cartao__midia--3x2">
            <ImagemWp
              imagens={principal.imagens}
              preferencia={['dov_card', 'dov_card_4x3']}
              alt={principal.titulo}
              proporcao="3x2"
            />
          </div>
          <h3 className="duplas__titulo">{principal.titulo}</h3>
          {principal.resumo && <p className="cartao__resumo">{principal.resumo}</p>}
        </Link>
      </article>

      {resto.length > 0 && (
        <ol className="lista-numerada">
          {resto.map((materia, indice) => (
            <li key={materia.id}>
              <Link className="lista-numerada__item" href={href(materia)}>
                {/* Numeral com zero à esquerda, tabular, como na prancha. */}
                <span className="lista-numerada__numero">
                  {String(indice + 1).padStart(2, '0')}
                </span>
                <span className="lista-numerada__titulo">{materia.titulo}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * Um evento da agenda.
 *
 * **Evento não tem página própria:** o CPT existe e tem corpo de texto, mas não
 * há rota para ele no `Anexo C` do plano nem template na Fase 3. Então o cartão
 * é link só quando existe `dov_link` externo; sem ele, é um bloco informativo.
 * Hoje os 3 eventos de teste estão sem link, e nenhum é clicável.
 *
 * Isso é uma lacuna real do plano, não uma decisão — ver `docs/PLANO`.
 */
function ItemDaAgenda({ evento }: { evento: Evento }) {
  const conteudo = (
    <>
      <p className="agenda__data">
        <time dateTime={evento.dataInicio}>
          {intervaloDeDatas(evento.dataInicio, evento.dataFim)}
        </time>
        {evento.local && ` · ${evento.local}`}
      </p>
      <h3 className="agenda__titulo">{evento.titulo}</h3>
    </>
  );

  return evento.link ? (
    <a className="agenda__item" href={evento.link} target="_blank" rel="noopener noreferrer">
      {conteudo}
    </a>
  ) : (
    <article className="agenda__item">{conteudo}</article>
  );
}
