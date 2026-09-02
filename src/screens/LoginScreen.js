import { useState } from 'react';
import {
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { useTema } from '../context/ThemeContext';
import CampoTexto from '../components/CampoTexto';
import Botao from '../components/Botao';

export default function LoginScreen() {
  const { cores, modoEfetivo } = useTema();
  const styles = criarEstilos(cores);
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [modoCadastro, setModoCadastro] = useState(false);

  async function handleLogin() {
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setCarregando(false);

    if (error) {
      Alert.alert('Erro ao entrar', error.message);
    }
  }

  async function handleCadastro() {
    if (!nome.trim()) {
      Alert.alert('Falta o nome', 'Digite seu nome para continuar.');
      return;
    }
    if (!sobrenome.trim()) {
      Alert.alert('Falta o sobrenome', 'Digite seu sobrenome para continuar.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Senhas diferentes', 'A senha e a confirmação precisam ser iguais.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Senha curta', 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome: nome.trim(),
          sobrenome: sobrenome.trim(),
        },
      },
    });
    setCarregando(false);

    if (error) {
      Alert.alert('Erro ao cadastrar', error.message);
    } else {
      Alert.alert('Cadastro realizado', 'Verifique seu e-mail para confirmar a conta.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Image
            source={
              modoEfetivo === 'light'
                ? require('../../assets/logo/logo-mark-claro.png')
                : require('../../assets/logo/logo-mark-escuro.png')
            }
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.marca}>FocoAprova</Text>
          <Text style={styles.subtitulo}>{modoCadastro ? 'Criar conta' : 'Entrar na conta'}</Text>

          {modoCadastro && (
            <>
              <CampoTexto
                placeholder="Nome"
                value={nome}
                onChangeText={setNome}
                returnKeyType="next"
              />
              <CampoTexto
                placeholder="Sobrenome"
                value={sobrenome}
                onChangeText={setSobrenome}
                returnKeyType="next"
              />
            </>
          )}

          <CampoTexto
            placeholder="E-mail"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />

          <CampoTexto placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />

          {modoCadastro && (
            <CampoTexto
              placeholder="Confirmar senha"
              secureTextEntry
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              returnKeyType="done"
              onSubmitEditing={handleCadastro}
            />
          )}

          <Botao
            titulo={carregando ? 'Aguarde...' : modoCadastro ? 'Cadastrar' : 'Entrar'}
            onPress={modoCadastro ? handleCadastro : handleLogin}
            disabled={carregando}
            style={{ marginTop: 8 }}
          />

          <TouchableOpacity onPress={() => setModoCadastro(!modoCadastro)}>
            <Text style={styles.link}>
              {modoCadastro ? 'Já tenho conta. Entrar' : 'Não tenho conta. Cadastrar'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
      backgroundColor: cores.fundo,
    },
    logo: {
      width: 184,
      height: 184,
      alignSelf: 'center',
      marginBottom: 12,
    },
    marca: {
      fontSize: 30,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 4,
      color: cores.texto,
      letterSpacing: 0.5,
    },
    subtitulo: {
      fontSize: 15,
      textAlign: 'center',
      color: cores.textoSecundario,
      marginBottom: 28,
    },
    link: {
      textAlign: 'center',
      color: cores.destaque,
      marginTop: 18,
      fontSize: 14,
    },
  });
}
