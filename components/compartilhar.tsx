'use client';

import { useEffect, useState } from 'react';

import { IconeCompartilhar, IconeCopiarLink, IconeWhatsapp } from './icones';

type Props = {
  titulo: string;
  /** Caminho da página, sem domínio. O endereço completo é montado no cliente. */
  caminho: string;
};

/**
 * Botões de compartilhar.
 *
 * Decisão fechada em `docs/DESIGN.md`: **`navigator.share` nativo**, e não o
 * botão de Instagram das pranchas — o Instagram não aceita compartilhamento por
 * URL a partir da web, então aquele botão nunca funcionaria.
 *
 * A API não existe em todo navegador (o Firefox no desktop não tem), e por isso
 * a reserva não é opcional: onde não houver `share`, aparecem WhatsApp e
 * copiar-link, cujos ícones já vêm no pacote do designer.
 *
 * A checagem roda depois da montagem, nunca no render do servidor: `navigator`
 * não existe lá, e decidir no servidor daria hidratação divergente.
 */
export function Compartilhar({ titulo, caminho }: Props) {
  const [temShareNativo, setTemShareNativo] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setTemShareNativo(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const url = () => new URL(caminho, window.location.origin).toString();

  async function compartilhar() {
    try {
      await navigator.share({ title: titulo, url: url() });
    } catch (erro) {
      // `AbortError` é o usuário fechando a folha de compartilhamento. Não é
      // falha, e mostrar erro por isso seria hostil.
      if (erro instanceof DOMException && erro.name === 'AbortError') return;

      await copiarLink();
    }
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(url());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de área de transferência não há o que fazer em silêncio;
      // o leitor ainda tem a barra de endereço.
    }
  }

  return (
    <div className="compartilhar">
      <span className="compartilhar__rotulo">Compartilhar</span>

      {temShareNativo ? (
        <button
          className="botao-icone botao-icone--contorno"
          type="button"
          aria-label={`Compartilhar: ${titulo}`}
          onClick={compartilhar}
        >
          <IconeCompartilhar className="botao-icone__svg" />
        </button>
      ) : (
        <a
          className="botao-icone botao-icone--contorno"
          href={`https://wa.me/?text=${encodeURIComponent(titulo)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no WhatsApp"
          onClick={(evento) => {
            // O texto precisa do endereço, e o endereço só existe no cliente.
            evento.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(
              `${titulo} ${url()}`,
            )}`;
          }}
        >
          <IconeWhatsapp className="botao-icone__svg" />
        </a>
      )}

      <button
        className="botao-icone botao-icone--contorno"
        type="button"
        aria-label="Copiar link"
        onClick={copiarLink}
      >
        <IconeCopiarLink className="botao-icone__svg" />
      </button>

      {/* A confirmação é anunciada, não desenhada: um toast não está nas
          pranchas, e `role="status"` avisa quem usa leitor de tela. */}
      <span className="visualmente-oculto" role="status">
        {copiado ? 'Link copiado.' : ''}
      </span>
    </div>
  );
}
