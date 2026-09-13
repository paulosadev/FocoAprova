import { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Ionicons from '@expo/vector-icons/Ionicons';
import { raio } from '../theme';
import { useTema } from '../context/ThemeContext';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

// campo que abre uma lista pesquisável em modal (mesma casca de
// ModalAssuntoEstudado: fundo esmaecido + folha com spring de entrada).
// opcoes: [{ rotulo, valor }]. onSelecionar recebe a opção inteira, pra quem
// chama decidir o que guardar (ex: sigla do estado) e o que exibir.
export default function SeletorLista({
  rotulo,
  obrigatorio,
  valorExibido,
  placeholder = 'Selecionar',
  opcoes,
  onSelecionar,
  desabilitado,
  carregando,
}) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [busca, setBusca] = useState('');
  const reduzMovimento = useReducedMotion();
  const progresso = useSharedValue(0);

  useEffect(() => {
    if (aberto) {
      setBusca('');
      setMontado(true);
      progresso.set(
        reduzMovimento
          ? withTiming(1, { duration: 150, easing: EASE_OUT })
          : withSpring(1, { duration: 300, dampingRatio: 0.8 }),
      );
    } else {
      progresso.set(withTiming(0, { duration: 180, easing: EASE_OUT }));
      const t = setTimeout(() => setMontado(false), 180);
      return () => clearTimeout(t);
    }
  }, [aberto]);

  const opcoesFiltradas = useMemo(() => {
    if (!busca.trim()) return opcoes;
    const alvo = busca.trim().toLowerCase();
    return opcoes.filter((o) => o.rotulo.toLowerCase().includes(alvo));
  }, [busca, opcoes]);

  const estiloFundo = useAnimatedStyle(() => ({ opacity: progresso.get() * 0.5 }));
  const estiloFolha = useAnimatedStyle(() =>
    reduzMovimento
      ? { opacity: progresso.get() }
      : {
          opacity: progresso.get(),
          transform: [{ translateY: (1 - progresso.get()) * 24 }],
        },
  );

  const travado = desabilitado || carregando;

  return (
    <View style={styles.grupo}>
      {!!rotulo && (
        <Text style={styles.rotulo}>
          {rotulo}
          {obrigatorio ? <Text style={{ color: cores.perigo }}> *</Text> : null}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.campo, travado && styles.campoDesabilitado]}
        onPress={() => !travado && setAberto(true)}
        activeOpacity={0.7}
        disabled={travado}
      >
        {carregando ? (
          <>
            <ActivityIndicator size="small" color={cores.textoFraco} />
            <Text style={[styles.valor, styles.placeholder, { marginLeft: 8 }]}>Carregando...</Text>
          </>
        ) : (
          <Text style={[styles.valor, !valorExibido && styles.placeholder]} numberOfLines={1}>
            {valorExibido || placeholder}
          </Text>
        )}
        {!carregando && (
          <Ionicons name="chevron-down" size={18} color={cores.textoFraco} />
        )}
      </TouchableOpacity>

      {montado && (
        <Modal visible transparent animationType="none" onRequestClose={() => setAberto(false)}>
          {/* fundo e folha são IRMÃOS, não um dentro do outro — a opacidade de
              View em RN é de grupo: se a folha ficasse dentro do fundo (que
              anima só até 0.5), ela herdaria esse teto e nunca ficaria opaca,
              deixando o formulário "vazar" por trás. */}
          <View style={styles.raizModal}>
            <TouchableWithoutFeedback onPress={() => setAberto(false)}>
              <Animated.View style={[styles.fundo, estiloFundo]} />
            </TouchableWithoutFeedback>

            <KeyboardAvoidingView
              style={styles.ancoraFolha}
              pointerEvents="box-none"
              behavior="padding"
            >
              <TouchableWithoutFeedback>
                <Animated.View style={[styles.folha, estiloFolha]}>
                  <Text style={styles.tituloFolha}>{rotulo || 'Selecionar'}</Text>
                  <TextInput
                    placeholder="Buscar..."
                    placeholderTextColor={cores.textoFraco}
                    value={busca}
                    onChangeText={setBusca}
                    style={styles.busca}
                    autoFocus
                  />
                  <FlatList
                    data={opcoesFiltradas}
                    keyExtractor={(item) => item.valor}
                    keyboardShouldPersistTaps="handled"
                    style={styles.lista}
                    ListEmptyComponent={
                      <Text style={styles.vazio}>Nada encontrado.</Text>
                    }
                    renderItem={({ item }) => {
                      const ativo = item.rotulo === valorExibido;
                      return (
                        <TouchableOpacity
                          style={[styles.item, ativo && styles.itemAtivo]}
                          onPress={() => {
                            onSelecionar(item);
                            setAberto(false);
                          }}
                        >
                          <Text style={[styles.itemTexto, ativo && styles.itemTextoAtivo]}>
                            {item.rotulo}
                          </Text>
                          {ativo && <Ionicons name="checkmark" size={18} color={cores.destaque} />}
                        </TouchableOpacity>
                      );
                    }}
                  />
                </Animated.View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      )}
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    grupo: { marginBottom: 12 },
    rotulo: {
      fontSize: 11,
      color: cores.textoFraco,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    campo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: raio.pequeno,
      padding: 12,
      backgroundColor: cores.superficie2,
    },
    campoDesabilitado: { opacity: 0.6 },
    valor: { fontSize: 15, color: cores.texto, flexShrink: 1 },
    placeholder: { color: cores.textoFraco },

    raizModal: { flex: 1 },
    fundo: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000',
    },
    ancoraFolha: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    folha: {
      backgroundColor: cores.superficie,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
      paddingBottom: 32,
      maxHeight: '75%',
    },
    tituloFolha: { fontSize: 16, fontWeight: '700', color: cores.texto, marginBottom: 14 },
    busca: {
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: raio.pequeno,
      padding: 12,
      fontSize: 15,
      color: cores.texto,
      backgroundColor: cores.superficie2,
      marginBottom: 10,
    },
    lista: { flexGrow: 0 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 13,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: cores.borda,
    },
    itemAtivo: { backgroundColor: cores.superficie2 },
    itemTexto: { fontSize: 15, color: cores.texto },
    itemTextoAtivo: { fontWeight: '700', color: cores.destaque },
    vazio: { color: cores.textoFraco, textAlign: 'center', paddingVertical: 20 },
  });
}
