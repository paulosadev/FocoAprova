import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';

// cabeçalho único e plano, usado por toda tela principal e sub-tela — troca
// os 3 estilos de cabeçalho que existiam antes (nativo do Drawer, o
// CabecalhoVidro com blur em Estudar/Revisar, e o back-chevron nativo das
// sub-telas). Como headerShown fica false em todo lugar agora, este
// componente também cuida do respiro da status bar (insets.top).
/**
 * @param {{
 *   titulo: string,
 *   subtitulo?: string,
 *   aoVoltar?: () => void,
 *   direita?: import('react').ReactNode,
 * }} props
 */
export default function Cabecalho({ titulo, subtitulo, aoVoltar, direita }) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const styles = criarEstilos(cores, insets.top);

  return (
    <View style={styles.container}>
      {aoVoltar && (
        <TouchableOpacity onPress={aoVoltar} hitSlop={10} style={styles.botaoLateral}>
          <Ionicons name="chevron-back" size={24} color={cores.textoSecundario} />
        </TouchableOpacity>
      )}
      <View style={styles.textos}>
        <Text style={styles.titulo} numberOfLines={1}>
          {titulo}
        </Text>
        {!!subtitulo && (
          <Text style={styles.subtitulo} numberOfLines={1}>
            {subtitulo}
          </Text>
        )}
      </View>
      {direita ? <View style={styles.botaoLateral}>{direita}</View> : null}
    </View>
  );
}

function criarEstilos(cores, topoSeguro) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingTop: topoSeguro + 12,
      paddingBottom: 13,
      paddingHorizontal: 16,
      backgroundColor: cores.superficie,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
      zIndex: 2,
    },
    botaoLateral: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    textos: { flex: 1, minWidth: 0 },
    titulo: { fontFamily: fontes.display, fontSize: 20, color: cores.texto, lineHeight: 24 },
    subtitulo: { fontSize: 11.5, color: cores.textoFraco, marginTop: 2 },
  });
}
