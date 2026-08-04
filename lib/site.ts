/**
 * Constantes do site que não vêm da API nem dos tokens.
 *
 * O que está aqui é texto de marca e estrutura de navegação. Nada de conteúdo
 * editorial: matéria, verbete, evento e categoria vêm sempre do WordPress.
 */

export type ItemNav = { rotulo: string; href: string };

export const SITE = {
  nome: 'Descubra o Vinho',

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
 * **Pendente:** os endereços não vieram com o pacote. Enquanto forem `null` os
 * ícones não são renderizados — é melhor faltar um ícone no rodapé do que
 * entregar link morto num site de cliente. Preencher e os ícones voltam.
 */
export const REDES: Array<{ nome: string; url: string | null }> = [
  { nome: 'Instagram', url: null },
  { nome: 'YouTube', url: null },
];

/**
 * Páginas legais do rodapé.
 *
 * **Pendente:** política de privacidade e termos de uso não existem no
 * WordPress nem na lista de rotas do plano. Mesma regra das redes: só aparecem
 * quando houver página de verdade atrás.
 */
export const PAGINAS_LEGAIS: ItemNav[] = [];

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

export function ordenarEditorias<T extends { slug: string; nome: string }>(termos: T[]): T[] {
  const posicao = (slug: string) => {
    const indice = ORDEM_EDITORIAS.indexOf(slug as (typeof ORDEM_EDITORIAS)[number]);

    return indice === -1 ? ORDEM_EDITORIAS.length : indice;
  };

  return [...termos].sort(
    (a, b) => posicao(a.slug) - posicao(b.slug) || a.nome.localeCompare(b.nome, 'pt-BR'),
  );
}
