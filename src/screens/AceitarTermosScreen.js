import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';
import Botao from '../components/Botao';
import TermosScreen from './TermosScreen';

// gate exibido pra quem entrou sem passar pelo checkbox do cadastro por
// e-mail (hoje só acontece com login via Google, que não tem essa etapa) —
// fica em cima do app até `termos_aceitos_em` ser gravado no perfil.
export default function AceitarTermosScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { atualizarPerfil, sair } = useAuth();
  const [aceito, setAceito] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function confirmar() {
    setCarregando(true);
    const { error } = await atualizarPerfil({ termos_aceitos_em: new Date().toISOString() });
    setCarregando(false);
    if (error) return;
  }

  return (
    <View style={styles.flex}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Antes de continuar</Text>
        <Text style={styles.subtitulo}>
          Precisamos que você aceite os Termos de Uso para usar o FocoAprova.
        </Text>
      </View>

      <View style={styles.corpo}>
        <TermosScreen />
      </View>

      <View style={styles.rodape}>
        <TouchableOpacity
          style={styles.linhaTermos}
          onPress={() => setAceito((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, aceito && styles.checkboxMarcado]}>
            {aceito && <Ionicons name="checkmark" size={13} color={cores.destaqueTexto} />}
          </View>
          <Text style={styles.textoTermos}>Li e aceito os Termos de Uso acima</Text>
        </TouchableOpacity>

        <Botao
          titulo={carregando ? 'Aguarde...' : 'Aceitar e continuar'}
          onPress={confirmar}
          disabled={!aceito || carregando}
        />

        <TouchableOpacity onPress={sair} hitSlop={8} style={styles.sair}>
          <Text style={styles.sairTexto}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    cabecalho: { padding: 20, paddingBottom: 12 },
    titulo: { fontFamily: fontes.display, fontSize: 20, color: cores.texto, marginBottom: 6 },
    subtitulo: { fontSize: 13, color: cores.textoSecundario, lineHeight: 19 },
    corpo: { flex: 1 },
    rodape: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: cores.borda,
      backgroundColor: cores.fundo,
    },
    linhaTermos: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: cores.borda,
      backgroundColor: cores.superficie2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxMarcado: { backgroundColor: cores.destaque, borderColor: cores.destaque },
    textoTermos: { flex: 1, fontSize: 13, color: cores.textoSecundario },
    sair: { alignSelf: 'center', paddingVertical: 12 },
    sairTexto: { fontSize: 13, color: cores.perigo, fontWeight: '600' },
  });
}
