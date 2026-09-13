import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import TrocarEmailScreen from '../src/screens/TrocarEmailScreen';
import Cabecalho from '../src/components/Cabecalho';

export default function TrocarEmail() {
  return (
    <View style={styles.flex}>
      <Cabecalho titulo="Trocar e-mail" aoVoltar={() => router.back()} />
      <TrocarEmailScreen />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
