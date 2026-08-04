/**
 * Formatação de data e número, em português do Brasil.
 *
 * **Por que tudo parte de `dataUtc` e não de `data`:** a API devolve os dois.
 * `data` é o horário de São Paulo, mas vem *sem* indicação de fuso —
 * `"2026-08-02T08:00:00"`. O `new Date()` interpreta isso no fuso do processo,
 * e o servidor da Hostinger roda em UTC. Uma matéria publicada às 00:30 em São
 * Paulo apareceria **um dia antes** na data exibida, sem nenhum erro visível.
 *
 * `dataUtc` é inequívoco: basta marcar como UTC e formatar em São Paulo.
 */

const FUSO = 'America/Sao_Paulo';

/** `date_gmt` vem sem o `Z` final. Sem ele, o `Date` volta a adivinhar. */
function comoUtc(iso: string): Date {
  return new Date(/[Zz]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`);
}

/** O `dateTime` de `<time>`: ISO completo, com fuso, para máquina ler. */
export function dataParaAtributo(dataUtc: string): string {
  return comoUtc(dataUtc).toISOString();
}

/**
 * `12 mar 2026` — o formato dos cartões e das listas.
 *
 * O `Intl` devolve o mês abreviado com ponto ("mar."); as pranchas não têm o
 * ponto, então ele sai.
 */
export function dataCurta(dataUtc: string): string {
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(comoUtc(dataUtc));

  return partes
    .map((p) => (p.type === 'month' ? p.value.replace('.', '') : p.value))
    .join('');
}

/** `12 de março de 2026` — cabeça de matéria e assinatura. */
export function dataLonga(dataUtc: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(comoUtc(dataUtc));
}

/**
 * Intervalo de datas de evento. `dov_data_inicio` e `dov_data_fim` são
 * `AAAA-MM-DD` puros, sem hora — tratados como dia civil, sem conversão de
 * fuso, que é o que uma data de agenda significa.
 *
 *     18 a 20 de setembro   ·   9 de outubro   ·   28 de fev a 2 de mar
 */
export function intervaloDeDatas(inicio: string, fim: string | null): string {
  const dia = (d: string) => Number(d.slice(8, 10));
  const mes = (d: string) =>
    new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(
      new Date(`${d}T12:00:00Z`),
    );

  if (!fim || fim === inicio) {
    return `${dia(inicio)} de ${mes(inicio)}`;
  }

  // Mesmo mês: o nome do mês aparece uma vez só.
  return inicio.slice(0, 7) === fim.slice(0, 7)
    ? `${dia(inicio)} a ${dia(fim)} de ${mes(inicio)}`
    : `${dia(inicio)} de ${mes(inicio)} a ${dia(fim)} de ${mes(fim)}`;
}

/** `6 min de leitura` · `1 min de leitura`. */
export function tempoDeLeitura(minutos: number): string {
  return `${minutos} min de leitura`;
}

/** `22 verbetes` · `1 verbete`. O plural vem da contagem, nunca chumbado. */
export function plural(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}
