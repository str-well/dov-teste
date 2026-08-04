import type { Metadata } from 'next';
import Link from 'next/link';

import { BuscaComSugestoes } from '@/components/busca-com-sugestoes';
import { EstadoVazio } from '@/components/estado-vazio';
import { ImagemWp } from '@/components/imagem-wp';
import { Realce } from '@/components/realce';
import { dataCurta, dataParaAtributo, plural, tempoDeLeitura } from '@/lib/formato';
import { ALMANAQUE, ordenarEditorias } from '@/lib/site';
import {
  buscar,
  categoriaPrincipal,
  listarCategorias,
  tagsPorIds,
  type Materia,
  type Verbete,
} from '@/lib/wp';

type Tipo = 'tudo' | 'materias' | 'almanaque';

const TIPOS: Tipo[] = ['tudo', 'materias', 'almanaque'];

type Props = { searchParams: Promise<{ q?: string; tipo?: string }> };

export const metadata: Metadata = {
  title: 'Busca',
  // A busca não deve ser indexada: cada termo geraria uma URL rasa e
  // duplicada. Está no checklist da Fase 5, e vale já.
  robots: { index: false, follow: true },
};

/**
 * Busca — `/busca`.
 *
 * Rota estática, e por isso vence `[categoria]`. O campo é o mesmo combobox da
 * home, então continua sugerindo enquanto se digita.
 *
 * **Duas coisas da prancha que o dado não sustenta:**
 *
 * 1. **O trecho com o termo em contexto.** A prancha mostra "…a diferença entre
 *    600 e 800 metros já muda a acidez, e é aí que o *terroir* aparece…" — um
 *    recorte do corpo em volta da palavra. A REST API **não devolve o trecho
 *    que casou**; devolveria só se houvesse um endpoint próprio no mu-plugin
 *    fazendo o recorte. Aqui o trecho é o resumo da matéria, com realce quando
 *    o termo aparece nele.
 * 2. **"Buscas relacionadas"** exigiria histórico de busca, que não existe.
 *    No lugar vão as tags das matérias encontradas, sob o rótulo "Temas
 *    relacionados" — dado real, promessa honesta.
 */
function normalizarTipo(valor: string | undefined): Tipo {
  return TIPOS.includes(valor as Tipo) ? (valor as Tipo) : 'tudo';
}

export default async function Page({ searchParams }: Props) {
  const { q, tipo: tipoBruto } = await searchParams;

  const termo = (q ?? '').trim();
  const tipo = normalizarTipo(tipoBruto);

  // Sem termo: a página é só o campo e alguns atalhos. Não faz consulta.
  if (termo === '') return <SemTermo />;

  const resultado = await buscar(termo, { porTipo: 20 });

  const materias = tipo === 'almanaque' ? [] : resultado.materias;
  const verbetes = tipo === 'materias' ? [] : resultado.verbetes;
  const visiveis = materias.length + verbetes.length;

  // Atalhos do estado "nada encontrado". A §7 sugere Almanaque, Harmonize e
  // Viaje; as editorias vêm da API, então quem tem conteúdo entra.
  const editorias = ordenarEditorias(await listarCategorias());

  const atalhos = [
    { rotulo: 'Almanaque A–Z', href: ALMANAQUE.href },
    ...editorias
      .filter((categoria) => categoria.quantidade > 0)
      .slice(0, 2)
      .map((categoria) => ({ rotulo: categoria.nome, href: `/${categoria.slug}` })),
  ];

  const query = (novoTipo: Tipo) => {
    const busca = new URLSearchParams({ q: termo });

    if (novoTipo !== 'tudo') busca.set('tipo', novoTipo);

    return `/busca?${busca.toString()}`;
  };

  return (
    <main>
      <section className="cabeca-busca secao--empilhada" aria-labelledby="busca-titulo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="blob blob--lilas cabeca-busca__blob"
          src="/blobs/dov-blob-lilas.svg"
          alt=""
          aria-hidden="true"
        />

        <div className="limite secao__conteudo">
          <div className="cabeca-busca__conteudo">
            <h1 className="cabeca-busca__titulo" id="busca-titulo">
              {resultado.total > 0 ? 'Resultados para ' : 'Nada encontrado para '}
              <em className="cabeca-busca__termo">“{termo}”</em>
            </h1>

            <BuscaComSugestoes
              id="busca-resultados"
              tamanho="media"
              valor={termo}
              placeholder="Tente outro termo…"
              limpavel
            />

            {resultado.total > 0 && (
              <p className="cabeca-busca__contagem" role="status">
                <strong>{plural(resultado.total, 'resultado', 'resultados')}</strong>
                {' — '}
                {plural(resultado.materias.length, 'matéria', 'matérias')} e{' '}
                {plural(resultado.verbetes.length, 'verbete', 'verbetes')}
              </p>
            )}
          </div>
        </div>
      </section>

      {resultado.total > 0 && (
        <div className="filtros-busca">
          <div className="limite filtros-busca__interno">
            <p className="filtros-busca__rotulo">Filtrar</p>

            <Filtro atual={tipo} valor="tudo" href={query('tudo')} contagem={resultado.total}>
              Tudo
            </Filtro>
            <Filtro
              atual={tipo}
              valor="materias"
              href={query('materias')}
              contagem={resultado.materias.length}
            >
              Matérias
            </Filtro>
            <Filtro
              atual={tipo}
              valor="almanaque"
              href={query('almanaque')}
              contagem={resultado.verbetes.length}
            >
              Almanaque
            </Filtro>
          </div>
        </div>
      )}

      <div className="limite resultados">
        <section aria-label="Resultados da busca">
          {visiveis > 0 ? (
            <ol className="resultados__lista">
              {/* Verbetes primeiro quando o termo casa exatamente com um deles —
                  a mesma regra do combobox. */}
              {verbetes.map((verbete) => (
                <li key={`v-${verbete.slug}`}>
                  <ResultadoVerbete verbete={verbete} termo={termo} />
                </li>
              ))}

              {materias.map((materia) => (
                <li key={`m-${materia.slug}`}>
                  <ResultadoMateria materia={materia} termo={termo} />
                </li>
              ))}
            </ol>
          ) : resultado.total === 0 ? (
            // Nada encontrado no portal — o estado da tela 15, com o texto que
            // a §7 define. [ESPEC] §7
            <EstadoVazio
              // O `<h1>` da cabeça já diz "Nada encontrado para …": aqui o
              // título fica só para leitor de tela, como na prancha.
              titulo="Nenhum resultado"
              tituloOculto
              orientacao="Confira a grafia ou tente palavras mais simples — “uva”, “espumante”, “Serra Gaúcha”."
              atalhos={atalhos}
              acao={{ rotulo: 'Ver as últimas publicações', href: '/' }}
            />
          ) : (
            // Achou no portal, mas não neste filtro: é outro estado, e a saída
            // é voltar para "Tudo", não ir para a home.
            <EstadoVazio
              titulo="Nenhum resultado com esse filtro"
              orientacao={
                <>
                  Tente outro filtro ou volte para <strong>Tudo</strong>.
                </>
              }
              acao={{ rotulo: 'Ver tudo', href: query('tudo'), variacao: 'contorno' }}
            />
          )}
        </section>

        <Lateral materias={resultado.materias} />
      </div>
    </main>
  );
}

function Filtro({
  atual,
  valor,
  href,
  contagem,
  children,
}: {
  atual: Tipo;
  valor: Tipo;
  href: string;
  contagem: number;
  children: React.ReactNode;
}) {
  const ativo = atual === valor;

  return (
    <Link
      className={`chip${ativo ? ' chip--ativo' : ''}`}
      href={href}
      aria-current={ativo ? 'true' : undefined}
    >
      {children} ({contagem})
    </Link>
  );
}

/** Verbete: inicial num quadrado roxo no lugar da foto que não existe. */
function ResultadoVerbete({ verbete, termo }: { verbete: Verbete; termo: string }) {
  return (
    <Link className="resultado__link" href={`/almanaque/${verbete.slug}`}>
      <span className="resultado__inicial" aria-hidden="true">
        {verbete.letra}
      </span>
      <div>
        <p className="kicker kicker--pequeno kicker--verde resultado__kicker">
          Almanaque · verbete
        </p>
        <h2 className="resultado__titulo">
          <Realce texto={verbete.titulo} termo={termo} />
        </h2>
        {verbete.definicaoCurta && (
          <p className="resultado__trecho">
            <Realce texto={verbete.definicaoCurta} termo={termo} />
          </p>
        )}
      </div>
    </Link>
  );
}

async function ResultadoMateria({ materia, termo }: { materia: Materia; termo: string }) {
  const categoria = await categoriaPrincipal(materia);

  if (!categoria) return null;

  return (
    <Link className="resultado__link" href={`/${categoria.slug}/${materia.slug}`}>
      <div className="resultado__midia">
        <ImagemWp
          imagens={materia.imagens}
          preferencia={['dov_card', 'dov_card_4x3']}
          alt={materia.titulo}
          proporcao="3x2"
        />
      </div>
      <div>
        <p className="kicker kicker--pequeno resultado__kicker">{categoria.nome}</p>
        <h2 className="resultado__titulo">
          <Realce texto={materia.titulo} termo={termo} />
        </h2>
        {/* O trecho é o resumo, não um recorte do corpo: a API não devolve o
            pedaço que casou. Ver o comentário no topo do arquivo. */}
        {materia.resumo && (
          <p className="resultado__trecho">
            <Realce texto={materia.resumo} termo={termo} />
          </p>
        )}
        <p className="resultado__meta">
          <time dateTime={dataParaAtributo(materia.dataUtc)}>{dataCurta(materia.dataUtc)}</time>
          {' · '}
          {tempoDeLeitura(materia.tempoLeitura)}
        </p>
      </div>
    </Link>
  );
}

/** "Temas relacionados": as tags das matérias encontradas. */
async function Lateral({ materias }: { materias: Materia[] }) {
  const ids = [...new Set(materias.flatMap((materia) => materia.tags))];
  const tags = (await tagsPorIds(ids)).slice(0, 6);

  if (tags.length === 0) return null;

  return (
    <aside className="resultados__lateral" aria-labelledby="temas-titulo">
      <p className="kicker kicker--pequeno resultados__lateral-titulo" id="temas-titulo">
        Temas relacionados
      </p>
      <div className="chips">
        {tags.map((tag) => (
          <Link
            key={tag.slug}
            className="chip chip--sugestao"
            href={`/busca?q=${encodeURIComponent(tag.nome)}`}
          >
            {tag.nome}
          </Link>
        ))}
      </div>
    </aside>
  );
}

/** A busca aberta, sem termo: campo com foco e alguns caminhos. */
async function SemTermo() {
  const categorias = ordenarEditorias(await listarCategorias());

  return (
    <main>
      <section className="cabeca-busca secao--empilhada" aria-labelledby="busca-titulo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="blob blob--lilas cabeca-busca__blob"
          src="/blobs/dov-blob-lilas.svg"
          alt=""
          aria-hidden="true"
        />

        <div className="limite secao__conteudo">
          <div className="cabeca-busca__conteudo">
            <h1 className="cabeca-busca__titulo" id="busca-titulo">
              O que você quer encontrar?
            </h1>

            <BuscaComSugestoes id="busca-vazia" tamanho="media" focoInicial />
          </div>
        </div>
      </section>

      <div className="limite">
        <EstadoVazio
          titulo="Busque matérias e verbetes de uma vez"
          orientacao="Digite um termo acima. A busca cobre o texto das matérias e as definições do Almanaque."
          rotuloDosAtalhos="Ou comece por aqui"
          atalhos={[
            { rotulo: 'Almanaque A–Z', href: ALMANAQUE.href },
            ...categorias
              .filter((categoria) => categoria.quantidade > 0)
              .slice(0, 3)
              .map((categoria) => ({ rotulo: categoria.nome, href: `/${categoria.slug}` })),
          ]}
        />
      </div>
    </main>
  );
}
