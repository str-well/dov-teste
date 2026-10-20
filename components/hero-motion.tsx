'use client';

import { useEffect, useRef } from 'react';

import { HERO_MOTION, LARGURA_HERO_DUAS_COLUNAS } from '@/lib/site';

/**
 * A animação de marca da coluna direita do hero.
 *
 * **O servidor entrega o vídeo parado, e o cliente é que manda tocar.** Parece
 * rodeio, mas é o que faz as duas exigências caberem juntas:
 *
 * - **`prefers-reduced-motion` não alcança vídeo.** O reset dos tokens zera
 *   `animation-duration` e `transition-duration`, o que mata animação de CSS —
 *   mas um `<video autoplay>` continua tocando, porque não é animação de CSS.
 *   É a única peça animada do projeto que precisa do tratamento na mão.
 * - **Vídeo que não vai aparecer não deve ser baixado.** Abaixo de 1280 a
 *   animação sai da tela; com `autoplay` no HTML o navegador baixaria os 1,5 MB
 *   mesmo escondida, num plano dividido com outros 6 sites.
 *
 * `preload="none"` + `play()` só quando as duas condições passam resolve as
 * duas: sem movimento para quem pediu silêncio, e sem download para quem não vai
 * ver. Quem está no caminho feliz paga o arquivo e mais nada.
 *
 * `aria-hidden` porque é decorativo: a animação mostra o logo e a assinatura da
 * marca, que já estão no cabeçalho logo acima. Anunciá-la de novo seria repetir
 * a mesma informação para quem usa leitor de tela.
 */
export function HeroMotion() {
  const referencia = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = referencia.current;

    if (!video) return;

    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
    const duasColunas = window.matchMedia(`(min-width: ${LARGURA_HERO_DUAS_COLUNAS}px)`);

    const decidir = () => {
      if (semMovimento.matches || !duasColunas.matches) {
        video.pause();

        return;
      }

      // `preload` só muda aqui: antes disso o navegador não busca o arquivo.
      video.preload = 'auto';

      // A política de autoplay pode recusar mesmo com `muted`. Se recusar, o
      // pôster fica no lugar e nada quebra — daí o `catch` vazio em vez de log.
      void video.play().catch(() => {});
    };

    decidir();
    semMovimento.addEventListener('change', decidir);
    duasColunas.addEventListener('change', decidir);

    return () => {
      semMovimento.removeEventListener('change', decidir);
      duasColunas.removeEventListener('change', decidir);
    };
  }, []);

  return (
    <video
      ref={referencia}
      className="hero-motion"
      // Sem `autoPlay`: quem decide é o efeito acima.
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      width={HERO_MOTION.largura}
      height={HERO_MOTION.altura}
      {...(HERO_MOTION.poster ? { poster: HERO_MOTION.poster } : {})}
    >
      <source src={HERO_MOTION.video} type="video/mp4" />
    </video>
  );
}
