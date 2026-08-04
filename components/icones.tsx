/**
 * Ícones do pacote do designer, inline.
 *
 * Ficam em TSX e não em arquivos SVG servidos de `public/` por três motivos:
 * o traço é `currentColor` e precisa herdar a cor do contexto, cada um tem
 * menos de 300 bytes, e assim não há uma requisição por ícone.
 *
 * Os logos e os blobs, esses sim, moram em `public/` — são grandes e não
 * mudam de cor.
 */

type Props = React.SVGProps<SVGSVGElement>;

/** Atributos comuns a todos: traço de 1.8, pontas arredondadas, sem preenchimento. */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function IconeBusca(props: Props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  );
}

export function IconeMenu(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function IconeFechar(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconeSetaDireita(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconeSetaEsquerda(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function IconeRelogio(props: Props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconeCalendario(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconeCompartilhar(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
    </svg>
  );
}

export function IconeCopiarLink(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 7" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L12.5 17" />
    </svg>
  );
}

/* --- Redes. O traço é mais fino: 1.6, como nas pranchas. --- */

export function IconeInstagram(props: Props) {
  return (
    <svg {...base} strokeWidth={1.6} {...props}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.6" cy="6.4" r="1" />
    </svg>
  );
}

export function IconeYoutube(props: Props) {
  return (
    <svg {...base} strokeWidth={1.6} {...props}>
      <path d="M22 8.5a4 4 0 0 0-3-3.8C17 4.2 12 4.2 12 4.2s-5 0-7 .5A4 4 0 0 0 2 8.5 24 24 0 0 0 2 15.5a4 4 0 0 0 3 3.8c2 .5 7 .5 7 .5s5 0 7-.5a4 4 0 0 0 3-3.8 24 24 0 0 0 0-7Z" />
      <path d="M10 9.5l5 2.5-5 2.5v-5Z" />
    </svg>
  );
}

export function IconeWhatsapp(props: Props) {
  return (
    <svg {...base} strokeWidth={1.6} {...props}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3.5 20.5l1.6-4.7A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8.8 9c0 3 2.2 5.2 5.2 5.2l1-1.3 1.6.8-.4 1.4c-2.8.6-6.8-2-7.7-5.4l1.3-.7Z" />
    </svg>
  );
}
