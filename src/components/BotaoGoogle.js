import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { raio } from '../theme';
import { useTema } from '../context/ThemeContext';

export default function BotaoGoogle({ onPress, carregando, disabled }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  return (
    <TouchableOpacity
      style={[styles.botao, (disabled || carregando) && styles.desabilitado]}
      onPress={onPress}
      disabled={disabled || carregando}
      activeOpacity={0.8}
    >
      {carregando ? (
        <ActivityIndicator color={cores.texto} />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color={cores.texto} />
          <Text style={styles.texto}>Continuar com Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    botao: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: 52,
      borderRadius: raio.botao,
      borderWidth: 1.5,
      borderColor: cores.borda,
      backgroundColor: cores.superficie2,
    },
    desabilitado: { opacity: 0.6 },
    texto: { color: cores.texto, fontSize: 15, fontWeight: '600' },
  });
}
