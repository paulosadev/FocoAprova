import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  useFonts,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTema, type Cores } from '../src/context/ThemeContext';
import { PreferenciasProvider } from '../src/context/PreferenciasContext';
import LoginScreen from '../src/screens/LoginScreen';
import ObjetivoScreen from '../src/screens/ObjetivoScreen';
import SplashInicial from '../src/components/SplashInicial';
import { garantirPermissaoNotificacao } from '../src/lib/notificacoes';

// mais cedo possível (antes de qualquer render): evita o flash cinza do
// windowBackground padrão do Android nas transições entre telas/splash
SystemUI.setBackgroundColorAsync('#0c131b');

function Conteudo() {
  const { session, profile, carregando } = useAuth();
  const { cores } = useTema();
  const styles = criarEstilos(cores);

  // fonte é cosmética: se falhar ou demorar, seguir com a fonte do sistema
  const [fontesCarregadas, fontesErro] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const fontesProntas = fontesCarregadas || !!fontesErro;

  // tempo mínimo de splash controlado aqui (Conteudo nunca desmonta), com
  // teto de segurança pra nunca travar se algo abaixo não resolver
  const [splashTerminou, setSplashTerminou] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSplashTerminou(true), 1400);
    return () => clearTimeout(t);
  }, []);
  const [tetoAtingido, setTetoAtingido] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTetoAtingido(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const pronto = splashTerminou && (tetoAtingido || (!carregando && fontesProntas));

  const precisaObjetivo = !!session && !!profile && !profile.objetivo_perguntado;
  const dentroDoApp = !!session && !!profile && !precisaObjetivo;

  // primeira entrada no app: pede permissão de notificação uma única vez
  useEffect(() => {
    if (dentroDoApp) garantirPermissaoNotificacao();
  }, [dentroDoApp]);

  if (!pronto) {
    return <SplashInicial />;
  }

  // O <Stack> fica SEMPRE montado — se desmontasse ao autenticar, o router
  // perderia a rota atual e a tela Início não voltaria. Login e Objetivo
  // entram como camadas por cima.
  return (
    <View style={styles.flex}>
      <Stack screenOptions={{ headerShown: false }} />
      {!session && (
        <View style={StyleSheet.absoluteFill}>
          <LoginScreen />
        </View>
      )}
      {precisaObjetivo && (
        <View style={StyleSheet.absoluteFill}>
          <ObjetivoScreen />
        </View>
      )}
    </View>
  );
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
        <PreferenciasProvider>
          <AuthProvider>
            <Portao />
          </AuthProvider>
        </PreferenciasProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
  });
}
