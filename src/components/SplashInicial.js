import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text } from 'react-native';

// splash com fade enquanto checa a sessão antes de ir pro Login/Início
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
    backgroundColor: '#0c131b',
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
