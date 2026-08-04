/**
 * Constantes do site que não vêm da API nem dos tokens.
 *
 * O que está aqui é texto de marca e estrutura de navegação. Nada de conteúdo
 * editorial: matéria, verbete, evento e categoria vêm sempre do WordPress.
 */

export type ItemNav = { rotulo: string; href: string };

export const SITE = {
  nome: 'Descubra o Vinho',

  /**
   * Domínio de produção. Alimenta o `metadataBase` do Next, e com ele as URLs
   * canônicas e as de Open Graph — que precisam ser absolutas.
   */
  url: 'https://descubraovinho.com.br',

  /** Copy do rodapé, do pacote do designer. */
  descricao:
    'Um portal para descobrir o universo do vinho sem solenidade: viagens, ' +
    'harmonizações, mercado, ciência e curiosidades.',

  /** Faixa utilitária do cabeçalho desktop. */
  assinatura: 'Descubra + Compartilhe + Viva +',

  /** Exigência legal. Fica sempre visível no rodapé. */
  avisoLegal: 'Aprecie com moderação. Venda proibida para menores de 18 anos.',
} as const;

/**
 * Links utilitários do cabeçalho e do menu mobile.
 *
 * "Newsletter" não é página: aponta para o formulário do rodapé, que existe em
 * toda tela. É interpretação — os mockups mostram o rótulo sem destino.
 */
export const UTILITARIOS: ItemNav[] = [
  { rotulo: 'Quem Somos', href: '/quem-somos' },
  { rotulo: 'Contato', href: '/contato' },
  { rotulo: 'Newsletter', href: '#newsletter' },
];

/**
 * Perfis de rede social.
 *
 * ⚠️ **Endereços provisórios, não confirmados com o cliente.**
 *
 * São o handle da marca, escolhidos por serem o palpite mais provável — mas
 * `instagram.com/descubraovinho` **pode pertencer a outra pessoa**, e aí o
 * rodapé de um site de cliente aponta para um terceiro. Conferir com o cliente
 * antes do lançamento; está no checklist da Fase 5.
 *
 * A estrutura aceita `null`: quem for `null` não é renderizado, porque faltar um
 * ícone no rodapé é melhor que entregar link morto.
 */
export const REDES: Array<{ nome: string; url: string | null }> = [
  { nome: 'Instagram', url: 'https://www.instagram.com/descubraovinho/' },
  { nome: 'YouTube', url: 'https://www.youtube.com/@descubraovinho' },
];

/**
 * Páginas legais do rodapé.
 *
 * São rotas do Next e não páginas do WordPress: texto jurídico muda pouco e não
 * precisa passar pelo editor. Se o cliente quiser editar sozinho, viram páginas
 * no WordPress e entram no template de `/[slug]`.
 *
 * ⚠️ O texto das duas é **rascunho**, e precisa de revisão jurídica antes do
 * lançamento — está no checklist da Fase 5.
 */
export const PAGINAS_LEGAIS: ItemNav[] = [
  { rotulo: 'Política de privacidade', href: '/politica-de-privacidade' },
  { rotulo: 'Termos de uso', href: '/termos-de-uso' },
];

/** Destinos fixos, fora das editorias. */
export const ALMANAQUE: ItemNav = { rotulo: 'Almanaque', href: '/almanaque' };
export const BUSCA: ItemNav = { rotulo: 'Buscar', href: '/busca' };

/**
 * A largura em que o cabeçalho troca de hambúrguer para menu completo.
 *
 * **Precisa acompanhar** `--breakpoint-menu` no `app/globals.css` e as media
 * queries de `.cabecalho__desktop` / `.cabecalho__mobile` em
 * `app/componentes.css`. Media query não aceita `var()`, então o número vive em
 * dois lugares — este comentário é a amarra entre eles.
 *
 * O JavaScript precisa dele porque o menu em tela cheia é renderizado por
 * portal no `<body>`: sem fechá-lo ao cruzar a fronteira, girar o tablet com o
 * menu aberto deixaria o painel cobrindo o layout de desktop.
 */
export const LARGURA_MENU_DESKTOP = 1280;

/**
 * A ordem das editorias no menu e no rodapé.
 *
 * A API não tem como informar isso: ordenação de termos exige plugin, e sem ele
 * `orderby` só oferece nome, id e contagem. Alfabética poria "Curiosidades"
 * antes de "Descubra", e as pranchas abrem por "Descubra" — que é a editoria
 * âncora do portal, não a primeira do alfabeto.
 *
 * São **slugs**, não nomes: o cliente pode renomear a editoria no WordPress sem
 * quebrar a ordem. Quem não estiver na lista entra no fim, em ordem alfabética —
 * uma editoria nova aparece sozinha, sem precisar mexer aqui.
 */
const ORDEM_EDITORIAS = [
  'descubra',
  'curiosidades',
  'harmonize',
  'mercado',
  'saude-e-ciencia',
  'viaje',
  'programe-se',
] as const;

/**
 * A curadoria da home, por slug.
 *
 * As pranchas destacam Viaje no bloco grande e Harmonize + Mercado no par
 * lado a lado. É escolha editorial, não dado: a API não sabe qual editoria
 * merece a home desta semana.
 *
 * Slug que não existir mais no WordPress é ignorado, e o lugar é preenchido
 * pela ordem de `ORDEM_EDITORIAS` — a home não fica com um buraco se o cliente
 * renomear ou apagar uma editoria.
 */
export const HOME_EDITORIA_DESTAQUE = 'viaje';
export const HOME_EDITORIAS_DUPLAS = ['harmonize', 'mercado'] as const;

export function ordenarEditorias<T extends { slug: string; nome: string }>(termos: T[]): T[] {
  const posicao = (slug: string) => {
    const indice = ORDEM_EDITORIAS.indexOf(slug as (typeof ORDEM_EDITORIAS)[number]);

    return indice === -1 ? ORDEM_EDITORIAS.length : indice;
  };

  return [...termos].sort(
    (a, b) => posicao(a.slug) - posicao(b.slug) || a.nome.localeCompare(b.nome, 'pt-BR'),
  );
}
