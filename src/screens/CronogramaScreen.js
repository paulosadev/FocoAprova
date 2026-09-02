import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Switch } from 'react-native';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from 'expo-router';
import { useTema } from '../context/ThemeContext';
import Cartao from '../components/Cartao';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import { dataLocalISO } from '../lib/data';

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function CronogramaScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { session } = useAuth();
  const [disciplinas, setDisciplinas] = useState([]);
  const [concluidosHoje, setConcluidosHoje] = useState({});
  const [nomeNovo, setNomeNovo] = useState('');
  const [diaNovo, setDiaNovo] = useState(DIAS[0]);
  const [carregando, setCarregando] = useState(false);

  const hojeISO = dataLocalISO();
  const hojeSemana = DIAS[(new Date().getDay() + 6) % 7];

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, []),
  );

  async function carregarDados() {
    const { data: disc } = await supabase.from('disciplinas').select('*').order('nome');
    setDisciplinas(disc || []);

    const { data: itens } = await supabase
      .from('checklist')
      .select('disciplina_id')
      .eq('data', hojeISO);

    const mapa = {};
    (itens || []).forEach((item) => (mapa[item.disciplina_id] = true));
    setConcluidosHoje(mapa);
  }

  async function adicionarDisciplina() {
    if (!nomeNovo.trim()) return;
    setCarregando(true);
    const { error } = await supabase.from('disciplinas').insert({
      user_id: session.user.id,
      nome: nomeNovo.trim(),
      dia_semana: diaNovo,
    });
    setCarregando(false);
    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }
    setNomeNovo('');
    carregarDados();
  }

  function confirmarRemocao(id, nome) {
    Alert.alert('Remover disciplina', `Remover "${nome}" do cronograma?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removerDisciplina(id) },
    ]);
  }

  async function removerDisciplina(id) {
    await supabase.from('disciplinas').delete().eq('id', id);
    carregarDados();
  }

  async function alternarConcluido(disciplinaId, valorAtual) {
    if (valorAtual) {
      await supabase
        .from('checklist')
        .delete()
        .eq('disciplina_id', disciplinaId)
        .eq('data', hojeISO);
    } else {
      await supabase.from('checklist').insert({
        user_id: session.user.id,
        disciplina_id: disciplinaId,
        data: hojeISO,
        concluido: true,
      });
    }
    carregarDados();
  }

  function renderDia(dia) {
    const materiasDoDia = disciplinas.filter((d) => d.dia_semana === dia);
    if (materiasDoDia.length === 0) return null;

    return (
      <Cartao key={dia} style={dia === hojeSemana ? styles.cartaoHoje : null}>
        <Text style={[styles.tituloDia, dia === hojeSemana && styles.tituloDiaHoje]}>{dia}</Text>
        {materiasDoDia.map((m) => (
          <View key={m.id} style={styles.linhaMateria}>
            <Switch
              value={!!concluidosHoje[m.id]}
              onValueChange={() => alternarConcluido(m.id, !!concluidosHoje[m.id])}
              disabled={dia !== hojeSemana}
              trackColor={{ false: cores.borda, true: cores.destaque }}
              thumbColor={cores.superficie}
              ios_backgroundColor={cores.borda}
            />
            <Text style={styles.nomeMateria}>{m.nome}</Text>
            <TouchableOpacity onPress={() => confirmarRemocao(m.id, m.nome)}>
              <Text style={styles.remover}>remover</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Cartao>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      data={DIAS}
      keyExtractor={(d) => d}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      renderItem={({ item }) => renderDia(item)}
      ListHeaderComponent={
        <Cartao>
          <Text style={styles.tituloForm}>Adicionar disciplina</Text>
          <CampoTexto
            placeholder="Nome da disciplina"
            value={nomeNovo}
            onChangeText={setNomeNovo}
          />
          <View style={styles.linhaDias}>
            {DIAS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.chipDia, diaNovo === d && styles.chipDiaAtivo]}
                onPress={() => setDiaNovo(d)}
              >
                <Text style={[styles.textoChip, diaNovo === d && styles.textoChipAtivo]}>
                  {d.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Botao
            titulo={carregando ? 'Salvando...' : 'Adicionar'}
            onPress={adicionarDisciplina}
            disabled={carregando}
          />
        </Cartao>
      }
      ListEmptyComponent={<Text style={styles.vazio}>Nenhuma disciplina cadastrada ainda.</Text>}
    />
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: cores.fundo },
    tituloForm: {
      fontSize: 13,
      fontWeight: '700',
      color: cores.textoSecundario,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    linhaDias: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
    chipDia: {
      borderWidth: 1.5,
      borderColor: cores.borda,
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: cores.superficie2,
    },
    chipDiaAtivo: { backgroundColor: cores.destaque, borderColor: cores.destaque },
    textoChip: { fontSize: 12, color: cores.textoSecundario },
    textoChipAtivo: { color: cores.destaqueTexto, fontWeight: '700' },
    cartaoHoje: { borderColor: cores.destaque },
    tituloDia: {
      fontSize: 13,
      fontWeight: '700',
      color: cores.textoSecundario,
      textTransform: 'uppercase',
      marginBottom: 10,
      letterSpacing: 0.5,
    },
    tituloDiaHoje: { color: cores.destaque },
    linhaMateria: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    nomeMateria: { flex: 1, fontSize: 14, color: cores.texto },
    remover: { fontSize: 12, color: cores.perigo },
    vazio: { textAlign: 'center', color: cores.textoFraco, paddingVertical: 20 },
  });
}
