import { useState } from 'react';
import { Platform, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { raio } from '../theme';
import { useTema } from '../context/ThemeContext';

// data fixa só pra servir de "base" pro picker nativo — não representa uma
// data real, só carrega a hora/minuto que a pessoa está escolhendo
function minutosParaData(minutos) {
  const data = new Date(2000, 0, 1, 0, 0, 0, 0);
  data.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0);
  return data;
}

// lê o horário escolhido como duração (ex: "01:30" selecionado = 1h30min),
// nunca como um horário do relógio
function dataParaMinutos(data) {
  return data.getHours() * 60 + data.getMinutes();
}

function formatarDuracao(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// seletor de duração nativo (mesma "rodinha" de configurar um alarme),
// sempre em formato 24h pra não confundir duração com horário do dia
export default function SeletorDuracao({ rotulo, valorMinutos, onAlterar }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const [abertoIOS, setAbertoIOS] = useState(false);

  function abrir() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: minutosParaData(valorMinutos),
        mode: 'time',
        is24Hour: true,
        onChange: (evento, data) => {
          if (evento.type === 'set' && data) onAlterar(dataParaMinutos(data));
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
        <Text style={styles.valor}>{formatarDuracao(valorMinutos)}</Text>
        <Ionicons name="time-outline" size={20} color={cores.textoFraco} />
      </TouchableOpacity>

      {Platform.OS === 'ios' && abertoIOS && (
        <DateTimePicker
          value={minutosParaData(valorMinutos)}
          mode="time"
          is24Hour
          display="spinner"
          onChange={(evento, data) => {
            if (data) onAlterar(dataParaMinutos(data));
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
    valor: { fontSize: 18, fontWeight: '700', color: cores.texto, letterSpacing: 1 },
  });
}
