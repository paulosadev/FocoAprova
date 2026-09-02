import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../supabaseClient';
import { useFocusEffect } from 'expo-router';
import { useTema } from '../context/ThemeContext';
import Cartao from '../components/Cartao';
import { dataLocalISO, dataISOParaBR } from '../lib/data';

function inicioDaSemana() {
  const d = new Date();
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return dataLocalISO(d);
}

function calcularSequencia(diasOrdenadosDesc) {
  if (diasOrdenadosDesc.length === 0) return 0;
  let contando = 0;
  const cursor = new Date();

  for (let i = 0; i < diasOrdenadosDesc.length; i++) {
    const esperado = dataLocalISO(cursor);
    if (diasOrdenadosDesc[i] === esperado) {
      contando++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (diasOrdenadosDesc[i] < esperado) {
      break;
    }
  }
  return contando;
}

export default function ProgressoScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const [horasTotal, setHorasTotal] = useState(0);
  const [horasSemana, setHorasSemana] = useState(0);
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [totalSimulados, setTotalSimulados] = useState(0);
  const [sequencia, setSequencia] = useState(0);
  const [porMateria, setPorMateria] = useState([]);
  const [ultimosSimulados, setUltimosSimulados] = useState([]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, []),
  );

  async function carregar() {
    const sow = inicioDaSemana();

    const { data: sessoes } = await supabase.from('sessoes_estudo').select('data, minutos');
    const total = (sessoes || []).reduce((a, s) => a + s.minutos, 0);
    const semana = (sessoes || []).filter((s) => s.data >= sow).reduce((a, s) => a + s.minutos, 0);
    setHorasTotal(total / 60);
    setHorasSemana(semana / 60);

    const diasUnicos = [...new Set((sessoes || []).map((s) => s.data))].sort().reverse();
    setSequencia(calcularSequencia(diasUnicos));

    const { data: questoes } = await supabase.from('questoes').select('*');
    setTotalQuestoes((questoes || []).reduce((a, q) => a + q.resolvidas, 0));

    const agregados = {};
    (questoes || []).forEach((q) => {
      const chave = q.disciplina_nome || 'Sem disciplina';
      if (!agregados[chave]) agregados[chave] = { resolvidas: 0, acertos: 0 };
      agregados[chave].resolvidas += q.resolvidas;
      agregados[chave].acertos += q.acertos;
    });
    setPorMateria(Object.entries(agregados));

    const { count } = await supabase.from('simulados').select('*', { count: 'exact', head: true });
    setTotalSimulados(count || 0);

    const { data: ultimos } = await supabase
      .from('simulados')
      .select('id, data, total, acertos, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (ultimos && ultimos.length > 0) {
      const ids = ultimos.map((s) => s.id);
      const { data: materias } = await supabase
        .from('simulado_materias')
        .select('*')
        .in('simulado_id', ids);

      const comMaterias = ultimos.map((simulado) => ({
        ...simulado,
        materias: (materias || []).filter((m) => m.simulado_id === simulado.id),
      }));
      setUltimosSimulados(comMaterias);
    } else {
      setUltimosSimulados([]);
    }
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.grid}>
        <Cartao style={styles.cardStat}>
          <Text style={styles.numeroStat}>{sequencia}</Text>
          <Text style={styles.rotuloStat}>Dias seguidos</Text>
        </Cartao>
        <Cartao style={styles.cardStat}>
          <Text style={styles.numeroStat}>{totalQuestoes}</Text>
          <Text style={styles.rotuloStat}>Questões resolvidas</Text>
        </Cartao>
        <Cartao style={styles.cardStat}>
          <Text style={styles.numeroStat}>{totalSimulados}</Text>
          <Text style={styles.rotuloStat}>Simulados feitos</Text>
        </Cartao>
        <Cartao style={styles.cardStat}>
          <Text style={styles.numeroStat}>{horasSemana.toFixed(1)}h</Text>
          <Text style={styles.rotuloStat}>Horas essa semana</Text>
        </Cartao>
        <Cartao style={[styles.cardStat, { width: '100%' }]}>
          <Text style={styles.numeroStat}>{horasTotal.toFixed(1)}h</Text>
          <Text style={styles.rotuloStat}>Horas no total</Text>
        </Cartao>
      </View>

      <Cartao>
        <Text style={[styles.tituloSecao, { marginBottom: 12 }]}>
          Acerto por matéria — questões do dia a dia
        </Text>
        {porMateria.length === 0 && (
          <Text style={styles.vazio}>Registre questões pra ver seu progresso aqui.</Text>
        )}
        {porMateria.map(([nome, valores]) => {
          const pct = valores.resolvidas
            ? Math.round((valores.acertos / valores.resolvidas) * 100)
            : 0;
          return (
            <View key={nome} style={styles.barraLinha}>
              <View style={styles.barraRotulo}>
                <Text style={styles.barraNome}>{nome}</Text>
                <Text style={styles.barraPct}>{pct}%</Text>
              </View>
              <View style={styles.barraFundo}>
                <View style={[styles.barraPreenchida, { width: `${pct}%` }]} />
              </View>
            </View>
          );
        })}
      </Cartao>

      <Cartao>
        <Text style={styles.tituloSecao}>Últimos simulados por matéria</Text>
        <Text style={styles.explicacaoSecao}>
          Compare os 3 mais recentes pra ver onde melhorou e o que ainda precisa de atenção.
        </Text>

        {ultimosSimulados.length === 0 && (
          <Text style={styles.vazio}>
            Detalhe matérias ao registrar um simulado pra ver essa base aqui.
          </Text>
        )}

        {ultimosSimulados.map((simulado, indice) => {
          const pctGeral = simulado.total
            ? Math.round((simulado.acertos / simulado.total) * 100)
            : 0;
          return (
            <View
              key={simulado.id}
              style={[
                styles.blocoSimulado,
                indice < ultimosSimulados.length - 1 && styles.blocoSimuladoComBorda,
              ]}
            >
              <View style={styles.cabecalhoSimulado}>
                <Text style={styles.tituloSimulado}>
                  {indice === 0 ? 'Mais recente' : `${indice + 1}º mais recente`} —{' '}
                  {dataISOParaBR(simulado.data)}
                </Text>
                <Text style={styles.pctGeralSimulado}>{pctGeral}% geral</Text>
              </View>

              {simulado.materias.length === 0 ? (
                <Text style={styles.vazio}>Sem detalhamento por matéria nesse simulado.</Text>
              ) : (
                simulado.materias.map((m) => {
                  const pct = m.resolvidas ? Math.round((m.acertos / m.resolvidas) * 100) : 0;
                  return (
                    <View key={m.id} style={styles.barraLinha}>
                      <View style={styles.barraRotulo}>
                        <Text style={styles.barraNome}>{m.disciplina_nome}</Text>
                        <Text style={styles.barraPct}>
                          {m.acertos}/{m.resolvidas} · {pct}%
                        </Text>
                      </View>
                      <View style={styles.barraFundo}>
                        <View
                          style={[
                            styles.barraPreenchida,
                            styles.barraPreenchidaSimulado,
                            { width: `${pct}%` },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          );
        })}
      </Cartao>
    </ScrollView>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: { padding: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
    cardStat: { width: '47%' },
    numeroStat: { fontSize: 24, fontWeight: '700', color: cores.destaque },
    rotuloStat: {
      fontSize: 11,
      color: cores.textoSecundario,
      textTransform: 'uppercase',
      marginTop: 4,
    },
    tituloSecao: {
      fontSize: 13,
      fontWeight: '700',
      color: cores.textoSecundario,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    explicacaoSecao: { fontSize: 12, color: cores.textoFraco, marginBottom: 14 },
    vazio: { color: cores.textoFraco },
    blocoSimulado: { marginBottom: 16, paddingBottom: 16 },
    blocoSimuladoComBorda: { borderBottomWidth: 1, borderBottomColor: cores.borda },
    cabecalhoSimulado: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    tituloSimulado: {
      fontSize: 12,
      fontWeight: '700',
      color: cores.texto,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    pctGeralSimulado: { fontSize: 13, fontWeight: '700', color: cores.ambar },
    barraLinha: { marginBottom: 12 },
    barraRotulo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    barraNome: { color: cores.texto, fontSize: 13 },
    barraPct: { color: cores.textoSecundario, fontSize: 12 },
    barraFundo: {
      height: 8,
      backgroundColor: cores.superficie2,
      borderRadius: 4,
      overflow: 'hidden',
    },
    barraPreenchida: { height: '100%', backgroundColor: cores.destaque },
    barraPreenchidaSimulado: { backgroundColor: cores.ambar },
  });
}
