import type { MetadataRoute } from 'next';

import {
  AGENDA,
  ALMANAQUE,
  PAGINAS_LEGAIS,
  SITE,
  UTILITARIOS,
  ordenarEditorias,
} from '@/lib/site';
import {
  listarCategorias,
  listarEventos,
  listarMaterias,
  listarVerbetes,
  type Materia,
} from '@/lib/wp';

/**
 * `sitemap.xml`.
 *
 * Estático com revalidação, como as listagens: ele consulta o WordPress, e
 * gerá-lo a cada visita de robô poria os 6 outros sites do plano a pagar por
 * varredura alheia. Sem `revalidate` ele congelaria no build — o
 * `revalidatePath` do mu-plugin revalida o caminho do post, não este.
 *
 * **O 300 é literal porque tem de ser.** O analisador estático do Next lê a
 * configuração de segmento antes de executar o módulo, e `REVALIDAR.conteudo`
 * quebra o build com `Unsupported node type "MemberExpression"`. É o único lugar
 * do projeto onde o número de ISR está duplicado; se `REVALIDAR.conteudo` mudar,
 * mudar aqui também.
 */
export const revalidate = 300;

/** `/busca` fica fora: ela manda `noindex` e está no `Disallow` do robots. */
const FIXAS: Array<{ href: string; prioridade: number }> = [
  { href: '/', prioridade: 1 },
  { href: ALMANAQUE.href, prioridade: 0.8 },
  { href: AGENDA.href, prioridade: 0.6 },
  // "Newsletter" é âncora do rodapé, não página — `#newsletter` não é URL.
  ...UTILITARIOS.filter((item) => item.href.startsWith('/')).map((item) => ({
    href: item.href,
    prioridade: 0.5,
  })),
  ...PAGINAS_LEGAIS.map((pagina) => ({ href: pagina.href, prioridade: 0.3 })),
];

/**
 * Todas as matérias, não só as 100 primeiras.
 *
 * O `per_page` do WordPress trava em 100, e com 20 matérias uma chamada bastaria
 * hoje. Mas sitemap truncado é a falha mais silenciosa que existe: a matéria 101
 * simplesmente nunca é descoberta, e nada no build reclama. O laço anda pelo
 * `totalPaginas` que o `http.ts` lê dos headers.
 */
async function todasAsMaterias(): Promise<Materia[]> {
  const primeira = await listarMaterias({ porPagina: 100 });
  const materias = [...primeira.itens];

  for (let pagina = 2; pagina <= primeira.totalPaginas; pagina += 1) {
    const { itens } = await listarMaterias({ porPagina: 100, pagina });
    materias.push(...itens);
  }

  return materias;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [materias, verbetes, eventos, categorias] = await Promise.all([
    todasAsMaterias(),
    listarVerbetes(),
    listarEventos(),
    listarCategorias(),
  ]);

  const url = (caminho: string) => `${SITE.url}${caminho}`;
  const porId = new Map(categorias.map((categoria) => [categoria.id, categoria]));

  return [
    ...FIXAS.map(({ href, prioridade }) => ({
      url: url(href),
      changeFrequency: 'monthly' as const,
      priority: prioridade,
    })),

    // As 7 editorias, na ordem editorial — que não muda nada para o buscador,
    // mas deixa o XML legível para quem for conferir à mão.
    ...ordenarEditorias(categorias).map((categoria) => ({
      url: url(`/${categoria.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),

    // A URL canônica da matéria é a da categoria **principal**, a primeira da
    // lista. Chegar pela secundária redireciona, e pôr as duas no sitemap
    // anunciaria conteúdo duplicado com as próprias mãos.
    ...materias.flatMap((materia) => {
      const categoria = porId.get(materia.categorias[0] ?? -1);

      return categoria
        ? [
            {
              url: url(`/${categoria.slug}/${materia.slug}`),
              lastModified: materia.dataUtc,
              changeFrequency: 'monthly' as const,
              priority: 0.9,
            },
          ]
        : [];
    }),

    ...verbetes.map((verbete) => ({
      url: url(`${ALMANAQUE.href}/${verbete.slug}`),
      lastModified: verbete.dataUtc,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),

    // Sem `lastModified`: `Evento` carrega a data em que o evento acontece, não
    // a da última edição do texto. Data de realização no lugar de modificação
    // mentiria para o buscador — o campo é opcional, e omitir é o certo.
    ...eventos.map((evento) => ({
      url: url(`${AGENDA.href}/${evento.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
  ];
}
