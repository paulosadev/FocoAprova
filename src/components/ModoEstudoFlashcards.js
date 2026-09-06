import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTema } from '../context/ThemeContext';
import Botao from './Botao';

// tela cheia de estudo dos flashcards: um cartão por vez, vira ao tocar,
// depois de virado responde Acertei/Errei e avança pro próximo da fila.
export default function ModoEstudoFlashcards({ visivel, fila, onResponder, onFechar }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const [indice, setIndice] = useState(0);
  const [virado, setVirado] = useState(false);
  const [respondendo, setRespondendo] = useState(false);

  // reinicia a fila sempre que o modo de estudo é reaberto
  useEffect(() => {
    if (visivel) {
      setIndice(0);
      setVirado(false);
    }
  }, [visivel]);

  const total = fila.length;
  const terminou = indice >= total;
  const item = !terminou ? fila[indice] : null;

  async function responder(acertou) {
    if (!item || respondendo) return;
    setRespondendo(true);
    await onResponder(item, acertou);
    setRespondendo(false);
    setVirado(false);
    setIndice((i) => i + 1);
  }

  return (
    <Modal
      visible={visivel}
      animationType="fade"
      statusBarTranslucent
      presentationStyle="fullScreen"
      onRequestClose={onFechar}
    >
      <View style={styles.container}>
        <View style={styles.cabecalho}>
          <Text style={styles.progresso}>{!terminou ? `${indice + 1} de ${total}` : ' '}</Text>
          <TouchableOpacity onPress={onFechar} hitSlop={12}>
            <Text style={styles.fechar}>Fechar</Text>
          </TouchableOpacity>
        </View>

        {!terminou ? (
          <View style={styles.corpo}>
            {!!item?.disciplina_nome && (
              <Text style={styles.disciplina}>{item.disciplina_nome}</Text>
            )}
            <CartaoEstudo
              item={item}
              virado={virado}
              onVirar={() => setVirado((v) => !v)}
              styles={styles}
            />
            <View style={styles.controles}>
              {virado ? (
                <>
                  <Botao
                    titulo="Errei"
                    onPress={() => responder(false)}
                    variante="secundario"
                    disabled={respondendo}
                    style={{ flex: 1 }}
                  />
                  <Botao
                    titulo="Acertei"
                    onPress={() => responder(true)}
                    disabled={respondendo}
                    style={{ flex: 1 }}
                  />
                </>
              ) : (
                <Text style={styles.dicaBotoes}>Toque no cartão pra ver a resposta</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.fimContainer}>
            <Text style={styles.fimEmoji}>🎉</Text>
            <Text style={styles.fimTitulo}>Terminou!</Text>
            <Text style={styles.fimTexto}>Revisão de hoje concluída.</Text>
            <Botao
              titulo="Sair"
              onPress={onFechar}
              style={{ marginTop: 24, alignSelf: 'stretch' }}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

// as duas faces do cartão ficam empilhadas e viram em Y; backfaceVisibility
// esconde a face que estiver de costas em cada ângulo da animação
function CartaoEstudo({ item, virado, onVirar, styles }) {
  const animado = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animado, {
      toValue: virado ? 180 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [virado, animado]);

  const rotFrente = animado.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const rotVerso = animado.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onVirar} style={styles.cartaoToque}>
      <View style={styles.cartaoEmpilhado}>
        <Animated.View style={[styles.face, { transform: [{ rotateY: rotFrente }] }]}>
          <Text style={styles.rotuloFace}>Pergunta</Text>
          <Text style={styles.textoCartao}>{item.frente}</Text>
        </Animated.View>
        <Animated.View
          style={[styles.face, styles.faceVerso, { transform: [{ rotateY: rotVerso }] }]}
        >
          <Text style={styles.rotuloFace}>Resposta</Text>
          <Text style={styles.textoCartao}>{item.verso}</Text>
        </Animated.View>
      </View>
      <Text style={styles.dicaVirar}>
        Toque para {virado ? 'ver a pergunta' : 'ver a resposta'}
      </Text>
    </TouchableOpacity>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: cores.fundo, padding: 20 },
    cabecalho: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    progresso: {
      fontSize: 13,
      fontWeight: '700',
      color: cores.textoSecundario,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    fechar: { fontSize: 14, fontWeight: '600', color: cores.destaque },
    corpo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    disciplina: {
      fontSize: 12,
      color: cores.textoFraco,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 14,
    },
    cartaoToque: { width: '100%', alignItems: 'center' },
    cartaoEmpilhado: { width: '100%', height: 280 },
    face: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backfaceVisibility: 'hidden',
      backgroundColor: cores.superficie,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    faceVerso: { backgroundColor: cores.superficie2 },
    rotuloFace: {
      fontSize: 11,
      color: cores.textoFraco,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 14,
    },
    textoCartao: {
      fontSize: 20,
      fontWeight: '600',
      color: cores.texto,
      textAlign: 'center',
      lineHeight: 28,
    },
    dicaVirar: { fontSize: 12, color: cores.textoFraco, marginTop: 14, fontStyle: 'italic' },
    controles: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
      marginTop: 28,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dicaBotoes: { fontSize: 13, color: cores.textoFraco },
    fimContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
    fimEmoji: { fontSize: 48, marginBottom: 12 },
    fimTitulo: { fontSize: 22, fontWeight: '700', color: cores.texto, marginBottom: 6 },
    fimTexto: { fontSize: 14, color: cores.textoSecundario },
  });
}
