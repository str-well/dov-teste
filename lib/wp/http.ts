/**
 * Transporte. É o único lugar do projeto que chama `fetch` no WordPress.
 *
 * Duas responsabilidades além de buscar: ler os headers de paginação, que a
 * REST API não coloca no corpo, e transformar os erros da API em algo que os
 * templates saibam tratar.
 */

import { REVALIDAR, urlBase } from './config';

/**
 * Falha da API que a página não tem como resolver — rede fora, 500 do
 * WordPress, JSON inválido. Sobe até o `error.tsx`.
 *
 * O que **não** é erro: nada encontrado. Ausência é `null` ou lista vazia.
 */
export class ErroWordPress extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly recurso: string,
  ) {
    super(message);
    this.name = 'ErroWordPress';
  }
}

export type Resposta<T> = {
  dados: T;
  /** `X-WP-Total`. 0 quando o header não vem (consulta de item único). */
  total: number;
  /** `X-WP-TotalPages`. */
  totalPaginas: number;
};

/** Valores aceitos numa query string. `undefined` e `''` são descartados. */
export type Parametros = Record<
  string,
  string | number | boolean | Array<string | number> | undefined | null
>;

function montarQuery(parametros: Parametros): string {
  const busca = new URLSearchParams();

  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor === undefined || valor === null || valor === '') continue;

    // A REST API espera `include=1,2,3`, não `include[]=1&include[]=2`.
    busca.set(chave, Array.isArray(valor) ? valor.join(',') : String(valor));
  }

  return busca.toString();
}

/**
 * `page` além da última devolve **400** `rest_post_invalid_page_number`, não
 * uma lista vazia. É o caso de alguém digitar `/viaje?pagina=99` na barra de
 * endereço, então precisa virar "não encontrado" e não um erro de servidor.
 */
const PAGINA_INVALIDA = 'rest_post_invalid_page_number';

type Opcoes = {
  /** Segundos de ISR. Padrão: `REVALIDAR.conteudo`. */
  revalidar?: number;
};

/**
 * Busca uma coleção. Devolve lista vazia quando a página pedida não existe.
 */
export async function buscarLista<T>(
  recurso: string,
  parametros: Parametros = {},
  opcoes: Opcoes = {},
): Promise<Resposta<T[]>> {
  const resposta = await requisitar(recurso, parametros, opcoes);

  if (resposta === null) {
    return { dados: [], total: 0, totalPaginas: 0 };
  }

  const dados = (await ler<T[]>(resposta, recurso)) ?? [];

  return {
    dados: Array.isArray(dados) ? dados : [],
    total: numeroDoHeader(resposta, 'x-wp-total'),
    totalPaginas: numeroDoHeader(resposta, 'x-wp-totalpages'),
  };
}

/**
 * Busca um item pelo `slug`, usando a coleção filtrada.
 *
 * A API responde **200 com `[]`** para um slug inexistente — nunca 404. Daí o
 * `null` explícito, que a página traduz em `notFound()`.
 */
export async function buscarPorSlug<T>(
  recurso: string,
  slug: string,
  parametros: Parametros = {},
  opcoes: Opcoes = {},
): Promise<T | null> {
  if (!slug) return null;

  const { dados } = await buscarLista<T>(
    recurso,
    { ...parametros, slug, per_page: 1 },
    opcoes,
  );

  return dados[0] ?? null;
}

/** Busca um item por ID. `null` no 404 — que aqui a API devolve de verdade. */
export async function buscarPorId<T>(
  recurso: string,
  id: number,
  parametros: Parametros = {},
  opcoes: Opcoes = {},
): Promise<T | null> {
  const resposta = await requisitar(`${recurso}/${id}`, parametros, opcoes);

  return resposta === null ? null : ((await ler<T>(resposta, recurso)) ?? null);
}

// ---------------------------------------------------------------------------

/**
 * Devolve `null` nos dois casos de "não existe" — 404 e página fora de
 * alcance. Qualquer outra falha vira `ErroWordPress`.
 */
async function requisitar(
  caminho: string,
  parametros: Parametros,
  opcoes: Opcoes,
): Promise<Response | null> {
  const query = montarQuery(parametros);
  const url = `${urlBase()}/${caminho}${query ? `?${query}` : ''}`;

  let resposta: Response;

  try {
    resposta = await fetch(url, {
      next: { revalidate: opcoes.revalidar ?? REVALIDAR.conteudo },
      headers: { Accept: 'application/json' },
    });
  } catch (erro) {
    throw new ErroWordPress(
      `Não foi possível falar com o WordPress: ${
        erro instanceof Error ? erro.message : 'falha de rede'
      }`,
      0,
      caminho,
    );
  }

  if (resposta.ok) return resposta;

  if (resposta.status === 404) return null;

  if (resposta.status === 400) {
    const corpo = await resposta
      .clone()
      .json()
      .catch(() => null);

    if (corpo && typeof corpo === 'object' && (corpo as { code?: string }).code === PAGINA_INVALIDA) {
      return null;
    }
  }

  throw new ErroWordPress(
    `A API respondeu ${resposta.status} ${resposta.statusText} em ${caminho}.`,
    resposta.status,
    caminho,
  );
}

async function ler<T>(resposta: Response, recurso: string): Promise<T | null> {
  try {
    return (await resposta.json()) as T;
  } catch {
    throw new ErroWordPress(`A API devolveu JSON inválido em ${recurso}.`, 502, recurso);
  }
}

function numeroDoHeader(resposta: Response, nome: string): number {
  const valor = Number(resposta.headers.get(nome));

  return Number.isFinite(valor) && valor > 0 ? valor : 0;
}
