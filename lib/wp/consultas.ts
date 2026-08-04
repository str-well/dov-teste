/**
 * As consultas ao WordPress. Nenhuma outra parte do projeto monta URL da API.
 *
 * Duas regras que valem para tudo aqui:
 *
 * 1. `_fields` sempre explícito. O plano da Hostinger é compartilhado com 6
 *    outros sites — resposta menor não é otimização prematura, é requisito.
 * 2. Taxonomias e autores passam por `cache()` do React, então um render que
 *    pede a lista de categorias em 20 cards faz **uma** requisição.
 */

import { cache } from 'react';

import { MAXIMO_POR_PAGINA, REVALIDAR } from './config';
import { buscarLista, buscarPorId, buscarPorSlug } from './http';
import {
  mapearAutor,
  mapearEvento,
  mapearMateria,
  mapearMateriaCompleta,
  mapearPagina,
  mapearTermo,
  mapearVerbete,
  mapearVerbeteCompleto,
  naOrdemDosIds,
} from './mapeadores';
import type {
  Autor,
  BrutoAutor,
  BrutoEvento,
  BrutoMateria,
  BrutoPagina,
  BrutoTermo,
  BrutoVerbete,
  Evento,
  Lista,
  Materia,
  MateriaCompleta,
  Pagina,
  Termo,
  Verbete,
  VerbeteCompleto,
} from './tipos';

// ===========================================================================
// LISTAS DE CAMPOS
//
// Mantidas juntas de propósito: quando um campo novo entrar no mu-plugin, é
// aqui que ele precisa ser liberado. Campo ausente no JSON é, quase sempre,
// esquecimento nesta lista — depois de checar `custom-fields` em `supports`.
// ===========================================================================

const CAMPOS = {
  materia:
    'id,slug,date,date_gmt,title,excerpt,author,categories,tags,meta,dov_imagens',
  materiaCompleta:
    'id,slug,date,date_gmt,modified_gmt,title,excerpt,content,author,categories,tags,meta,dov_imagens',
  verbete: 'id,slug,date,date_gmt,title,meta,dov_imagens',
  verbeteCompleto: 'id,slug,date,date_gmt,modified_gmt,title,content,meta,dov_imagens',
  evento: 'id,slug,title,content,meta,dov_imagens',
  pagina: 'id,slug,modified_gmt,title,excerpt,content',
  termo: 'id,name,slug,description,count',
  autor: 'id,name,slug,description,meta',
} as const;

/** Ordenações oferecidas no arquivo de categoria. */
export type Ordenacao = 'recentes' | 'antigas' | 'alfabetica';

const ORDENACAO: Record<Ordenacao, { orderby: string; order: string }> = {
  recentes: { orderby: 'date', order: 'desc' },
  antigas: { orderby: 'date', order: 'asc' },
  alfabetica: { orderby: 'title', order: 'asc' },
};

function limitar(porPagina: number): number {
  return Math.min(Math.max(1, Math.trunc(porPagina)), MAXIMO_POR_PAGINA);
}

function montarLista<T>(
  itens: T[],
  total: number,
  totalPaginas: number,
  pagina: number,
): Lista<T> {
  return { itens, total, totalPaginas, pagina };
}

// ===========================================================================
// MATÉRIAS
// ===========================================================================

export type FiltroMaterias = {
  pagina?: number;
  porPagina?: number;
  /** ID de categoria. Resolva o slug antes com `categoriaPorSlug()`. */
  categoria?: number;
  /** ID de tag. */
  tag?: number;
  /** Busca por texto. O WordPress procura em título, resumo e corpo. */
  busca?: string;
  ordenar?: Ordenacao;
  /** IDs a excluir — a matéria de capa não se repete na lista abaixo dela. */
  excluir?: number[];
};

/**
 * Listagem paginada de matérias. Serve o arquivo de categoria, a home e a busca.
 *
 * Uma página fora de alcance devolve lista vazia com `total` real — quem chama
 * decide entre `notFound()` e um estado vazio.
 */
export async function listarMaterias(filtro: FiltroMaterias = {}): Promise<Lista<Materia>> {
  const pagina = Math.max(1, Math.trunc(filtro.pagina ?? 1));
  const { orderby, order } = ORDENACAO[filtro.ordenar ?? 'recentes'];

  const { dados, total, totalPaginas } = await buscarLista<BrutoMateria>('posts', {
    page: pagina,
    per_page: limitar(filtro.porPagina ?? 12),
    categories: filtro.categoria,
    tags: filtro.tag,
    search: filtro.busca?.trim(),
    exclude: filtro.excluir?.length ? filtro.excluir : undefined,
    orderby,
    order,
    _fields: CAMPOS.materia,
  });

  return montarLista(dados.map(mapearMateria), total, totalPaginas, pagina);
}

/** A matéria de uma URL `/[categoria]/[slug]`. `null` vira `notFound()`. */
export async function materiaPorSlug(slug: string): Promise<MateriaCompleta | null> {
  const bruto = await buscarPorSlug<BrutoMateria>('posts', slug, {
    _fields: CAMPOS.materiaCompleta,
  });

  return bruto ? mapearMateriaCompleta(bruto) : null;
}

/** Matérias específicas, na ordem dos IDs pedidos. */
export async function materiasPorIds(ids: number[]): Promise<Materia[]> {
  if (ids.length === 0) return [];

  const { dados } = await buscarLista<BrutoMateria>('posts', {
    include: ids.slice(0, MAXIMO_POR_PAGINA),
    per_page: limitar(ids.length),
    orderby: 'include',
    _fields: CAMPOS.materia,
  });

  return naOrdemDosIds(dados.map(mapearMateria), ids);
}

/**
 * Matérias relacionadas a uma matéria, por categoria compartilhada.
 *
 * Sem campo de "relacionados" para matéria no mu-plugin, o critério é a
 * categoria — o mesmo que o leitor entende como assunto.
 */
export async function materiasRelacionadas(
  materia: Materia,
  quantidade = 3,
): Promise<Materia[]> {
  const { itens } = await listarMaterias({
    categoria: materia.categorias[0],
    excluir: [materia.id],
    porPagina: quantidade,
  });

  return itens;
}

/**
 * Matérias que mencionam um termo do Almanaque, para a seção "onde aparece"
 * do verbete.
 *
 * É a busca do WordPress sobre título, resumo e corpo. Um verbete cujo termo
 * não aparece escrito em nenhuma matéria devolve lista vazia — e é um caso
 * comum, não um erro.
 */
export async function materiasQueCitam(
  termo: string,
  quantidade = 4,
): Promise<Materia[]> {
  if (!termo.trim()) return [];

  const { itens } = await listarMaterias({ busca: termo, porPagina: quantidade });

  return itens;
}

/** Total de matérias publicadas. Vem do header, sem baixar as matérias. */
export const contarMaterias = cache(async (): Promise<number> => {
  const { total } = await buscarLista<BrutoMateria>('posts', {
    per_page: 1,
    _fields: 'id',
  });

  return total;
});

// ===========================================================================
// VERBETES
// ===========================================================================

/**
 * Todos os verbetes em ordem alfabética, para o índice A–Z.
 *
 * O índice é uma página só, com navegação por letra — paginar não faria
 * sentido. São 22 verbetes hoje; o `per_page` do WordPress trava em 100, então
 * esta função busca até 100 e para. Passando de 100, virar paginação aqui.
 */
export const listarVerbetes = cache(async (): Promise<Verbete[]> => {
  const { dados } = await buscarLista<BrutoVerbete>('verbetes', {
    per_page: MAXIMO_POR_PAGINA,
    orderby: 'title',
    order: 'asc',
    _fields: CAMPOS.verbete,
  });

  return dados.map(mapearVerbete);
});

/**
 * Verbetes agrupados por letra inicial, na ordem do alfabeto.
 *
 * Devolve as 26 letras **sempre**, inclusive as vazias — K, Q, W, X, Y e Z
 * estão vazias de propósito no conteúdo de teste, e é a navegação do índice
 * que precisa saber disso para renderizá-las em cinza e sem link.
 */
export async function verbetesPorLetra(): Promise<
  Array<{ letra: string; verbetes: Verbete[] }>
> {
  const verbetes = await listarVerbetes();
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const grupos = alfabeto.map((letra) => ({
    letra,
    verbetes: verbetes.filter((verbete) => verbete.letra === letra),
  }));

  // Títulos que não começam com letra de A a Z caem em "#" — só entra no
  // resultado se existir algum, para não criar uma seção vazia à toa.
  const foraDoAlfabeto = verbetes.filter((verbete) => verbete.letra === '#');

  return foraDoAlfabeto.length > 0
    ? [...grupos, { letra: '#', verbetes: foraDoAlfabeto }]
    : grupos;
}

export async function verbetePorSlug(slug: string): Promise<VerbeteCompleto | null> {
  const bruto = await buscarPorSlug<BrutoVerbete>('verbetes', slug, {
    _fields: CAMPOS.verbeteCompleto,
  });

  return bruto ? mapearVerbeteCompleto(bruto) : null;
}

/**
 * Verbetes por ID, na ordem em que foram escolhidos no editor.
 *
 * Alimenta a caixa "Do Almanaque" da matéria e os relacionados do verbete.
 * A ordem importa: é escolha editorial, e sem `orderby=include` a API devolve
 * por data.
 */
export async function verbetesPorIds(ids: number[]): Promise<Verbete[]> {
  if (ids.length === 0) return [];

  const { dados } = await buscarLista<BrutoVerbete>('verbetes', {
    include: ids.slice(0, MAXIMO_POR_PAGINA),
    per_page: limitar(ids.length),
    orderby: 'include',
    _fields: CAMPOS.verbete,
  });

  return naOrdemDosIds(dados.map(mapearVerbete), ids);
}

/**
 * O verbete anterior e o próximo, em ordem alfabética.
 *
 * Reaproveita a lista completa já cacheada por render, em vez de duas
 * consultas ordenadas na API.
 */
export async function verbeteVizinhos(
  slug: string,
): Promise<{ anterior: Verbete | null; proximo: Verbete | null }> {
  const verbetes = await listarVerbetes();
  const indice = verbetes.findIndex((verbete) => verbete.slug === slug);

  if (indice === -1) return { anterior: null, proximo: null };

  return {
    anterior: verbetes[indice - 1] ?? null,
    proximo: verbetes[indice + 1] ?? null,
  };
}

/** Total de verbetes publicados — o "418 verbetes" do mockup, de verdade. */
export const contarVerbetes = cache(async (): Promise<number> => {
  const { total } = await buscarLista<BrutoVerbete>('verbetes', {
    per_page: 1,
    _fields: 'id',
  });

  return total;
});

// ===========================================================================
// EVENTOS
// ===========================================================================

/** Hoje no fuso de São Paulo, em `AAAA-MM-DD`. */
function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Eventos da agenda, do mais próximo ao mais distante.
 *
 * O filtro por data e a ordenação acontecem em JavaScript, não na API: as
 * datas moram em `meta`, e a REST API do WordPress não expõe `meta_query`.
 * Com 3 eventos isso é irrelevante; se a agenda crescer muito, o caminho é um
 * endpoint próprio no mu-plugin, não um `meta_query` improvisado.
 */
export async function listarEventos(
  opcoes: { apenasFuturos?: boolean; quantidade?: number } = {},
): Promise<Evento[]> {
  const { dados } = await buscarLista<BrutoEvento>('eventos', {
    per_page: MAXIMO_POR_PAGINA,
    _fields: CAMPOS.evento,
  });

  const hoje = hojeEmSaoPaulo();

  let eventos = dados
    .map(mapearEvento)
    // Sem data de início não há como posicionar na agenda.
    .filter((evento) => evento.dataInicio !== '');

  if (opcoes.apenasFuturos !== false) {
    // Um evento de vários dias continua acontecendo até a data de término.
    eventos = eventos.filter((evento) => (evento.dataFim ?? evento.dataInicio) >= hoje);
  }

  eventos.sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));

  return opcoes.quantidade ? eventos.slice(0, opcoes.quantidade) : eventos;
}

export async function eventoPorSlug(slug: string): Promise<Evento | null> {
  const bruto = await buscarPorSlug<BrutoEvento>('eventos', slug, {
    _fields: CAMPOS.evento,
  });

  return bruto ? mapearEvento(bruto) : null;
}

// ===========================================================================
// PÁGINAS
// ===========================================================================

export async function paginaPorSlug(slug: string): Promise<Pagina | null> {
  const bruto = await buscarPorSlug<BrutoPagina>('pages', slug, {
    _fields: CAMPOS.pagina,
  });

  return bruto ? mapearPagina(bruto) : null;
}

// ===========================================================================
// CATEGORIAS E TAGS
// ===========================================================================

/**
 * As 7 editorias, em ordem alfabética.
 *
 * Cacheada por render: o menu, os cards e o rodapé pedem a mesma lista, e sai
 * uma requisição só.
 */
export const listarCategorias = cache(async (): Promise<Termo[]> => {
  const { dados } = await buscarLista<BrutoTermo>(
    'categories',
    {
      per_page: MAXIMO_POR_PAGINA,
      orderby: 'name',
      order: 'asc',
      // Sem `hide_empty`: uma editoria sem matéria publicada ainda precisa
      // aparecer no menu e ter página própria.
      _fields: CAMPOS.termo,
    },
    { revalidar: REVALIDAR.taxonomia },
  );

  return dados.map(mapearTermo);
});

/**
 * Resolve o slug da URL em categoria. `null` significa 404.
 *
 * Passa pela lista completa em vez de consultar `?slug=`: são 7 termos, já
 * cacheados por render, e evita uma requisição por página de categoria.
 */
export async function categoriaPorSlug(slug: string): Promise<Termo | null> {
  const categorias = await listarCategorias();

  return categorias.find((categoria) => categoria.slug === slug) ?? null;
}

export async function categoriasPorIds(ids: number[]): Promise<Termo[]> {
  if (ids.length === 0) return [];

  const categorias = await listarCategorias();

  return naOrdemDosIds(categorias, ids);
}

/** A categoria principal de uma matéria — a que monta a URL. */
export async function categoriaPrincipal(materia: Materia): Promise<Termo | null> {
  const [primeira] = await categoriasPorIds(materia.categorias);

  return primeira ?? null;
}

export const listarTags = cache(async (): Promise<Termo[]> => {
  const { dados } = await buscarLista<BrutoTermo>(
    'tags',
    {
      per_page: MAXIMO_POR_PAGINA,
      orderby: 'name',
      order: 'asc',
      _fields: CAMPOS.termo,
    },
    { revalidar: REVALIDAR.taxonomia },
  );

  return dados.map(mapearTermo);
});

export async function tagPorSlug(slug: string): Promise<Termo | null> {
  const tags = await listarTags();

  return tags.find((tag) => tag.slug === slug) ?? null;
}

export async function tagsPorIds(ids: number[]): Promise<Termo[]> {
  if (ids.length === 0) return [];

  const tags = await listarTags();

  return naOrdemDosIds(tags, ids);
}

// ===========================================================================
// AUTORES
// ===========================================================================

export const autorPorId = cache(async (id: number): Promise<Autor | null> => {
  if (!Number.isInteger(id) || id <= 0) return null;

  const bruto = await buscarPorId<BrutoAutor>(
    'users',
    id,
    { _fields: CAMPOS.autor },
    { revalidar: REVALIDAR.taxonomia },
  );

  return bruto ? mapearAutor(bruto) : null;
});

// ===========================================================================
// BUSCA
// ===========================================================================

export type ResultadoBusca = {
  termo: string;
  materias: Materia[];
  verbetes: Verbete[];
  /** Soma dos dois. Zero é o estado "sem resultados" da tela 15. */
  total: number;
};

/**
 * A busca do site: matérias e verbetes na mesma consulta.
 *
 * A busca do Almanaque em si é client-side com Fuse.js sobre um JSON gerado no
 * build — esta é a busca geral do cabeçalho, que precisa das matérias também.
 */
export async function buscar(
  termo: string,
  opcoes: { porTipo?: number } = {},
): Promise<ResultadoBusca> {
  const limpo = termo.trim();

  if (limpo === '') {
    return { termo: '', materias: [], verbetes: [], total: 0 };
  }

  const porTipo = limitar(opcoes.porTipo ?? 10);

  const [materias, verbetes] = await Promise.all([
    listarMaterias({ busca: limpo, porPagina: porTipo }),
    buscarLista<BrutoVerbete>('verbetes', {
      search: limpo,
      per_page: porTipo,
      orderby: 'title',
      order: 'asc',
      _fields: CAMPOS.verbete,
    }),
  ]);

  return {
    termo: limpo,
    materias: materias.itens,
    verbetes: verbetes.dados.map(mapearVerbete),
    total: materias.total + verbetes.total,
  };
}

/** Um item do painel de sugestões. Já pronto para renderizar — sem resolver nada. */
export type Sugestao = {
  tipo: 'materia' | 'verbete';
  /** O que aparece à direita do item: nome da editoria, ou "Almanaque". */
  rotulo: string;
  titulo: string;
  href: string;
};

/** Sem acento, sem caixa, sem espaço nas pontas. Para comparar, não para exibir. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * As sugestões do combobox da busca.
 *
 * Devolve no máximo `limite` itens **intercalando matéria e verbete**, e não os
 * 8 primeiros de um tipo só: a especificação pede a lista misturada, e sem
 * intercalar uma editoria movimentada enterraria o Almanaque.
 *
 * A exceção é o acerto exato: se o termo digitado for o título de um verbete,
 * aquele verbete vem primeiro. Quem digita "terroir" inteiro quer a definição.
 *
 * Devolve `href` montado, então o cliente não resolve categoria nem rota.
 */
export async function sugestoes(termo: string, limite = 8): Promise<Sugestao[]> {
  const limpo = termo.trim();

  if (limpo === '') return [];

  const [materias, brutosVerbetes, categorias] = await Promise.all([
    listarMaterias({ busca: limpo, porPagina: limite }),
    buscarLista<BrutoVerbete>('verbetes', {
      search: limpo,
      per_page: limite,
      orderby: 'title',
      order: 'asc',
      _fields: CAMPOS.verbete,
    }),
    listarCategorias(),
  ]);

  const porId = new Map(categorias.map((categoria) => [categoria.id, categoria]));

  const deMaterias: Sugestao[] = materias.itens.flatMap((materia) => {
    const categoria = porId.get(materia.categorias[0] ?? -1);

    // Sem categoria não existe rota `/{categoria}/{slug}`. Fora da lista.
    return categoria
      ? [
          {
            tipo: 'materia' as const,
            rotulo: categoria.nome,
            titulo: materia.titulo,
            href: `/${categoria.slug}/${materia.slug}`,
          },
        ]
      : [];
  });

  const deVerbetes: Sugestao[] = brutosVerbetes.dados.map(mapearVerbete).map((verbete) => ({
    tipo: 'verbete' as const,
    rotulo: 'Almanaque',
    titulo: verbete.titulo,
    href: `/almanaque/${verbete.slug}`,
  }));

  const alvo = normalizar(limpo);
  const exato = deVerbetes.findIndex((item) => normalizar(item.titulo) === alvo);

  const misturadas: Sugestao[] = [];

  if (exato !== -1) {
    misturadas.push(deVerbetes.splice(exato, 1)[0]);
  }

  for (let i = 0; misturadas.length < limite; i += 1) {
    const proximos = [deMaterias[i], deVerbetes[i]].filter(Boolean) as Sugestao[];

    if (proximos.length === 0) break;

    for (const item of proximos) {
      if (misturadas.length < limite) misturadas.push(item);
    }
  }

  return misturadas;
}

/**
 * Dados para o JSON estático da busca do Almanaque, gerado no build.
 *
 * Deliberadamente enxuto: é o payload que vai para o navegador do leitor.
 */
export async function indiceDoAlmanaque(): Promise<
  Array<{ slug: string; titulo: string; definicao: string; letra: string }>
> {
  const verbetes = await listarVerbetes();

  return verbetes.map(({ slug, titulo, definicaoCurta, letra }) => ({
    slug,
    titulo,
    definicao: definicaoCurta,
    letra,
  }));
}
