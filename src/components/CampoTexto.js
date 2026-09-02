import { TextInput, View, Text, StyleSheet } from 'react-native';
import { raio } from '../theme';
import { useTema } from '../context/ThemeContext';

export default function CampoTexto({ rotulo, style, inputStyle, ...props }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  return (
    <View style={[styles.grupo, style]}>
      {rotulo ? <Text style={styles.rotulo}>{rotulo}</Text> : null}
      <TextInput
        placeholderTextColor={cores.textoFraco}
        style={[styles.input, inputStyle]}
        {...props}
      />
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    grupo: {
      marginBottom: 12,
    },
    rotulo: {
      fontSize: 11,
      color: cores.textoFraco,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: raio.pequeno,
      padding: 12,
      fontSize: 15,
      color: cores.texto,
      backgroundColor: cores.superficie2,
    },
  });
}
