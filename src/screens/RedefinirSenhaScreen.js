import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { supabase } from '../supabaseClient';
import { extrairParametros } from '../lib/auth';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';
import CampoTexto from '../components/CampoTexto';
import Botao from '../components/Botao';

export default function RedefinirSenhaScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const urlAtual = Linking.useURL();

  const [estado, setEstado] = useState('verificando'); // verificando | pronto | invalido
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function preparar() {
      const url = urlAtual || (await Linking.getInitialURL());
      const params = extrairParametros(url || '');

      if (params.access_token && params.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (!cancelado) setEstado(error ? 'invalido' : 'pronto');
        return;
      }

      // sem tokens na URL: pode já ter uma sessão de recuperação ativa
      const { data } = await supabase.auth.getSession();
      if (!cancelado) setEstado(data.session ? 'pronto' : 'invalido');
    }

    preparar();
    return () => {
      cancelado = true;
    };
  }, [urlAtual]);

  async function salvar() {
    if (senha.length < 8) {
      Alert.alert('Senha curta', 'A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      Alert.alert('Senhas diferentes', 'A senha e a confirmação precisam ser iguais.');
      return;
    }

    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    Keyboard.dismiss();

    if (error) {
      Alert.alert('Não foi possível salvar', error.message);
      return;
    }
    Alert.alert('Senha alterada', 'Sua senha foi redefinida.', [
      { text: 'Continuar', onPress: () => router.replace('/') },
    ]);
  }

  return (
    <View style={styles.flex}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          bottomOffset={20}
        >
          <Text style={styles.titulo}>Redefinir senha</Text>

          {estado === 'verificando' && (
            <Text style={styles.aviso}>Verificando o link...</Text>
          )}

          {estado === 'invalido' && (
            <>
              <Text style={styles.aviso}>
                O link é inválido ou expirou. Peça um novo em &quot;Esqueci minha senha&quot;.
              </Text>
              <Botao
                titulo="Voltar ao login"
                onPress={async () => {
                  await supabase.auth.signOut();
                  router.replace('/');
                }}
                style={{ marginTop: 16 }}
              />
            </>
          )}

          {estado === 'pronto' && (
            <>
              <Text style={styles.aviso}>Escolha uma nova senha para a sua conta.</Text>
              <CampoTexto
                rotulo="Nova senha"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                returnKeyType="next"
              />
              <CampoTexto
                rotulo="Confirmar nova senha"
                secureTextEntry
                value={confirmar}
                onChangeText={setConfirmar}
                returnKeyType="done"
                onSubmitEditing={salvar}
              />
              <Botao
                titulo={salvando ? 'Salvando...' : 'Salvar nova senha'}
                onPress={salvar}
                disabled={salvando}
                style={{ marginTop: 8 }}
              />
            </>
          )}
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    titulo: {
      fontFamily: fontes.display,
      fontSize: 24,
      color: cores.texto,
      marginBottom: 12,
      textAlign: 'center',
    },
    aviso: {
      fontSize: 14,
      color: cores.textoSecundario,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 16,
    },
  });
}
