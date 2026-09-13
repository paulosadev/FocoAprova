import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';
import Cartao from '../components/Cartao';
import Botao from '../components/Botao';
import Cabecalho from '../components/Cabecalho';
import CampoTexto from '../components/CampoTexto';
import SeletorData from '../components/SeletorData';
import SeletorLista from '../components/SeletorLista';
import { dataLocalISO, dataISOParaBR, diasRestantes } from '../lib/data';
import { apenasLetras } from '../lib/texto';
import { mensagemErro } from '../lib/erros';
import { useEstadoCidade } from '../lib/useEstadoCidade';

function isoParaData(iso) {
  return iso ? new Date(`${iso}T00:00:00`) : null;
}

const CATEGORIAS = [
  { valor: 'concurso', rotulo: 'Concurso' },
  { valor: 'faculdade', rotulo: 'Faculdade' },
  { valor: 'ensino_medio', rotulo: 'Ensino médio' },
  { valor: 'curso', rotulo: 'Curso' },
  { valor: 'outro', rotulo: 'Outro' },
];

function rotuloCategoria(valor) {
  const encontrada = CATEGORIAS.find((c) => c.valor === valor);
  return encontrada ? encontrada.rotulo : null;
}

function cidadeEstado(cidade, estado) {
  if (cidade && estado) return `${cidade}, ${estado}`;
  return cidade || estado || '-';
}

function calcularIdade(dataNascimentoISO) {
  if (!dataNascimentoISO) return null;
  const nascimento = new Date(`${dataNascimentoISO}T00:00:00`);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade--;
  return idade;
}

export default function PerfilScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { session, profile, atualizarPerfil } = useAuth();
  const { editar } = useLocalSearchParams();
  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [dataNascimento, setDataNascimento] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [descricaoObjetivo, setDescricaoObjetivo] = useState('');
  const [dataProva, setDataProva] = useState(null);

  const {
    estados,
    carregandoEstados,
    estadoFallback,
    estadoLivre,
    setEstadoLivre,
    estadoSelecionado,
    selecionarEstado,
    preencher: preencherEstadoCidade,
    cidades,
    carregandoCidades,
    cidadeFallback,
    cidade,
    setCidade,
  } = useEstadoCidade({ ativo: editando });

  function iniciarEdicao() {
    setNome(profile?.nome || '');
    setSobrenome(profile?.sobrenome || '');
    setDataNascimento(isoParaData(profile?.data_nascimento));
    setCategoria(profile?.objetivo_categoria || null);
    setDescricaoObjetivo(profile?.objetivo_descricao || '');
    setDataProva(isoParaData(profile?.data_prova));
    preencherEstadoCidade(profile?.estado || null, profile?.cidade || '');
    setEditando(true);
  }

  // veio de Configurações → "Editar perfil" (?editar=1): abre direto editando
  useEffect(() => {
    if (editar === '1' && !editando) iniciarEdicao();
  }, [editar]);

  async function salvar() {
    setCarregando(true);
    const { error } = await atualizarPerfil({
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      data_nascimento: dataNascimento ? dataLocalISO(dataNascimento) : null,
      objetivo_categoria: categoria,
      objetivo_descricao: descricaoObjetivo.trim(),
      objetivo_perguntado: true,
      data_prova: dataProva ? dataLocalISO(dataProva) : null,
      estado: estadoFallback ? estadoLivre.trim() || null : estadoSelecionado?.sigla || null,
      cidade: cidade.trim() || null,
    });
    setCarregando(false);
    Keyboard.dismiss();

    if (error) {
      Alert.alert('Erro', mensagemErro(error));
      return;
    }
    setEditando(false);
  }

  const faltam = diasRestantes(profile?.data_prova);

  if (editando) {
    return (
      <View style={styles.flex}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAwareScrollView
            style={styles.flex}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            bottomOffset={20}
          >
            <Text style={styles.titulo}>Editar perfil</Text>

            <Cartao>
              <Text style={styles.rotulo}>E-mail</Text>
              <Text style={styles.valor}>{session?.user?.email}</Text>

              <View style={styles.linhaContaLinks}>
                <TouchableOpacity onPress={() => router.push('/trocar-senha')} hitSlop={6}>
                  <Text style={styles.linkConta}>Trocar senha</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/trocar-email')} hitSlop={6}>
                  <Text style={styles.linkConta}>Trocar e-mail</Text>
                </TouchableOpacity>
              </View>

              <CampoTexto
                rotulo="Nome"
                value={nome}
                onChangeText={(t) => setNome(apenasLetras(t))}
                returnKeyType="next"
              />
              <CampoTexto
                rotulo="Sobrenome"
                value={sobrenome}
                onChangeText={(t) => setSobrenome(apenasLetras(t))}
                returnKeyType="next"
              />
              <SeletorData
                rotulo="Data de nascimento"
                placeholder="Escolher data"
                valor={dataNascimento}
                onAlterar={setDataNascimento}
                minimo={new Date(1900, 0, 1)}
                maximo={new Date()}
              />

              {estadoFallback ? (
                <CampoTexto
                  rotulo="Estado"
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
                  placeholder="Sua cidade"
                  value={cidade}
                  onChangeText={setCidade}
                  returnKeyType="next"
                />
              ) : (
                <SeletorLista
                  rotulo="Cidade"
                  placeholder={estadoSelecionado ? 'Escolher cidade' : 'Escolha um estado primeiro'}
                  valorExibido={cidade}
                  desabilitado={!estadoSelecionado}
                  carregando={carregandoCidades}
                  opcoes={cidades.map((c) => ({ rotulo: c.nome, valor: c.nome }))}
                  onSelecionar={(opcao) => setCidade(opcao.valor)}
                />
              )}
            </Cartao>

            <Cartao>
              <Text style={styles.tituloCartao}>O que você está estudando</Text>
              <View style={styles.linhaChips}>
                {CATEGORIAS.map((c) => (
                  <TouchableOpacity
                    key={c.valor}
                    style={[styles.chip, categoria === c.valor && styles.chipAtivo]}
                    onPress={() => setCategoria(c.valor)}
                  >
                    <Text
                      style={[styles.textoChip, categoria === c.valor && styles.textoChipAtivo]}
                    >
                      {c.rotulo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <CampoTexto
                placeholder="Ex: PMMA, Engenharia Civil, 3º ano..."
                value={descricaoObjetivo}
                onChangeText={setDescricaoObjetivo}
                returnKeyType="next"
              />
            </Cartao>

            <Cartao>
              <Text style={styles.tituloCartao}>Data da prova</Text>
              <SeletorData
                placeholder="Escolher data"
                valor={dataProva}
                onAlterar={setDataProva}
                minimo={new Date(2000, 0, 1)}
                maximo={new Date(2100, 0, 1)}
              />
            </Cartao>

            <View style={styles.linhaBotoes}>
              <Botao
                titulo="Cancelar"
                onPress={() => setEditando(false)}
                variante="secundario"
                style={{ flex: 1 }}
              />
              <Botao
                titulo={carregando ? 'Salvando...' : 'Salvar'}
                onPress={salvar}
                disabled={carregando}
                style={{ flex: 1 }}
              />
            </View>
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <Cabecalho
        titulo="Perfil"
        direita={
          <TouchableOpacity onPress={() => router.push('/configuracoes')} hitSlop={8}>
            <Ionicons name="settings-outline" size={22} color={cores.textoSecundario} />
          </TouchableOpacity>
        }
      />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {faltam !== null && (
        <Cartao style={styles.cartaoContagem}>
          <Text style={styles.numeroContagem}>
            {faltam > 0 ? faltam : faltam === 0 ? 'Hoje!' : `${Math.abs(faltam)} atrás`}
          </Text>
          <Text style={styles.rotuloContagem}>
            {faltam > 0
              ? 'dias para a prova'
              : faltam === 0
                ? 'é o dia da prova'
                : 'dias desde a prova'}
          </Text>
        </Cartao>
      )}

      <Cartao>
        <Text style={styles.rotulo}>Nome</Text>
        <Text style={styles.valor}>
          {[profile?.nome, profile?.sobrenome].filter(Boolean).join(' ') || '-'}
        </Text>

        <Text style={styles.rotulo}>Idade</Text>
        <Text style={styles.valor}>
          {calcularIdade(profile?.data_nascimento) != null
            ? `${calcularIdade(profile?.data_nascimento)} anos`
            : '-'}
        </Text>

        <Text style={styles.rotulo}>Cidade e estado</Text>
        <Text style={styles.valor}>{cidadeEstado(profile?.cidade, profile?.estado)}</Text>
      </Cartao>

      <Cartao>
        <Text style={styles.rotulo}>Nome da prova</Text>
        <Text style={styles.valor}>
          {profile?.objetivo_descricao || rotuloCategoria(profile?.objetivo_categoria) || '-'}
        </Text>

        <Text style={styles.rotulo}>Data da prova</Text>
        <Text style={styles.valor}>{dataISOParaBR(profile?.data_prova) || 'Não informada'}</Text>
      </Cartao>
      </ScrollView>
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: { padding: 16 },
    titulo: {
      fontFamily: fontes.display,
      fontSize: 20,
      color: cores.texto,
      marginBottom: 16,
    },
    tituloCartao: {
      fontSize: 13,
      fontWeight: '700',
      color: cores.textoSecundario,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    rotulo: { fontSize: 11, color: cores.textoFraco, marginTop: 8, textTransform: 'uppercase' },
    valor: { fontSize: 15, color: cores.texto, marginTop: 2, marginBottom: 8 },
    linhaContaLinks: { flexDirection: 'row', gap: 18, marginTop: 4, marginBottom: 4 },
    linkConta: { fontSize: 12.5, color: cores.destaque, fontWeight: '600' },
    linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: {
      borderWidth: 1.5,
      borderColor: cores.borda,
      borderRadius: 18,
      paddingVertical: 7,
      paddingHorizontal: 13,
      backgroundColor: cores.superficie2,
    },
    chipAtivo: { backgroundColor: cores.destaque, borderColor: cores.destaque },
    textoChip: { fontSize: 13, color: cores.textoSecundario },
    textoChipAtivo: { color: cores.destaqueTexto, fontWeight: '700' },
    linhaBotoes: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cartaoContagem: { alignItems: 'center' },
    numeroContagem: {
      fontFamily: fontes.display,
      fontSize: 40,
      color: cores.destaque,
    },
    rotuloContagem: {
      fontSize: 12,
      color: cores.textoSecundario,
      textTransform: 'uppercase',
      marginTop: 4,
      letterSpacing: 0.5,
    },
  });
}
