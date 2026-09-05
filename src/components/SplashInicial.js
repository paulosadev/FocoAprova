import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text } from 'react-native';

const COR_FUNDO = '#0c131b';
const { width: larguraTela, height: alturaTela } = Dimensions.get('window');

// splash com fade enquanto checa a sessão antes de ir pro Login/Início
// a cor de fundo nativa (windowBackground) é configurada em app/_layout.tsx
// e no app.json (expo-system-ui), pra cobrir o app inteiro, não só aqui
export default function SplashInicial({ onTerminar }) {
  const opacidade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const tempoMinimo = setTimeout(() => {
      Animated.timing(opacidade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onTerminar());
    }, 1500);

    return () => clearTimeout(tempoMinimo);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: opacidade }]}>
      <Image
        source={require('../../assets/logo/logo-mark-escuro.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.nome}>FocoAprova</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    // porcentagem + pixels absolutos (Dimensions) juntos: se o container pai
    // não tiver altura definida no edge-to-edge, o '100%' sozinho não cobre a tela
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
