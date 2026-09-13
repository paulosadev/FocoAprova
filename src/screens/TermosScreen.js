import { ScrollView, Text, StyleSheet } from 'react-native';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';
import Cartao from '../components/Cartao';

const ATUALIZADO_EM = '13 de setembro de 2026';

const TERMOS_DE_USO = [
  {
    titulo: '1. Aceitação dos Termos',
    paragrafos: [
      'Ao criar uma conta ou usar o FocoAprova você concorda com estes Termos de Uso e com a Política de Privacidade descrita mais abaixo nesta mesma página. Se você não concorda com algum ponto, não deve usar o aplicativo.',
      'Marcar a caixa "Li e aceito os Termos de Uso" no cadastro registra a data e hora do seu aceite na sua conta.',
    ],
  },
  {
    titulo: '2. Quem pode usar o FocoAprova',
    paragrafos: [
      'O uso do FocoAprova é permitido a partir de 13 anos de idade. Se você tem entre 13 e 18 anos incompletos, o uso do aplicativo deve ser autorizado por um pai, mãe ou responsável legal, que também aceita estes Termos em seu nome.',
      'Ao se cadastrar, você declara que as informações fornecidas (nome, data de nascimento, e-mail e demais dados do cadastro) são verdadeiras e que você tem capacidade para aceitar estes Termos nas condições acima.',
    ],
  },
  {
    titulo: '3. Sua conta',
    paragrafos: [
      'Você é responsável por manter sua senha em sigilo e por todas as atividades feitas na sua conta. Avise a gente imediatamente se suspeitar de uso não autorizado.',
      'Você pode entrar com e-mail e senha ou com sua conta Google. Em ambos os casos, a autenticação é processada pelo Supabase (nosso provedor de backend) e, no caso do Google, também pela Google — veja a seção de compartilhamento de dados na Política de Privacidade.',
    ],
  },
  {
    titulo: '4. Como o FocoAprova funciona',
    paragrafos: [
      'O FocoAprova é uma ferramenta de organização de estudos: cronograma de disciplinas, timer de foco, registro de questões e simulados, flashcards com repetição espaçada e acompanhamento de progresso. Os dados que você registra vêm de você mesmo — o app não corrige provas nem valida se suas respostas ou anotações estão certas.',
      'O FocoAprova é um app de apoio à organização dos seus estudos. Ele não garante aprovação em concursos, vestibulares ou qualquer outra avaliação, e não substitui material didático oficial, professores ou orientação profissional.',
    ],
  },
  {
    titulo: '5. Conteúdo gerado por Inteligência Artificial',
    paragrafos: [
      'A função "Gerar com IA" de flashcards usa um serviço de terceiro (atualmente a Groq) para criar cartões de estudo a partir da disciplina e do assunto que você digita. Esse conteúdo é gerado automaticamente e pode conter erros, imprecisões ou simplificações — sempre confira com fontes confiáveis antes de confiar no conteúdo para os seus estudos.',
      'Por dia, cada disciplina tem um limite de flashcards gerados por IA. Esse limite pode mudar sem aviso prévio.',
    ],
  },
  {
    titulo: '6. Uso aceitável',
    paragrafos: [
      'Ao usar o FocoAprova você concorda em não: (a) tentar acessar contas de outras pessoas ou dados que não sejam seus; (b) enviar conteúdo ilegal, ofensivo ou que viole direitos de terceiros nos campos de texto livre (como anotações e assuntos de flashcards); (c) tentar burlar limites técnicos do app (como o limite diário de geração por IA) por meios automatizados; (d) fazer engenharia reversa, copiar ou redistribuir o código do aplicativo sem autorização.',
      'Podemos suspender ou encerrar contas que violem este item, conforme a seção 10.',
    ],
  },
  {
    titulo: '7. Propriedade intelectual',
    paragrafos: [
      'A marca FocoAprova, o logotipo, o design do aplicativo e o código-fonte pertencem aos seus desenvolvedores e são protegidos por lei. Isso não inclui o conteúdo que você mesmo cria (suas anotações, cartões e registros), que continua sendo seu.',
    ],
  },
  {
    titulo: '8. Gratuidade e mudanças no serviço',
    paragrafos: [
      'Hoje o FocoAprova é gratuito. Podemos, no futuro, introduzir recursos pagos ou por assinatura — se isso acontecer, avisaremos com clareza antes de cobrar qualquer valor, e o uso dos recursos pagos será sempre opcional.',
      'Podemos alterar, suspender ou descontinuar funcionalidades do app a qualquer momento, buscando sempre avisar com antecedência razoável quando a mudança afetar seus dados ou o uso que você já faz do app.',
    ],
  },
  {
    titulo: '9. Isenções e limitação de responsabilidade',
    paragrafos: [
      'O FocoAprova é fornecido "como está". Fazemos o possível para manter o app disponível e funcionando corretamente, mas não garantimos que ele estará livre de interrupções, erros ou perda de dados, incluindo casos causados por falhas de conexão, do seu aparelho ou de provedores externos (como Supabase, Google ou Groq).',
      'Na máxima medida permitida por lei, não nos responsabilizamos por resultados de provas, concursos ou avaliações, nem por decisões tomadas com base no conteúdo do app, incluindo conteúdo gerado por IA.',
      'Recomendamos manter cópias externas de informações que você considere críticas (por exemplo, anotações muito importantes), já que nenhum sistema é livre de falhas.',
    ],
  },
  {
    titulo: '10. Suspensão e encerramento',
    paragrafos: [
      'Você pode excluir sua conta a qualquer momento em Configurações → Excluir minha conta. Isso apaga permanentemente seus dados de acordo com a seção "Exclusão da sua conta" da Política de Privacidade.',
      'Podemos suspender ou encerrar sua conta em caso de violação destes Termos, uso indevido do app ou por exigência legal, avisando você sempre que possível.',
    ],
  },
  {
    titulo: '11. Alterações destes Termos',
    paragrafos: [
      'Podemos atualizar estes Termos de tempos em tempos. Mudanças relevantes serão comunicadas dentro do app. Ao continuar usando o FocoAprova depois de uma atualização, você concorda com os novos termos.',
    ],
  },
  {
    titulo: '12. Lei aplicável',
    paragrafos: [
      'Estes Termos são regidos pelas leis brasileiras, incluindo o Código de Defesa do Consumidor e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). Eventuais disputas serão resolvidas no foro do domicílio do usuário, conforme a legislação aplicável.',
    ],
  },
];

const PRIVACIDADE = [
  {
    titulo: '1. Quais dados coletamos',
    paragrafos: [
      'Dados de cadastro: nome, sobrenome, e-mail, senha (armazenada de forma criptografada, nunca em texto puro), data de nascimento, país, estado e cidade.',
      'Dados de objetivo: o que você está estudando (categoria e descrição) e a data da sua prova, se você informar.',
      'Dados de uso e desempenho: disciplinas cadastradas, sessões de estudo (timer), questões e simulados registrados, flashcards criados (manualmente ou por IA), anotações de erro e suas datas de revisão.',
      'Dados técnicos básicos necessários para o funcionamento do app, como identificadores de sessão de login.',
    ],
  },
  {
    titulo: '2. Para que usamos seus dados',
    paragrafos: [
      'Para criar e manter sua conta, autenticar seu login e sincronizar seus dados entre sessões.',
      'Para fazer o app funcionar: montar seu cronograma, calcular seu progresso e estatísticas, controlar as revisões espaçadas de flashcards e anotações, e gerar flashcards por IA quando você usa essa função.',
      'Para comunicação essencial sobre sua conta (por exemplo, confirmação de cadastro ou redefinição de senha).',
      'Não usamos seus dados para publicidade nem vendemos seus dados a terceiros.',
    ],
  },
  {
    titulo: '3. Base legal (LGPD)',
    paragrafos: [
      'Tratamos seus dados com base na execução do contrato firmado com você ao aceitar estes Termos (fornecer o serviço que você pediu) e, quando aplicável, no seu consentimento explícito (como o aceite dos Termos no cadastro). Você pode retirar seu consentimento a qualquer momento excluindo sua conta.',
    ],
  },
  {
    titulo: '4. Com quem compartilhamos dados',
    paragrafos: [
      'Supabase: hospeda nosso banco de dados e cuida da autenticação. Seus dados ficam protegidos por regras de acesso (Row Level Security) que impedem outros usuários de verem seus dados.',
      'Google: se você entrar com sua conta Google, a Google processa essa autenticação conforme a própria política de privacidade dela. Não recebemos sua senha do Google.',
      'Groq (geração de flashcards por IA): quando você usa "Gerar com IA", a disciplina e o assunto que você digitar são enviados a esse serviço só para gerar o conteúdo do cartão — não enviamos seu nome, e-mail ou outros dados pessoais nessa chamada.',
      'Não compartilhamos seus dados com anunciantes ou corretores de dados. Só compartilhamos dados com autoridades quando exigido por lei.',
    ],
  },
  {
    titulo: '5. Como protegemos seus dados',
    paragrafos: [
      'Sua senha nunca é armazenada em texto puro. O banco de dados usa regras de segurança em nível de linha (RLS), o que significa que, mesmo dentro da nossa infraestrutura, um usuário só consegue acessar os próprios dados. A comunicação entre o app e nossos servidores é criptografada.',
      'Nenhum sistema é 100% imune a falhas, mas seguimos práticas reconhecidas de segurança e revisamos nossas configurações regularmente.',
    ],
  },
  {
    titulo: '6. Por quanto tempo guardamos seus dados',
    paragrafos: [
      'Guardamos seus dados enquanto sua conta existir. Se você excluir sua conta, seus dados pessoais e de uso são apagados permanentemente, exceto quando a lei exigir retenção por período determinado (por exemplo, obrigações fiscais ou de defesa em processos judiciais).',
    ],
  },
  {
    titulo: '7. Seus direitos',
    paragrafos: [
      'De acordo com a LGPD, você tem direito a: confirmar se tratamos seus dados; acessar seus dados; corrigir dados incompletos ou desatualizados; solicitar a exclusão dos seus dados; solicitar a portabilidade dos seus dados a outro fornecedor; e revogar seu consentimento a qualquer momento.',
      'A maioria desses direitos pode ser exercida diretamente no app: seus dados de perfil ficam em Perfil → Editar perfil, e a exclusão da conta fica em Configurações → Excluir minha conta.',
    ],
  },
  {
    titulo: '8. Exclusão da sua conta',
    paragrafos: [
      'Ao excluir sua conta em Configurações, apagamos permanentemente seu cadastro, disciplinas, sessões de estudo, questões, simulados, flashcards e anotações associados a ela. Essa ação não pode ser desfeita — não temos como recuperar dados depois da exclusão.',
    ],
  },
  {
    titulo: '9. Privacidade de crianças e adolescentes',
    paragrafos: [
      'O FocoAprova não é destinado a menores de 13 anos. Para usuários entre 13 e 18 anos incompletos, o tratamento de dados é feito com o entendimento de que há autorização de um responsável legal, conforme o artigo 14 da LGPD.',
    ],
  },
  {
    titulo: '10. Alterações desta Política',
    paragrafos: [
      'Podemos atualizar esta Política de Privacidade de tempos em tempos, sempre indicando a data da última atualização no topo desta página. Mudanças relevantes serão avisadas dentro do app.',
    ],
  },
  {
    titulo: '11. Contato',
    paragrafos: [
      'Dúvidas sobre estes Termos ou sobre seus dados podem ser enviadas pelo formulário de sugestões em Configurações → Enviar sugestão ou relatar bug.',
    ],
  },
];

export default function TermosScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.atualizado}>Última atualização: {ATUALIZADO_EM}</Text>

      <Text style={styles.tituloParte}>Termos de Uso</Text>
      {TERMOS_DE_USO.map((secao) => (
        <Cartao key={secao.titulo}>
          <Text style={styles.tituloSecao}>{secao.titulo}</Text>
          {secao.paragrafos.map((p, i) => (
            <Text key={i} style={styles.paragrafo}>
              {p}
            </Text>
          ))}
        </Cartao>
      ))}

      <Text style={styles.tituloParte}>Política de Privacidade</Text>
      {PRIVACIDADE.map((secao) => (
        <Cartao key={secao.titulo}>
          <Text style={styles.tituloSecao}>{secao.titulo}</Text>
          {secao.paragrafos.map((p, i) => (
            <Text key={i} style={styles.paragrafo}>
              {p}
            </Text>
          ))}
        </Cartao>
      ))}
    </ScrollView>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: { padding: 16, paddingBottom: 32 },
    atualizado: {
      fontSize: 12,
      color: cores.textoFraco,
      marginBottom: 16,
      textAlign: 'center',
    },
    tituloParte: {
      fontFamily: fontes.display,
      fontSize: 20,
      color: cores.texto,
      marginTop: 8,
      marginBottom: 12,
    },
    tituloSecao: {
      fontFamily: fontes.displaySemi,
      fontSize: 15,
      color: cores.texto,
      marginBottom: 8,
    },
    paragrafo: {
      fontSize: 13,
      color: cores.textoSecundario,
      lineHeight: 20,
      marginBottom: 8,
    },
  });
}
