/**
 * O que as duas rotas de formulário têm em comum: ler o corpo, validar e barrar
 * abuso.
 *
 * **As duas exigem JavaScript**, e isso é uma escolha consciente, não um
 * esquecimento. A ordenação do arquivo de categoria funciona sem JS porque é
 * navegação — um `<form method="get">` que troca a URL. Aqui a resposta é JSON,
 * e uma rota de API não tem como devolver uma página do site: sem JS o leitor
 * veria `{"ok":true}` numa tela branca. O caminho para funcionar sem JS seria
 * server action com `useActionState`, que é outra forma — e o plano especifica
 * `/api/contato` e `/api/newsletter`. Fica anotado como pendência de verdade,
 * não como detalhe.
 */

import { dentroDoLimite, ipDaRequisicao } from './limite';

/**
 * O campo-armadilha.
 *
 * Fica escondido por CSS e vazio para gente. Robô de formulário preenche tudo
 * que encontra, então qualquer valor aqui é robô. Custa uma linha e pega a maior
 * parte do spam automatizado — o resto é o limite por IP.
 *
 * O nome é plausível de propósito: um campo chamado `honeypot` seria ignorado.
 */
export const CAMPO_ARMADILHA = 'assunto_secundario';

export type Falha = { status: number; erro: string };

/**
 * Valida e-mail sem tentar implementar a RFC.
 *
 * Regex de e-mail "completa" é lendária por rejeitar endereço válido, e a única
 * validação que prova que um endereço existe é mandar mensagem para ele. Aqui só
 * barra o que é claramente errado; quem digitar errado não recebe, e é o que
 * aconteceria de qualquer forma.
 */
export function emailValido(valor: unknown): valor is string {
  return (
    typeof valor === 'string' &&
    valor.length >= 6 &&
    valor.length <= 254 &&
    /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(valor)
  );
}

export function textoValido(valor: unknown, minimo: number, maximo: number): valor is string {
  return typeof valor === 'string' && valor.trim().length >= minimo && valor.trim().length <= maximo;
}

/** A janela dos dois limites. */
const JANELA_MS = 10 * 60 * 1000;

/**
 * Guarda de enxurrada: barra rajada antes de gastar CPU parsear JSON.
 *
 * Generoso de propósito. **Este contador conta tentativa, inclusive inválida**, e
 * é justamente por isso que não pode ser apertado: validação não custa e-mail
 * nenhum, e quem digita o endereço errado três vezes não pode ficar dez minutos
 * de castigo. O limite que protege a cota do Resend é o outro, abaixo.
 */
const TETO_TENTATIVAS = 20;

/**
 * Lê o corpo JSON e aplica as travas que valem para as duas rotas.
 *
 * Devolve `{ falha }` quando barrou, `{ corpo, ip }` quando passou. Nunca lança:
 * uma exceção aqui viraria 500, e "corpo inválido" é 400.
 */
export async function receber(
  requisicao: Request,
  rota: string,
): Promise<
  | { corpo: Record<string, unknown>; ip: string; falha?: never }
  | { corpo?: never; ip?: never; falha: Falha }
> {
  if (requisicao.headers.get('content-type')?.includes('application/json') !== true) {
    return { falha: { status: 415, erro: 'Envie JSON.' } };
  }

  const ip = ipDaRequisicao(requisicao);
  const veredito = dentroDoLimite(`${rota}:${ip}`, TETO_TENTATIVAS, JANELA_MS);

  if (!veredito.permitido) {
    return {
      falha: {
        status: 429,
        erro: `Muitas tentativas. Tente de novo em ${veredito.segundos} segundos.`,
      },
    };
  }

  const corpo = (await requisicao.json().catch(() => null)) as Record<string, unknown> | null;

  if (corpo === null || typeof corpo !== 'object') {
    return { falha: { status: 400, erro: 'Corpo inválido.' } };
  }

  // Armadilha preenchida: responde 200 e não faz nada. Não é gentileza — devolver
  // 400 ensina ao robô qual campo evitar na próxima tentativa.
  if (typeof corpo[CAMPO_ARMADILHA] === 'string' && corpo[CAMPO_ARMADILHA] !== '') {
    return { falha: { status: 200, erro: '' } };
  }

  return { corpo, ip };
}

/**
 * O limite que protege a cota de e-mail. Chamado **depois** da validação, quando
 * o pedido já é bom e a próxima coisa é gastar um envio.
 *
 * Contador separado do de tentativas: quem erra o formulário não consome envio.
 */
export function limitarEnvio(rota: string, ip: string, teto: number): Falha | null {
  const veredito = dentroDoLimite(`${rota}-envio:${ip}`, teto, JANELA_MS);

  if (veredito.permitido) return null;

  return {
    status: 429,
    erro: `Você já enviou há pouco. Tente de novo em ${veredito.segundos} segundos.`,
  };
}
