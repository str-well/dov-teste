import type { Metadata } from 'next';
import Link from 'next/link';

import { PaginaInstitucional } from '@/components/pagina-institucional';
import { dataLonga } from '@/lib/formato';
import { SITE } from '@/lib/site';

/**
 * ⚠️ RASCUNHO — precisa de revisão jurídica antes do lançamento.
 *
 * O texto descreve **só o que o site faz de fato hoje**: newsletter, formulário
 * de contato e Google Analytics 4 mediante consentimento. Nada foi inventado
 * para parecer completo. O que depende de informação que não temos — razão
 * social, CNPJ, endereço, encarregado de dados, retenção — está marcado no
 * próprio texto como pendência visível, de propósito: assim ninguém publica sem
 * preencher.
 *
 * A seção de cookies **é o par textual de `components/consentimento.tsx`**. Se
 * um dos dois mudar sem o outro, a política vira declaração falsa — foi
 * exatamente o que aconteceu quando o GA4 entrou e o texto ainda dizia que não
 * havia analytics. Mexer nos dois no mesmo commit.
 *
 * Se o inventário de dados mudar (pixel, comentários, login), esta página muda
 * junto. Está no checklist da Fase 5.
 */

const ATUALIZADO_EM = '2026-08-05T12:00:00Z';

export const metadata: Metadata = {
  title: `Política de privacidade · ${SITE.nome}`,
  description:
    'Quais dados o Descubra o Vinho coleta, para que usam e como exercer seus direitos.',
};

export default function Page() {
  return (
    <PaginaInstitucional
      kicker="Legal"
      titulo="Política de privacidade"
      lead="O que coletamos, por quê, por quanto tempo guardamos e como você pede para apagar."
    >
      <p>
        Última atualização: <time dateTime={ATUALIZADO_EM}>{dataLonga(ATUALIZADO_EM)}</time>.
      </p>

      <p>
        Esta política explica como o <strong>{SITE.nome}</strong> trata dados pessoais,
        conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
      </p>

      <h2>Quem é o responsável</h2>

      <p>
        O tratamento é feito por <mark>[razão social, CNPJ e endereço — preencher]</mark>.
        Para qualquer assunto relativo a dados pessoais, incluindo o exercício dos
        direitos listados abaixo, fale com a gente pela{' '}
        <Link href="/contato">página de contato</Link>.
      </p>

      <p>
        Encarregado pelo tratamento de dados: <mark>[nome e e-mail — preencher]</mark>.
      </p>

      <h2>Que dados coletamos</h2>

      <p>O que você digita, em dois lugares:</p>

      <ul>
        <li>
          <strong>Newsletter.</strong> Seu endereço de e-mail, quando você o informa no
          formulário de assinatura.
        </li>
        <li>
          <strong>Formulário de contato.</strong> Nome, e-mail e o conteúdo da mensagem
          que você escreve.
        </li>
      </ul>

      <p>
        E, <strong>só se você autorizar</strong>, dados de navegação para medir audiência:
        páginas visitadas, tempo de leitura, tipo de aparelho e navegador, cidade
        aproximada e de onde você veio. Detalhe na seção sobre cookies, abaixo.
      </p>

      <p>
        Não pedimos CPF, telefone, endereço nem dados de pagamento. Não há área de
        cadastro, login ou comentários no site.
      </p>

      <h2>Cookies e medição de audiência</h2>

      <p>
        O site usa o <strong>Google Analytics 4</strong> para medir audiência: quantas
        pessoas leem cada matéria, por qual caminho chegaram e em que tipo de aparelho.
        Ele grava cookies no seu navegador — os que começam com <strong>_ga</strong> — e
        gera um identificador aleatório do seu dispositivo, não do seu nome.
      </p>

      <p>
        <strong>Nada disso é carregado antes de você autorizar.</strong> Na primeira
        visita aparece um aviso com as opções aceitar e recusar, e enquanto você não
        escolher, o site não pede nada ao Google e não escreve cookie de medição. Se
        recusar, o Analytics simplesmente não é carregado, e o site funciona igual.
      </p>

      <p>
        Você pode mudar de ideia quando quiser: o link{' '}
        <strong>&ldquo;Preferências de cookies&rdquo;</strong>, no rodapé de qualquer
        página, reabre o aviso. Ao revogar, apagamos os cookies de medição que já
        estiverem no seu navegador.
      </p>

      <p>
        A base legal desse tratamento é o <strong>seu consentimento</strong>. Também não
        usamos pixel de publicidade, não fazemos perfilamento para anúncio e não cruzamos
        os dados de audiência com o e-mail que você informa nos formulários.
      </p>

      <p>
        <strong>Transferência internacional.</strong> O Google Analytics é operado pelo
        Google, e os dados de audiência são processados <strong>fora do Brasil</strong>,
        em servidores nos Estados Unidos e em outros países onde o Google mantém
        infraestrutura. Isso é transferência internacional de dados, permitida pela LGPD
        com o seu consentimento — o mesmo que o aviso de cookies pede, e que esta página
        detalha.
      </p>

      <p>
        O único cookie que existe sem pedir nada a você é o registro da <em>sua própria
        escolha</em> no aviso acima, guardado no armazenamento local do navegador. Sem
        ele, o aviso reapareceria em cada página.
      </p>

      <p>
        Os servidores que hospedam o site registram, como qualquer servidor,
        informações técnicas de acesso — endereço IP, data e hora, navegador e página
        pedida. Esses registros servem para segurança e diagnóstico de falha, e não são
        usados para identificar pessoas nem cruzados com os dados dos formulários.
      </p>

      <h2>Para que usamos</h2>

      <ul>
        <li>
          O e-mail da newsletter serve <strong>exclusivamente</strong> para enviar a
          newsletter. Não é vendido, alugado, cedido nem usado para outra finalidade.
        </li>
        <li>Os dados do contato servem para responder à sua mensagem.</li>
      </ul>

      <h2>Com quem compartilhamos</h2>

      <p>
        Apenas com os prestadores necessários para o site funcionar, e só no que cada um
        precisa:
      </p>

      <ul>
        <li>
          <strong>Hospedagem</strong> — Hostinger, onde o site e o banco de dados rodam.
        </li>
        <li>
          <strong>Envio de e-mail</strong> — Resend, que processa o disparo da newsletter
          e das mensagens de contato.
        </li>
        <li>
          <strong>DNS</strong> — Cloudflare, que resolve o endereço do site.
        </li>
        <li>
          <strong>Medição de audiência</strong> — Google, pelo Google Analytics 4, e
          somente se você autorizar. Recebe os dados de navegação descritos acima, nunca
          o seu e-mail nem o conteúdo das suas mensagens.
        </li>
      </ul>

      <p>
        Nenhum deles está autorizado a usar seus dados para finalidade própria. Podemos
        também compartilhar dados quando houver obrigação legal ou ordem judicial.
      </p>

      <h2>Por quanto tempo guardamos</h2>

      <ul>
        <li>
          <strong>Newsletter</strong> — enquanto você quiser receber. O cancelamento está
          em todo e-mail que enviamos, e o endereço é removido em seguida.
        </li>
        <li>
          <strong>Contato</strong> — <mark>[prazo — definir]</mark> após a resposta, salvo
          quando a mensagem precisar ser mantida por obrigação legal.
        </li>
        <li>
          <strong>Medição de audiência</strong> — <mark>[período de retenção configurado
          no Google Analytics — confirmar]</mark>. Os cookies de medição expiram
          por conta em até dois anos, e são apagados antes disso se você revogar o
          consentimento.
        </li>
      </ul>

      <h2>Seus direitos</h2>

      <p>A LGPD garante que você pode, a qualquer momento:</p>

      <ul>
        <li>confirmar se tratamos dados seus e pedir acesso a eles;</li>
        <li>corrigir dado incompleto, inexato ou desatualizado;</li>
        <li>pedir anonimização, bloqueio ou eliminação de dado desnecessário;</li>
        <li>pedir a portabilidade dos dados a outro fornecedor;</li>
        <li>revogar o consentimento e pedir a eliminação dos dados tratados com base nele;</li>
        <li>ser informado sobre com quem compartilhamos seus dados;</li>
        <li>opor-se a um tratamento feito sem o seu consentimento.</li>
      </ul>

      <p>
        Para exercer qualquer um deles, escreva pela{' '}
        <Link href="/contato">página de contato</Link>. Respondemos no prazo da lei.
      </p>

      <h2>Segurança</h2>

      <p>
        Todo o tráfego do site é cifrado por HTTPS, e o acesso administrativo é restrito
        a quem publica o conteúdo. Nenhuma medida elimina risco por completo — se
        acontecer um incidente que possa causar risco relevante a você, comunicaremos
        você e a Autoridade Nacional de Proteção de Dados.
      </p>

      <h2>Menores de 18 anos</h2>

      <p>
        O conteúdo trata de bebida alcoólica e é destinado a maiores de 18 anos. Não
        coletamos dados de menores de forma consciente. Se isso tiver acontecido, avise
        pela <Link href="/contato">página de contato</Link> e apagaremos.
      </p>

      <h2>Mudanças nesta política</h2>

      <p>
        Se ela mudar, a data de última atualização no topo muda também. Alteração que
        afete de forma significativa o tratamento dos seus dados será avisada na
        newsletter.
      </p>
    </PaginaInstitucional>
  );
}
