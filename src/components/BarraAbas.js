import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTema } from '../context/ThemeContext';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

// 5 posições visuais — a do meio (Estudar) não é uma aba igual às outras: é
// um atalho pra rota "estudar" (que tem suas próprias sub-abas Timer/
// Cronograma/Simulado — não é só o timer), estilizado como FAB elevado,
// igual ao mockup aprovado.
const ITENS = [
  { rota: 'index', rotulo: 'Início', icone: 'home-outline', iconeAtivo: 'home' },
  { rota: 'revisar', rotulo: 'Revisar', icone: 'albums-outline', iconeAtivo: 'albums' },
  { rota: 'estudar', rotulo: 'Estudar', icone: 'book-outline', iconeAtivo: 'book', fab: true },
  { rota: 'progresso', rotulo: 'Progresso', icone: 'stats-chart-outline', iconeAtivo: 'stats-chart' },
  { rota: 'perfil', rotulo: 'Perfil', icone: 'person-outline', iconeAtivo: 'person' },
];

export default function BarraAbas({ state, navigation, insets }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores, insets.bottom);

  return (
    <View style={styles.barra}>
      {ITENS.map((item) => {
        const indiceRota = state.routes.findIndex((r) => r.name === item.rota);
        if (indiceRota === -1) return null;
        const rota = state.routes[indiceRota];
        const focado = state.index === indiceRota;

        function aoPressionar() {
          const evento = navigation.emit({ type: 'tabPress', target: rota.key, canPreventDefault: true });
          if (!focado && !evento.defaultPrevented) {
            navigation.navigate(rota.name);
          }
        }

        if (item.fab) {
          return (
            <BotaoFab
              key={rota.key}
              focado={focado}
              icone={focado ? item.iconeAtivo : item.icone}
              rotulo={item.rotulo}
              onPress={aoPressionar}
              cores={cores}
              styles={styles}
            />
          );
        }

        return (
          <Pressable key={rota.key} onPress={aoPressionar} style={styles.item} hitSlop={4}>
            <Ionicons
              name={focado ? item.iconeAtivo : item.icone}
              size={21}
              color={focado ? cores.destaque : cores.textoSecundario}
            />
            <Text style={[styles.rotuloItem, focado && styles.rotuloItemAtivo]}>{item.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function BotaoFab({ focado, icone, rotulo, onPress, cores, styles }) {
  const escala = useSharedValue(1);
  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ scale: escala.get() }] }));

  return (
    <View style={styles.itemFabWrap}>
      <Pressable
        onPress={onPress}
        onPressIn={() => escala.set(withTiming(0.92, { duration: 100, easing: EASE_OUT }))}
        onPressOut={() => escala.set(withTiming(1, { duration: 120, easing: EASE_OUT }))}
        hitSlop={4}
      >
        <Animated.View style={[styles.fab, estiloAnimado]}>
          <Ionicons name={icone} size={24} color={cores.ambarTexto} />
        </Animated.View>
        <Text style={[styles.rotuloItem, styles.rotuloFab]}>{rotulo}</Text>
      </Pressable>
    </View>
  );
}

function criarEstilos(cores, embaixoSeguro) {
  return StyleSheet.create({
    barra: {
      flexDirection: 'row',
      backgroundColor: cores.superficie,
      paddingBottom: embaixoSeguro,
      overflow: 'visible',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingTop: 8,
      paddingBottom: 6,
    },
    rotuloItem: { fontSize: 10.5, fontWeight: '600', color: cores.textoSecundario },
    rotuloItemAtivo: { color: cores.destaque },
    itemFabWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 6,
    },
    fab: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: cores.ambar,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginTop: -22,
      shadowColor: cores.ambar,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
    rotuloFab: { color: cores.ambar, textAlign: 'center', marginTop: 4 },
  });
}
