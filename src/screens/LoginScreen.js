import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../supabaseClient';
import { entrarComGoogle, enviarResetSenha } from '../lib/auth';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';
import CampoTexto from '../components/CampoTexto';
import Botao from '../components/Botao';
import BotaoGoogle from '../components/BotaoGoogle';

export default function LoginScreen() {
  const { cores, modoEfetivo } = useTema();
  const styles = criarEstilos(cores);

  // 'inicio' = tela de boas-vindas; 'form' = login/cadastro
  const [etapa, setEtapa] = useState('inicio');
  const [modoCadastro, setModoCadastro] = useState(false);

  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);

  const logo =
    modoEfetivo === 'light'
      ? require('../../assets/logo/logo-mark-claro.png')
      : require('../../assets/logo/logo-mark-escuro.png');

  function abrirForm(cadastro) {
    setModoCadastro(cadastro);
    setEtapa('form');
  }

  async function handleGoogle() {
    setCarregandoGoogle(true);
    try {
      await entrarComGoogle();
      // sessão entra pelo onAuthStateChange do AuthContext
    } catch (erro) {
      Alert.alert('Erro no login com Google', erro?.message ?? 'Tente novamente.');
    } finally {
      setCarregandoGoogle(false);
    }
  }

  async function handleLogin() {
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) Alert.alert('Erro ao entrar', error.message);
  }

  async function handleEsqueciSenha() {
    if (!email.trim()) {
      Alert.alert('Digite seu e-mail', 'Preencha o campo de e-mail acima e toque de novo.');
      return;
    }
    try {
      await enviarResetSenha(email);
      Alert.alert(
        'E-mail enviado',
        'Se existir uma conta com esse e-mail, você vai receber um link para redefinir a senha.',
      );
    } catch (erro) {
      Alert.alert('Não foi possível enviar', erro?.message ?? 'Tente de novo em instantes.');
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
    if (senha.length < 8) {
      Alert.alert('Senha curta', 'A senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome: nome.trim(), sobrenome: sobrenome.trim() } },
    });
    setCarregando(false);

    if (error) {
      if (ehErroEmailJaExiste(error)) {
        avisarContaExistente();
        return;
      }
      Alert.alert('Erro ao cadastrar', error.message);
      return;
    }

    // com confirmação de e-mail ligada, o Supabase esconde que a conta já
    // existe devolvendo "sucesso" com a lista de identities vazia
    if (data?.user && (data.user.identities?.length ?? 0) === 0) {
      avisarContaExistente();
      return;
    }

    Alert.alert('Cadastro realizado', 'Verifique seu e-mail para confirmar a conta.');
  }

  function ehErroEmailJaExiste(error) {
    const msg = (error?.message || '').toLowerCase();
    return (
      error?.code === 'user_already_exists' ||
      error?.code === 'email_exists' ||
      msg.includes('already registered') ||
      msg.includes('already been registered') ||
      msg.includes('user already exists')
    );
  }

  function avisarContaExistente() {
    Alert.alert(
      'E-mail já cadastrado',
      'Esse e-mail já tem uma conta. Quer entrar em vez de cadastrar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Entrar',
          onPress: () => {
            setModoCadastro(false);
            setSenha('');
            setConfirmarSenha('');
            // o e-mail digitado continua no state e aparece já preenchido
          },
        },
      ],
    );
  }

  // ---------- Boas-vindas ----------
  if (etapa === 'inicio') {
    return (
      <View style={styles.flexCentro}>
        <View style={styles.miolo}>
          <Image source={logo} style={styles.logoGrande} resizeMode="contain" />
          <Text style={styles.marca}>FocoAprova</Text>
          <Text style={styles.tagline}>Sua rotina de estudos, organizada num só lugar</Text>
        </View>

        <View style={styles.acoes}>
          <Botao titulo="Entrar" onPress={() => abrirForm(false)} style={styles.botaoGrande} />
          <Botao
            titulo="Cadastrar"
            variante="secundario"
            onPress={() => abrirForm(true)}
            style={styles.botaoGrande}
          />
        </View>
      </View>
    );
  }

  // ---------- Login / Cadastro ----------
  return (
    <View style={styles.flex}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bottomOffset={20}
        >
          <TouchableOpacity
            style={styles.voltar}
            onPress={() => setEtapa('inicio')}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={22} color={cores.textoSecundario} />
            <Text style={styles.voltarTexto}>Voltar</Text>
          </TouchableOpacity>

          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.marca}>FocoAprova</Text>
          <Text style={styles.tagline}>Sua rotina de estudos, organizada num só lugar</Text>

          <View style={styles.abas}>
            <TouchableOpacity
              style={[styles.aba, !modoCadastro && styles.abaAtiva]}
              onPress={() => setModoCadastro(false)}
            >
              <Text style={[styles.abaTexto, !modoCadastro && styles.abaTextoAtivo]}>Entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.aba, modoCadastro && styles.abaAtiva]}
              onPress={() => setModoCadastro(true)}
            >
              <Text style={[styles.abaTexto, modoCadastro && styles.abaTextoAtivo]}>Cadastrar</Text>
            </TouchableOpacity>
          </View>

          {modoCadastro && (
            <>
              <CampoTexto
                rotulo="Nome"
                placeholder="Seu nome"
                value={nome}
                onChangeText={setNome}
                returnKeyType="next"
              />
              <CampoTexto
                rotulo="Sobrenome"
                placeholder="Seu sobrenome"
                value={sobrenome}
                onChangeText={setSobrenome}
                returnKeyType="next"
              />
            </>
          )}

          <CampoTexto
            rotulo="E-mail"
            placeholder="voce@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />
          <CampoTexto
            rotulo="Senha"
            placeholder="Sua senha"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          {modoCadastro && (
            <CampoTexto
              rotulo="Confirmar senha"
              placeholder="Repita a senha"
              secureTextEntry
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              returnKeyType="done"
              onSubmitEditing={handleCadastro}
            />
          )}

          {!modoCadastro && (
            <TouchableOpacity onPress={handleEsqueciSenha} hitSlop={8} style={styles.esqueci}>
              <Text style={styles.esqueciTexto}>Esqueci minha senha</Text>
            </TouchableOpacity>
          )}

          <Botao
            titulo={carregando ? 'Aguarde...' : modoCadastro ? 'Cadastrar' : 'Entrar'}
            onPress={modoCadastro ? handleCadastro : handleLogin}
            disabled={carregando}
            style={{ marginTop: 8 }}
          />

          <View style={styles.separador}>
            <View style={styles.linha} />
            <Text style={styles.separadorTexto}>ou</Text>
            <View style={styles.linha} />
          </View>

          <BotaoGoogle variante="icone" onPress={handleGoogle} carregando={carregandoGoogle} />
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    flexCentro: {
      flex: 1,
      backgroundColor: cores.fundo,
      padding: 24,
    },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: cores.fundo },

    miolo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    acoes: { gap: 12, paddingBottom: 8 },
    botaoGrande: { paddingVertical: 16 },

    logoGrande: { width: 96, height: 96, marginBottom: 20 },
    logo: { width: 72, height: 72, alignSelf: 'center', marginBottom: 10 },
    marca: {
      fontFamily: fontes.display,
      fontSize: 30,
      textAlign: 'center',
      color: cores.texto,
      letterSpacing: 0.4,
      marginBottom: 8,
    },
    tagline: {
      fontSize: 15,
      textAlign: 'center',
      color: cores.textoSecundario,
      lineHeight: 22,
      maxWidth: 260,
      alignSelf: 'center',
    },

    esqueci: { alignSelf: 'flex-end', paddingVertical: 6 },
    esqueciTexto: { color: cores.destaque, fontSize: 13 },

    voltar: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, alignSelf: 'flex-start' },
    voltarTexto: { color: cores.textoSecundario, fontSize: 14 },

    abas: {
      flexDirection: 'row',
      gap: 4,
      padding: 4,
      backgroundColor: cores.superficie2,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 11,
      marginTop: 16,
      marginBottom: 20,
    },
    aba: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 8 },
    abaAtiva: { backgroundColor: cores.destaque },
    abaTexto: { fontSize: 14, fontWeight: '600', color: cores.textoSecundario },
    abaTextoAtivo: { color: cores.destaqueTexto, fontWeight: '700' },

    separador: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
    linha: { flex: 1, height: 1, backgroundColor: cores.borda },
    separadorTexto: { color: cores.textoFraco, fontSize: 12 },
  });
}
