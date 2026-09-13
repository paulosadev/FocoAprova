import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import Cartao from '../components/Cartao';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import SeletorData from '../components/SeletorData';
import { dataLocalISO } from '../lib/data';
import { mensagemErro } from '../lib/erros';

const CATEGORIAS = [
  { valor: 'concurso', rotulo: 'Concurso', placeholder: 'Ex: PMMA, Banco do Brasil, TJ-SP...' },
  { valor: 'faculdade', rotulo: 'Faculdade', placeholder: 'Ex: Engenharia Civil - UFMA' },
  { valor: 'ensino_medio', rotulo: 'Ensino médio', placeholder: 'Ex: 3º ano, preparação pro ENEM' },
  { valor: 'curso', rotulo: 'Curso', placeholder: 'Ex: Inglês, Excel avançado' },
  { valor: 'outro', rotulo: 'Outro', placeholder: 'Conte um pouco do que está estudando' },
];

export default function ObjetivoScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { atualizarPerfil } = useAuth();
  const [categoria, setCategoria] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [metaDiaria, setMetaDiaria] = useState('100');
  const [dataProva, setDataProva] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const categoriaAtual = CATEGORIAS.find((c) => c.valor === categoria);

  async function salvar() {
    if (!categoria) {
      Alert.alert('Escolha uma opção', 'Selecione o que melhor descreve seus estudos.');
      return;
    }
    setCarregando(true);
    const { error } = await atualizarPerfil({
      objetivo_categoria: categoria,
      objetivo_descricao: descricao.trim(),
      meta_diaria: Math.max(Number(metaDiaria) || 1, 1),
      data_prova: dataProva ? dataLocalISO(dataProva) : null,
      objetivo_perguntado: true,
    });
    setCarregando(false);
    if (error) Alert.alert('Erro', mensagemErro(error));
  }

  async function pular() {
    await atualizarPerfil({ objetivo_perguntado: true });
  }

  return (
    <View style={styles.flex}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          bottomOffset={20}
        >
          <Text style={styles.titulo}>O que você está estudando?</Text>
          <Text style={styles.subtitulo}>Isso ajuda a gente a entender melhor quem usa o app.</Text>

          <Cartao>
            <View style={styles.linhaChips}>
              {CATEGORIAS.map((c) => (
                <TouchableOpacity
                  key={c.valor}
                  style={[styles.chip, categoria === c.valor && styles.chipAtivo]}
                  onPress={() => setCategoria(c.valor)}
                >
                  <Text style={[styles.textoChip, categoria === c.valor && styles.textoChipAtivo]}>
                    {c.rotulo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {categoria && (
              <CampoTexto
                placeholder={categoriaAtual?.placeholder}
                value={descricao}
                onChangeText={setDescricao}
                returnKeyType="done"
              />
            )}
          </Cartao>

          <Cartao>
            <Text style={styles.tituloCartao}>Meta diária de questões</Text>
            <Text style={styles.explicacao}>Você pode mudar isso depois em Configurações.</Text>
            <CampoTexto
              keyboardType="number-pad"
              returnKeyType="done"
              value={metaDiaria}
              onChangeText={setMetaDiaria}
              style={{ marginBottom: 0 }}
            />
          </Cartao>

          <Cartao>
            <Text style={styles.tituloCartao}>Data da prova (opcional)</Text>
            <Text style={styles.explicacao}>
              Se já souber a data, a gente mostra a contagem regressiva na Início.
            </Text>
            <SeletorData
              placeholder="Escolher data"
              valor={dataProva}
              onAlterar={setDataProva}
              minimo={new Date()}
              maximo={new Date(2100, 0, 1)}
            />
          </Cartao>

          <Botao
            titulo={carregando ? 'Salvando...' : 'Continuar'}
            onPress={salvar}
            disabled={carregando}
          />

          <TouchableOpacity onPress={pular}>
            <Text style={styles.link}>Prefiro não dizer agora</Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: cores.fundo },
    titulo: {
      fontSize: 21,
      fontWeight: '700',
      color: cores.texto,
      textAlign: 'center',
      marginBottom: 6,
    },
    subtitulo: {
      fontSize: 14,
      color: cores.textoSecundario,
      textAlign: 'center',
      marginBottom: 20,
    },
    linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    chip: {
      borderWidth: 1.5,
      borderColor: cores.borda,
      borderRadius: 18,
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: cores.superficie2,
    },
    chipAtivo: { backgroundColor: cores.destaque, borderColor: cores.destaque },
    textoChip: { fontSize: 13, color: cores.textoSecundario },
    textoChipAtivo: { color: cores.destaqueTexto, fontWeight: '700' },
    link: { textAlign: 'center', color: cores.textoFraco, marginTop: 18, fontSize: 13 },
    tituloCartao: {
      fontSize: 12,
      fontWeight: '700',
      color: cores.textoSecundario,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    explicacao: { fontSize: 12, color: cores.textoFraco, marginBottom: 10 },
  });
}
