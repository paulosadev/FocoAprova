import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../supabaseClient';
import { useFocusEffect } from 'expo-router';
import { useTema } from '../context/ThemeContext';
import Cartao from '../components/Cartao';
import Cabecalho from '../components/Cabecalho';
import Ionicons from '@expo/vector-icons/Ionicons';
import { dataLocalISO, dataISOParaBR } from '../lib/data';
import { fontes } from '../theme';

const LIMIAR_ATENCAO = 70;
const DIAS_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// últimos 7 dias (hoje incluso), do mais antigo pro mais recente
function ultimosSeteDias() {
  const dias = [];
  const hoje = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    dias.push({ data: dataLocalISO(d), rotulo: DIAS_ABREV[d.getDay()], hoje: i === 0 });
  }
  return dias;
}

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
  const [horasPorDia, setHorasPorDia] = useState([]);

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

    const minutosPorDia = {};
    (sessoes || []).forEach((s) => {
      minutosPorDia[s.data] = (minutosPorDia[s.data] || 0) + s.minutos;
    });
    setHorasPorDia(
      ultimosSeteDias().map((d) => ({ ...d, horas: (minutosPorDia[d.data] || 0) / 60 })),
    );

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

  const maxHorasDia = Math.max(...horasPorDia.map((d) => d.horas), 0.1);

  // da matéria que mais precisa de atenção pra a mais consolidada
  const porMateriaOrdenado = [...porMateria].sort((a, b) => {
    const pctA = a[1].resolvidas ? a[1].acertos / a[1].resolvidas : 0;
    const pctB = b[1].resolvidas ? b[1].acertos / b[1].resolvidas : 0;
    return pctA - pctB;
  });

  // reagrupa "por simulado" (o que a API devolve) em "por matéria", do mais
  // antigo (esquerda) pro mais recente (destaque) — pra comparar a evolução
  // de cada matéria de uma vez, em vez de comparar simulados inteiros
  const simuladosCronologicos = [...ultimosSimulados].reverse();
  const nomesMaterias = [];
  simuladosCronologicos.forEach((s) => {
    s.materias.forEach((m) => {
      if (!nomesMaterias.includes(m.disciplina_nome)) nomesMaterias.push(m.disciplina_nome);
    });
  });
  const materiasComparadas = nomesMaterias.map((nome) => ({
    nome,
    pontos: simuladosCronologicos
      .map((s) => {
        const m = s.materias.find((mm) => mm.disciplina_nome === nome);
        if (!m) return null;
        return {
          data: s.data,
          pct: m.resolvidas ? Math.round((m.acertos / m.resolvidas) * 100) : 0,
        };
      })
      .filter(Boolean),
  }));

  return (
    <View style={styles.flex}>
      <Cabecalho titulo="Progresso" />
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
          <Text style={styles.tituloSecao}>Horas estudadas — últimos 7 dias</Text>
          <View style={styles.semanaBarras}>
            {horasPorDia.map((d) => (
              <View key={d.data} style={styles.semanaColuna}>
                <Text style={styles.semanaValor}>{d.horas.toFixed(1)}h</Text>
                <View style={styles.semanaTrilho}>
                  <View
                    style={[
                      styles.semanaPreenchido,
                      d.hoje && styles.semanaPreenchidoHoje,
                      { height: `${Math.max((d.horas / maxHorasDia) * 100, 3)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.semanaRotulo}>{d.rotulo}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.explicacaoSecao}>
            Total no período: {horasTotal.toFixed(1)}h desde o início
          </Text>
        </Cartao>

        <Cartao>
          <Text style={[styles.tituloSecao, { marginBottom: 4 }]}>
            Acerto por matéria — questões do dia a dia
          </Text>
          <Text style={styles.explicacaoSecao}>
            Da que mais precisa de atenção pra a mais consolidada.
          </Text>
          {porMateriaOrdenado.length === 0 && (
            <Text style={styles.vazio}>Registre questões pra ver seu progresso aqui.</Text>
          )}
          {porMateriaOrdenado.map(([nome, valores]) => {
            const pct = valores.resolvidas
              ? Math.round((valores.acertos / valores.resolvidas) * 100)
              : 0;
            return (
              <View key={nome} style={styles.barraLinha}>
                <View style={styles.barraRotulo}>
                  <Text style={styles.barraNome}>{nome}</Text>
                  <Text style={styles.barraPct}>
                    {valores.resolvidas} resolvidas · {pct}%
                  </Text>
                </View>
                <View style={styles.barraFundo}>
                  <View style={[styles.barraPreenchida, { width: `${pct}%` }]} />
                </View>
                {pct < LIMIAR_ATENCAO && (
                  <View style={styles.seloAtencao}>
                    <Ionicons name="alert-circle-outline" size={13} color={cores.perigo} />
                    <Text style={styles.textoSeloAtencao}>
                      Abaixo de {LIMIAR_ATENCAO}% — foque aqui
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </Cartao>

        <Cartao>
          <Text style={styles.tituloSecao}>Últimos simulados por matéria</Text>
          <Text style={styles.explicacaoSecao}>
            Cada matéria comparada nos últimos simulados — do mais antigo ao mais recente (em
            destaque), pra ver a evolução de cara.
          </Text>

          {materiasComparadas.length === 0 && (
            <Text style={styles.vazio}>
              Detalhe matérias ao registrar um simulado pra ver essa base aqui.
            </Text>
          )}

          {materiasComparadas.map((materia, indice) => (
            <View
              key={materia.nome}
              style={[
                styles.blocoTrend,
                indice < materiasComparadas.length - 1 && styles.blocoTrendComBorda,
              ]}
            >
              <Text style={styles.nomeTrend}>{materia.nome}</Text>
              <View style={styles.barrasTrend}>
                {materia.pontos.map((ponto, i) => {
                  const maisRecente = i === materia.pontos.length - 1;
                  return (
                    <View key={i} style={styles.colunaTrend}>
                      <Text style={[styles.valorTrend, maisRecente && styles.valorTrendAtivo]}>
                        {ponto.pct}%
                      </Text>
                      <View style={styles.trilhoTrend}>
                        <View
                          style={[
                            styles.preenchidoTrend,
                            maisRecente && styles.preenchidoTrendAtivo,
                            { height: `${Math.max(ponto.pct, 4)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.dataTrend}>{dataISOParaBR(ponto.data).slice(0, 5)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </Cartao>
      </ScrollView>
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: { padding: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
    cardStat: { width: '47%' },
    numeroStat: { fontFamily: fontes.display, fontSize: 25, color: cores.destaque },
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
    seloAtencao: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
    textoSeloAtencao: { fontSize: 11, fontWeight: '600', color: cores.perigo },

    blocoTrend: { marginBottom: 18, paddingBottom: 18 },
    blocoTrendComBorda: { borderBottomWidth: 1, borderBottomColor: cores.borda },
    nomeTrend: { color: cores.texto, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    barrasTrend: { flexDirection: 'row', gap: 10 },
    colunaTrend: { flex: 1, alignItems: 'center', gap: 5 },
    valorTrend: { fontSize: 11, fontWeight: '700', color: cores.textoSecundario },
    valorTrendAtivo: { color: cores.ambar },
    trilhoTrend: { width: '70%', height: 64, justifyContent: 'flex-end' },
    preenchidoTrend: {
      width: '100%',
      minHeight: 3,
      borderRadius: 4,
      backgroundColor: cores.borda,
    },
    preenchidoTrendAtivo: { backgroundColor: cores.ambar },
    dataTrend: { fontSize: 10, color: cores.textoFraco },

    semanaBarras: { flexDirection: 'row', gap: 6, height: 90, marginTop: 4 },
    semanaColuna: { flex: 1, alignItems: 'center', gap: 5 },
    semanaValor: { fontSize: 9, color: cores.textoFraco },
    semanaTrilho: { width: '100%', flex: 1, justifyContent: 'flex-end' },
    semanaPreenchido: {
      width: '100%',
      minHeight: 3,
      borderRadius: 4,
      backgroundColor: cores.borda,
    },
    semanaPreenchidoHoje: { backgroundColor: cores.destaque },
    semanaRotulo: { fontSize: 9.5, fontWeight: '600', color: cores.textoFraco },
  });
}
