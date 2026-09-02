import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { raio } from '../theme';
import { useTema } from '../context/ThemeContext';

export default function Botao({ titulo, onPress, variante = 'primario', disabled, style }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const ehPrimario = variante === 'primario';
  return (
    <TouchableOpacity
      style={[
        styles.base,
        ehPrimario ? styles.primario : styles.secundario,
        disabled && styles.desabilitado,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.texto, ehPrimario ? styles.textoPrimario : styles.textoSecundario]}>
        {titulo}
      </Text>
    </TouchableOpacity>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    base: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: raio.botao,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primario: {
      backgroundColor: cores.destaque,
    },
    secundario: {
      backgroundColor: cores.superficie2,
      borderWidth: 1,
      borderColor: cores.borda,
    },
    desabilitado: {
      opacity: 0.6,
    },
    texto: {
      fontWeight: '700',
      fontSize: 15,
      letterSpacing: 0.3,
    },
    textoPrimario: {
      color: cores.destaqueTexto,
    },
    textoSecundario: {
      color: cores.texto,
    },
  });
}
