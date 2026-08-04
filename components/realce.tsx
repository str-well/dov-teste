/**
 * Realce do trecho que casa com o termo digitado.
 *
 * A comparação ignora acento, mas o texto exibido é o original: quem digita
 * "acucar" precisa ver o realce em "açúcar", escrito certo.
 *
 * Para isso a dobra é feita **caractere por caractere**, preservando o mapa 1:1
 * de índices. Normalizar a string inteira não serve — `"á"` em NFD tem dois
 * caracteres, e todo índice depois dele sairia deslocado.
 *
 * Usado pelo combobox da busca e pelo índice A–Z.
 */
export function Realce({ texto, termo }: { texto: string; termo: string }) {
  const alvo = dobrar(termo.trim());

  if (alvo === '') return <>{texto}</>;

  const inicio = dobrar(texto).indexOf(alvo);

  if (inicio === -1) return <>{texto}</>;

  return (
    <>
      {texto.slice(0, inicio)}
      <mark>{texto.slice(inicio, inicio + alvo.length)}</mark>
      {texto.slice(inicio + alvo.length)}
    </>
  );
}

const COMBINANTES = /[\u0300-\u036f]/g;

/** Sem acento e sem caixa, mantendo um caractere por caractere. */
export function dobrar(texto: string): string {
  return [...texto]
    .map((caractere) => {
      const sem = caractere.normalize('NFD').replace(COMBINANTES, '');

      // Ligaduras e afins viram mais de um caractere e quebrariam o mapa de
      // índices. Nesses casos o original fica.
      return sem.length === 1 ? sem : caractere;
    })
    .join('')
    .toLowerCase();
}
