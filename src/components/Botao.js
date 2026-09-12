import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { raio } from '../theme';
import { useTema } from '../context/ThemeContext';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export default function Botao({ titulo, onPress, variante = 'primario', disabled, style }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const ehPrimario = variante === 'primario';
  const escala = useSharedValue(1);

  // feedback no toque (não na soltura) — sutil, porque um botão é tocado
  // dezenas de vezes por dia; qualquer coisa maior chamaria atenção demais
  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ scale: escala.get() }] }));

  return (
    <Animated.View style={[estiloAnimado, style]}>
      <Pressable
        style={[styles.base, ehPrimario ? styles.primario : styles.secundario, disabled && styles.desabilitado]}
        onPressIn={() => {
          escala.set(withTiming(0.97, { duration: 100, easing: EASE_OUT }));
        }}
        onPressOut={() => {
          escala.set(withTiming(1, { duration: 120, easing: EASE_OUT }));
        }}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.texto, ehPrimario ? styles.textoPrimario : styles.textoSecundario]}>
          {titulo}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    base: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: raio.botao,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primario: {
      backgroundColor: cores.destaque,
    },
    secundario: {
      backgroundColor: cores.superficie2,
      borderWidth: 1,
      borderColor: cores.borda,
    },
    desabilitado: {
      opacity: 0.6,
    },
    texto: {
      fontWeight: '700',
      fontSize: 15,
      letterSpacing: 0.3,
    },
    textoPrimario: {
      color: cores.destaqueTexto,
    },
    textoSecundario: {
      color: cores.texto,
    },
  });
}
