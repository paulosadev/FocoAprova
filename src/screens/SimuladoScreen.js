import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Vibration,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from 'expo-router';
import { useTema } from '../context/ThemeContext';
import Cartao from '../components/Cartao';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import ModoFoco from '../components/ModoFoco';
import { tocarAlerta } from '../lib/som';
import { notificar } from '../lib/notificacoes';
import { dataLocalISO, dataISOParaBR } from '../lib/data';

const KEEP_AWAKE_TAG = 'simulado-focoaprova';

function formatar(segundos) {
  const s = Math.max(segundos, 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function SimuladoScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { session } = useAuth();
  const [duracaoMin, setDuracaoMin] = useState('180');
  const [segundos, setSegundos] = useState(180 * 60);
  const [rodando, setRodando] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [totalQuestoes, setTotalQuestoes] = useState('100');
  const [acertos, setAcertos] = useState('70');
  const [historico, setHistorico] = useState([]);
  const [editandoSimuladoId, setEditandoSimuladoId] = useState(null);
  const intervaloRef = useRef(null);

  // Detalhamento por matéria
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
  const [resolvidasMateria, setResolvidasMateria] = useState('10');
  const [acertosMateria, setAcertosMateria] = useState('7');
  const [materiasAdicionadas, setMateriasAdicionadas] = useState([]);

  // Matérias já salvas do simulado em edição (edição/exclusão individual)
  const [materiasDoSimulado, setMateriasDoSimulado] = useState([]);
  const [editandoMateriaId, setEditandoMateriaId] = useState(null);
  const [materiaEditDisciplina, setMateriaEditDisciplina] = useState(null);
  const [materiaEditResolvidas, setMateriaEditResolvidas] = useState('');
  const [materiaEditAcertos, setMateriaEditAcertos] = useState('');

  useFocusEffect(
    useCallback(() => {
      carregarHistorico();
      carregarDisciplinas();
    }, []),
  );

  useEffect(() => {
    return () => deactivateKeepAwake(KEEP_AWAKE_TAG);
  }, []);

  // Mantém o detalhamento do simulado em edição sincronizado após cada recarga
  useEffect(() => {
    if (!editandoSimuladoId) return;
    const atual = historico.find((h) => h.id === editandoSimuladoId);
    setMateriasDoSimulado(atual?.materias || []);
  }, [historico, editandoSimuladoId]);

  async function carregarHistorico() {
    const { data } = await supabase
      .from('simulados')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    const lista = data || [];

    if (lista.length === 0) {
      setHistorico([]);
      return;
    }

    const ids = lista.map((s) => s.id);
    const { data: materias } = await supabase
      .from('simulado_materias')
      .select('*')
      .in('simulado_id', ids);

    setHistorico(
      lista.map((s) => ({
        ...s,
        materias: (materias || []).filter((m) => m.simulado_id === s.id),
      })),
    );
  }

  async function carregarDisciplinas() {
    const { data } = await supabase.from('disciplinas').select('*').order('nome');
    setDisciplinas(data || []);
    if (data && data.length > 0 && !disciplinaSelecionada) {
      setDisciplinaSelecionada(data[0].id);
    }
  }

  function iniciar() {
    Keyboard.dismiss();
    setRodando(true);
    setTelaCheia(true);
    activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    intervaloRef.current = setInterval(() => {
      setSegundos((atual) => {
        if (atual <= 1) {
          Vibration.vibrate([0, 400, 200, 400]);
          tocarAlerta();
          notificar('Tempo esgotado', 'O tempo do simulado chegou ao fim.');
          clearInterval(intervaloRef.current);
          setRodando(false);
          setTelaCheia(false);
          deactivateKeepAwake(KEEP_AWAKE_TAG);
          return 0;
        }
        return atual - 1;
      });
    }, 1000);
  }

  function pausar() {
    setRodando(false);
    setTelaCheia(false);
    clearInterval(intervaloRef.current);
    deactivateKeepAwake(KEEP_AWAKE_TAG);
  }

  function reiniciar() {
    pausar();
    setSegundos((Number(duracaoMin) || 180) * 60);
  }

  function adicionarMateria() {
    const disc = disciplinas.find((d) => d.id === disciplinaSelecionada);
    if (!disc) {
      Alert.alert('Escolha uma disciplina', 'Cadastre uma disciplina na aba Cronograma primeiro.');
      return;
    }
    const resolvidas = Number(resolvidasMateria) || 0;
    const acertosNum = Math.min(Number(acertosMateria) || 0, resolvidas);
    if (resolvidas <= 0) return;

    setMateriasAdicionadas((atual) => [
      ...atual,
      { disciplina_nome: disc.nome, resolvidas, acertos: acertosNum },
    ]);
    setResolvidasMateria('10');
    setAcertosMateria('7');
  }

  function removerMateria(index) {
    setMateriasAdicionadas((atual) => atual.filter((_, i) => i !== index));
  }

  async function salvarSimulado() {
    const total = Number(totalQuestoes) || 0;
    const numAcertos = Math.min(Number(acertos) || 0, total);
    if (total <= 0) return;

    if (editandoSimuladoId) {
      const { error } = await supabase
        .from('simulados')
        .update({ total, acertos: numAcertos })
        .eq('id', editandoSimuladoId);

      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }
      cancelarEdicaoSimulado();
      Keyboard.dismiss();
      carregarHistorico();
      return;
    }

    const { data: simuladoSalvo, error } = await supabase
      .from('simulados')
      .insert({
        user_id: session.user.id,
        total,
        acertos: numAcertos,
        duracao_min: Number(duracaoMin) || 0,
        data: dataLocalISO(),
      })
      .select()
      .single();

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }

    if (materiasAdicionadas.length > 0) {
      const linhas = materiasAdicionadas.map((m) => ({
        simulado_id: simuladoSalvo.id,
        user_id: session.user.id,
        disciplina_nome: m.disciplina_nome,
        resolvidas: m.resolvidas,
        acertos: m.acertos,
      }));
      const { error: erroMaterias } = await supabase.from('simulado_materias').insert(linhas);
      if (erroMaterias) {
        Alert.alert(
          'Simulado salvo, mas houve um erro no detalhamento por matéria',
          erroMaterias.message,
        );
      }
    }

    await supabase.from('sessoes_estudo').insert({
      user_id: session.user.id,
      minutos: Number(duracaoMin) || 0,
      tipo: 'simulado',
      data: dataLocalISO(),
    });

    setMateriasAdicionadas([]);
    Keyboard.dismiss();
    carregarHistorico();
  }

  function iniciarEdicaoSimulado(item) {
    setEditandoSimuladoId(item.id);
    setTotalQuestoes(String(item.total));
    setAcertos(String(item.acertos));
    setMateriasDoSimulado(item.materias || []);
    cancelarEdicaoMateria();
  }

  function cancelarEdicaoSimulado() {
    setEditandoSimuladoId(null);
    setTotalQuestoes('100');
    setAcertos('70');
    setMateriasDoSimulado([]);
    cancelarEdicaoMateria();
  }

  function excluirSimulado(id) {
    Alert.alert(
      'Excluir esse simulado?',
      'Isso também apaga o detalhamento por matéria dele. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('simulado_materias').delete().eq('simulado_id', id);
            const { error } = await supabase.from('simulados').delete().eq('id', id);
            if (error) {
              Alert.alert('Erro', error.message);
              return;
            }
            if (editandoSimuladoId === id) cancelarEdicaoSimulado();
            carregarHistorico();
          },
        },
      ],
    );
  }

  function iniciarEdicaoMateria(materia) {
    setEditandoMateriaId(materia.id);
    const disc = disciplinas.find((d) => d.nome === materia.disciplina_nome);
    setMateriaEditDisciplina(disc ? disc.id : null);
    setMateriaEditResolvidas(String(materia.resolvidas));
    setMateriaEditAcertos(String(materia.acertos));
  }

  function cancelarEdicaoMateria() {
    setEditandoMateriaId(null);
    setMateriaEditDisciplina(null);
    setMateriaEditResolvidas('');
    setMateriaEditAcertos('');
  }

  async function salvarEdicaoMateria() {
    const disc = disciplinas.find((d) => d.id === materiaEditDisciplina);
    const resolvidas = Number(materiaEditResolvidas) || 0;
    const acertosNum = Math.min(Number(materiaEditAcertos) || 0, resolvidas);
    if (resolvidas <= 0) return;

    const { error } = await supabase
      .from('simulado_materias')
      .update({
        disciplina_nome: disc ? disc.nome : null,
        resolvidas,
        acertos: acertosNum,
      })
      .eq('id', editandoMateriaId);

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }
    cancelarEdicaoMateria();
    carregarHistorico();
  }

  function excluirMateria(id) {
    Alert.alert('Excluir essa matéria do simulado?', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('simulado_materias').delete().eq('id', id);
          if (error) {
            Alert.alert('Erro', error.message);
            return;
          }
          if (editandoMateriaId === id) cancelarEdicaoMateria();
          carregarHistorico();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Cartao>
          <Text style={styles.tituloCartao}>
            Cronômetro do simulado (não entra nas estatísticas de questões)
          </Text>
          <CampoTexto
            style={styles.campoDuracao}
            rotulo="Duração (min)"
            keyboardType="number-pad"
            returnKeyType="done"
            value={duracaoMin}
            onChangeText={(v) => {
              setDuracaoMin(v);
              // só atualiza o preview com um número já válido; enquanto o
              // campo estiver vazio/incompleto, mantém o valor atual
              if (!rodando) {
                const minutos = Number(v);
                if (Number.isFinite(minutos) && minutos > 0) {
                  setSegundos(minutos * 60);
                }
              }
            }}
            onSubmitEditing={Keyboard.dismiss}
          />
          <Text style={styles.display}>{formatar(segundos)}</Text>
          <View style={styles.controles}>
            <Botao
              titulo={rodando ? 'Pausar' : 'Iniciar simulado'}
              onPress={rodando ? pausar : iniciar}
              style={{ flex: 1 }}
            />
            <Botao
              titulo="Reiniciar"
              onPress={reiniciar}
              variante="secundario"
              style={{ flex: 1 }}
            />
          </View>
          {rodando && (
            <Botao
              titulo="Abrir tela cheia"
              onPress={() => setTelaCheia(true)}
              variante="secundario"
              style={{ marginTop: 10 }}
            />
          )}
        </Cartao>

        <Cartao>
          <View style={styles.cabecalhoCartao}>
            <Text style={[styles.tituloCartao, styles.tituloCartaoSemMargem]}>
              {editandoSimuladoId ? 'Editar resultado' : 'Resultado geral'}
            </Text>
            {editandoSimuladoId && (
              <TouchableOpacity onPress={cancelarEdicaoSimulado} hitSlop={8}>
                <Text style={styles.acaoCancelar}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.linhaCampos}>
            <CampoTexto
              style={styles.campo}
              rotulo="Total de questões"
              keyboardType="number-pad"
              returnKeyType="done"
              value={totalQuestoes}
              onChangeText={setTotalQuestoes}
            />
            <CampoTexto
              style={styles.campo}
              rotulo="Acertos"
              keyboardType="number-pad"
              returnKeyType="done"
              value={acertos}
              onChangeText={setAcertos}
            />
          </View>
        </Cartao>

        <Cartao>
          <Text style={styles.tituloCartao}>Detalhamento por matéria (opcional)</Text>

          {!editandoSimuladoId && (
            <>
              <Text style={styles.explicacao}>
                Anote quantas questões acertou em cada matéria, pra ter uma base real de onde está
                mais fraco nos simulados.
              </Text>

              <View style={styles.formMateria}>
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

                <View style={styles.linhaCamposMateria}>
                  <CampoTexto
                    style={styles.campoMateria}
                    rotulo="Resolvidas"
                    keyboardType="number-pad"
                    returnKeyType="done"
                    value={resolvidasMateria}
                    onChangeText={setResolvidasMateria}
                  />
                  <CampoTexto
                    style={styles.campoMateria}
                    rotulo="Acertos"
                    keyboardType="number-pad"
                    returnKeyType="done"
                    value={acertosMateria}
                    onChangeText={setAcertosMateria}
                  />
                  <Botao
                    titulo="+ Adicionar"
                    onPress={adicionarMateria}
                    style={styles.botaoAdicionarMateria}
                  />
                </View>
              </View>

              {materiasAdicionadas.length > 0 && (
                <View style={styles.listaMateriasAdicionadas}>
                  {materiasAdicionadas.map((m, i) => {
                    const pct = m.resolvidas ? Math.round((m.acertos / m.resolvidas) * 100) : 0;
                    return (
                      <View key={i} style={styles.cardMateriaAdicionada}>
                        <View style={styles.linhaTopoMateriaAdicionada}>
                          <Text style={styles.nomeMateriaAdicionada}>{m.disciplina_nome}</Text>
                          <TouchableOpacity onPress={() => removerMateria(i)} hitSlop={8}>
                            <Text style={styles.remover}>×</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.linhaBaixoMateriaAdicionada}>
                          <View style={styles.barraFundoMateria}>
                            <View style={[styles.barraPreenchidaMateria, { width: `${pct}%` }]} />
                          </View>
                          <Text style={styles.textoPctMateria}>
                            {m.acertos}/{m.resolvidas} · {pct}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {editandoSimuladoId && (
            <>
              <Text style={styles.explicacao}>
                Editando o detalhamento já salvo deste simulado.
              </Text>
              {materiasDoSimulado.length === 0 && (
                <Text style={styles.vazio}>Esse simulado não tem detalhamento por matéria.</Text>
              )}
              <View style={styles.listaMateriasAdicionadas}>
                {materiasDoSimulado.map((m) =>
                  editandoMateriaId === m.id ? (
                    <View key={m.id} style={styles.formMateria}>
                      <View style={styles.linhaChips}>
                        {disciplinas.map((d) => (
                          <TouchableOpacity
                            key={d.id}
                            style={[
                              styles.chip,
                              materiaEditDisciplina === d.id && styles.chipAtivo,
                            ]}
                            onPress={() => setMateriaEditDisciplina(d.id)}
                          >
                            <Text
                              style={[
                                styles.textoChip,
                                materiaEditDisciplina === d.id && styles.textoChipAtivo,
                              ]}
                            >
                              {d.nome}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.linhaCamposMateria}>
                        <CampoTexto
                          style={styles.campoMateria}
                          rotulo="Resolvidas"
                          keyboardType="number-pad"
                          returnKeyType="done"
                          value={materiaEditResolvidas}
                          onChangeText={setMateriaEditResolvidas}
                        />
                        <CampoTexto
                          style={styles.campoMateria}
                          rotulo="Acertos"
                          keyboardType="number-pad"
                          returnKeyType="done"
                          value={materiaEditAcertos}
                          onChangeText={setMateriaEditAcertos}
                        />
                      </View>
                      <View style={styles.linhaAcoesItem}>
                        <Botao
                          titulo="Salvar matéria"
                          onPress={salvarEdicaoMateria}
                          style={{ flex: 1 }}
                        />
                        <Botao
                          titulo="Cancelar"
                          onPress={cancelarEdicaoMateria}
                          variante="secundario"
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  ) : (
                    <View key={m.id} style={styles.cardMateriaAdicionada}>
                      <View style={styles.linhaTopoMateriaAdicionada}>
                        <Text style={styles.nomeMateriaAdicionada}>{m.disciplina_nome}</Text>
                        <Text style={styles.textoPctMateria}>
                          {m.acertos}/{m.resolvidas}
                        </Text>
                      </View>
                      <View style={styles.linhaAcoesItem}>
                        <TouchableOpacity onPress={() => iniciarEdicaoMateria(m)} hitSlop={8}>
                          <Text style={styles.acaoEditar}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => excluirMateria(m.id)} hitSlop={8}>
                          <Text style={styles.acaoExcluir}>Excluir</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ),
                )}
              </View>
            </>
          )}
        </Cartao>

        <Botao
          titulo={editandoSimuladoId ? 'Salvar alterações' : 'Salvar simulado'}
          onPress={salvarSimulado}
        />

        <Cartao style={{ marginTop: 14 }}>
          <Text style={styles.tituloCartao}>Histórico</Text>
          {historico.length === 0 && (
            <Text style={styles.vazio}>Nenhum simulado registrado ainda.</Text>
          )}
          {historico.map((item) => {
            const pct = item.total ? Math.round((item.acertos / item.total) * 100) : 0;
            return (
              <View key={item.id} style={styles.itemHistorico}>
                <View style={styles.linhaHistorico}>
                  <Text style={styles.dataHistorico}>{dataISOParaBR(item.data)}</Text>
                  <Text style={styles.valorHistorico}>
                    {item.acertos}/{item.total}
                  </Text>
                  <Text style={styles.valorHistorico}>{pct}%</Text>
                </View>
                <View style={styles.linhaAcoesItem}>
                  <TouchableOpacity onPress={() => iniciarEdicaoSimulado(item)} hitSlop={8}>
                    <Text style={styles.acaoEditar}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => excluirSimulado(item.id)} hitSlop={8}>
                    <Text style={styles.acaoExcluir}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </Cartao>
      </ScrollView>

      <ModoFoco
        visivel={telaCheia}
        rotulo="Simulado"
        display={formatar(segundos)}
        onPausar={pausar}
        onSair={() => setTelaCheia(false)}
      />
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
    explicacao: { fontSize: 12, color: cores.textoFraco, marginBottom: 12 },
    campoDuracao: { width: 130 },
    display: {
      fontSize: 44,
      fontWeight: '700',
      color: cores.texto,
      textAlign: 'center',
      marginVertical: 14,
    },
    controles: { flexDirection: 'row', gap: 10 },
    linhaCampos: { flexDirection: 'row', gap: 12 },
    campo: { flex: 1 },
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
    formMateria: {
      backgroundColor: cores.superficie2,
      borderRadius: 10,
      padding: 12,
      marginBottom: 4,
    },
    linhaCamposMateria: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
    campoMateria: { flex: 1 },
    botaoAdicionarMateria: { paddingHorizontal: 14, marginBottom: 12 },
    listaMateriasAdicionadas: { marginTop: 14, gap: 8 },
    cardMateriaAdicionada: {
      backgroundColor: cores.superficie2,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: cores.ambar,
      padding: 10,
    },
    linhaTopoMateriaAdicionada: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    nomeMateriaAdicionada: { color: cores.texto, fontSize: 14, fontWeight: '600' },
    remover: { fontSize: 20, color: cores.perigo, lineHeight: 20 },
    linhaBaixoMateriaAdicionada: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    barraFundoMateria: {
      flex: 1,
      height: 6,
      backgroundColor: cores.borda,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barraPreenchidaMateria: { height: '100%', backgroundColor: cores.ambar },
    textoPctMateria: {
      fontSize: 12,
      color: cores.textoSecundario,
      minWidth: 90,
      textAlign: 'right',
    },
    itemHistorico: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: cores.borda,
    },
    linhaHistorico: { flexDirection: 'row', justifyContent: 'space-between' },
    dataHistorico: { color: cores.texto },
    valorHistorico: { color: cores.textoSecundario },
    vazio: { textAlign: 'center', color: cores.textoFraco, paddingVertical: 12 },
    cabecalhoCartao: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    tituloCartaoSemMargem: { marginBottom: 0 },
    acaoCancelar: { fontSize: 13, color: cores.textoSecundario, fontWeight: '600' },
    linhaAcoesItem: { flexDirection: 'row', gap: 16, marginTop: 8 },
    acaoEditar: { fontSize: 13, color: cores.destaque, fontWeight: '600' },
    acaoExcluir: { fontSize: 13, color: cores.perigo, fontWeight: '600' },
  });
}
