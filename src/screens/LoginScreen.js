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
  Modal,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../supabaseClient';
import { entrarComGoogle, enviarResetSenha, redirectTo } from '../lib/auth';
import { useEstadoCidade } from '../lib/useEstadoCidade';
import { dataLocalISO } from '../lib/data';
import { apenasLetras } from '../lib/texto';
import { mensagemErro } from '../lib/erros';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';
import CampoTexto from '../components/CampoTexto';
import SeletorData from '../components/SeletorData';
import SeletorLista from '../components/SeletorLista';
import SeletorPilulas from '../components/SeletorPilulas';
import Botao from '../components/Botao';
import BotaoGoogle from '../components/BotaoGoogle';
import TermosScreen from './TermosScreen';

const ABAS_LOGIN = [
  { chave: 'entrar', rotulo: 'Entrar' },
  { chave: 'cadastrar', rotulo: 'Cadastrar' },
];

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const ENTRANDO = FadeIn.duration(220).easing(EASE_OUT);
const SAINDO = FadeOut.duration(150).easing(EASE_OUT);

export default function LoginScreen() {
  const { cores, modoEfetivo } = useTema();
  const styles = criarEstilos(cores);

  // 'inicio' = tela de boas-vindas; 'form' = login/cadastro
  const [etapa, setEtapa] = useState('inicio');
  const [modoCadastro, setModoCadastro] = useState(false);

  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [dataNascimento, setDataNascimento] = useState(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);

  // país/estado/cidade — Brasil é o padrão (app focado em concursos no BR);
  // fora disso vira texto livre e não mostra estado/cidade
  const [foraDoBrasil, setForaDoBrasil] = useState(false);
  const [paisLivre, setPaisLivre] = useState('');
  const {
    estados,
    carregandoEstados,
    estadoFallback,
    estadoLivre,
    setEstadoLivre,
    estadoSelecionado,
    selecionarEstado,
    cidades,
    carregandoCidades,
    cidadeFallback,
    cidade,
    setCidade,
  } = useEstadoCidade({ ativo: modoCadastro && !foraDoBrasil });

  const [termosAceitos, setTermosAceitos] = useState(false);
  const [termosVisivel, setTermosVisivel] = useState(false);

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
      Alert.alert('Erro no login com Google', mensagemErro(erro, 'Tente novamente.'));
    } finally {
      setCarregandoGoogle(false);
    }
  }

  async function handleLogin() {
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) Alert.alert('Erro ao entrar', mensagemErro(error));
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
      Alert.alert('Não foi possível enviar', mensagemErro(erro, 'Tente de novo em instantes.'));
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
    if (!dataNascimento) {
      Alert.alert('Falta a data de nascimento', 'Escolha sua data de nascimento para continuar.');
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
    if (foraDoBrasil && !paisLivre.trim()) {
      Alert.alert('Falta o país', 'Digite seu país para continuar.');
      return;
    }
    const uf = estadoFallback ? estadoLivre.trim() : estadoSelecionado?.sigla;
    if (!foraDoBrasil && !uf) {
      Alert.alert('Falta o estado', 'Escolha seu estado para continuar.');
      return;
    }
    if (!foraDoBrasil && !cidade.trim()) {
      Alert.alert('Falta a cidade', 'Escolha sua cidade para continuar.');
      return;
    }
    if (!termosAceitos) {
      Alert.alert('Aceite os Termos de Uso', 'Marque a caixa de aceite dos Termos de Uso para continuar.');
      return;
    }

    const dadosCadastro = {
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      data_nascimento: dataLocalISO(dataNascimento),
      termos_aceitos: true,
    };
    if (foraDoBrasil) {
      dadosCadastro.pais = paisLivre.trim();
    } else {
      dadosCadastro.pais = 'Brasil';
      dadosCadastro.estado = uf;
      dadosCadastro.cidade = cidade.trim();
    }

    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: dadosCadastro, emailRedirectTo: redirectTo },
    });
    setCarregando(false);

    if (error) {
      if (ehErroEmailJaExiste(error)) {
        avisarContaExistente();
        return;
      }
      Alert.alert('Erro ao cadastrar', mensagemErro(error));
      return;
    }

    // com confirmação de e-mail ligada, o Supabase esconde que a conta já
    // existe devolvendo "sucesso" com a lista de identities vazia
    if (data?.user && (data.user.identities?.length ?? 0) === 0) {
      avisarContaExistente();
      return;
    }

    Alert.alert('Cadastro realizado', 'Verifique seu e-mail para confirmar a conta.', [
      {
        text: 'OK',
        onPress: () => {
          setModoCadastro(false);
          setSenha('');
          setConfirmarSenha('');
          // o e-mail digitado continua no state e aparece já preenchido
        },
      },
    ]);
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
      <Animated.View style={styles.flexCentro} entering={ENTRANDO} exiting={SAINDO}>
        <View style={styles.miolo}>
          <Image source={logo} style={styles.logoGrande} resizeMode="contain" />
          <Text style={styles.marca}>FocoAprova</Text>
          <Text style={styles.tagline}>Sua rotina de estudos, organizada num só lugar</Text>
        </View>

        <View style={styles.acoes}>
          <Botao titulo="Entrar" onPress={() => abrirForm(false)} tamanho="grande" />
          <Botao
            titulo="Cadastrar"
            variante="secundario"
            onPress={() => abrirForm(true)}
            tamanho="grande"
          />
        </View>
      </Animated.View>
    );
  }

  // ---------- Login / Cadastro ----------
  return (
    <Animated.View style={styles.flex} entering={ENTRANDO} exiting={SAINDO}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bottomOffset={20}
        >
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.marcaPequena}>FocoAprova</Text>
          <Text style={styles.taglinePequena}>Sua rotina de estudos, organizada num só lugar</Text>

          <SeletorPilulas
            abas={ABAS_LOGIN}
            ativa={modoCadastro ? 'cadastrar' : 'entrar'}
            onSelecionar={(chave) => setModoCadastro(chave === 'cadastrar')}
            corIndicador="destaque"
            corTextoAtivo="destaqueTexto"
            style={styles.abas}
          />

          {modoCadastro && (
            <>
              <CampoTexto
                rotulo="Nome"
                obrigatorio={!nome.trim()}
                placeholder="Seu nome"
                value={nome}
                onChangeText={(t) => setNome(apenasLetras(t))}
                returnKeyType="next"
              />
              <CampoTexto
                rotulo="Sobrenome"
                obrigatorio={!sobrenome.trim()}
                placeholder="Seu sobrenome"
                value={sobrenome}
                onChangeText={(t) => setSobrenome(apenasLetras(t))}
                returnKeyType="next"
              />
              <SeletorData
                rotulo="Data de nascimento"
                obrigatorio={!dataNascimento}
                placeholder="Escolher data"
                valor={dataNascimento}
                onAlterar={setDataNascimento}
                minimo={new Date(1900, 0, 1)}
                maximo={new Date()}
              />

              {foraDoBrasil ? (
                <CampoTexto
                  rotulo="País"
                  obrigatorio={!paisLivre.trim()}
                  placeholder="Seu país"
                  value={paisLivre}
                  onChangeText={setPaisLivre}
                  returnKeyType="next"
                />
              ) : (
                <CampoTexto
                  rotulo="País"
                  value="Brasil"
                  editable={false}
                  inputStyle={{ opacity: 0.7 }}
                />
              )}

              {!foraDoBrasil && (
                <>
                  {estadoFallback ? (
                    <CampoTexto
                      rotulo="Estado"
                      obrigatorio={!estadoLivre.trim()}
                      placeholder="UF (ex: MA)"
                      autoCapitalize="characters"
                      maxLength={2}
                      value={estadoLivre}
                      onChangeText={setEstadoLivre}
                      returnKeyType="next"
                    />
                  ) : (
                    <SeletorLista
                      rotulo="Estado"
                      obrigatorio={!estadoSelecionado}
                      placeholder="Escolher estado"
                      valorExibido={estadoSelecionado?.nome}
                      carregando={carregandoEstados}
                      opcoes={estados.map((e) => ({ rotulo: e.nome, valor: e.sigla }))}
                      onSelecionar={selecionarEstado}
                    />
                  )}

                  {cidadeFallback || estadoFallback ? (
                    <CampoTexto
                      rotulo="Cidade"
                      obrigatorio={!cidade.trim()}
                      placeholder="Sua cidade"
                      value={cidade}
                      onChangeText={setCidade}
                      returnKeyType="next"
                    />
                  ) : (
                    <SeletorLista
                      rotulo="Cidade"
                      obrigatorio={!cidade.trim()}
                      placeholder={estadoSelecionado ? 'Escolher cidade' : 'Escolha um estado primeiro'}
                      valorExibido={cidade}
                      desabilitado={!estadoSelecionado}
                      carregando={carregandoCidades}
                      opcoes={cidades.map((c) => ({ rotulo: c.nome, valor: c.nome }))}
                      onSelecionar={(opcao) => setCidade(opcao.valor)}
                    />
                  )}
                </>
              )}

              <TouchableOpacity
                onPress={() => setForaDoBrasil((v) => !v)}
                hitSlop={8}
                style={styles.linkForaDoBrasil}
              >
                <Text style={styles.linkForaDoBrasilTexto}>
                  {foraDoBrasil ? 'Sou do Brasil' : 'Não mora no Brasil?'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <CampoTexto
            rotulo="E-mail"
            obrigatorio={!email.trim()}
            placeholder="voce@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />
          <CampoTexto
            rotulo="Senha"
            obrigatorio={!senha}
            placeholder="Sua senha"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          {modoCadastro && (
            <>
              <CampoTexto
                rotulo="Confirmar senha"
                obrigatorio={!confirmarSenha}
                placeholder="Repita a senha"
                secureTextEntry
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                returnKeyType="done"
                onSubmitEditing={handleCadastro}
              />

              <TouchableOpacity
                style={styles.linhaTermos}
                onPress={() => setTermosAceitos((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, termosAceitos && styles.checkboxMarcado]}>
                  {termosAceitos && <Ionicons name="checkmark" size={13} color={cores.destaqueTexto} />}
                </View>
                <Text style={styles.textoTermos}>
                  Li e aceito os{' '}
                  <Text style={styles.linkTermos} onPress={() => setTermosVisivel(true)}>
                    Termos de Uso
                  </Text>
                </Text>
              </TouchableOpacity>
            </>
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

      <Modal
        visible={termosVisivel}
        animationType="slide"
        onRequestClose={() => setTermosVisivel(false)}
      >
        <View style={styles.flex}>
          <View style={styles.headerTermos}>
            <TouchableOpacity onPress={() => setTermosVisivel(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={cores.texto} />
            </TouchableOpacity>
            <Text style={styles.tituloHeaderTermos}>Termos de Uso</Text>
            <View style={{ width: 24 }} />
          </View>
          <TermosScreen />
        </View>
      </Modal>
    </Animated.View>
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
    acoes: { gap: 10, paddingBottom: 8 },

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
    marcaPequena: {
      fontFamily: fontes.display,
      fontSize: 19,
      textAlign: 'center',
      color: cores.texto,
      letterSpacing: 0.3,
      marginBottom: 4,
    },
    taglinePequena: {
      fontSize: 13,
      textAlign: 'center',
      color: cores.textoSecundario,
      lineHeight: 18,
      maxWidth: 230,
      alignSelf: 'center',
      marginBottom: 4,
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

    linkForaDoBrasil: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 8 },
    linkForaDoBrasilTexto: { color: cores.destaque, fontSize: 12.5 },

    linhaTermos: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 2, marginBottom: 14 },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: cores.borda,
      backgroundColor: cores.superficie2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    checkboxMarcado: { backgroundColor: cores.destaque, borderColor: cores.destaque },
    textoTermos: { flex: 1, fontSize: 13, color: cores.textoSecundario, lineHeight: 18 },
    linkTermos: { color: cores.destaque, fontWeight: '700' },

    headerTermos: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: cores.borda,
    },
    tituloHeaderTermos: { fontSize: 16, fontWeight: '700', color: cores.texto },

    abas: {
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 11,
      marginTop: 14,
      marginBottom: 18,
    },

    separador: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
    linha: { flex: 1, height: 1, backgroundColor: cores.borda },
    separadorTexto: { color: cores.textoFraco, fontSize: 12 },
  });
}
