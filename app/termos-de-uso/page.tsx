import type { Metadata } from 'next';
import Link from 'next/link';

import { PaginaInstitucional } from '@/components/pagina-institucional';
import { dataLonga } from '@/lib/formato';
import { SITE } from '@/lib/site';

/**
 * ⚠️ RASCUNHO — precisa de revisão jurídica antes do lançamento.
 *
 * Cobre o que é verificável sobre este site: conteúdo editorial e informativo,
 * público maior de 18 anos, direito autoral do que publicamos, links externos e
 * limite de responsabilidade. O que depende de informação que não temos está
 * marcado no texto como pendência visível.
 */

const ATUALIZADO_EM = '2026-08-03T12:00:00Z';

export const metadata: Metadata = {
  title: `Termos de uso · ${SITE.nome}`,
  description: 'As regras de uso do Descubra o Vinho: conteúdo, direitos autorais e limites.',
};

export default function Page() {
  return (
    <PaginaInstitucional
      kicker="Legal"
      titulo="Termos de uso"
      lead="As regras para usar o site, o que você pode fazer com o nosso conteúdo e o que não prometemos."
    >
      <p>
        Última atualização: <time dateTime={ATUALIZADO_EM}>{dataLonga(ATUALIZADO_EM)}</time>.
      </p>

      <p>
        Ao usar o <strong>{SITE.nome}</strong>, você concorda com o que está aqui. Se não
        concordar, não use o site.
      </p>

      <h2>O que este site é</h2>

      <p>
        Um portal editorial sobre vinho: reportagem, curiosidade, harmonização, mercado,
        ciência, viagem e um almanaque de termos. É conteúdo{' '}
        <strong>jornalístico e informativo</strong>.
      </p>

      <h2>O que ele não é</h2>

      <p>
        O conteúdo <strong>não é orientação médica, nutricional, jurídica nem
        financeira</strong>. Matéria sobre saúde e vinho descreve o que a literatura diz;
        não substitui consulta com profissional de saúde, e nenhuma decisão sobre o seu
        consumo de álcool deve se apoiar apenas no que você leu aqui.
      </p>

      <p>
        Também não vendemos vinho, não intermediamos compra e não somos responsáveis por
        produto, preço, disponibilidade ou atendimento de nenhum produtor, loja, vinícola
        ou evento mencionado.
      </p>

      <h2>Idade mínima</h2>

      <p>
        O conteúdo trata de bebida alcoólica e é destinado a <strong>maiores de 18
        anos</strong>. A venda de bebida alcoólica para menores de 18 anos é proibida por
        lei. Aprecie com moderação.
      </p>

      <h2>Conteúdo e direitos autorais</h2>

      <p>
        Texto, fotografia, ilustração, identidade visual e a estrutura do almanaque são
        protegidos por direito autoral e pertencem ao {SITE.nome} ou a quem nos licenciou
        o uso.
      </p>

      <p>Você pode, sem pedir autorização:</p>

      <ul>
        <li>ler, imprimir e compartilhar links para as páginas;</li>
        <li>
          citar trechos curtos com crédito e link para a página original, como manda o
          artigo 46 da Lei nº 9.610/1998.
        </li>
      </ul>

      <p>Você não pode, sem autorização por escrito:</p>

      <ul>
        <li>republicar matéria ou verbete por inteiro, em qualquer meio;</li>
        <li>usar nosso conteúdo, marca ou logotipo em material comercial ou publicitário;</li>
        <li>
          raspar o site de forma automatizada, nem usar o conteúdo para treinar modelo de
          linguagem, sem acordo prévio.
        </li>
      </ul>

      <p>
        Para pedir autorização, escreva pela <Link href="/contato">página de contato</Link>.
      </p>

      <h2>Links para outros sites</h2>

      <p>
        Indicamos vinícolas, eventos, estudos e lojas quando isso ajuda a leitura. Não
        controlamos esses sites e não respondemos pelo conteúdo, pela política de
        privacidade nem pela prática comercial de nenhum deles.
      </p>

      <h2>Publicidade e conteúdo patrocinado</h2>

      <p>
        <mark>[definir — se houver publicidade, patrocínio, link de afiliado ou permuta
        de hospedagem em viagem de pauta, precisa estar declarado aqui e sinalizado na
        própria matéria]</mark>
      </p>

      <h2>Newsletter</h2>

      <p>
        Assinar é voluntário e cancelar também: todo e-mail traz o link de cancelamento.
        O tratamento do seu endereço está na{' '}
        <Link href="/politica-de-privacidade">política de privacidade</Link>.
      </p>

      <h2>Disponibilidade do site</h2>

      <p>
        Trabalhamos para manter o site no ar, mas não garantimos funcionamento
        ininterrupto nem ausência de erro. Podemos alterar, suspender ou encerrar
        qualquer parte do site — inclusive despublicar ou corrigir conteúdo — sem aviso
        prévio.
      </p>

      <h2>Erros e correções</h2>

      <p>
        Se encontrar erro de fato numa matéria ou num verbete, avise pela{' '}
        <Link href="/contato">página de contato</Link>. Corrigimos e, quando a correção
        for relevante, deixamos registro dela na própria página.
      </p>

      <h2>Limite de responsabilidade</h2>

      <p>
        Na máxima extensão permitida pela lei brasileira, não respondemos por dano
        indireto decorrente do uso do site ou da confiança depositada no conteúdo. Isso
        não afasta os direitos que o Código de Defesa do Consumidor garante a você.
      </p>

      <h2>Mudanças nestes termos</h2>

      <p>
        Podem mudar. Quando mudarem, a data de última atualização no topo muda também, e
        continuar usando o site significa aceitar a nova versão.
      </p>

      <h2>Lei aplicável</h2>

      <p>
        Estes termos são regidos pela lei brasileira. Fica eleito o foro de{' '}
        <mark>[comarca — preencher]</mark> para resolver qualquer questão, ressalvado o
        direito do consumidor de acionar o foro do seu domicílio.
      </p>
    </PaginaInstitucional>
  );
}
