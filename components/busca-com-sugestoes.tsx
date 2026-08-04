'use client';

import { useCombobox } from 'downshift';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BUSCA } from '@/lib/site';
import type { Sugestao } from '@/lib/wp';

import { IconeBusca } from './icones';
import { Realce } from './realce';

/** [ESPEC] §5 — o painel abre a partir de 3 caracteres, com 250 ms de debounce. */
const MINIMO_DE_CARACTERES = 3;
const DEBOUNCE = 250;

type Estado = 'ocioso' | 'carregando' | 'ok' | 'vazio' | 'erro';

type Props = {
  valor?: string;
  placeholder?: string;
  tamanho?: 'hero' | 'media' | 'compacta';
  id?: string;
  rotulo?: string;
  focoInicial?: boolean;
};

/**
 * A barra de busca com painel de sugestões — o combobox da §5.
 *
 * Envolve a mesma marcação do `Busca`, e continua sendo um `<form>` GET para
 * `/busca`: **sem JavaScript ainda funciona**, só perde as sugestões.
 *
 * A acessibilidade do padrão combobox (`role`, `aria-expanded`, `aria-controls`,
 * `aria-activedescendant`, `role="option"`) vem do `downshift`. O que é escrito
 * aqui é o que a especificação pede e o comportamento padrão dele não dá:
 * setas circulando, `Esc` que fecha **mantendo o texto**, e `Enter` sem item em
 * foco submetendo a busca completa.
 */
export function BuscaComSugestoes({
  valor = '',
  placeholder = 'Busque uvas, harmonizações, destinos…',
  tamanho = 'hero',
  id = 'busca',
  rotulo = 'Buscar no portal',
  focoInicial = false,
}: Props) {
  const router = useRouter();
  const [itens, setItens] = useState<Sugestao[]>([]);
  const [estado, setEstado] = useState<Estado>('ocioso');
  const [termo, setTermo] = useState(valor);

  // Busca com debounce e cancelamento. O `AbortController` é o que impede a
  // resposta de "vin" chegar depois da de "vinho" e sobrescrever a lista certa.
  useEffect(() => {
    const limpo = termo.trim();

    if (limpo.length < MINIMO_DE_CARACTERES) {
      setItens([]);
      setEstado('ocioso');
      return;
    }

    // Carregando: a lista anterior **fica na tela**. Piscar uma lista vazia
    // entre uma resposta e outra é pior que mostrar resultado um pouco velho.
    setEstado('carregando');

    const controlador = new AbortController();

    const cronometro = setTimeout(async () => {
      try {
        const resposta = await fetch(`/api/sugestoes?q=${encodeURIComponent(limpo)}`, {
          signal: controlador.signal,
        });

        if (!resposta.ok) throw new Error(String(resposta.status));

        const { sugestoes } = (await resposta.json()) as { sugestoes: Sugestao[] };

        setItens(sugestoes);
        setEstado(sugestoes.length > 0 ? 'ok' : 'vazio');
      } catch (erro) {
        // Cancelamento não é erro: é a requisição anterior saindo de cena.
        if (erro instanceof DOMException && erro.name === 'AbortError') return;

        setItens([]);
        setEstado('erro');
      }
    }, DEBOUNCE);

    return () => {
      clearTimeout(cronometro);
      controlador.abort();
    };
  }, [termo]);

  const {
    isOpen,
    highlightedIndex,
    getLabelProps,
    getInputProps,
    getMenuProps,
    getItemProps,
    closeMenu,
  } = useCombobox<Sugestao>({
    items: itens,
    inputValue: termo,
    itemToString: (item) => item?.titulo ?? '',

    onInputValueChange: ({ inputValue }) => setTermo(inputValue ?? ''),

    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) router.push(selectedItem.href);
    },

    stateReducer: (estadoAtual, { type, changes }) => {
      switch (type) {
        // Esc fecha e **mantém o texto digitado**. O padrão do downshift limpa
        // o campo, o que apaga o trabalho de quem ia corrigir uma letra.
        case useCombobox.stateChangeTypes.InputKeyDownEscape:
          return { ...changes, inputValue: estadoAtual.inputValue, isOpen: false, highlightedIndex: -1 };

        // Setas circulando: do último volta ao primeiro, e vice-versa.
        case useCombobox.stateChangeTypes.InputKeyDownArrowDown:
          if (!estadoAtual.isOpen || itens.length === 0) return changes;
          return {
            ...changes,
            highlightedIndex:
              estadoAtual.highlightedIndex >= itens.length - 1
                ? 0
                : estadoAtual.highlightedIndex + 1,
          };

        case useCombobox.stateChangeTypes.InputKeyDownArrowUp:
          if (!estadoAtual.isOpen || itens.length === 0) return changes;
          return {
            ...changes,
            highlightedIndex:
              estadoAtual.highlightedIndex <= 0
                ? itens.length - 1
                : estadoAtual.highlightedIndex - 1,
          };

        default:
          return changes;
      }
    },
  });

  const temMensagem = estado === 'vazio' || estado === 'erro';
  const visivel = isOpen && (itens.length > 0 || temMensagem);

  const modificador =
    tamanho === 'media' ? ' busca--media' : tamanho === 'compacta' ? ' busca--compacta' : '';

  return (
    // O `action` continua valendo: sem JavaScript, o Enter submete e leva para
    // `/busca`. As sugestões são melhoria, não requisito.
    <form className={`busca${modificador}`} role="search" action={BUSCA.href}>
      <IconeBusca className="busca__icone" />

      <label className="visualmente-oculto" {...getLabelProps({ htmlFor: id })}>
        {rotulo}
      </label>

      <input
        {...getInputProps({
          id,
          name: 'q',
          type: 'search',
          className: 'busca__campo',
          placeholder,
          autoComplete: 'off',
          autoFocus: focoInicial,

          onKeyDown(evento) {
            // Enter sem item em foco submete a busca completa. O downshift
            // engoliria a tecla; `preventDownshiftDefault` devolve o controle
            // ao formulário.
            if (evento.key === 'Enter' && highlightedIndex < 0) {
              (
                evento.nativeEvent as KeyboardEvent & { preventDownshiftDefault?: boolean }
              ).preventDownshiftDefault = true;
              closeMenu();
            }

            // Tab fecha o painel e segue o fluxo normal de foco.
            if (evento.key === 'Tab') closeMenu();
          },
        })}
      />

      <button className="busca__botao" type="submit">
        Buscar
      </button>

      {/* O `getMenuProps` tem de ser aplicado em todo render — daí a lista
          existir sempre e ser escondida por `hidden` em vez de desmontada. */}
      <ul
        {...getMenuProps({
          className: 'sugestoes',
          hidden: !visivel,
          // Carregando com painel aberto: anuncia, mas não troca o conteúdo.
          'aria-busy': estado === 'carregando' || undefined,
        })}
      >
        {visivel && itens.length > 0 &&
          itens.map((item, indice) => (
            <li
              key={item.href}
              {...getItemProps({
                item,
                index: indice,
                className: `sugestoes__item${
                  highlightedIndex === indice ? ' sugestoes__item--realcado' : ''
                }`,
              })}
            >
              <span>
                <Realce texto={item.titulo} termo={termo} />
              </span>
              <span className="sugestoes__tipo">{item.rotulo}</span>
            </li>
          ))}

        {/* Linhas de estado: não são opções, então ficam fora da lista de
            navegação — sem `getItemProps`, sem `role="option"`. */}
        {visivel && itens.length === 0 && estado === 'vazio' && (
          <li className="sugestoes__vazio" role="presentation">
            Nenhuma sugestão. Pressione Enter para buscar em todo o portal.
          </li>
        )}

        {visivel && itens.length === 0 && estado === 'erro' && (
          <li className="sugestoes__vazio" role="presentation">
            Não foi possível sugerir agora.
          </li>
        )}
      </ul>
    </form>
  );
}
