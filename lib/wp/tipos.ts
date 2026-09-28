/**
 * Tipos da camada de dados.
 *
 * Duas famílias, de propósito:
 *
 * - `Bruto*` — o que a REST API do WordPress devolve de fato. Derivados da
 *   resposta real de `wp.descubraovinho.com.br`, não da documentação.
 * - o resto — o domínio do portal, em português, já decodificado e com o
 *   estado vazio explícito no tipo. É só isso que sai deste módulo.
 *
 * Nenhum componente importa um tipo `Bruto*`.
 */

// ===========================================================================
// 1 · IMAGENS
// ===========================================================================

/**
 * Os tamanhos nomeados gerados no WordPress. Ver a tabela em CLAUDE.md.
 * Os nomes são os mesmos do mu-plugin, para o mapa entre os dois ser óbvio.
 */
export type NomeTamanho =
  | 'dov_hero' // 16:9  1920×1080 — hero da home
  | 'dov_destaque' // 3:2   1600×1067 — topo da matéria
  | 'dov_card_4x3' // 4:3   1200×900  — card em destaque
  | 'dov_corpo' // livre 1200 de largura
  | 'dov_card' // 3:2   800×533   — card padrão
  | 'dov_retrato'; // 1:1   240×240    — autor

/** Uma imagem pronta para `next/image`. */
export type Imagem = {
  url: string;
  largura: number;
  altura: number;
  alt: string;
};

/**
 * O conjunto de tamanhos de um post.
 *
 * `tamanhos` é `Partial` porque o mu-plugin omite a chave quando
 * `wp_get_attachment_image_src` falha — o que acontece quando o arquivo
 * original é menor que o tamanho pedido. Ou seja: mesmo com `imagens`
 * preenchido, um tamanho específico pode não existir. Use `imagem()`.
 */
export type Imagens = {
  alt: string;
  tamanhos: Partial<Record<NomeTamanho, Omit<Imagem, 'alt'>>>;
};

// ===========================================================================
// 2 · DOMÍNIO
// ===========================================================================

/**
 * Um resultado paginado. `total` e `totalPaginas` vêm dos headers
 * `X-WP-Total` e `X-WP-TotalPages` — o componente de paginação depende deles.
 */
export type Lista<T> = {
  itens: T[];
  total: number;
  totalPaginas: number;
  pagina: number;
};

/**
 * Matéria como aparece numa listagem ou num card.
 *
 * `imagens` é `Imagens | null` porque hoje **nenhum** conteúdo tem imagem
 * destacada. O `null` está no tipo para o estado vazio não ser esquecido.
 */
export type Materia = {
  id: number;
  slug: string;
  /** Já decodificado. */
  titulo: string;
  /** Texto puro, sem o `<p>` que o WordPress envolve. */
  resumo: string;
  /** ISO 8601 no fuso de São Paulo. É o campo de exibição. */
  data: string;
  /** ISO 8601 em UTC. Para `<time dateTime>` e sitemap. */
  dataUtc: string;
  imagens: Imagens | null;
  /** IDs — resolver com `listarCategorias()`, que é cacheada por render. */
  categorias: number[];
  tags: number[];
  autorId: number;
  /** Crédito da foto de destaque. Vazio quando não informado. */
  creditoFoto: string;
  /** IDs de verbete que alimentam a caixa "Do Almanaque". */
  verbetesRelacionados: number[];
  /** Em minutos, mínimo 1. Hoje é 1 em tudo, porque os corpos são curtos. */
  tempoLeitura: number;
  seo: { titulo: string; descricao: string };
};

/** Matéria com o corpo do texto. Só a consulta de item único devolve isso. */
export type MateriaCompleta = Materia & {
  /**
   * HTML do editor de blocos, com classes `wp-block-*`. Vai para o DOM via
   * `dangerouslySetInnerHTML`, dentro de um wrapper com escopo — **não** passa
   * por decodificação de entidades.
   */
  conteudoHtml: string;
  /** Última modificação, em UTC. */
  modificadoUtc: string;
};

export type Verbete = {
  id: number;
  slug: string;
  titulo: string;
  /**
   * "substantivo masculino". Campo novo no mu-plugin, ainda vazio em todos os
   * verbetes — a linha de gramática compõe com o que houver.
   */
  classeGramatical: string;
  /** Uma frase. Alimenta os cards do índice A–Z e a busca. */
  definicaoCurta: string;
  /** Frequentemente vazios — a linha inteira desaparece quando os dois são. */
  etimologia: string;
  pronuncia: string;
  /** Caixa destacada, opcional. */
  naPratica: string;
  /**
   * Segunda caixa destacada, opcional e independente de `naPratica` — um verbete
   * pode ter as duas.
   */
  curiosidade: string;
  /**
   * Como o verbete se ordena no índice, quando o título não serve.
   *
   * "Vinho Natural" ordenado pelo título joga 22 verbetes na letra V. Com
   * `ordenacao` igual a "Natural, vinho", ele cai em N. **O título exibido não
   * muda** — isto só governa letra e posição.
   *
   * Vazio na maioria: quem não tem usa o título.
   */
  ordenacao: string;
  /** IDs de outros verbetes, na ordem definida no editor. */
  relacionados: number[];
  imagens: Imagens | null;
  /**
   * A letra do índice. Vem de `ordenacao` quando preenchido, senão do título,
   * com acento normalizado. "#" para o que não começa com A–Z.
   */
  letra: string;
  /**
   * A chave de comparação que ordena o índice e define anterior/próximo.
   *
   * Sem acento e em maiúsculas, derivada da mesma fonte que a `letra`. Existe
   * como campo, e não como cálculo na hora de ordenar, para que **ordem, letra e
   * vizinhos saiam sempre da mesma origem** — foi assim que a ordenação por
   * título e a letra por título já combinavam, e é o que precisa continuar
   * valendo agora que a origem pode ser outra.
   */
  chaveOrdenacao: string;
  data: string;
  dataUtc: string;
};

export type VerbeteCompleto = Verbete & {
  conteudoHtml: string;
  modificadoUtc: string;
};

export type Evento = {
  id: number;
  slug: string;
  titulo: string;
  /** `AAAA-MM-DD`. */
  dataInicio: string;
  /** `null` quando o evento é de um dia só. */
  dataFim: string | null;
  /** Cidade, ou "online". */
  local: string;
  /** `null` quando não há inscrição externa. */
  link: string | null;
  imagens: Imagens | null;
  conteudoHtml: string;
};

export type Pagina = {
  id: number;
  slug: string;
  titulo: string;
  resumo: string;
  conteudoHtml: string;
  modificadoUtc: string;
  /**
   * `dov_imagens` passou a ser registrado para `page` no mu-plugin, então página
   * agora pode ter imagem destacada. Continua `null` até alguém subir uma.
   */
  imagens: Imagens | null;
};

/**
 * Categoria ou tag. As duas têm exatamente a mesma forma na API; o que
 * distingue é a consulta que devolve.
 */
export type Termo = {
  id: number;
  /** Já decodificado — "Saúde & Ciência", não `Saúde &amp; Ciência`. */
  nome: string;
  /** Contrato de rota. `saude-e-ciencia`, com o "e". */
  slug: string;
  descricao: string;
  /** Quantas matérias publicadas. */
  quantidade: number;
};

export type Autor = {
  id: number;
  nome: string;
  slug: string;
  /** Uma ou duas frases, na assinatura da matéria. Ainda vazio em produção. */
  minibio: string;
  /** Retrato 240×240. `null` quando não informado — hoje, sempre. */
  retratoUrl: string | null;
};

// ===========================================================================
// 3 · RESPOSTA BRUTA DA API
// ===========================================================================

type Renderizado = { rendered: string };

/** O que o mu-plugin injeta em `dov_imagens`. `null` sem imagem destacada. */
export type BrutoImagens = {
  alt?: string;
} & Partial<Record<NomeTamanho, { url: string; w: number; h: number }>>;

export type BrutoMateria = {
  id: number;
  slug: string;
  date: string;
  date_gmt: string;
  modified_gmt?: string;
  title: Renderizado;
  excerpt?: Renderizado;
  content?: Renderizado;
  author: number;
  categories: number[];
  tags: number[];
  dov_imagens: BrutoImagens | null;
  meta: {
    dov_credito_foto?: string;
    dov_verbetes_relacionados?: number[];
    dov_seo_titulo?: string;
    dov_seo_descricao?: string;
    dov_tempo_leitura?: number;
  };
};

export type BrutoVerbete = {
  id: number;
  slug: string;
  date: string;
  date_gmt: string;
  modified_gmt?: string;
  title: Renderizado;
  content?: Renderizado;
  dov_imagens: BrutoImagens | null;
  meta: {
    dov_classe_gramatical?: string;
    dov_ordenacao?: string;
    dov_definicao_curta?: string;
    dov_etimologia?: string;
    dov_pronuncia?: string;
    dov_na_pratica?: string;
    dov_curiosidade?: string;
    dov_relacionados?: number[];
  };
};

export type BrutoEvento = {
  id: number;
  slug: string;
  title: Renderizado;
  content?: Renderizado;
  dov_imagens: BrutoImagens | null;
  meta: {
    dov_data_inicio?: string;
    dov_data_fim?: string;
    dov_local?: string;
    dov_link?: string;
  };
};

export type BrutoPagina = {
  id: number;
  slug: string;
  modified_gmt?: string;
  title: Renderizado;
  excerpt?: Renderizado;
  content?: Renderizado;
  dov_imagens: BrutoImagens | null;
};

export type BrutoTermo = {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
};

export type BrutoAutor = {
  id: number;
  name: string;
  slug: string;
  description: string;
  meta?: {
    dov_minibio?: string;
    dov_retrato_url?: string;
  };
};
