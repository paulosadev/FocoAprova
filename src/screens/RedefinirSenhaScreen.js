import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { supabase } from '../supabaseClient';
import { extrairParametros, consumirUrlRecuperacaoPendente, aoReceberUrlRecuperacao } from '../lib/auth';
import { mensagemErro } from '../lib/erros';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';
import CampoTexto from '../components/CampoTexto';
import Botao from '../components/Botao';

export default function RedefinirSenhaScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);

  const [estado, setEstado] = useState('verificando'); // verificando | pronto | invalido
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [debug, setDebug] = useState(null); // TEMP: diagnóstico do link

  useEffect(() => {
    let cancelado = false;

    async function processar(url) {
      const params = extrairParametros(url || '');
      const info = {
        url: url ?? '(null)',
        chaves: Object.keys(params).join(', ') || '(nenhuma)',
        error: params.error ?? '',
        error_code: params.error_code ?? '',
        error_description: params.error_description ?? '',
        temTokens: !!(params.access_token && params.refresh_token),
      };

      if (params.access_token && params.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        info.setSessionError = error?.message ?? '';
        if (!cancelado) {
          setDebug(info);
          setEstado(error ? 'invalido' : 'pronto');
        }
        return;
      }

      // sem tokens na URL: pode já ter uma sessão de recuperação ativa
      const { data } = await supabase.auth.getSession();
      info.sessaoExistente = !!data.session;
      if (!cancelado) {
        setDebug(info);
        setEstado(data.session ? 'pronto' : 'invalido');
      }
    }

    // a URL de recuperação é capturada em src/lib/auth.js desde a carga do
    // módulo (bem antes desta tela montar) — ler Linking direto aqui perdia
    // o evento sempre que o app já estava aberto em segundo plano, porque o
    // expo-router consumia esse mesmo evento pra navegar pra esta tela antes
    // do listener dela existir (era a causa do "link inválido ou expirou"
    // aparecer com um link válido).
    const pendente = consumirUrlRecuperacaoPendente();
    if (pendente) {
      processar(pendente);
      return () => {
        cancelado = true;
      };
    }

    // ainda não chegou (ex: o app abriu direto nesta rota antes do módulo de
    // auth processar o link) — espera a URL chegar, com um teto de segurança
    // pra não ficar preso em "Verificando..." se nunca vier nenhuma
    const remover = aoReceberUrlRecuperacao((url) => {
      clearTimeout(teto);
      remover();
      processar(url);
    });
    const teto = setTimeout(() => {
      remover();
      processar(null);
    }, 4000);

    return () => {
      cancelado = true;
      remover();
      clearTimeout(teto);
    };
  }, []);

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
      Alert.alert('Não foi possível salvar', mensagemErro(error));
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

              {!!debug && (
                <View style={styles.debugCaixa}>
                  <Text style={styles.debugTitulo}>debug do link</Text>
                  <Text style={styles.debugTexto} selectable>
                    url: {debug.url}
                    {'\n'}params: {debug.chaves}
                    {'\n'}temTokens: {String(debug.temTokens)}
                    {'\n'}error: {debug.error || '(nenhum)'}
                    {'\n'}error_code: {debug.error_code || '(nenhum)'}
                    {'\n'}error_description: {debug.error_description || '(nenhum)'}
                    {debug.sessaoExistente !== undefined
                      ? `\nsessaoExistente: ${debug.sessaoExistente}`
                      : ''}
                    {debug.setSessionError ? `\nsetSession: ${debug.setSessionError}` : ''}
                  </Text>
                </View>
              )}

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
    debugCaixa: {
      backgroundColor: cores.superficie2,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 8,
      padding: 12,
    },
    debugTitulo: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: cores.ambar,
      marginBottom: 6,
    },
    debugTexto: { fontSize: 11, color: cores.textoSecundario, lineHeight: 16 },
  });
}
