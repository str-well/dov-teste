import Link from 'next/link';
import { Fragment } from 'react';

export type Migalha = { rotulo: string; href?: string };

/**
 * Migalhas de pão.
 *
 * O último item nunca é link — é onde o leitor está. Os separadores são
 * `aria-hidden`: leitor de tela já entende a lista ordenada, e ouvir "barra"
 * entre cada item é ruído.
 */
export function Migalhas({ itens, className }: { itens: Migalha[]; className?: string }) {
  if (itens.length === 0) return null;

  return (
    <nav className={`migalhas${className ? ` ${className}` : ''}`} aria-label="Você está em">
      <ol className="migalhas__lista">
        {itens.map((item, indice) => (
          <Fragment key={`${item.rotulo}-${indice}`}>
            {indice > 0 && (
              <li className="migalhas__separador" aria-hidden="true">
                /
              </li>
            )}
            <li>
              {item.href && indice < itens.length - 1 ? (
                <Link className="migalhas__link" href={item.href}>
                  {item.rotulo}
                </Link>
              ) : (
                <span className="migalhas__atual" aria-current="page">
                  {item.rotulo}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
