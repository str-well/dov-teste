/**
 * Limite de envios por IP, em memória.
 *
 * As duas rotas de formulário mandam e-mail, e e-mail custa: cota do Resend e
 * reputação do domínio. Sem limite, um laço de dez linhas enche a caixa de
 * entrada do cliente e queima o domínio para spam.
 *
 * **Em memória de propósito, com as limitações que isso traz:**
 *
 * - Zera quando o processo reinicia — e reinicia em todo deploy. Aceitável: o
 *   ataque que isso barra é rajada de minutos, não campanha de dias.
 * - Vale por processo. Hoje é um processo Node só na Hostinger, então é o
 *   servidor inteiro. Se um dia houver mais de uma instância, cada uma contará
 *   separado e o limite efetivo multiplica.
 *
 * A alternativa correta seria Redis ou KV, e as duas custam dinheiro ou um
 * serviço novo — que estão fora do orçamento por decisão do projeto.
 */

type Registro = { contagem: number; expiraEm: number };

const registros = new Map<string, Registro>();

/**
 * Limpeza preguiçosa, na própria chamada.
 *
 * Sem ela o `Map` cresce para sempre — um IP diferente por visita, cada um
 * deixando uma entrada morta, e o processo fica meses no ar. Um `setInterval`
 * resolveria também, mas timer em módulo de servidor sobrevive a hot-reload em
 * desenvolvimento e vira vários.
 */
function limpar(agora: number) {
  if (registros.size < 500) return;

  for (const [chave, registro] of registros) {
    if (registro.expiraEm <= agora) registros.delete(chave);
  }
}

export type Veredito = { permitido: true } | { permitido: false; segundos: number };

/**
 * @param chave    Identificador do contador — IP mais o nome da rota.
 * @param teto     Quantos envios são permitidos na janela.
 * @param janelaMs Duração da janela.
 */
export function dentroDoLimite(chave: string, teto: number, janelaMs: number): Veredito {
  const agora = Date.now();

  limpar(agora);

  const registro = registros.get(chave);

  if (!registro || registro.expiraEm <= agora) {
    registros.set(chave, { contagem: 1, expiraEm: agora + janelaMs });

    return { permitido: true };
  }

  if (registro.contagem >= teto) {
    return { permitido: false, segundos: Math.ceil((registro.expiraEm - agora) / 1000) };
  }

  registro.contagem += 1;

  return { permitido: true };
}

/**
 * O IP de quem pediu.
 *
 * Atrás da CDN da Hostinger o socket é o do proxy, então o IP real vem em
 * header. `x-forwarded-for` pode trazer uma cadeia — o primeiro é o cliente.
 *
 * **Header é falsificável.** Quem quiser furar o limite manda um
 * `x-forwarded-for` diferente por requisição. Não há como resolver isso na
 * aplicação sem confiar num proxy conhecido; o limite serve contra abuso
 * distraído e contra script simples, não contra alguém dedicado. O honeypot e o
 * tempo mínimo de preenchimento das rotas são a outra camada.
 */
export function ipDaRequisicao(requisicao: Request): string {
  const encaminhado = requisicao.headers.get('x-forwarded-for');

  if (encaminhado) {
    const primeiro = encaminhado.split(',')[0]?.trim();

    if (primeiro) return primeiro;
  }

  return requisicao.headers.get('x-real-ip') ?? 'desconhecido';
}
