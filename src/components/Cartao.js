import { View, StyleSheet } from 'react-native';
import { espacamento, raio } from '../theme';
import { useTema } from '../context/ThemeContext';

export default function Cartao({ children, style }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  return <View style={[styles.cartao, style]}>{children}</View>;
}

function criarEstilos(cores) {
  return StyleSheet.create({
    cartao: {
      backgroundColor: cores.superficie,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: raio.padrao,
      padding: espacamento.medio,
      marginBottom: espacamento.medio,
    },
  });
}
