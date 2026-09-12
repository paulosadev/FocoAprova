import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTema } from '../context/ThemeContext';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

// seletor de abas em pílula (acabamento "Tátil" aprovado no protótipo):
// pílula âmbar "levantada" desliza atrás da aba ativa. É um toque discreto
// (não um gesto contínuo), então a faixa anima com timing, não spring — e a
// TROCA DE CONTEÚDO das abas em si não anima (ver EstudarScreen/RevisarScreen).
export default function SeletorPilulas({ abas, ativa, onSelecionar }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const layoutsRef = useRef({});
  const reduzMovimento = useReducedMotion();

  const indicadorX = useSharedValue(0);
  const indicadorLargura = useSharedValue(0);
  const pronto = useSharedValue(0);

  function medir(chave, evento) {
    const { x, width } = evento.nativeEvent.layout;
    layoutsRef.current[chave] = { x, width };
    if (chave === ativa) posicionar(chave, pronto.get() === 1);
  }

  function posicionar(chave, animar) {
    const layout = layoutsRef.current[chave];
    if (!layout) return;
    if (animar && !reduzMovimento) {
      indicadorX.set(withTiming(layout.x, { duration: 200, easing: EASE_OUT }));
      indicadorLargura.set(withTiming(layout.width, { duration: 200, easing: EASE_OUT }));
    } else {
      indicadorX.set(layout.x);
      indicadorLargura.set(layout.width);
      pronto.set(1);
    }
  }

  useEffect(() => {
    posicionar(ativa, pronto.get() === 1);
  }, [ativa]);

  const estiloIndicador = useAnimatedStyle(() => ({
    transform: [{ translateX: indicadorX.get() }],
    width: indicadorLargura.get(),
  }));

  return (
    <View style={styles.trilha}>
      <Animated.View style={[styles.indicador, estiloIndicador]} />
      {abas.map((aba) => {
        const ativaAgora = aba.chave === ativa;
        return (
          <Pressable
            key={aba.chave}
            style={styles.botao}
            onLayout={(e) => medir(aba.chave, e)}
            onPress={() => onSelecionar(aba.chave)}
            hitSlop={4}
          >
            <Text style={[styles.rotulo, ativaAgora && styles.rotuloAtivo]}>{aba.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    trilha: {
      flexDirection: 'row',
      backgroundColor: cores.superficie2,
      borderRadius: 16,
      padding: 4,
      position: 'relative',
    },
    indicador: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      left: 0,
      borderRadius: 12,
      backgroundColor: cores.ambar,
      shadowColor: cores.ambar,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
      elevation: 3,
    },
    botao: {
      flex: 1,
      paddingVertical: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rotulo: { fontSize: 12.5, fontWeight: '700', color: cores.textoSecundario },
    rotuloAtivo: { color: cores.ambarTexto },
  });
}
