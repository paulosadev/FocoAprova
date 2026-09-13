import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';
import Cartao from '../components/Cartao';

const SECOES = [
  {
    titulo: 'Navegação',
    itens: [
      'A barra de baixo leva direto pra Início, Revisar, Progresso e Perfil.',
      'O botão âmbar no meio ("Estudar") abre o Timer, Cronograma e Simulado — a aba fica selecionada ali dentro.',
    ],
  },
  {
    titulo: 'Cadastro',
    itens: [
      'Nome, sobrenome, data de nascimento, país/estado/cidade (estado e cidade vêm da lista oficial do IBGE) e e-mail/senha.',
      'É preciso aceitar os Termos de Uso pra concluir o cadastro — dá pra ler o conteúdo completo sem sair da tela.',
    ],
  },
  {
    titulo: 'Início',
    itens: [
      'Contagem regressiva para a data da prova.',
      'Matérias do dia com o interruptor de "estudei hoje" — ao marcar, dá pra anotar o assunto estudado.',
      'Revisões pendentes de hoje (das anotações de erro e dos flashcards).',
    ],
  },
  {
    titulo: 'Timer',
    itens: [
      'Blocos no estilo Pomodoro, com foco, pausa curta e pausa longa configuráveis.',
      'A cada 4 blocos de foco, a próxima pausa é a longa.',
      'Modo tela cheia para estudar sem distração; o tempo de foco entra nas suas horas de estudo.',
    ],
  },
  {
    titulo: 'Cronograma',
    itens: [
      'Cadastre suas disciplinas escolhendo o dia da semana de cada uma.',
      'O dia de hoje fica destacado; marque cada matéria conforme for estudando.',
    ],
  },
  {
    titulo: 'Questões',
    itens: [
      'Registre quantas questões resolveu e quantas acertou — o app calcula o % de acerto por matéria.',
      'A meta diária de questões aparece aqui só como acompanhamento; pra mudar o número, vá em Configurações.',
      'Anote erros por assunto; eles voltam para revisão em intervalos crescentes (1, 3, 7, 14 e 30 dias).',
    ],
  },
  {
    titulo: 'Simulado',
    itens: [
      'Cronômetro próprio do simulado — o tempo dele não entra nas estatísticas de questões do dia a dia.',
      'Registre o resultado geral e, se quiser, o detalhamento de acertos por matéria.',
    ],
  },
  {
    titulo: 'Progresso',
    itens: [
      'Sequência de dias estudados seguidos, total de horas e horas na semana.',
      '"Acerto por matéria" vem ordenado da que mais precisa de atenção pra a mais consolidada, com um aviso pras que estão abaixo de 70%.',
      '"Últimos simulados por matéria" compara a evolução de cada matéria simulado a simulado, do mais antigo ao mais recente.',
    ],
  },
  {
    titulo: 'Flashcards',
    itens: [
      'Criação Manual ou Gerar com IA ficam juntas num só card — escolha o modo na pílula do topo.',
      'Modo de estudo um cartão por vez; acertos aumentam o intervalo até a próxima revisão, erros voltam para o início.',
    ],
  },
  {
    titulo: 'Perfil',
    itens: [
      'Mostra nome, idade (calculada pela data de nascimento), cidade e estado, e o nome/data da prova.',
      'Editar os dados só é possível a partir de Configurações → Editar perfil.',
    ],
  },
  {
    titulo: 'Configurações',
    itens: [
      'Aparência (claro/escuro/sistema) e meta diária de questões ficam aqui.',
      '"Editar perfil" abre o Perfil já em modo de edição — trocar senha e trocar e-mail também ficam dentro dessa tela.',
      '"Excluir minha conta" apaga tudo permanentemente: disciplinas, sessões, questões, simulados, flashcards, anotações e o cadastro.',
    ],
  },
];

export default function AjudaScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Um resumo rápido do que cada parte do app faz.
      </Text>
      {SECOES.map((secao) => (
        <Cartao key={secao.titulo}>
          <Text style={styles.tituloSecao}>{secao.titulo}</Text>
          {secao.itens.map((item, i) => (
            <View key={i} style={styles.linhaItem}>
              <Text style={styles.marcador}>•</Text>
              <Text style={styles.textoItem}>{item}</Text>
            </View>
          ))}
        </Cartao>
      ))}
    </ScrollView>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: { padding: 16 },
    intro: { fontSize: 14, color: cores.textoSecundario, marginBottom: 16, lineHeight: 20 },
    tituloSecao: {
      fontFamily: fontes.displaySemi,
      fontSize: 16,
      color: cores.texto,
      marginBottom: 10,
    },
    linhaItem: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    marcador: { color: cores.destaque, fontSize: 14, lineHeight: 20 },
    textoItem: { flex: 1, fontSize: 13, color: cores.textoSecundario, lineHeight: 20 },
  });
}
