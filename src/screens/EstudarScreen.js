import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTema } from '../context/ThemeContext';
import CabecalhoVidro from '../components/CabecalhoVidro';
import SeletorPilulas from '../components/SeletorPilulas';
import TimerScreen from './TimerScreen';
import CronogramaScreen from './CronogramaScreen';
import SimuladoScreen from './SimuladoScreen';

const ABAS = [
  { chave: 'timer', rotulo: 'Timer' },
  { chave: 'cronograma', rotulo: 'Cronograma' },
  { chave: 'simulado', rotulo: 'Simulado' },
];

// Troca de aba não anima: é conteúdo visto muitas vezes por sessão (mesma
// categoria de um seletor de segmento nativo), e abas são pares — deslizar
// implicaria uma hierarquia que não existe. Só o indicador da pílula desliza
// (SeletorPilulas), o conteúdo troca na hora.
export default function EstudarScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { aba: abaInicial } = useLocalSearchParams();
  const [aba, setAba] = useState(
    ABAS.some((a) => a.chave === abaInicial) ? abaInicial : 'timer',
  );

  return (
    <View style={styles.flex}>
      <CabecalhoVidro titulo="Estudar" subtitulo="Timer · Cronograma · Simulado" />
      <View style={styles.pilulas}>
        <SeletorPilulas abas={ABAS} ativa={aba} onSelecionar={setAba} />
      </View>
      <View style={styles.conteudo}>
        {aba === 'timer' && <TimerScreen />}
        {aba === 'cronograma' && <CronogramaScreen />}
        {aba === 'simulado' && <SimuladoScreen />}
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
