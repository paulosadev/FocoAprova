import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Vibration } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import Cartao from '../components/Cartao';
import Botao from '../components/Botao';
import SeletorDuracao from '../components/SeletorDuracao';
import ModoFoco from '../components/ModoFoco';
import { tocarAlerta } from '../lib/som';
import { notificar } from '../lib/notificacoes';
import { dataLocalISO } from '../lib/data';
import { fontes } from '../theme';

const KEEP_AWAKE_TAG = 'timer-focoaprova';

function formatar(segundos) {
  const s = Math.max(segundos, 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function TimerScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { session } = useAuth();

  // cada duração já guardada direto em minutos totais (0-1439), escolhida
  // pelo seletor de horário nativo — sem texto pra validar/limitar
  const [focoMin, setFocoMin] = useState(50);
  const [pausaMin, setPausaMin] = useState(10);
  const [pausaLongaMin, setPausaLongaMin] = useState(20);
  const [ciclosParaPausaLonga] = useState(4);

  const [modo, setModo] = useState('foco'); // foco | pausa | pausaLonga
  const [segundos, setSegundos] = useState(50 * 60);
  const [rodando, setRodando] = useState(false);
  const [ciclosFeitos, setCiclosFeitos] = useState(0);
  const [telaCheia, setTelaCheia] = useState(false);

  const intervaloRef = useRef(null);
  const rodandoRef = useRef(rodando);

  useEffect(() => {
    return () => deactivateKeepAwake(KEEP_AWAKE_TAG);
  }, []);

  useEffect(() => {
    rodandoRef.current = rodando;
  }, [rodando]);

  useEffect(() => {
    // atualiza o preview com a duração do bloco atual quando ela muda ou o
    // modo troca, mas só enquanto não estiver rodando (senão atropelaria a
    // contagem). Não depende de `rodando` pra não disparar (e resetar o
    // tempo) só porque o usuário pausou.
    if (rodandoRef.current) return;
    const duracoes = { foco: focoMin, pausa: pausaMin, pausaLonga: pausaLongaMin };
    setSegundos(duracoes[modo] * 60);
  }, [focoMin, pausaMin, pausaLongaMin, modo]);

  function iniciar() {
    setRodando(true);
    setTelaCheia(true);
    activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    intervaloRef.current = setInterval(() => {
      setSegundos((atual) => {
        if (atual <= 1) {
          finalizarBloco();
          return 0;
        }
        return atual - 1;
      });
    }, 1000);
  }

  function pausar() {
    setRodando(false);
    clearInterval(intervaloRef.current);
    deactivateKeepAwake(KEEP_AWAKE_TAG);
  }

  function reiniciar() {
    pausar();
    setModo('foco');
    setCiclosFeitos(0);
    setSegundos(focoMin * 60);
  }

  async function finalizarBloco() {
    Vibration.vibrate([0, 400, 200, 400, 200, 400]);
    tocarAlerta();
    clearInterval(intervaloRef.current);
    setRodando(false);
    setTelaCheia(false);
    deactivateKeepAwake(KEEP_AWAKE_TAG);

    if (modo === 'foco') {
      const novosCiclos = ciclosFeitos + 1;
      setCiclosFeitos(novosCiclos);
      registrarMinutos(focoMin, 'foco');
      notificar('Bloco de foco concluído', 'Hora da pausa.');
      const proximoModo = novosCiclos % ciclosParaPausaLonga === 0 ? 'pausaLonga' : 'pausa';
      setModo(proximoModo);
      setSegundos((proximoModo === 'pausaLonga' ? pausaLongaMin : pausaMin) * 60);
    } else {
      notificar('Pausa concluída', 'Hora de voltar ao foco.');
      setModo('foco');
      setSegundos(focoMin * 60);
    }
  }

  async function registrarMinutos(minutos, tipo) {
    if (!session) return;
    await supabase.from('sessoes_estudo').insert({
      user_id: session.user.id,
      minutos,
      tipo,
      data: dataLocalISO(),
    });
  }

  const rotulo = modo === 'foco' ? 'Foco' : modo === 'pausa' ? 'Pausa curta' : 'Pausa longa';
  const pontosPreenchidos = Array.from({ length: ciclosParaPausaLonga }).map(
    (_, i) => i < ciclosFeitos % ciclosParaPausaLonga,
  );

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <Cartao style={styles.cartaoTimer}>
          <Text style={styles.rotulo}>{rotulo}</Text>
          <Text style={styles.display}>{formatar(segundos)}</Text>

          <View style={styles.pontos}>
            {pontosPreenchidos.map((preenchido, i) => (
              <View key={i} style={[styles.ponto, preenchido && styles.pontoPreenchido]} />
            ))}
          </View>

          <View style={styles.controles}>
            <Botao
              titulo={rodando ? 'Pausar' : 'Iniciar'}
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
          <Text style={styles.tituloConfig}>Configurar tempos</Text>
          <SeletorDuracao rotulo="Foco" valorMinutos={focoMin} onAlterar={setFocoMin} />
          <SeletorDuracao rotulo="Pausa" valorMinutos={pausaMin} onAlterar={setPausaMin} />
          <SeletorDuracao
            rotulo="Pausa longa"
            valorMinutos={pausaLongaMin}
            onAlterar={setPausaLongaMin}
          />
        </Cartao>
      </ScrollView>

      <ModoFoco
        visivel={telaCheia}
        rotulo={rotulo}
        display={formatar(segundos)}
        pontos={pontosPreenchidos}
        rodando={rodando}
        onPausar={pausar}
        onIniciar={iniciar}
        onSair={() => setTelaCheia(false)}
      />
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: { padding: 16 },
    cartaoTimer: { alignItems: 'center' },
    rotulo: {
      fontSize: 13,
      color: cores.destaque,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 6,
    },
    display: {
      fontFamily: fontes.displaySemi,
      fontSize: 58,
      color: cores.texto,
      marginBottom: 14,
      fontVariant: ['tabular-nums'],
    },
    pontos: { flexDirection: 'row', gap: 8, marginBottom: 18 },
    ponto: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: cores.borda },
    pontoPreenchido: { backgroundColor: cores.ambar, borderColor: cores.ambar },
    controles: { flexDirection: 'row', gap: 10, width: '100%' },
    tituloConfig: {
      fontSize: 12,
      color: cores.textoSecundario,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
  });
}
