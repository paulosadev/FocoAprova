import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';

// cabeçalho com vidro sutil (acabamento "Tátil"). Intensidade do blur é fixa
// — nunca anima BlurView, isso força um re-render caro do blur a cada frame.
export default function CabecalhoVidro({ titulo, subtitulo }) {
  const { cores, modoEfetivo } = useTema();
  const styles = criarEstilos(cores);
  return (
    <BlurView
      intensity={40}
      tint={modoEfetivo === 'light' ? 'light' : 'dark'}
      style={styles.container}
    >
      <View style={styles.tintaAmbar} pointerEvents="none" />
      <Text style={styles.titulo}>{titulo}</Text>
      {!!subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
    </BlurView>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: cores.borda,
      overflow: 'hidden',
    },
    tintaAmbar: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: cores.ambar,
      opacity: 0.05,
    },
    titulo: { fontFamily: fontes.display, fontSize: 22, color: cores.texto },
    subtitulo: { fontSize: 12, color: cores.textoFraco, marginTop: 2 },
  });
}
