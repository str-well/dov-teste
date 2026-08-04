'use client';

import { useEffect, useState } from 'react';

import type { ItemDoSumario } from '@/lib/artigo';

/**
 * O sumário "Neste texto".
 *
 * Os `id` dos títulos são gerados em `lib/artigo.ts`, porque o editor de blocos
 * do WordPress não os cria — sem eles não haveria âncora para apontar.
 *
 * A seção ativa é acompanhada por `IntersectionObserver` com o mesmo
 * `rootMargin` que a §6 define para a navegação do A–Z: `-30% 0px -60% 0px`.
 * A faixa estreita no meio da tela é o que faz o item mudar quando a seção
 * *chega* à leitura, e não quando ela apenas encosta na borda.
 */
export function Sumario({ itens }: { itens: ItemDoSumario[] }) {
  const [ativo, setAtivo] = useState<string | null>(null);

  useEffect(() => {
    const alvos = itens
      .map((item) => document.getElementById(item.id))
      .filter((elemento): elemento is HTMLElement => elemento !== null);

    if (alvos.length === 0) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) setAtivo(entrada.target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );

    for (const alvo of alvos) observador.observe(alvo);

    return () => observador.disconnect();
  }, [itens]);

  if (itens.length === 0) return null;

  return (
    <nav className="caixa caixa--alternativa" aria-labelledby="sumario-titulo">
      <p className="kicker kicker--pequeno caixa__titulo" id="sumario-titulo">
        Neste texto
      </p>

      <div className="indice">
        {itens.map((item) => (
          <a
            key={item.id}
            className={`indice__link${item.nivel === 3 ? ' indice__link--sub' : ''}`}
            href={`#${item.id}`}
            aria-current={ativo === item.id ? 'true' : undefined}
          >
            {item.texto}
          </a>
        ))}
      </div>
    </nav>
  );
}
