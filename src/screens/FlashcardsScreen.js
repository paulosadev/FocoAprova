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
import ModoEstudoFlashcards from '../components/ModoEstudoFlashcards';
import { dataLocalISO, dataISOParaBR } from '../lib/data';

const INTERVALOS_REVISAO = [1, 3, 7, 14, 30];
const LIMITE_DIARIO_IA = 10;

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
  const [fila, setFila] = useState(null); // null = modo de estudo fechado; array = fila em andamento

  const [disciplinaIASelecionada, setDisciplinaIASelecionada] = useState(null);
  const [assuntoIA, setAssuntoIA] = useState('');
  const [gerandoIA, setGerandoIA] = useState(false);

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
    if (disc && disc.length > 0 && !disciplinaIASelecionada) {
      setDisciplinaIASelecionada(disc[0].id);
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

  async function extrairMensagemErroFunction(error) {
    try {
      if (error?.context?.json) {
        const corpo = await error.context.json();
        if (corpo?.error) return corpo.error;
      }
    } catch {
      // mantém a mensagem padrão abaixo
    }
    return error?.message || 'Tente novamente em instantes.';
  }

  async function gerarFlashcardsIA() {
    const disc = disciplinas.find((d) => d.id === disciplinaIASelecionada);
    if (!disc) {
      Alert.alert('Escolha uma disciplina', 'Selecione a disciplina antes de gerar.');
      return;
    }
    if (!assuntoIA.trim()) {
      Alert.alert('Informe o assunto', 'Digite o assunto para a IA gerar os flashcards.');
      return;
    }
    if (restanteIA <= 0) {
      Alert.alert(
        'Limite atingido',
        `Você já gerou o máximo de ${LIMITE_DIARIO_IA} flashcards por IA para ${disc.nome} hoje.`,
      );
      return;
    }

    Keyboard.dismiss();
    setGerandoIA(true);
    const { data, error } = await supabase.functions.invoke('gerar-flashcards', {
      body: {
        disciplina_nome: disc.nome,
        assunto: assuntoIA.trim(),
        data_local: hojeISO(),
      },
    });
    setGerandoIA(false);

    if (error) {
      const mensagem = await extrairMensagemErroFunction(error);
      Alert.alert('Não foi possível gerar', mensagem);
      return;
    }

    const criados = data?.criados ?? 0;
    Alert.alert(
      'Prontinho!',
      criados > 0
        ? `${criados} flashcard${criados === 1 ? '' : 's'} gerado${criados === 1 ? '' : 's'} para ${disc.nome}.`
        : 'Nenhum flashcard foi gerado. Tente reformular o assunto.',
    );
    setAssuntoIA('');
    carregarDados();
  }

  function iniciarEstudo() {
    if (paraRevisarHoje.length === 0) return;
    setFila(paraRevisarHoje);
  }

  function fecharEstudo() {
    setFila(null);
  }

  const paraRevisarHoje = cartoes.filter(
    (c) => c.proxima_revisao && c.proxima_revisao <= hojeISO(),
  );

  const disciplinaIANome = disciplinas.find((d) => d.id === disciplinaIASelecionada)?.nome;
  const geradosHojeIA = disciplinaIANome
    ? cartoes.filter(
        (c) =>
          c.disciplina_nome === disciplinaIANome &&
          c.gerado_por_ia &&
          c.created_at?.slice(0, 10) === hojeISO(),
      ).length
    : 0;
  const restanteIA = Math.max(0, LIMITE_DIARIO_IA - geradosHojeIA);

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

        {/* Gerar com IA */}
        <Cartao>
          <View style={styles.cabecalhoCartao}>
            <Text style={[styles.tituloCartao, styles.tituloCartaoSemMargem]}>Gerar com IA</Text>
            <Text style={styles.contadorAmbar}>
              {restanteIA}/{LIMITE_DIARIO_IA}
            </Text>
          </View>

          <Text style={styles.rotuloPequeno}>Disciplina</Text>
          <View style={styles.linhaChips}>
            {disciplinas.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.chip, disciplinaIASelecionada === d.id && styles.chipAtivo]}
                onPress={() => setDisciplinaIASelecionada(d.id)}
              >
                <Text
                  style={[
                    styles.textoChip,
                    disciplinaIASelecionada === d.id && styles.textoChipAtivo,
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
            rotulo="Assunto"
            placeholder="Ex.: Revolução Francesa, Verbos irregulares..."
            value={assuntoIA}
            onChangeText={setAssuntoIA}
            returnKeyType="done"
          />

          <Text style={styles.textoResumoRevisao}>
            {restanteIA > 0
              ? `Restam ${restanteIA} de ${LIMITE_DIARIO_IA} flashcards por IA hoje nessa disciplina.`
              : 'Limite diário de flashcards por IA atingido nessa disciplina hoje.'}
          </Text>

          <Botao
            titulo={gerandoIA ? 'Gerando...' : 'Gerar com IA'}
            onPress={gerarFlashcardsIA}
            disabled={gerandoIA || restanteIA <= 0 || disciplinas.length === 0}
          />
        </Cartao>

        {/* Para revisar hoje */}
        <Cartao>
          <View style={styles.linhaTituloCartao}>
            <Text style={[styles.tituloCartao, styles.semMargem]}>Para revisar hoje</Text>
            {paraRevisarHoje.length > 0 && (
              <Text style={styles.contadorAmbar}>{paraRevisarHoje.length}</Text>
            )}
          </View>
          {paraRevisarHoje.length === 0 ? (
            <Text style={styles.vazio}>Nada pendente de revisão hoje.</Text>
          ) : (
            <>
              <Text style={styles.textoResumoRevisao}>
                {paraRevisarHoje.length}{' '}
                {paraRevisarHoje.length === 1 ? 'cartão esperando' : 'cartões esperando'} revisão.
              </Text>
              <Botao titulo="Estudar agora" onPress={iniciarEstudo} />
            </>
          )}
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

      <ModoEstudoFlashcards
        visivel={fila !== null}
        fila={fila || []}
        onResponder={responder}
        onFechar={fecharEstudo}
      />
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
    linhaTituloCartao: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    semMargem: { marginBottom: 0 },
    contadorAmbar: {
      minWidth: 22,
      textAlign: 'center',
      overflow: 'hidden',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: cores.ambar,
      color: cores.fundo,
      fontSize: 12,
      fontWeight: '700',
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
    textoResumoRevisao: { fontSize: 13, color: cores.textoSecundario, marginBottom: 12 },
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
