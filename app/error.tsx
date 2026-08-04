'use client';

import Link from 'next/link';

import { ALMANAQUE } from '@/lib/site';

/**
 * Erro de servidor — `error.tsx`.
 *
 * Mesmo layout do 404, com o numeral 500 e o texto que a §7 da especificação
 * define. É onde o `ErroWordPress` da camada de dados aterra: falha de verdade
 * da API sobe até aqui, enquanto "não encontrado" virou `notFound()` lá atrás.
 *
 * O botão primário recarrega pelo `reset()` do Next, que tenta renderizar o
 * segmento de novo sem recarregar a página inteira.
 */
export default function Erro({ reset }: { error: Error; reset: () => void }) {
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
          500
        </p>

        <h1 className="erro__titulo">Algo saiu errado por aqui</h1>

        <p className="erro__texto">
          Já estamos verificando. Tente de novo em alguns instantes.
        </p>

        <div className="erro__acoes">
          <button className="botao botao--primario" type="button" onClick={reset}>
            Recarregar a página
          </button>
          <Link className="botao botao--contorno" href={ALMANAQUE.href}>
            Abrir o Almanaque
          </Link>
        </div>
      </div>
    </main>
  );
}
