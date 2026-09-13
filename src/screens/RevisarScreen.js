import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTema } from '../context/ThemeContext';
import Cabecalho from '../components/Cabecalho';
import SeletorPilulas from '../components/SeletorPilulas';
import FlashcardsScreen from './FlashcardsScreen';
import QuestoesScreen from './QuestoesScreen';

const ABAS = [
  { chave: 'flashcards', rotulo: 'Flashcards' },
  { chave: 'questoes', rotulo: 'Questões' },
];

// Mesma regra do EstudarScreen: troca de aba não anima, só o indicador da
// pílula desliza.
export default function RevisarScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { aba: abaInicial } = useLocalSearchParams();
  const [aba, setAba] = useState(
    ABAS.some((a) => a.chave === abaInicial) ? abaInicial : 'flashcards',
  );

  useEffect(() => {
    if (ABAS.some((a) => a.chave === abaInicial)) setAba(abaInicial);
  }, [abaInicial]);

  return (
    <View style={styles.flex}>
      <Cabecalho titulo="Revisar" subtitulo="Flashcards · Questões" />
      <View style={styles.pilulas}>
        <SeletorPilulas abas={ABAS} ativa={aba} onSelecionar={setAba} />
      </View>
      <View style={styles.conteudo}>
        {aba === 'flashcards' && <FlashcardsScreen />}
        {aba === 'questoes' && <QuestoesScreen />}
      </View>
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    pilulas: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    conteudo: { flex: 1 },
  });
}
