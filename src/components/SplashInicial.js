import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';

const COR_FUNDO = '#0c131b';
const { width: larguraTela, height: alturaTela } = Dimensions.get('window');

// só o visual do splash — o tempo mínimo é controlado por quem renderiza
// (app/_layout.tsx), pra não depender de callback de animação que pode não
// disparar em alguns aparelhos
export default function SplashInicial() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo/logo-mark-escuro.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.nome}>FocoAprova</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    ...(larguraTela && alturaTela ? { width: larguraTela, height: alturaTela } : null),
    backgroundColor: COR_FUNDO,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  nome: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
