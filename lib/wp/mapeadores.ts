/**
 * Bruto → domínio.
 *
 * Todo campo de texto passa por `decodificarEntidades` ou `paraTextoSimples`
 * exatamente aqui. É o que garante a armadilha nº 1 resolvida uma vez só.
 *
 * `content.rendered` é a exceção deliberada: sai cru, porque é HTML de verdade.
 */

import { decodificarEntidades, letraInicial, paraTextoSimples } from './html';
import type {
  Autor,
  BrutoAutor,
  BrutoEvento,
  BrutoImagens,
  BrutoMateria,
  BrutoPagina,
  BrutoTermo,
  BrutoVerbete,
  Evento,
  Imagem,
  Imagens,
  Materia,
  MateriaCompleta,
  NomeTamanho,
  Pagina,
  Termo,
  Verbete,
  VerbeteCompleto,
} from './tipos';

const TAMANHOS: readonly NomeTamanho[] = [
  'dov_hero',
  'dov_destaque',
  'dov_card_4x3',
  'dov_corpo',
  'dov_card',
  'dov_retrato',
];

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function inteiros(valor: unknown): number[] {
  return Array.isArray(valor) ? valor.filter((n): n is number => Number.isInteger(n)) : [];
}

/** Campo de texto opcional que pode vir vazio, como etimologia ou local. */
function opcional(valor: unknown): string {
  return decodificarEntidades(texto(valor));
}

/** Campo opcional em que vazio significa "não existe". */
function opcionalOuNulo(valor: unknown): string | null {
  const limpo = texto(valor);

  return limpo === '' ? null : limpo;
}

// ===========================================================================
// IMAGENS
// ===========================================================================

export function mapearImagens(bruto: BrutoImagens | null | undefined): Imagens | null {
  if (!bruto) return null;

  const tamanhos: Imagens['tamanhos'] = {};

  for (const nome of TAMANHOS) {
    const item = bruto[nome];

    // O mu-plugin omite a chave quando o arquivo original é menor que o
    // tamanho pedido. Sem largura e altura, `next/image` não renderiza.
    if (!item?.url || !item.w || !item.h) continue;

    tamanhos[nome] = { url: item.url, largura: item.w, altura: item.h };
  }

  // Registro sem nenhum tamanho utilizável é o mesmo que não ter imagem.
  if (Object.keys(tamanhos).length === 0) return null;

  return { alt: opcional(bruto.alt), tamanhos };
}

/**
 * Escolhe um tamanho, com alternativas em ordem de preferência.
 *
 * Devolve `null` quando o post não tem imagem **ou** quando nenhum dos
 * tamanhos pedidos existe. Todo componente que consome imagem trata esse
 * `null` — hoje é o caso de 100% do conteúdo.
 *
 *     const capa = imagem(materia.imagens, 'dov_card_4x3', 'dov_card');
 *     if (!capa) return <SemImagem />;
 */
export function imagem(
  imagens: Imagens | null | undefined,
  ...preferencia: NomeTamanho[]
): Imagem | null {
  if (!imagens) return null;

  for (const nome of preferencia) {
    const encontrado = imagens.tamanhos[nome];

    if (encontrado) return { ...encontrado, alt: imagens.alt };
  }

  return null;
}

// ===========================================================================
// CONTEÚDO
// ===========================================================================

export function mapearMateria(bruto: BrutoMateria): Materia {
  return {
    id: bruto.id,
    slug: bruto.slug,
    titulo: decodificarEntidades(bruto.title?.rendered ?? ''),
    resumo: paraTextoSimples(bruto.excerpt?.rendered),
    data: bruto.date,
    dataUtc: bruto.date_gmt,
    imagens: mapearImagens(bruto.dov_imagens),
    categorias: inteiros(bruto.categories),
    tags: inteiros(bruto.tags),
    autorId: bruto.author,
    creditoFoto: opcional(bruto.meta?.dov_credito_foto),
    verbetesRelacionados: inteiros(bruto.meta?.dov_verbetes_relacionados),
    // Mínimo 1: o mu-plugin já garante, mas um post antigo pode não ter o meta.
    tempoLeitura: Math.max(1, Number(bruto.meta?.dov_tempo_leitura) || 1),
    seo: {
      // Vazio significa "usar o título e o resumo" — a decisão fica no template.
      titulo: opcional(bruto.meta?.dov_seo_titulo),
      descricao: opcional(bruto.meta?.dov_seo_descricao),
    },
  };
}

export function mapearMateriaCompleta(bruto: BrutoMateria): MateriaCompleta {
  return {
    ...mapearMateria(bruto),
    conteudoHtml: bruto.content?.rendered ?? '',
    modificadoUtc: bruto.modified_gmt ?? bruto.date_gmt,
  };
}

export function mapearVerbete(bruto: BrutoVerbete): Verbete {
  const titulo = decodificarEntidades(bruto.title?.rendered ?? '');

  return {
    id: bruto.id,
    slug: bruto.slug,
    titulo,
    classeGramatical: opcional(bruto.meta?.dov_classe_gramatical),
    definicaoCurta: opcional(bruto.meta?.dov_definicao_curta),
    etimologia: opcional(bruto.meta?.dov_etimologia),
    pronuncia: opcional(bruto.meta?.dov_pronuncia),
    naPratica: opcional(bruto.meta?.dov_na_pratica),
    relacionados: inteiros(bruto.meta?.dov_relacionados),
    imagens: mapearImagens(bruto.dov_imagens),
    letra: letraInicial(titulo),
    data: bruto.date,
    dataUtc: bruto.date_gmt,
  };
}

export function mapearVerbeteCompleto(bruto: BrutoVerbete): VerbeteCompleto {
  return {
    ...mapearVerbete(bruto),
    conteudoHtml: bruto.content?.rendered ?? '',
    modificadoUtc: bruto.modified_gmt ?? bruto.date_gmt,
  };
}

export function mapearEvento(bruto: BrutoEvento): Evento {
  return {
    id: bruto.id,
    slug: bruto.slug,
    titulo: decodificarEntidades(bruto.title?.rendered ?? ''),
    dataInicio: texto(bruto.meta?.dov_data_inicio),
    // Vazio significa evento de um dia só.
    dataFim: opcionalOuNulo(bruto.meta?.dov_data_fim),
    local: opcional(bruto.meta?.dov_local),
    link: opcionalOuNulo(bruto.meta?.dov_link),
    imagens: mapearImagens(bruto.dov_imagens),
    conteudoHtml: bruto.content?.rendered ?? '',
  };
}

export function mapearPagina(bruto: BrutoPagina): Pagina {
  return {
    id: bruto.id,
    slug: bruto.slug,
    titulo: decodificarEntidades(bruto.title?.rendered ?? ''),
    resumo: paraTextoSimples(bruto.excerpt?.rendered),
    conteudoHtml: bruto.content?.rendered ?? '',
    modificadoUtc: bruto.modified_gmt ?? '',
    imagens: mapearImagens(bruto.dov_imagens),
  };
}

export function mapearTermo(bruto: BrutoTermo): Termo {
  return {
    id: bruto.id,
    nome: decodificarEntidades(bruto.name ?? ''),
    slug: bruto.slug,
    descricao: paraTextoSimples(bruto.description),
    quantidade: Number(bruto.count) || 0,
  };
}

export function mapearAutor(bruto: BrutoAutor): Autor {
  return {
    id: bruto.id,
    nome: decodificarEntidades(bruto.name ?? ''),
    slug: bruto.slug,
    // O `description` nativo do WordPress é o reserva da minibio própria.
    minibio: opcional(bruto.meta?.dov_minibio) || paraTextoSimples(bruto.description),
    retratoUrl: opcionalOuNulo(bruto.meta?.dov_retrato_url),
  };
}

/**
 * Ordena o resultado de `include` na ordem em que os IDs foram pedidos.
 *
 * A API aceita `orderby=include`, mas nem todo endpoint respeita — e a ordem
 * dos relacionados é escolha editorial, definida no `<select multiple>` do
 * editor. Reordenar aqui é a garantia.
 */
export function naOrdemDosIds<T extends { id: number }>(itens: T[], ids: number[]): T[] {
  const porId = new Map(itens.map((item) => [item.id, item]));

  return ids
    .map((id) => porId.get(id))
    .filter((item): item is T => item !== undefined);
}
