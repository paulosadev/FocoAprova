import { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';
import Cartao from '../components/Cartao';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import SeletorData from '../components/SeletorData';
import { dataLocalISO, dataISOParaBR, diasRestantes } from '../lib/data';

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

export default function PerfilScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { session, profile, atualizarPerfil } = useAuth();
  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [dataNascimento, setDataNascimento] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [descricaoObjetivo, setDescricaoObjetivo] = useState('');
  const [dataProva, setDataProva] = useState(null);

  function iniciarEdicao() {
    setNome(profile?.nome || '');
    setSobrenome(profile?.sobrenome || '');
    setDataNascimento(isoParaData(profile?.data_nascimento));
    setCategoria(profile?.objetivo_categoria || null);
    setDescricaoObjetivo(profile?.objetivo_descricao || '');
    setDataProva(isoParaData(profile?.data_prova));
    setEditando(true);
  }

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
    });
    setCarregando(false);
    Keyboard.dismiss();

    if (error) {
      Alert.alert('Erro', error.message);
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

              <CampoTexto rotulo="Nome" value={nome} onChangeText={setNome} returnKeyType="next" />
              <CampoTexto
                rotulo="Sobrenome"
                value={sobrenome}
                onChangeText={setSobrenome}
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
        <Text style={styles.rotulo}>E-mail</Text>
        <Text style={styles.valor}>{session?.user?.email}</Text>

        <Text style={styles.rotulo}>Nome</Text>
        <Text style={styles.valor}>{profile?.nome || '-'}</Text>

        <Text style={styles.rotulo}>Sobrenome</Text>
        <Text style={styles.valor}>{profile?.sobrenome || '-'}</Text>

        <Text style={styles.rotulo}>Data de nascimento</Text>
        <Text style={styles.valor}>{dataISOParaBR(profile?.data_nascimento) || '-'}</Text>
      </Cartao>

      <Cartao>
        <Text style={styles.tituloCartao}>O que você está estudando</Text>
        <Text style={styles.valor}>
          {rotuloCategoria(profile?.objetivo_categoria) || 'Não informado'}
          {profile?.objetivo_descricao ? ` — ${profile.objetivo_descricao}` : ''}
        </Text>
      </Cartao>

      <Cartao>
        <Text style={styles.tituloCartao}>Data da prova</Text>
        <Text style={styles.valor}>{dataISOParaBR(profile?.data_prova) || 'Não informada'}</Text>
      </Cartao>

      <Botao titulo="Editar perfil" onPress={iniciarEdicao} />
    </ScrollView>
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
