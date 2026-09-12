import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useTema } from '../context/ThemeContext';
import Cartao from '../components/Cartao';
import Botao from '../components/Botao';
import ModalAssuntoEstudado from '../components/ModalAssuntoEstudado';
import { dataLocalISO, diasRestantes } from '../lib/data';
import { fraseDoDia } from '../lib/frases';
import { fontes } from '../theme';

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function InicioScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { session, profile } = useAuth();
  const router = useRouter();

  const [materiasHoje, setMateriasHoje] = useState([]);
  const [concluidosHoje, setConcluidosHoje] = useState({});
  const [ultimoAssunto, setUltimoAssunto] = useState({});
  const [disciplinaModal, setDisciplinaModal] = useState(null);
  const [anotacoesPendentes, setAnotacoesPendentes] = useState([]);

  const hojeISO = dataLocalISO();
  const hojeSemana = DIAS[(new Date().getDay() + 6) % 7];
  const faltam = diasRestantes(profile?.data_prova);
  const frase = fraseDoDia();

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, []),
  );

  async function carregar() {
    const { data: disc } = await supabase
      .from('disciplinas')
      .select('*')
      .eq('dia_semana', hojeSemana)
      .order('nome');
    setMateriasHoje(disc || []);

    const { data: itens } = await supabase
      .from('checklist')
      .select('disciplina_id')
      .eq('data', hojeISO);
    const mapa = {};
    (itens || []).forEach((i) => (mapa[i.disciplina_id] = true));
    setConcluidosHoje(mapa);

    // último assunto estudado (qualquer data anterior) por disciplina, pra mostrar "onde parou"
    const { data: ultimos } = await supabase
      .from('checklist')
      .select('disciplina_id, assunto_estudado, data')
      .not('assunto_estudado', 'is', null)
      .order('data', { ascending: false });

    const mapaUltimo = {};
    (ultimos || []).forEach((item) => {
      if (!item.assunto_estudado || !item.assunto_estudado.trim()) return;
      if (!mapaUltimo[item.disciplina_id]) mapaUltimo[item.disciplina_id] = item.assunto_estudado;
    });
    setUltimoAssunto(mapaUltimo);

    const { data: notas } = await supabase
      .from('anotacoes_erro')
      .select('*')
      .lte('proxima_revisao', hojeISO)
      .order('proxima_revisao');
    setAnotacoesPendentes(notas || []);
  }

  function alternarConcluido(disciplinaId, valorAtual) {
    if (valorAtual) {
      // desmarcar não pergunta nada, só desmarca normal
      desmarcarConcluido(disciplinaId);
    } else {
      // marcar como estudado abre o modal perguntando o assunto
      setDisciplinaModal(disciplinaId);
    }
  }

  async function desmarcarConcluido(disciplinaId) {
    await supabase.from('checklist').delete().eq('disciplina_id', disciplinaId).eq('data', hojeISO);
    carregar();
  }

  async function marcarConcluido(disciplinaId, assunto) {
    await supabase.from('checklist').insert({
      user_id: session.user.id,
      disciplina_id: disciplinaId,
      data: hojeISO,
      concluido: true,
      assunto_estudado: assunto && assunto.trim() ? assunto.trim() : null,
    });
    setDisciplinaModal(null);
    carregar();
  }

  function pularModal() {
    if (disciplinaModal) marcarConcluido(disciplinaModal, null);
  }

  function salvarModal(texto) {
    if (disciplinaModal) marcarConcluido(disciplinaModal, texto);
  }

  return (
    <>
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <Text style={styles.saudacao}>Olá{profile?.nome ? `, ${profile.nome}` : ''}!</Text>

        <Cartao style={styles.cartaoFrase}>
          <Text style={styles.textoFrase}>"{frase.texto}"</Text>
          <Text style={styles.autorFrase}>— {frase.autor}</Text>
        </Cartao>

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
          <Text style={styles.tituloCartao}>Hoje é {hojeSemana}</Text>
          {materiasHoje.length === 0 && (
            <Text style={styles.vazio}>Nenhuma disciplina cadastrada pra hoje.</Text>
          )}
          {materiasHoje.map((m) => (
            <View key={m.id} style={styles.linhaMateria}>
              <Switch
                value={!!concluidosHoje[m.id]}
                onValueChange={() => alternarConcluido(m.id, !!concluidosHoje[m.id])}
                trackColor={{ false: cores.borda, true: cores.destaque }}
                thumbColor={cores.superficie}
                ios_backgroundColor={cores.borda}
              />
              <View style={styles.colunaMateria}>
                <Text
                  style={[styles.nomeMateria, concluidosHoje[m.id] && styles.nomeMateriaConcluida]}
                >
                  {m.nome}
                </Text>
                {!!ultimoAssunto[m.id] && (
                  <Text style={styles.ultimoAssunto} numberOfLines={1}>
                    Último assunto estudado: {ultimoAssunto[m.id]}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </Cartao>

        <Cartao>
          <View style={styles.linhaTituloCartao}>
            <Text style={[styles.tituloCartao, styles.semMargem]}>Para revisar hoje</Text>
            {anotacoesPendentes.length > 0 && (
              <Text style={styles.contadorAmbar}>{anotacoesPendentes.length}</Text>
            )}
          </View>
          {anotacoesPendentes.length === 0 && (
            <Text style={styles.vazio}>Nada pendente de revisão hoje.</Text>
          )}
          {anotacoesPendentes.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.itemAnotacao}>
              <Text style={styles.textoAnotacao}>
                {item.disciplina_nome || 'Sem disciplina'}
                {item.assunto ? ` · ${item.assunto}` : ''}
              </Text>
            </View>
          ))}
          {anotacoesPendentes.length > 5 && (
            <Text style={styles.maisTexto}>
              +{anotacoesPendentes.length - 5} outra(s) — veja tudo em Revisar → Questões
            </Text>
          )}
        </Cartao>

        <View style={styles.linhaAtalhos}>
          <Botao
            titulo="Iniciar Timer"
            onPress={() => router.push('/estudar?aba=timer')}
            style={{ flex: 1 }}
          />
          <Botao
            titulo="Simulado"
            onPress={() => router.push('/estudar?aba=simulado')}
            variante="secundario"
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
      <ModalAssuntoEstudado
        visivel={disciplinaModal != null}
        onPular={pularModal}
        onSalvar={salvarModal}
      />
    </>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: { padding: 16 },
    saudacao: { fontFamily: fontes.display, fontSize: 22, color: cores.texto, marginBottom: 14 },
    cartaoFrase: { borderLeftWidth: 3, borderLeftColor: cores.destaque },
    textoFrase: {
      fontSize: 14,
      color: cores.texto,
      fontStyle: 'italic',
      lineHeight: 20,
      marginBottom: 6,
    },
    autorFrase: { fontSize: 12, color: cores.textoSecundario, textAlign: 'right' },
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
    cartaoContagem: { alignItems: 'center' },
    numeroContagem: { fontFamily: fontes.display, fontSize: 44, color: cores.destaque },
    rotuloContagem: {
      fontSize: 12,
      color: cores.textoSecundario,
      textTransform: 'uppercase',
      marginTop: 4,
      letterSpacing: 0.5,
    },
    linhaMateria: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    colunaMateria: { flex: 1 },
    nomeMateria: { fontSize: 14, color: cores.texto },
    nomeMateriaConcluida: { color: cores.textoFraco, textDecorationLine: 'line-through' },
    ultimoAssunto: { fontSize: 11, color: cores.textoFraco, marginTop: 2 },
    vazio: { color: cores.textoFraco, fontSize: 13 },
    itemAnotacao: {
      borderLeftWidth: 2,
      borderLeftColor: cores.ambar,
      backgroundColor: cores.superficie2,
      borderRadius: 0,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginBottom: 6,
    },
    textoAnotacao: { fontSize: 13, color: cores.texto },
    maisTexto: { fontSize: 12, color: cores.textoFraco, marginTop: 4 },
    linhaAtalhos: { flexDirection: 'row', gap: 10, marginTop: 4 },
  });
}
