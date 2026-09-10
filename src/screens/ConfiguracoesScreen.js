import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import { usePreferencias } from '../context/PreferenciasContext';
import { permissaoNotificacaoConcedida, pedirPermissaoNotificacao } from '../lib/notificacoes';
import Cartao from '../components/Cartao';

// trocar pela URL real do formulário de sugestões quando estiver pronta
const URL_SUGESTOES = null;

const MODOS_TEMA = [
  { valor: 'light', rotulo: 'Claro' },
  { valor: 'dark', rotulo: 'Escuro' },
  { valor: 'system', rotulo: 'Sistema' },
];

const versao = Constants.expoConfig?.version ?? '1.0.0';

export default function ConfiguracoesScreen() {
  const { cores, modo, setModo } = useTema();
  const styles = criarEstilos(cores);
  const { sair } = useAuth();
  const { somAtivado, setSomAtivado } = usePreferencias();

  const [notificacoesAtivas, setNotificacoesAtivas] = useState(false);

  useEffect(() => {
    permissaoNotificacaoConcedida().then(setNotificacoesAtivas);
  }, []);

  async function ativarNotificacoes() {
    const concedida = await pedirPermissaoNotificacao();
    setNotificacoesAtivas(concedida);
    if (!concedida) {
      Alert.alert(
        'Permissão negada',
        'Ative as notificações do FocoAprova nas configurações do sistema.',
      );
    }
  }

  function abrirSugestoes() {
    if (URL_SUGESTOES) {
      Linking.openURL(URL_SUGESTOES);
    } else {
      Alert.alert('Em breve', 'O formulário de sugestões ainda vai ser disponibilizado.');
    }
  }

  function abrirAjuda() {
    Alert.alert(
      'Como usar',
      'Monte seu cronograma por dia da semana, use o Timer pra blocos de foco, registre questões e simulados, e acompanhe tudo em Progresso.',
    );
  }

  function confirmarSaida() {
    Alert.alert('Sair da conta', 'Tem certeza que quer sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => sair() },
    ]);
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {/* Aparência */}
      <Cartao>
        <Text style={styles.tituloCartao}>Aparência</Text>
        <View style={styles.linhaChips}>
          {MODOS_TEMA.map((m) => (
            <TouchableOpacity
              key={m.valor}
              style={[styles.chip, modo === m.valor && styles.chipAtivo]}
              onPress={() => setModo(m.valor)}
            >
              <Text style={[styles.textoChip, modo === m.valor && styles.textoChipAtivo]}>
                {m.rotulo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Cartao>

      {/* Preferências */}
      <Cartao>
        <Text style={styles.tituloCartao}>Preferências</Text>

        <View style={[styles.linhaItem, styles.comBorda]}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitulo}>Notificações</Text>
            <Text style={styles.itemSub}>Avisos de fim de bloco e de pausa</Text>
          </View>
          {notificacoesAtivas ? (
            <Text style={styles.badgeOk}>Ativadas</Text>
          ) : (
            <TouchableOpacity style={styles.botaoPequeno} onPress={ativarNotificacoes}>
              <Text style={styles.botaoPequenoTexto}>Ativar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.linhaItem}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitulo}>Som</Text>
            <Text style={styles.itemSub}>Bipes do timer e do simulado</Text>
          </View>
          <Switch
            value={somAtivado}
            onValueChange={setSomAtivado}
            trackColor={{ false: cores.borda, true: cores.destaque }}
            thumbColor={cores.superficie}
            ios_backgroundColor={cores.borda}
          />
        </View>
      </Cartao>

      {/* Links */}
      <Cartao>
        <TouchableOpacity style={[styles.linhaLink, styles.comBorda]} onPress={abrirAjuda}>
          <Text style={styles.linkTexto}>Ajuda / Como usar</Text>
          <Ionicons name="chevron-forward" size={18} color={cores.textoFraco} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.linhaLink, styles.comBorda]} onPress={abrirSugestoes}>
          <Text style={styles.linkTexto}>Enviar sugestão ou relatar bug</Text>
          <Ionicons name="open-outline" size={17} color={cores.textoFraco} />
        </TouchableOpacity>

        <View style={styles.linhaLink}>
          <View>
            <Text style={styles.linkTexto}>Sobre o app</Text>
            <Text style={styles.itemSub}>FocoAprova · v{versao}</Text>
          </View>
        </View>
      </Cartao>

      <TouchableOpacity style={styles.botaoSair} onPress={confirmarSaida}>
        <Text style={styles.botaoSairTexto}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: { padding: 16 },
    tituloCartao: {
      fontSize: 12,
      fontWeight: '700',
      color: cores.textoSecundario,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    linhaChips: { flexDirection: 'row', gap: 8 },
    chip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 9,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: cores.borda,
      backgroundColor: cores.superficie2,
    },
    chipAtivo: { backgroundColor: cores.destaque, borderColor: cores.destaque },
    textoChip: { fontSize: 13, color: cores.textoSecundario },
    textoChipAtivo: { color: cores.destaqueTexto, fontWeight: '700' },

    linhaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
    },
    comBorda: { borderBottomWidth: 1, borderBottomColor: cores.borda },
    itemInfo: { flex: 1 },
    itemTitulo: { fontSize: 14, color: cores.texto },
    itemSub: { fontSize: 11, color: cores.textoFraco, marginTop: 2 },
    badgeOk: { fontSize: 13, color: cores.sucesso, fontWeight: '600' },
    botaoPequeno: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: cores.destaque,
    },
    botaoPequenoTexto: { color: cores.destaqueTexto, fontSize: 13, fontWeight: '700' },

    linhaLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
    },
    linkTexto: { fontSize: 14, color: cores.texto },

    botaoSair: {
      marginTop: 4,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: cores.perigo,
    },
    botaoSairTexto: { color: cores.perigo, fontSize: 15, fontWeight: '600' },
  });
}
