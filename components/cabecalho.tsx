import { listarCategorias } from '@/lib/wp';
import { ALMANAQUE, UTILITARIOS, ordenarEditorias, type ItemNav } from '@/lib/site';

import { CabecalhoInterativo } from './cabecalho-interativo';

/**
 * Cabeçalho do portal.
 *
 * A divisão é de propósito: este componente é de servidor e só busca as
 * editorias — a lista é cacheada por render, então o rodapé pede a mesma e não
 * gera segunda requisição. Toda a interação vive no componente cliente.
 *
 * As editorias vêm da API. Nunca chumbadas: o cliente pode renomear "Viaje" no
 * WordPress e o menu tem de acompanhar.
 */
export async function Cabecalho() {
  const categorias = ordenarEditorias(await listarCategorias());

  const editorias: ItemNav[] = categorias.map((categoria) => ({
    rotulo: categoria.nome,
    href: `/${categoria.slug}`,
  }));

  return (
    <CabecalhoInterativo
      editorias={editorias}
      utilitarios={UTILITARIOS}
      almanaque={ALMANAQUE}
    />
  );
}
