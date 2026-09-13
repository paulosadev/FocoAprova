import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTema } from '../context/ThemeContext';
import { registrarToastHost } from '../lib/toast';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const DURACAO_VISIVEL = 2600;

// host único, montado uma vez em app/_layout.tsx; chamado via mostrarToast()
// (src/lib/toast.js) de qualquer tela, sem precisar de hook ou contexto.
export default function ToastHost() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const reduzMovimento = useReducedMotion();
  const [item, setItem] = useState(null);
  const timeoutRef = useRef(null);

  const progresso = useSharedValue(0); // 0 = escondido, 1 = visível

  const esconder = useCallback(() => {
    progresso.set(
      reduzMovimento
        ? withTiming(0, { duration: 150, easing: EASE_OUT })
        : withTiming(0, { duration: 180, easing: EASE_OUT }),
    );
    setTimeout(() => setItem(null), 180);
  }, [progresso, reduzMovimento]);

  useEffect(() => {
    registrarToastHost((mensagem, tipo) => {
      clearTimeout(timeoutRef.current);
      setItem({ mensagem, tipo });
      progresso.set(
        reduzMovimento
          ? withTiming(1, { duration: 150, easing: EASE_OUT })
          : withSpring(1, { duration: 300, dampingRatio: 0.8 }),
      );
      timeoutRef.current = setTimeout(esconder, DURACAO_VISIVEL);
    });
    return () => clearTimeout(timeoutRef.current);
  }, [progresso, esconder, reduzMovimento]);

  const estiloAnimado = useAnimatedStyle(() => {
    if (reduzMovimento) {
      // reduzido: só opacidade, sem deslocamento nem escala
      return { opacity: progresso.get() };
    }
    return {
      opacity: progresso.get(),
      transform: [
        { translateY: (1 - progresso.get()) * 16 },
        { scale: 0.95 + progresso.get() * 0.05 },
      ],
    };
  });

  if (!item) return null;

  const ehErro = item.tipo === 'erro';
  const corIcone = ehErro ? cores.perigo : cores.sucesso;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrapper,
        { bottom: insets.bottom + 20, backgroundColor: cores.superficie2, borderColor: cores.borda },
        estiloAnimado,
      ]}
    >
      <Ionicons
        name={ehErro ? 'close-circle' : 'checkmark-circle'}
        size={18}
        color={corIcone}
        style={styles.icone}
      />
      <Text style={[styles.texto, { color: cores.texto }]} numberOfLines={2}>
        {item.mensagem}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  icone: { flexShrink: 0 },
  texto: { flex: 1, fontSize: 13.5, fontWeight: '600' },
});
