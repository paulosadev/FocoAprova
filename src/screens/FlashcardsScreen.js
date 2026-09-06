import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Keyboard } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
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

export default function FlashcardsScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { session } = useAuth();

  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
  const [frente, setFrente] = useState('');
  const [verso, setVerso] = useState('');
  const [cartoes, setCartoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, []),
  );

  async function carregarDados() {
    const { data: disc } = await supabase.from('disciplinas').select('*').order('nome');
    setDisciplinas(disc || []);
    if (disc && disc.length > 0 && !disciplinaSelecionada) {
      setDisciplinaSelecionada(disc[0].id);
    }

    const { data: cards } = await supabase
      .from('flashcards')
      .select('*')
      .order('created_at', { ascending: false });
    setCartoes(cards || []);
  }

  async function salvarCartao() {
    if (!frente.trim() || !verso.trim()) return;
    const disc = disciplinas.find((d) => d.id === disciplinaSelecionada);

    setCarregando(true);
    const { error } = editandoId
      ? await supabase
          .from('flashcards')
          .update({
            disciplina_nome: disc ? disc.nome : null,
            frente: frente.trim(),
            verso: verso.trim(),
          })
          .eq('id', editandoId)
      : await supabase.from('flashcards').insert({
          user_id: session.user.id,
          disciplina_nome: disc ? disc.nome : null,
          frente: frente.trim(),
          verso: verso.trim(),
          review_stage: 0,
          proxima_revisao: hojeISO(),
        });
    setCarregando(false);

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }
    cancelarEdicao();
    Keyboard.dismiss();
    carregarDados();
  }

  function iniciarEdicao(item) {
    setEditandoId(item.id);
    const disc = disciplinas.find((d) => d.nome === item.disciplina_nome);
    setDisciplinaSelecionada(disc ? disc.id : null);
    setFrente(item.frente || '');
    setVerso(item.verso || '');
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setFrente('');
    setVerso('');
  }

  function excluirCartao(id) {
    Alert.alert('Excluir esse cartão?', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('flashcards').delete().eq('id', id);
          if (error) {
            Alert.alert('Erro', error.message);
            return;
          }
          if (editandoId === id) cancelarEdicao();
          carregarDados();
        },
      },
    ]);
  }

  // acertou avança de estágio (intervalo maior); errou volta pro início
  async function responder(item, acertou) {
    const novoEstagio = acertou
      ? Math.min((item.review_stage || 0) + 1, INTERVALOS_REVISAO.length - 1)
      : 0;
    const dias = INTERVALOS_REVISAO[novoEstagio];
    const proxima = new Date();
    proxima.setDate(proxima.getDate() + dias);

    await supabase
      .from('flashcards')
      .update({ review_stage: novoEstagio, proxima_revisao: dataLocalISO(proxima) })
      .eq('id', item.id);

    carregarDados();
  }

  const paraRevisarHoje = cartoes.filter(
    (c) => c.proxima_revisao && c.proxima_revisao <= hojeISO(),
  );

  return (
    <View style={styles.flex}>
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={20}
      >
        {/* Cadastro */}
        <Cartao>
          <View style={styles.cabecalhoCartao}>
            <Text style={[styles.tituloCartao, styles.tituloCartaoSemMargem]}>
              {editandoId ? 'Editar cartão' : 'Novo cartão'}
            </Text>
            {editandoId && (
              <TouchableOpacity onPress={cancelarEdicao} hitSlop={8}>
                <Text style={styles.acaoCancelar}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
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

          <CampoTexto
            rotulo="Frente"
            placeholder="Pergunta ou termo"
            value={frente}
            onChangeText={setFrente}
            multiline
            numberOfLines={2}
            inputStyle={{ minHeight: 50, textAlignVertical: 'top' }}
            returnKeyType="next"
          />
          <CampoTexto
            rotulo="Verso"
            placeholder="Resposta"
            value={verso}
            onChangeText={setVerso}
            multiline
            numberOfLines={2}
            inputStyle={{ minHeight: 50, textAlignVertical: 'top' }}
          />

          <Botao
            titulo={
              carregando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Adicionar cartão'
            }
            onPress={salvarCartao}
            disabled={carregando}
          />
        </Cartao>

        {/* Para revisar hoje */}
        <Cartao>
          <Text style={styles.tituloCartao}>Para revisar hoje</Text>
          {paraRevisarHoje.length === 0 && (
            <Text style={styles.vazio}>Nada pendente de revisão hoje.</Text>
          )}
          {paraRevisarHoje.map((item) => (
            <CartaoRevisao
              key={item.id}
              item={item}
              styles={styles}
              onAcertei={() => responder(item, true)}
              onErrei={() => responder(item, false)}
            />
          ))}
        </Cartao>

        {/* Todos os cartões */}
        <Cartao>
          <Text style={styles.tituloCartao}>Todos os cartões</Text>
          {cartoes.length === 0 && (
            <Text style={styles.vazio}>Nenhum cartão cadastrado ainda.</Text>
          )}
          {cartoes.map((item) => (
            <View key={item.id} style={styles.itemAnotacao}>
              <Text style={styles.metaAnotacao}>
                {item.disciplina_nome || 'Sem disciplina'} · próxima revisão{' '}
                {dataISOParaBR(item.proxima_revisao)}
              </Text>
              <Text style={styles.notaAnotacao}>{item.frente}</Text>
              <View style={styles.linhaAcoesItem}>
                <TouchableOpacity onPress={() => iniciarEdicao(item)} hitSlop={8}>
                  <Text style={styles.acaoEditar}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => excluirCartao(item.id)} hitSlop={8}>
                  <Text style={styles.acaoExcluir}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Cartao>
      </KeyboardAwareScrollView>
    </View>
  );
}

// cartão de estudo: toca pra virar (frente -> verso), depois de virado mostra
// os botões de acertei/errei
function CartaoRevisao({ item, styles, onAcertei, onErrei }) {
  const [virado, setVirado] = useState(false);

  function responderEFechar(fn) {
    fn();
    setVirado(false);
  }

  return (
    <View style={styles.itemAnotacao}>
      <Text style={styles.metaAnotacao}>{item.disciplina_nome || 'Sem disciplina'}</Text>
      <TouchableOpacity onPress={() => setVirado((v) => !v)} activeOpacity={0.7}>
        <Text style={styles.textoCartaoRevisao}>{virado ? item.verso : item.frente}</Text>
        <Text style={styles.dicaVirar}>
          {virado ? 'Toque para ver a frente' : 'Toque para ver a resposta'}
        </Text>
      </TouchableOpacity>
      {virado && (
        <View style={styles.linhaAcoesItem}>
          <Botao
            titulo="Errei"
            onPress={() => responderEFechar(onErrei)}
            variante="secundario"
            style={{ flex: 1 }}
          />
          <Botao titulo="Acertei" onPress={() => responderEFechar(onAcertei)} style={{ flex: 1 }} />
        </View>
      )}
    </View>
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
    textoCartaoRevisao: { fontSize: 15, color: cores.texto, marginTop: 4, marginBottom: 4 },
    dicaVirar: { fontSize: 11, color: cores.textoFraco, fontStyle: 'italic' },
    cabecalhoCartao: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    tituloCartaoSemMargem: { marginBottom: 0 },
    acaoCancelar: { fontSize: 13, color: cores.textoSecundario, fontWeight: '600' },
    linhaAcoesItem: { flexDirection: 'row', gap: 10, marginTop: 8 },
    acaoEditar: { fontSize: 13, color: cores.destaque, fontWeight: '600' },
    acaoExcluir: { fontSize: 13, color: cores.perigo, fontWeight: '600' },
  });
}
