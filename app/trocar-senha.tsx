import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import TrocarSenhaScreen from '../src/screens/TrocarSenhaScreen';
import Cabecalho from '../src/components/Cabecalho';

export default function TrocarSenha() {
  return (
    <View style={styles.flex}>
      <Cabecalho titulo="Trocar senha" aoVoltar={() => router.back()} />
      <TrocarSenhaScreen />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
