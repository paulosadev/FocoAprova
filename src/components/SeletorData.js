import { useState } from 'react';
import { Platform, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { raio } from '../theme';
import { useTema } from '../context/ThemeContext';

function formatarBR(data) {
  if (!data) return '';
  const d = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${data.getFullYear()}`;
}

// seletor de data com o calendário nativo (mesma lib do seletor de horário),
// sem digitação manual
export default function SeletorData({ rotulo, valor, onAlterar, minimo, maximo, placeholder }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const [abertoIOS, setAbertoIOS] = useState(false);
  const base = valor || maximo || new Date();

  function abrir() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: base,
        mode: 'date',
        minimumDate: minimo,
        maximumDate: maximo,
        onChange: (evento, data) => {
          if (evento.type === 'set' && data) onAlterar(data);
        },
      });
    } else {
      setAbertoIOS((v) => !v);
    }
  }

  return (
    <View style={styles.grupo}>
      {!!rotulo && <Text style={styles.rotulo}>{rotulo}</Text>}
      <TouchableOpacity style={styles.campo} onPress={abrir} activeOpacity={0.7}>
        <Text style={[styles.valor, !valor && styles.placeholder]}>
          {valor ? formatarBR(valor) : placeholder || 'Escolher data'}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={cores.textoFraco} />
      </TouchableOpacity>

      {Platform.OS === 'ios' && abertoIOS && (
        <DateTimePicker
          value={base}
          mode="date"
          display="spinner"
          minimumDate={minimo}
          maximumDate={maximo}
          onChange={(evento, data) => {
            if (data) onAlterar(data);
          }}
        />
      )}
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    grupo: { marginBottom: 12 },
    rotulo: {
      fontSize: 11,
      color: cores.textoFraco,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    campo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: raio.pequeno,
      padding: 12,
      backgroundColor: cores.superficie2,
    },
    valor: { fontSize: 15, color: cores.texto },
    placeholder: { color: cores.textoFraco },
  });
}
