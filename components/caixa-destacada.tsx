/**
 * A caixa destacada do verbete: "Na prática" e "Curiosidade".
 *
 * Virou componente quando a segunda caixa chegou. As duas são o mesmo bloco da
 * prancha com rótulo diferente, e um verbete pode ter **as duas** — a
 * `curiosidade` veio na importação do cliente e é independente da `naPratica`.
 *
 * Um componente em vez de duas cópias do JSX: são quatro elementos, mas é onde
 * a divergência nasceria. A prancha tem uma caixa só, e manter duas cópias
 * garantiria que um ajuste de espaçamento pegasse só uma delas.
 */
export function CaixaDestacada({ rotulo, children }: { rotulo: string; children: string }) {
  return (
    <aside className="na-pratica">
      <p className="kicker kicker--pequeno kicker--verde na-pratica__titulo">{rotulo}</p>
      <p className="na-pratica__texto">{children}</p>
    </aside>
  );
}
