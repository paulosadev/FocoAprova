import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { raio } from '../theme';
import { useTema } from '../context/ThemeContext';

// variante 'cheio' = botão largo com texto (tela de boas-vindas)
// variante 'icone' = só o símbolo do Google, círculo branco (abaixo do formulário)
export default function BotaoGoogle({ onPress, carregando, disabled, variante = 'cheio' }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const bloqueado = disabled || carregando;

  if (variante === 'icone') {
    return (
      <TouchableOpacity
        style={[styles.iconeBotao, bloqueado && styles.desabilitado]}
        onPress={onPress}
        disabled={bloqueado}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Continuar com Google"
      >
        {carregando ? (
          <ActivityIndicator color="#1f1f1f" />
        ) : (
          <Ionicons name="logo-google" size={22} color="#1f1f1f" />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.botao, bloqueado && styles.desabilitado]}
      onPress={onPress}
      disabled={bloqueado}
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
    texto: { color: cores.texto, fontSize: 15, fontWeight: '600' },
    iconeBotao: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    desabilitado: { opacity: 0.6 },
  });
}
