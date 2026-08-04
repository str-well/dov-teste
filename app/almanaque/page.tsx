import type { Metadata } from 'next';

import { AlmanaqueIndice, type ItemDoIndice } from '@/components/almanaque-indice';
import { plural } from '@/lib/formato';
import { listarVerbetes } from '@/lib/wp';

export const metadata: Metadata = {
  title: 'Almanaque do Vinho',
  description:
    'Uvas, técnicas, regiões e aquele termo que o sommelier falou rápido demais. ' +
    'Escrito para ser lido em trinta segundos.',
  alternates: { canonical: '/almanaque' },
};

/**
 * Índice A–Z do Almanaque — `/almanaque`.
 *
 * A cabeça é a única seção escura do portal fora do rodapé, com o blob menta.
 *
 * O servidor busca, agrupa e escreve a cabeça; a tira de letras, a letra ativa
 * e a busca são do componente cliente. A cabeça vai como slot para o `<h1>` e a
 * contagem **não** irem para o pacote do navegador.
 */
export default async function Page() {
  const verbetes = await listarVerbetes();

  // Só o que o índice usa. O resto do verbete não precisa cruzar para o cliente.
  const itens: ItemDoIndice[] = verbetes.map((verbete) => ({
    slug: verbete.slug,
    titulo: verbete.titulo,
    definicao: verbete.definicaoCurta,
    letra: verbete.letra,
  }));

  return (
    <main>
      <AlmanaqueIndice
        verbetes={itens}
        cabeca={
          <>
            <p className="kicker kicker--menta">Consulta permanente</p>

            <h1 className="cabeca-almanaque__titulo" id="almanaque-titulo">
              Almanaque do Vinho
            </h1>

            {/* A contagem é real. O "418 verbetes" da prancha é fictício. */}
            <p className="cabeca-almanaque__texto">
              {plural(itens.length, 'verbete', 'verbetes')} sobre uvas, técnicas, regiões e
              aquele termo que o sommelier falou rápido demais. Escrito para ser lido em
              trinta segundos.
            </p>
          </>
        }
      />
    </main>
  );
}
