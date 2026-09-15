import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import AceitarTermosScreen from '../src/screens/AceitarTermosScreen';
import SplashInicial from '../src/components/SplashInicial';
import ToastHost from '../src/components/Toast';
import { garantirPermissaoNotificacao } from '../src/lib/notificacoes';

// mais cedo possível (antes de qualquer render): evita o flash cinza do
// windowBackground padrão do Android nas transições entre telas/splash
SystemUI.setBackgroundColorAsync('#0c131b');

function Conteudo() {
  const { session, profile, carregando } = useAuth();
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const pathname = usePathname();
  const naRedefinicaoDeSenha = pathname === '/redefinir-senha';

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

  // login via Google não passa pelo checkbox de aceite do cadastro por
  // e-mail, então esse portão cobre esse caso — fica sempre antes do Objetivo
  const precisaAceitarTermos = !!session && !!profile && !profile.termos_aceitos_em;
  const precisaObjetivo =
    !!session && !!profile && !precisaAceitarTermos && !profile.objetivo_perguntado;
  const dentroDoApp = !!session && !!profile && !precisaAceitarTermos && !precisaObjetivo;

  // primeira entrada no app: pede permissão de notificação uma única vez
  useEffect(() => {
    if (dentroDoApp) garantirPermissaoNotificacao();
  }, [dentroDoApp]);

  // a Stack fica sempre montada (ver comentário abaixo), então sem isso, sair
  // da conta e logar de novo volta pra última tela visitada (ex: Configurações)
  // em vez de Início — reseta a navegação sempre que uma sessão nova começa.
  // Só dispara depois que `pronto` vira true (Stack já montada) — navegar
  // antes disso quebra o expo-router ("Attempted to navigate before mounting
  // the Root Layout"), o que pode derrubar e reiniciar o app em loop, travando
  // no splash pra sempre.
  const sessaoAnteriorRef = useRef(session);
  useEffect(() => {
    if (!pronto) return;
    const acabouDeLogar = !sessaoAnteriorRef.current && !!session;
    sessaoAnteriorRef.current = session;
    if (acabouDeLogar) router.replace('/');
  }, [session, pronto]);

  if (!pronto) {
    return <SplashInicial />;
  }

  // O <Stack> fica SEMPRE montado — se desmontasse ao autenticar, o router
  // perderia a rota atual e a tela Início não voltaria. Login e Objetivo
  // entram como camadas por cima.
  return (
    <View style={styles.flex}>
      <Stack screenOptions={{ headerShown: false }} />
      {!session && !naRedefinicaoDeSenha && (
        // fundo opaco na camada de fora (nunca anima) — LoginScreen faz fade
        // de entrada por dentro, e sem isso a tela de Início (sempre montada
        // no Stack por baixo) fica visível por um instante durante o fade
        <View style={[StyleSheet.absoluteFill, { backgroundColor: cores.fundo }]}>
          <LoginScreen />
        </View>
      )}
      {precisaAceitarTermos && !naRedefinicaoDeSenha && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: cores.fundo }]}>
          <AceitarTermosScreen />
        </View>
      )}
      {precisaObjetivo && !naRedefinicaoDeSenha && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: cores.fundo }]}>
          <ObjetivoScreen />
        </View>
      )}
      <ToastHost />
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
    <SafeAreaProvider>
      <KeyboardProvider>
        <ThemeProvider>
          <PreferenciasProvider>
            <AuthProvider>
              <Portao />
            </AuthProvider>
          </PreferenciasProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
  });
}
