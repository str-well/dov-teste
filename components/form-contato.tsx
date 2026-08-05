'use client';

import { useState } from 'react';

import { CAMPO_ARMADILHA } from '@/lib/formulario';

type Estado =
  | { tipo: 'parado' }
  | { tipo: 'enviando' }
  | { tipo: 'pronto' }
  | { tipo: 'erro'; texto: string };

/**
 * O formulário de contato.
 *
 * A página não tinha nenhum, de propósito: o comentário em `app/contato/page.tsx`
 * dizia que um formulário que engole a mensagem sem enviar é pior que não ter
 * formulário. Agora existe rota, então existe formulário — e a regra continua
 * valendo do outro lado: falha de envio mostra erro, nunca sucesso falso.
 *
 * Sem prancha própria. Os campos herdam o desenho do campo de busca e do
 * formulário do rodapé, que são o que o pacote do designer traz de entrada de
 * texto.
 */
export function FormContato() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'parado' });

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const dados = new FormData(evento.currentTarget);

    setEstado({ tipo: 'enviando' });

    try {
      const resposta = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: dados.get('nome'),
          email: dados.get('email'),
          mensagem: dados.get('mensagem'),
          [CAMPO_ARMADILHA]: dados.get(CAMPO_ARMADILHA),
        }),
      });

      const corpo = (await resposta.json().catch(() => null)) as
        | { ok?: boolean; erro?: string }
        | null;

      if (!resposta.ok || !corpo?.ok) {
        setEstado({ tipo: 'erro', texto: corpo?.erro ?? 'Não foi possível enviar agora.' });

        return;
      }

      setEstado({ tipo: 'pronto' });
    } catch {
      setEstado({ tipo: 'erro', texto: 'Sem conexão. Tente de novo.' });
    }
  }

  if (estado.tipo === 'pronto') {
    return (
      <div className="form-contato__pronto" role="status">
        <p className="form-contato__pronto-titulo">Mensagem enviada.</p>
        <p>Respondemos no e-mail que você informou. Costuma levar alguns dias úteis.</p>
      </div>
    );
  }

  const enviando = estado.tipo === 'enviando';

  return (
    <form className="form-contato" onSubmit={enviar} noValidate>
      <div className="form-contato__linha">
        <div className="campo">
          <label className="campo__rotulo" htmlFor="contato-nome">
            Como podemos chamar você
          </label>
          <input
            className="campo__entrada"
            id="contato-nome"
            name="nome"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            disabled={enviando}
          />
        </div>

        <div className="campo">
          <label className="campo__rotulo" htmlFor="contato-email">
            Seu e-mail
          </label>
          <input
            className="campo__entrada"
            id="contato-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={enviando}
          />
        </div>
      </div>

      <div className="campo">
        <label className="campo__rotulo" htmlFor="contato-mensagem">
          Sua mensagem
        </label>
        <textarea
          className="campo__entrada campo__entrada--area"
          id="contato-mensagem"
          name="mensagem"
          rows={7}
          required
          minLength={10}
          maxLength={5000}
          disabled={enviando}
        />
      </div>

      <div className="campo-armadilha" aria-hidden="true">
        <label htmlFor="contato-armadilha">Não preencha</label>
        <input id="contato-armadilha" type="text" name={CAMPO_ARMADILHA} tabIndex={-1} autoComplete="off" />
      </div>

      {estado.tipo === 'erro' && (
        <p className="form-contato__erro" role="alert">
          {estado.texto}
        </p>
      )}

      <div className="form-contato__acoes">
        <button className="botao botao--primario" type="submit" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar mensagem'}
        </button>
      </div>
    </form>
  );
}
