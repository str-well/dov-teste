/**
 * Camada de dados do Descubra o Vinho.
 *
 * Superfície pública única. Todo acesso ao WordPress entra por aqui:
 *
 *     import { listarMaterias, imagem } from '@/lib/wp';
 *
 * Importar `./http`, `./mapeadores` ou `./consultas` direto de um componente
 * fura a regra do módulo único — se algo necessário não está exportado neste
 * arquivo, o certo é exportá-lo aqui.
 *
 * O que este módulo garante, para nenhum componente ter de se lembrar:
 *
 * - Entidades HTML já decodificadas em título, resumo, nome de termo e campos
 *   de texto do `meta`. Nunca em `conteudoHtml`, que é HTML de verdade.
 * - `imagens` é `Imagens | null`, e `imagem()` também pode devolver `null`
 *   mesmo com imagem presente. O estado vazio está no tipo.
 * - Ausência é `null` ou lista vazia; `ErroWordPress` é só falha de verdade.
 * - Ordem editorial preservada nos relacionados.
 * - `total` e `totalPaginas` vindos dos headers, para a paginação.
 */

// --- Consultas -------------------------------------------------------------

export {
  autorPorId,
  buscar,
  categoriaPorSlug,
  categoriaPrincipal,
  categoriasPorIds,
  contarMaterias,
  contarVerbetes,
  eventoPorSlug,
  indiceDoAlmanaque,
  listarCategorias,
  listarEventos,
  listarMaterias,
  listarTags,
  listarVerbetes,
  materiaPorSlug,
  materiasPorIds,
  materiasQueCitam,
  materiasRelacionadas,
  paginaPorSlug,
  sugestoes,
  tagPorSlug,
  tagsPorIds,
  verbetePorSlug,
  verbetesPorIds,
  verbetesPorLetra,
  verbeteVizinhos,
} from './consultas';

export type { FiltroMaterias, Ordenacao, ResultadoBusca, Sugestao } from './consultas';

// --- Auxiliares ------------------------------------------------------------

/** Escolhe um tamanho de imagem, com alternativas. Pode devolver `null`. */
export { imagem } from './mapeadores';

/**
 * Expostos para conteúdo que não vem das consultas — um texto vindo de outra
 * fonte que ainda precise virar texto simples. Os campos deste módulo já
 * chegam tratados: **não** aplicar de novo.
 */
export { decodificarEntidades, letraInicial, paraTextoSimples } from './html';

export { ErroWordPress } from './http';

export { REVALIDAR } from './config';

// --- Tipos -----------------------------------------------------------------

export type {
  Autor,
  Evento,
  Imagem,
  Imagens,
  Lista,
  Materia,
  MateriaCompleta,
  NomeTamanho,
  Pagina,
  Termo,
  Verbete,
  VerbeteCompleto,
} from './tipos';
