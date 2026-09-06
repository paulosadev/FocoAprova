import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTema, type Cores } from '../src/context/ThemeContext';
import LoginScreen from '../src/screens/LoginScreen';
import ObjetivoScreen from '../src/screens/ObjetivoScreen';
import SplashInicial from '../src/components/SplashInicial';

// mais cedo possível (antes de qualquer render): evita o flash cinza do
// windowBackground padrão do Android nas transições entre telas/splash
SystemUI.setBackgroundColorAsync('#0c131b');

function Conteudo() {
  const { session, profile, carregando } = useAuth();
  const { cores } = useTema();
  const styles = criarEstilos(cores);

  // splash controla o próprio tempo mínimo, evita piscar se a sessão carregar rápido demais
  const [splashTerminou, setSplashTerminou] = useState(false);

  if (!splashTerminou) {
    return <SplashInicial onTerminar={() => setSplashTerminou(true)} />;
  }

  if (carregando) {
    return <View style={styles.carregando} />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  // pergunta o objetivo só uma vez, depois objetivo_perguntado fica true
  if (profile && !profile.objetivo_perguntado) {
    return <ObjetivoScreen />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

function Portao() {
  const { modoEfetivo } = useTema();
  return (
    <>
      <StatusBar style={modoEfetivo === 'light' ? 'dark' : 'light'} />
      <Conteudo />
    </>
  );
}

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <ThemeProvider>
        <AuthProvider>
          <Portao />
        </AuthProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
    carregando: { flex: 1, backgroundColor: cores.fundo },
  });
}
