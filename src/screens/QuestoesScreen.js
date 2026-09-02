import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from 'expo-router';
import { useTema } from '../context/ThemeContext';
import Cartao from '../components/Cartao';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import { dataLocalISO, dataISOParaBR } from '../lib/data';

const INTERVALOS_REVISAO = [1, 3, 7, 14, 30];

function hojeISO() {
  return dataLocalISO();
}

export default function QuestoesScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { session, profile, recarregarPerfil } = useAuth();

  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
  const [resolvidas, setResolvidas] = useState('20');
  const [acertos, setAcertos] = useState('15');
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const [metaDiaria, setMetaDiaria] = useState('100');
  const [salvandoMeta, setSalvandoMeta] = useState(false);

  const [disciplinaErro, setDisciplinaErro] = useState(null);
  const [assuntoErro, setAssuntoErro] = useState('');
  const [notaErro, setNotaErro] = useState('');
  const [anotacoes, setAnotacoes] = useState([]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, []),
  );

  async function carregarDados() {
    const { data: disc } = await supabase.from('disciplinas').select('*').order('nome');
    setDisciplinas(disc || []);
    if (disc && disc.length > 0) {
      if (!disciplinaSelecionada) setDisciplinaSelecionada(disc[0].id);
      if (!disciplinaErro) setDisciplinaErro(disc[0].id);
    }

    const { data: q } = await supabase.from('questoes').select('*');
    setRegistros(q || []);

    const { data: notas } = await supabase
      .from('anotacoes_erro')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    setAnotacoes(notas || []);

    if (profile?.meta_diaria) setMetaDiaria(String(profile.meta_diaria));
  }

  async function registrar() {
    const disc = disciplinas.find((d) => d.id === disciplinaSelecionada);
    if (!disc) {
      Alert.alert('Escolha uma disciplina', 'Cadastre uma disciplina na aba Cronograma primeiro.');
      return;
    }
    const numResolvidas = Number(resolvidas) || 0;
    const numAcertos = Math.min(Number(acertos) || 0, numResolvidas);
    if (numResolvidas <= 0) return;

    setCarregando(true);
    const { error } = await supabase.from('questoes').insert({
      user_id: session.user.id,
      disciplina_id: disc.id,
      disciplina_nome: disc.nome,
      resolvidas: numResolvidas,
      acertos: numAcertos,
      data: hojeISO(),
    });
    setCarregando(false);

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }
    carregarDados();
  }

  async function salvarMeta() {
    const valor = Math.max(Number(metaDiaria) || 1, 1);
    setSalvandoMeta(true);
    const { error } = await supabase
      .from('profiles')
      .update({ meta_diaria: valor })
      .eq('id', session.user.id);
    setSalvandoMeta(false);
    Keyboard.dismiss();
    if (error) {
      Alert.alert('Erro ao salvar meta', error.message);
      return;
    }
    recarregarPerfil();
  }

  async function salvarAnotacao() {
    const disc = disciplinas.find((d) => d.id === disciplinaErro);
    if (!assuntoErro.trim() && !notaErro.trim()) return;

    const { error } = await supabase.from('anotacoes_erro').insert({
      user_id: session.user.id,
      disciplina_nome: disc ? disc.nome : null,
      assunto: assuntoErro.trim(),
      nota: notaErro.trim(),
      review_stage: 0,
      proxima_revisao: hojeISO(),
      data: hojeISO(),
    });

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }
    setAssuntoErro('');
    setNotaErro('');
    Keyboard.dismiss();
    carregarDados();
  }

  async function marcarRevisado(item) {
    const novoEstagio = Math.min((item.review_stage || 0) + 1, INTERVALOS_REVISAO.length - 1);
    const dias = INTERVALOS_REVISAO[novoEstagio];
    const proxima = new Date();
    proxima.setDate(proxima.getDate() + dias);

    await supabase
      .from('anotacoes_erro')
      .update({ review_stage: novoEstagio, proxima_revisao: dataLocalISO(proxima) })
      .eq('id', item.id);

    carregarDados();
  }

  // Agregação de desempenho por matéria
  const agregados = {};
  registros.forEach((r) => {
    const chave = r.disciplina_nome || 'Sem disciplina';
    if (!agregados[chave]) agregados[chave] = { resolvidas: 0, acertos: 0 };
    agregados[chave].resolvidas += r.resolvidas;
    agregados[chave].acertos += r.acertos;
  });
  const linhasAgregadas = Object.entries(agregados);

  // Meta diária: soma de questões resolvidas hoje
  const resolvidasHoje = registros
    .filter((r) => r.data === hojeISO())
    .reduce((total, r) => total + r.resolvidas, 0);
  const metaAtual = profile?.meta_diaria || Number(metaDiaria) || 100;
  const percentualMeta = Math.min(Math.round((resolvidasHoje / metaAtual) * 100), 100);

  const anotacoesPendentes = anotacoes.filter(
    (a) => a.proxima_revisao && a.proxima_revisao <= hojeISO(),
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Meta diária */}
        <Cartao>
          <Text style={styles.tituloCartao}>Meta diária de questões</Text>
          <View style={styles.linhaMeta}>
            <CampoTexto
              style={styles.campoMeta}
              keyboardType="number-pad"
              returnKeyType="done"
              value={metaDiaria}
              onChangeText={setMetaDiaria}
              onSubmitEditing={salvarMeta}
            />
            <Botao
              titulo={salvandoMeta ? 'Salvando...' : 'Salvar'}
              onPress={salvarMeta}
              variante="secundario"
            />
          </View>
          <Text style={styles.textoMeta}>
            {resolvidasHoje} / {metaAtual} hoje ({percentualMeta}%)
          </Text>
          <View style={styles.barraFundo}>
            <View style={[styles.barraPreenchida, { width: `${percentualMeta}%` }]} />
          </View>
        </Cartao>

        {/* Registrar questões */}
        <Cartao>
          <Text style={styles.tituloCartao}>Registrar questões</Text>
          <Text style={styles.rotuloPequeno}>Disciplina</Text>
          <View style={styles.linhaChips}>
            {disciplinas.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.chip, disciplinaSelecionada === d.id && styles.chipAtivo]}
                onPress={() => setDisciplinaSelecionada(d.id)}
              >
                <Text
                  style={[
                    styles.textoChip,
                    disciplinaSelecionada === d.id && styles.textoChipAtivo,
                  ]}
                >
                  {d.nome}
                </Text>
              </TouchableOpacity>
            ))}
            {disciplinas.length === 0 && (
              <Text style={styles.vazioChips}>Cadastre disciplinas na aba Cronograma.</Text>
            )}
          </View>

          <View style={styles.linhaCampos}>
            <CampoTexto
              style={styles.campo}
              rotulo="Resolvidas"
              keyboardType="number-pad"
              returnKeyType="done"
              value={resolvidas}
              onChangeText={setResolvidas}
            />
            <CampoTexto
              style={styles.campo}
              rotulo="Acertos"
              keyboardType="number-pad"
              returnKeyType="done"
              value={acertos}
              onChangeText={setAcertos}
              onSubmitEditing={registrar}
            />
          </View>

          <Botao
            titulo={carregando ? 'Salvando...' : 'Registrar'}
            onPress={registrar}
            disabled={carregando}
          />
        </Cartao>

        {/* Desempenho por matéria */}
        <Cartao>
          <Text style={styles.tituloCartao}>Desempenho por matéria</Text>
          {linhasAgregadas.length === 0 && (
            <Text style={styles.vazio}>Nenhuma questão registrada ainda.</Text>
          )}
          {linhasAgregadas.map(([nome, valores]) => {
            const pct = valores.resolvidas
              ? Math.round((valores.acertos / valores.resolvidas) * 100)
              : 0;
            return (
              <View key={nome} style={styles.linhaTabela}>
                <Text style={styles.nomeTabela}>{nome}</Text>
                <Text style={styles.valorTabela}>{valores.resolvidas} resolvidas</Text>
                <Text style={styles.valorTabela}>{pct}%</Text>
              </View>
            );
          })}
        </Cartao>

        {/* Anotar erro */}
        <Cartao>
          <Text style={styles.tituloCartao}>Anotar erro por assunto</Text>
          <Text style={styles.rotuloPequeno}>Disciplina</Text>
          <View style={styles.linhaChips}>
            {disciplinas.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.chip, disciplinaErro === d.id && styles.chipAtivo]}
                onPress={() => setDisciplinaErro(d.id)}
              >
                <Text style={[styles.textoChip, disciplinaErro === d.id && styles.textoChipAtivo]}>
                  {d.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <CampoTexto
            placeholder="Assunto específico (ex: concordância verbal)"
            value={assuntoErro}
            onChangeText={setAssuntoErro}
            returnKeyType="next"
          />
          <CampoTexto
            placeholder="O que errou / o que revisar"
            value={notaErro}
            onChangeText={setNotaErro}
            multiline
            numberOfLines={3}
            inputStyle={{ minHeight: 70, textAlignVertical: 'top' }}
          />
          <Botao titulo="Salvar anotação" onPress={salvarAnotacao} />
        </Cartao>

        {/* Para revisar hoje */}
        <Cartao>
          <Text style={styles.tituloCartao}>Para revisar hoje</Text>
          {anotacoesPendentes.length === 0 && (
            <Text style={styles.vazio}>Nada pendente de revisão hoje.</Text>
          )}
          {anotacoesPendentes.map((item) => (
            <View key={item.id} style={styles.itemAnotacao}>
              <Text style={styles.metaAnotacao}>
                {dataISOParaBR(item.data)} — {item.disciplina_nome || 'Sem disciplina'}
                {item.assunto ? ` · ${item.assunto}` : ''}
              </Text>
              {!!item.nota && <Text style={styles.notaAnotacao}>{item.nota}</Text>}
              <Botao
                titulo="Marquei como revisado"
                onPress={() => marcarRevisado(item)}
                variante="secundario"
                style={{ marginTop: 8, alignSelf: 'flex-start' }}
              />
            </View>
          ))}
        </Cartao>

        {/* Últimas anotações */}
        <Cartao>
          <Text style={styles.tituloCartao}>Últimos erros anotados</Text>
          {anotacoes.length === 0 && <Text style={styles.vazio}>Nenhuma anotação ainda.</Text>}
          {anotacoes.slice(0, 15).map((item) => (
            <View key={item.id} style={styles.itemAnotacao}>
              <Text style={styles.metaAnotacao}>
                {dataISOParaBR(item.data)} — {item.disciplina_nome || 'Sem disciplina'}
                {item.assunto ? ` · ${item.assunto}` : ''} · próxima revisão{' '}
                {dataISOParaBR(item.proxima_revisao)}
              </Text>
              {!!item.nota && <Text style={styles.notaAnotacao}>{item.nota}</Text>}
            </View>
          ))}
        </Cartao>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: { padding: 16 },
    tituloCartao: {
      fontSize: 13,
      fontWeight: '700',
      color: cores.textoSecundario,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    rotuloPequeno: {
      fontSize: 11,
      color: cores.textoFraco,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
    chip: {
      borderWidth: 1.5,
      borderColor: cores.borda,
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: cores.superficie2,
    },
    chipAtivo: { backgroundColor: cores.destaque, borderColor: cores.destaque },
    textoChip: { fontSize: 13, color: cores.textoSecundario },
    textoChipAtivo: { color: cores.destaqueTexto, fontWeight: '700' },
    vazioChips: { fontSize: 12, color: cores.textoFraco },
    linhaCampos: { flexDirection: 'row', gap: 12 },
    campo: { flex: 1 },
    linhaMeta: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
    campoMeta: { flex: 1 },
    textoMeta: { fontSize: 13, color: cores.textoSecundario, marginBottom: 6 },
    barraFundo: {
      height: 8,
      backgroundColor: cores.superficie2,
      borderRadius: 4,
      overflow: 'hidden',
    },
    barraPreenchida: { height: '100%', backgroundColor: cores.destaque },
    linhaTabela: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: cores.borda,
    },
    nomeTabela: { flex: 2, color: cores.texto, fontWeight: '500' },
    valorTabela: { flex: 1, color: cores.textoSecundario, textAlign: 'right' },
    vazio: { color: cores.textoFraco, textAlign: 'center', paddingVertical: 12 },
    itemAnotacao: {
      borderLeftWidth: 2,
      borderLeftColor: cores.ambar,
      backgroundColor: cores.superficie2,
      borderRadius: 6,
      padding: 10,
      marginBottom: 8,
    },
    metaAnotacao: { fontSize: 11, color: cores.textoFraco, marginBottom: 4 },
    notaAnotacao: { fontSize: 13, color: cores.texto },
  });
}
