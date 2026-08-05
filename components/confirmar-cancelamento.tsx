'use client';

import Link from 'next/link';
import { useState } from 'react';

type Estado =
  | { tipo: 'parado' }
  | { tipo: 'enviando' }
  | { tipo: 'cancelado' }
  | { tipo: 'inexistente' }
  | { tipo: 'erro' };

/**
 * O botão que efetiva o cancelamento da newsletter.
 *
 * Existe como componente cliente porque o cancelamento tem de ser **POST**, e
 * não o render da página: cliente de e-mail e antivírus corporativo abrem links
 * para escanear, e cancelar no render descadastraria quem nunca clicou, sem
 * ninguém saber. Ver o comentário de `app/api/newsletter/cancelar/route.ts`.
 *
 * É um clique, sem login e sem formulário — a LGPD pede que revogar seja tão
 * fácil quanto consentir.
 */
export function ConfirmarCancelamento({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'parado' });

  async function cancelar() {
    setEstado({ tipo: 'enviando' });

    try {
      const resposta = await fetch('/api/newsletter/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (resposta.ok) {
        setEstado({ tipo: 'cancelado' });

        return;
      }

      setEstado({ tipo: resposta.status === 404 ? 'inexistente' : 'erro' });
    } catch {
      setEstado({ tipo: 'erro' });
    }
  }

  if (estado.tipo === 'cancelado') {
    return (
      <div className="form-contato__pronto" role="status">
        <p className="form-contato__pronto-titulo">Inscrição cancelada.</p>
        <p>Você não vai mais receber a newsletter.</p>
      </div>
    );
  }

  if (estado.tipo === 'inexistente') {
    return (
      <p role="status">
        Este código não corresponde a nenhuma inscrição ativa. Se você já cancelou antes,
        está tudo certo — não é preciso fazer nada.
      </p>
    );
  }

  return (
    <>
      {estado.tipo === 'erro' && (
        <p className="form-contato__erro" role="alert">
          Houve uma falha ao falar com o servidor. Tente de novo, ou escreva pela{' '}
          <Link href="/contato">página de contato</Link> e a gente cancela na mão.
        </p>
      )}

      <p>
        <button
          className="botao botao--primario"
          type="button"
          onClick={cancelar}
          disabled={estado.tipo === 'enviando'}
        >
          {estado.tipo === 'enviando' ? 'Cancelando…' : 'Confirmar cancelamento'}
        </button>
      </p>
    </>
  );
}
