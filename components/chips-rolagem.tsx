'use client';

import { useEffect, useRef } from 'react';

/**
 * A tira de chips de filtro.
 *
 * No desktop os chips quebram em linhas; no mobile a tira rola na horizontal,
 * com o último chip cortado na borda para dizer que há mais. Isso é todo CSS.
 *
 * O que precisa de JavaScript é uma coisa só: ao **carregar a página com um
 * filtro ativo**, a tira precisa rolar até deixá-lo visível. Sem isso o leitor
 * chega em `/viaje?tag=enoturismo` e o chip aceso está fora da tela, à direita.
 *
 * [ESPEC] §4 manda usar `scrollLeft` e **não** `scrollIntoView`: o
 * `scrollIntoView` rola o documento inteiro junto, jogando a página para baixo
 * antes de o leitor ter lido o título.
 */
export function ChipsRolagem({ children }: { children: React.ReactNode }) {
  const tira = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = tira.current;

    if (!elemento) return;

    // No desktop a tira não rola — `flex-wrap` em vez de `overflow-x`.
    if (elemento.scrollWidth <= elemento.clientWidth) return;

    const ativo = elemento.querySelector<HTMLElement>('[aria-current="true"]');

    if (!ativo) return;

    // A margem de sangria é o mesmo `--dov-margem-mobile` do padding da tira:
    // subtraí-la deixa o chip alinhado com o texto da página, e não colado na
    // borda esquerda.
    const margem = Number.parseFloat(
      getComputedStyle(elemento).getPropertyValue('padding-inline-start'),
    );

    elemento.scrollLeft = ativo.offsetLeft - (Number.isFinite(margem) ? margem : 0);
  }, []);

  return (
    <div ref={tira} className="chips-rolagem">
      {children}
    </div>
  );
}
