import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import ConfiguracoesScreen from '../src/screens/ConfiguracoesScreen';
import Cabecalho from '../src/components/Cabecalho';

export default function Configuracoes() {
  return (
    <View style={styles.flex}>
      <Cabecalho titulo="Configurações" aoVoltar={() => router.back()} />
      <ConfiguracoesScreen />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
