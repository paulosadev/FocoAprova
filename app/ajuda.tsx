import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AjudaScreen from '../src/screens/AjudaScreen';
import Cabecalho from '../src/components/Cabecalho';

export default function Ajuda() {
  return (
    <View style={styles.flex}>
      <Cabecalho titulo="Ajuda" aoVoltar={() => router.back()} />
      <AjudaScreen />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
