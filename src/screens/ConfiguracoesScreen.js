import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import { usePreferencias } from '../context/PreferenciasContext';
import Cartao from '../components/Cartao';

const URL_SUGESTOES = 'https://forms.gle/vdpSEC1AW84Noayn8';

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
  const router = useRouter();

  function abrirSugestoes() {
    Linking.openURL(URL_SUGESTOES).catch(() => {
      Alert.alert('Não foi possível abrir', 'Tente novamente em instantes.');
    });
  }

  function sobre() {
    const id = (Updates.updateId ?? 'embutido').slice(0, 8);
    Alert.alert(
      'FocoAprova',
      `Versão ${versao}\n\nApp para organizar sua rotina de estudos.\n\ncanal: ${Updates.channel ?? '-'}\nupdate: ${id}\nruntime: ${(Updates.runtimeVersion ?? '-').slice(0, 12)}`,
    );
  }

  async function verificarAtualizacao() {
    if (!Updates.isEnabled) {
      Alert.alert('Indisponível', 'A verificação de atualização só funciona no app publicado.');
      return;
    }
    try {
      const r = await Updates.checkForUpdateAsync();
      if (!r.isAvailable) {
        Alert.alert('Tudo atualizado', 'Você já está na versão mais recente.');
        return;
      }
      await Updates.fetchUpdateAsync();
      Alert.alert('Atualização baixada', 'O app vai reiniciar para aplicar.', [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Reiniciar', onPress: () => Updates.reloadAsync() },
      ]);
    } catch (erro) {
      Alert.alert('Não deu pra verificar', String(erro?.message ?? erro));
    }
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

      {/* Som */}
      <Cartao>
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
        <TouchableOpacity style={[styles.linhaLink, styles.comBorda]} onPress={() => router.push('/ajuda')}>
          <Text style={styles.linkTexto}>Ajuda / Como usar</Text>
          <Ionicons name="chevron-forward" size={18} color={cores.textoFraco} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.linhaLink, styles.comBorda]} onPress={abrirSugestoes}>
          <Text style={styles.linkTexto}>Enviar sugestão ou relatar bug</Text>
          <Ionicons name="open-outline" size={17} color={cores.textoFraco} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.linhaLink, styles.comBorda]} onPress={verificarAtualizacao}>
          <Text style={styles.linkTexto}>Verificar atualização</Text>
          <Ionicons name="refresh" size={17} color={cores.textoFraco} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linhaLink} onPress={sobre}>
          <View>
            <Text style={styles.linkTexto}>Sobre o app</Text>
            <Text style={styles.itemSub}>FocoAprova · v{versao}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={cores.textoFraco} />
        </TouchableOpacity>
      </Cartao>

      {/* Conta */}
      <Cartao>
        <Text style={styles.tituloCartao}>Conta</Text>

        <TouchableOpacity
          style={[styles.linhaLink, styles.comBorda]}
          onPress={() => router.push('/trocar-senha')}
        >
          <Text style={styles.linkTexto}>Trocar senha</Text>
          <Ionicons name="chevron-forward" size={18} color={cores.textoFraco} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.linhaLink, styles.comBorda]}
          onPress={() => router.push('/trocar-email')}
        >
          <Text style={styles.linkTexto}>Trocar e-mail</Text>
          <Ionicons name="chevron-forward" size={18} color={cores.textoFraco} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linhaLink} onPress={confirmarSaida}>
          <Text style={[styles.linkTexto, { color: cores.perigo }]}>Sair da conta</Text>
        </TouchableOpacity>
      </Cartao>
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

    linhaItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemInfo: { flex: 1 },
    itemTitulo: { fontSize: 14, color: cores.texto },
    itemSub: { fontSize: 11, color: cores.textoFraco, marginTop: 2 },

    comBorda: { borderBottomWidth: 1, borderBottomColor: cores.borda },
    linhaLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
    },
    linkTexto: { fontSize: 14, color: cores.texto },
  });
}
