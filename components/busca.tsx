import { BUSCA } from '@/lib/site';

import { IconeBusca } from './icones';

type Props = {
  /** Texto já digitado, na página de resultados. */
  valor?: string;
  placeholder?: string;
  /** `hero` é 72px; `media` 66px na página de busca; `compacta` 64px no Almanaque. */
  tamanho?: 'hero' | 'media' | 'compacta';
  /** `id` do campo. Precisa ser único quando há duas buscas na mesma tela. */
  id?: string;
  /** Rótulo para leitor de tela. */
  rotulo?: string;
  /** Foco automático ao montar. Só na página de resultados vazia. */
  focoInicial?: boolean;
  /**
   * Esconde o botão. A busca compacta da lateral do verbete não tem botão nas
   * pranchas — o campo ocupa a caixa toda e o envio é pelo teclado, como no
   * mobile.
   */
  semBotao?: boolean;
};

/**
 * A barra de busca — o componente-assinatura do portal.
 *
 * Esta é a versão sem sugestões: um `<form>` GET para `/busca`, que funciona
 * sem JavaScript e é o que a maioria das telas precisa. O painel de sugestões
 * (§5 da especificação: 3 caracteres, 250 ms de debounce, combobox com
 * `aria-activedescendant`) é um componente cliente separado, que embrulha este.
 *
 * O `role="search"` fica no form, e o botão desaparece no mobile — lá o envio é
 * pelo teclado, como nas pranchas.
 */
export function Busca({
  valor,
  placeholder = 'Busque uvas, harmonizações, destinos…',
  tamanho = 'hero',
  id = 'busca',
  rotulo = 'Buscar no portal',
  focoInicial = false,
  semBotao = false,
}: Props) {
  const modificador =
    tamanho === 'media' ? ' busca--media' : tamanho === 'compacta' ? ' busca--compacta' : '';

  return (
    <form className={`busca${modificador}`} role="search" action={BUSCA.href}>
      <IconeBusca className="busca__icone" />

      <label className="visualmente-oculto" htmlFor={id}>
        {rotulo}
      </label>

      <input
        className="busca__campo"
        id={id}
        name="q"
        type="search"
        defaultValue={valor}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={focoInicial}
      />

      {!semBotao && (
        <button className="busca__botao" type="submit">
          Buscar
        </button>
      )}
    </form>
  );
}
