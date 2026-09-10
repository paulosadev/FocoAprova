import { View, StyleSheet } from 'react-native';
import { espacamento, raio, sombra } from '../theme';
import { useTema } from '../context/ThemeContext';

// card padrão: superfície elevada sobre o fundo, com sombra sutil pra dar
// profundidade entre camadas (fundo -> superficie -> superficie2)
export default function Cartao({ children, style, plano = false }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  return <View style={[styles.cartao, !plano && sombra.cartao, style]}>{children}</View>;
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
