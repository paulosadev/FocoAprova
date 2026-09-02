import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Vibration,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import Cartao from '../components/Cartao';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import ModoFoco from '../components/ModoFoco';
import { tocarAlerta } from '../lib/som';
import {
  notificar,
  pedirPermissaoNotificacao,
  permissaoNotificacaoConcedida,
} from '../lib/notificacoes';
import { dataLocalISO } from '../lib/data';

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

  const [focoMin, setFocoMin] = useState(50);
  const [pausaMin, setPausaMin] = useState(10);
  const [pausaLongaMin, setPausaLongaMin] = useState(20);
  const [ciclosParaPausaLonga] = useState(4);

  const [modo, setModo] = useState('foco'); // foco | pausa | pausaLonga
  const [segundos, setSegundos] = useState(50 * 60);
  const [rodando, setRodando] = useState(false);
  const [ciclosFeitos, setCiclosFeitos] = useState(0);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);

  const intervaloRef = useRef(null);

  useEffect(() => {
    permissaoNotificacaoConcedida().then(setNotificacoesAtivas);
    return () => deactivateKeepAwake(KEEP_AWAKE_TAG);
  }, []);

  useEffect(() => {
    if (!rodando && modo === 'foco') {
      setSegundos(focoMin * 60);
    }
  }, [focoMin]);

  function iniciar() {
    Keyboard.dismiss();
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
    setTelaCheia(false);
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

  async function alternarNotificacoes() {
    const concedida = await pedirPermissaoNotificacao();
    setNotificacoesAtivas(concedida);
  }

  const rotulo = modo === 'foco' ? 'Foco' : modo === 'pausa' ? 'Pausa curta' : 'Pausa longa';
  const pontosPreenchidos = Array.from({ length: ciclosParaPausaLonga }).map(
    (_, i) => i < ciclosFeitos % ciclosParaPausaLonga,
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
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

            <Botao
              titulo={notificacoesAtivas ? 'Notificações ativadas' : 'Ativar notificações'}
              onPress={alternarNotificacoes}
              variante="secundario"
              style={{ marginTop: 10 }}
            />
          </Cartao>

          <Cartao>
            <Text style={styles.tituloConfig}>Configurar tempos (minutos)</Text>
            <View style={styles.linhaConfig}>
              <CampoTexto
                style={styles.campoConfig}
                rotulo="Foco"
                keyboardType="number-pad"
                returnKeyType="done"
                value={String(focoMin)}
                onChangeText={(v) => setFocoMin(Number(v) || 1)}
                onSubmitEditing={Keyboard.dismiss}
              />
              <CampoTexto
                style={styles.campoConfig}
                rotulo="Pausa"
                keyboardType="number-pad"
                returnKeyType="done"
                value={String(pausaMin)}
                onChangeText={(v) => setPausaMin(Number(v) || 1)}
                onSubmitEditing={Keyboard.dismiss}
              />
              <CampoTexto
                style={styles.campoConfig}
                rotulo="Pausa longa"
                keyboardType="number-pad"
                returnKeyType="done"
                value={String(pausaLongaMin)}
                onChangeText={(v) => setPausaLongaMin(Number(v) || 1)}
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>
            <Botao titulo="Concluído" onPress={Keyboard.dismiss} variante="secundario" />
          </Cartao>
        </ScrollView>
      </TouchableWithoutFeedback>

      <ModoFoco
        visivel={telaCheia}
        rotulo={rotulo}
        display={formatar(segundos)}
        pontos={pontosPreenchidos}
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
    cartaoTimer: { alignItems: 'center' },
    rotulo: {
      fontSize: 13,
      color: cores.destaque,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 6,
    },
    display: { fontSize: 56, fontWeight: '700', color: cores.texto, marginBottom: 14 },
    pontos: { flexDirection: 'row', gap: 8, marginBottom: 18 },
    ponto: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: cores.borda },
    pontoPreenchido: { backgroundColor: cores.destaque, borderColor: cores.destaque },
    controles: { flexDirection: 'row', gap: 10, width: '100%' },
    tituloConfig: {
      fontSize: 12,
      color: cores.textoSecundario,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    linhaConfig: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    campoConfig: { flex: 1 },
  });
}
