import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import TermosScreen from '../src/screens/TermosScreen';
import Cabecalho from '../src/components/Cabecalho';

export default function Termos() {
  return (
    <View style={styles.flex}>
      <Cabecalho titulo="Termos de Uso" aoVoltar={() => router.back()} />
      <TermosScreen />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
