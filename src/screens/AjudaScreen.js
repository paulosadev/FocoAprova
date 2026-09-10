import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';
import Cartao from '../components/Cartao';

const SECOES = [
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
      'Defina uma meta diária de questões e acompanhe o progresso do dia.',
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
      'Sequência de dias estudados seguidos.',
      'Total de horas de estudo e horas na semana.',
      'Desempenho por matéria no dia a dia e comparação dos últimos simulados.',
    ],
  },
  {
    titulo: 'Flashcards',
    itens: [
      'Crie cartões com frente e verso, agrupados por disciplina.',
      'Modo de estudo um cartão por vez; acertos aumentam o intervalo até a próxima revisão, erros voltam para o início.',
    ],
  },
  {
    titulo: 'Perfil',
    itens: [
      'Seus dados pessoais, o objetivo de estudo e a data da prova.',
      'A engrenagem no canto abre estas Configurações.',
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
