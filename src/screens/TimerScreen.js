import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Vibration } from 'react-native';
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
  const [avancoAutomatico, setAvancoAutomatico] = useState(true);

  const intervaloRef = useRef(null);
  const rodandoRef = useRef(rodando);
  // finalizarBloco roda dentro do callback do setInterval criado em iniciar(),
  // que fecha sobre o valor de avancoAutomatico daquele render — sem a ref,
  // ligar/desligar o interruptor durante uma etapa em andamento só valeria a
  // partir da próxima vez que o timer for iniciado
  const avancoAutomaticoRef = useRef(avancoAutomatico);
  // deactivateKeepAwake quebra se chamado sem nunca ter ativado (ex: sair da
  // aba sem apertar "Iniciar") — só desativa no cleanup se de fato ativou
  const ativouKeepAwakeRef = useRef(false);

  useEffect(() => {
    avancoAutomaticoRef.current = avancoAutomatico;
  }, [avancoAutomatico]);

  useEffect(() => {
    return () => {
      if (ativouKeepAwakeRef.current) deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
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

  function iniciarIntervalo() {
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

  function iniciar() {
    setRodando(true);
    setTelaCheia(true);
    activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    ativouKeepAwakeRef.current = true;
    iniciarIntervalo();
  }

  function pausar() {
    setRodando(false);
    clearInterval(intervaloRef.current);
    // "Reiniciar" chama pausar() mesmo sem nunca ter apertado "Iniciar" —
    // sem essa checagem quebra igual ao bug do cleanup (ver useEffect acima)
    if (ativouKeepAwakeRef.current) {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
      ativouKeepAwakeRef.current = false;
    }
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

    const automatico = avancoAutomaticoRef.current;
    let proximoModo;
    let proximoSegundos;

    if (modo === 'foco') {
      const novosCiclos = ciclosFeitos + 1;
      setCiclosFeitos(novosCiclos);
      registrarMinutos(focoMin, 'foco');
      proximoModo = novosCiclos % ciclosParaPausaLonga === 0 ? 'pausaLonga' : 'pausa';
      proximoSegundos = (proximoModo === 'pausaLonga' ? pausaLongaMin : pausaMin) * 60;
      notificar(
        'Bloco de foco concluído',
        automatico ? 'Começando a pausa.' : 'Hora da pausa.',
      );
    } else {
      proximoModo = 'foco';
      proximoSegundos = focoMin * 60;
      notificar(
        'Pausa concluída',
        automatico ? 'Voltando ao foco.' : 'Hora de voltar ao foco.',
      );
    }

    setModo(proximoModo);
    setSegundos(proximoSegundos);

    // avanço automático: segue direto pra próxima etapa sem exigir toque em
    // "Iniciar" — mantém rodando, tela cheia e o "manter tela acesa" como
    // estavam. Senão, comportamento de sempre: para e espera o usuário.
    if (automatico) {
      iniciarIntervalo();
    } else {
      setRodando(false);
      setTelaCheia(false);
      if (ativouKeepAwakeRef.current) {
        deactivateKeepAwake(KEEP_AWAKE_TAG);
        ativouKeepAwakeRef.current = false;
      }
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
          <View style={styles.linhaItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitulo}>Avançar automaticamente</Text>
              <Text style={styles.itemSub}>
                Segue direto pra próxima etapa até a pausa longa, sem precisar tocar em Iniciar
              </Text>
            </View>
            <Switch
              value={avancoAutomatico}
              onValueChange={setAvancoAutomatico}
              trackColor={{ false: cores.borda, true: cores.destaque }}
              thumbColor={cores.superficie}
              ios_backgroundColor={cores.borda}
            />
          </View>
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
    linhaItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemInfo: { flex: 1 },
    itemTitulo: { fontSize: 14, color: cores.texto },
    itemSub: { fontSize: 11, color: cores.textoFraco, marginTop: 2 },
    tituloConfig: {
      fontSize: 12,
      color: cores.textoSecundario,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
  });
}
