'use client';

import { useRouter } from 'next/navigation';
import { useId } from 'react';

import type { Ordenacao as Ordem } from '@/lib/wp';

const OPCOES: Array<{ valor: Ordem; rotulo: string }> = [
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'antigas', rotulo: 'Mais antigas' },
  { valor: 'alfabetica', rotulo: 'Título A–Z' },
];

type Props = {
  atual: Ordem;
  /** Caminho da página, sem query. */
  caminho: string;
  /** Query a preservar ao trocar a ordem — o filtro de tag, por exemplo. */
  preservar?: Record<string, string | undefined>;
};

/**
 * O seletor de ordenação do arquivo.
 *
 * É um `<form method="get">` de verdade: sem JavaScript, o botão "Aplicar" —
 * visível só para leitor de tela e teclado — submete e a ordem muda. Com
 * JavaScript, trocar a opção navega na hora, que é o que se espera de um select
 * de ordenação.
 *
 * As opções não são as da prancha. Ela oferece "Mais lidas", que **exige
 * contagem de visualização** — e o projeto não tem analytics nem plugin de
 * contador, por decisão de não instalar nada. Trocado por "Mais antigas" e
 * "Título A–Z", que a API entrega com `orderby`.
 */
export function Ordenacao({ atual, caminho, preservar = {} }: Props) {
  const router = useRouter();
  const id = useId();

  const escondidos = Object.entries(preservar).filter(([, valor]) => valor);

  return (
    <form className="ordenacao" method="get" action={caminho}>
      {escondidos.map(([chave, valor]) => (
        <input key={chave} type="hidden" name={chave} value={valor} />
      ))}

      <label htmlFor={id}>Ordenar:</label>

      <select
        className="ordenacao__campo"
        id={id}
        name="ordem"
        defaultValue={atual}
        onChange={(evento) => {
          const busca = new URLSearchParams(
            escondidos.map(([chave, valor]) => [chave, valor as string]),
          );

          // `recentes` é o padrão: fica fora da URL para não sujar o endereço.
          if (evento.target.value !== 'recentes') busca.set('ordem', evento.target.value);

          const query = busca.toString();

          router.push(query ? `${caminho}?${query}` : caminho);
        }}
      >
        {OPCOES.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>

      {/* A reserva sem JavaScript. Fica fora da vista, dentro do alcance. */}
      <button className="visualmente-oculto" type="submit">
        Aplicar ordenação
      </button>
    </form>
  );
}
