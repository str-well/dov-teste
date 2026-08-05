'use client';

import { useState } from 'react';

import { CAMPO_ARMADILHA } from '@/lib/formulario';

type Estado = { tipo: 'parado' } | { tipo: 'enviando' } | { tipo: 'pronto'; texto: string } | { tipo: 'erro'; texto: string };

/**
 * O formulário da newsletter do rodapé.
 *
 * Era markup morto: campo e botão sem `action` e sem handler, com um comentário
 * dizendo que o envio vinha na Fase 4. Agora fala com `/api/newsletter`.
 *
 * **Exige JavaScript**, e é uma escolha registrada: a rota responde JSON, e sem
 * JS o leitor veria `{"ok":true}` numa tela branca. Progressive enhancement aqui
 * pediria server action em vez de rota de API. Está anotado no plano.
 *
 * `origem` acompanha a assinatura até o painel do WordPress, na coluna Origem.
 * Com o mesmo formulário em dois lugares um dia, é o que responde de onde a
 * pessoa veio.
 */
export function FormNewsletter({ origem = 'rodape' }: { origem?: string }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'parado' });

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const dados = new FormData(evento.currentTarget);

    setEstado({ tipo: 'enviando' });

    try {
      const resposta = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: dados.get('email'),
          origem,
          [CAMPO_ARMADILHA]: dados.get(CAMPO_ARMADILHA),
        }),
      });

      const corpo = (await resposta.json().catch(() => null)) as
        | { ok?: boolean; erro?: string; jaAssinava?: boolean }
        | null;

      if (!resposta.ok || !corpo?.ok) {
        setEstado({
          tipo: 'erro',
          texto: corpo?.erro ?? 'Não foi possível assinar agora.',
        });

        return;
      }

      setEstado({
        tipo: 'pronto',
        // Quem já assinava não deve ouvir "pronto, assinado" como se fosse novo,
        // nem um erro — do ponto de vista dele está tudo certo.
        texto: corpo.jaAssinava
          ? 'Este e-mail já estava na lista.'
          : 'Pronto. Confira sua caixa de entrada.',
      });
    } catch {
      setEstado({ tipo: 'erro', texto: 'Sem conexão. Tente de novo.' });
    }
  }

  // Depois do sucesso o formulário sai: deixar o campo preenchido convida a
  // clicar de novo, e a segunda vez cairia no "já estava na lista".
  if (estado.tipo === 'pronto') {
    return (
      <p className="rodape__form-aviso rodape__form-aviso--ok" role="status">
        {estado.texto}
      </p>
    );
  }

  return (
    <form className="rodape__form" aria-labelledby="rodape-newsletter" onSubmit={enviar} noValidate>
      <label className="visualmente-oculto" htmlFor="rodape-email">
        Seu e-mail
      </label>
      <input
        className="rodape__campo"
        id="rodape-email"
        type="email"
        name="email"
        placeholder="seu@email.com"
        autoComplete="email"
        required
        disabled={estado.tipo === 'enviando'}
      />

      {/* A armadilha. Escondida por CSS, nunca por `type="hidden"` — robô ignora
          campo oculto e preenche campo de texto que encontra. */}
      <div className="campo-armadilha" aria-hidden="true">
        <label htmlFor="rodape-armadilha">Não preencha</label>
        <input id="rodape-armadilha" type="text" name={CAMPO_ARMADILHA} tabIndex={-1} autoComplete="off" />
      </div>

      <button className="botao botao--verde" type="submit" disabled={estado.tipo === 'enviando'}>
        {estado.tipo === 'enviando' ? 'Enviando…' : 'Assinar'}
      </button>

      {estado.tipo === 'erro' && (
        <p className="rodape__form-aviso rodape__form-aviso--erro" role="alert">
          {estado.texto}
        </p>
      )}
    </form>
  );
}
