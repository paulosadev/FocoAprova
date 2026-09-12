import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTema } from '../context/ThemeContext';
import CampoTexto from './CampoTexto';
import Botao from './Botao';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

// modal exibido ao marcar uma disciplina como estudada, perguntando o assunto.
// "Pular" marca sem anotar nada, "Salvar" marca e guarda o texto.
//
// Entrada: caixa em scale(0.95)+opacity, spring "sheet" (~300ms percebido);
// fundo só em opacity. animationType do Modal fica 'none' porque somos nós
// que animamos as duas camadas — coordenadas, na mesma "batida".
export default function ModalAssuntoEstudado({ visivel, onPular, onSalvar }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const [texto, setTexto] = useState('');
  const [montado, setMontado] = useState(visivel);
  const reduzMovimento = useReducedMotion();

  const progresso = useSharedValue(visivel ? 1 : 0);

  useEffect(() => {
    if (visivel) {
      setTexto('');
      setMontado(true);
      progresso.set(
        reduzMovimento
          ? withTiming(1, { duration: 150, easing: EASE_OUT })
          : withSpring(1, { duration: 300, dampingRatio: 0.8 }),
      );
    } else {
      progresso.set(withTiming(0, { duration: 180, easing: EASE_OUT }));
      // some do modal nativo só depois da animação de saída terminar
      const t = setTimeout(() => setMontado(false), 180);
      return () => clearTimeout(t);
    }
  }, [visivel]);

  const estiloFundo = useAnimatedStyle(() => ({ opacity: progresso.get() * 0.5 }));
  const estiloCaixa = useAnimatedStyle(() =>
    reduzMovimento
      ? { opacity: progresso.get() }
      : {
          opacity: progresso.get(),
          transform: [{ scale: 0.95 + progresso.get() * 0.05 }],
        },
  );

  if (!montado) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onPular}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View style={[styles.fundo, estiloFundo]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.caixa, estiloCaixa]}>
              <Text style={styles.titulo}>O que você estudou?</Text>
              <CampoTexto
                placeholder="Ex: Verbos irregulares"
                value={texto}
                onChangeText={setTexto}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => onSalvar(texto)}
              />
              <Animated.View style={styles.linhaBotoes}>
                <Botao titulo="Pular" onPress={onPular} variante="secundario" style={{ flex: 1 }} />
                <Botao titulo="Salvar" onPress={() => onSalvar(texto)} style={{ flex: 1 }} />
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    fundo: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      padding: 24,
    },
    caixa: {
      backgroundColor: cores.superficie,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 12,
      padding: 20,
    },
    titulo: { fontSize: 16, fontWeight: '700', color: cores.texto, marginBottom: 14 },
    linhaBotoes: { flexDirection: 'row', gap: 10, marginTop: 4 },
  });
}
