import type { Metadata } from 'next';
import Link from 'next/link';

import { ALMANAQUE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false, follow: false },
};

/**
 * 404 — `not-found.tsx`.
 *
 * Portado da tela 16, que só existe em mobile: o desktop é derivado dos tokens,
 * centralizado e com os botões lado a lado em vez de empilhados.
 *
 * O numeral é `aria-hidden`: "404" lido em voz alta não ajuda ninguém, e o
 * título já diz o que aconteceu.
 */
export default function NaoEncontrada() {
  return (
    <main className="limite erro">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="blob blob--lilas erro__blob"
        src="/blobs/dov-blob-lilas.svg"
        alt=""
        aria-hidden="true"
      />

      <div className="erro__conteudo">
        <p className="erro__numero" aria-hidden="true">
          404
        </p>

        <h1 className="erro__titulo">Essa garrafa não está na adega</h1>

        <p className="erro__texto">
          A página que você procurava saiu de linha — mas há muito para descobrir.
        </p>

        <div className="erro__acoes">
          <Link className="botao botao--primario" href="/">
            Voltar para a home
          </Link>
          <Link className="botao botao--contorno" href={ALMANAQUE.href}>
            Abrir o Almanaque
          </Link>
        </div>
      </div>
    </main>
  );
}
