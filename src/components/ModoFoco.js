import { Modal, View, Text, StyleSheet } from 'react-native';
import Botao from './Botao';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';

// tela cheia do Timer/Simulado, só cronômetro e botões pra evitar distração
export default function ModoFoco({ visivel, rotulo, display, pontos, onPausar, onSair }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  return (
    <Modal
      visible={visivel}
      animationType="fade"
      statusBarTranslucent
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {!!rotulo && <Text style={styles.rotulo}>{rotulo}</Text>}
        <Text style={styles.display}>{display}</Text>

        {pontos && (
          <View style={styles.pontos}>
            {pontos.map((preenchido, i) => (
              <View key={i} style={[styles.ponto, preenchido && styles.pontoPreenchido]} />
            ))}
          </View>
        )}

        <View style={styles.controles}>
          <Botao titulo="Pausar" onPress={onPausar} variante="secundario" style={{ flex: 1 }} />
          <Botao
            titulo="Sair da tela cheia"
            onPress={onSair}
            variante="secundario"
            style={{ flex: 1 }}
          />
        </View>

        <Text style={styles.dica}>
          Dica: ative o "Não perturbe" do seu celular agora pra evitar notificações de outros apps.
        </Text>
      </View>
    </Modal>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: cores.fundo,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    rotulo: {
      fontSize: 15,
      color: cores.destaque,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 10,
    },
    display: {
      fontFamily: fontes.displaySemi,
      fontSize: 66,
      color: cores.texto,
      marginBottom: 20,
      fontVariant: ['tabular-nums'],
    },
    pontos: { flexDirection: 'row', gap: 10, marginBottom: 30 },
    ponto: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: cores.borda },
    pontoPreenchido: { backgroundColor: cores.ambar, borderColor: cores.ambar },
    controles: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 24 },
    dica: {
      position: 'absolute',
      bottom: 32,
      fontSize: 12,
      color: cores.textoFraco,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
  });
}
