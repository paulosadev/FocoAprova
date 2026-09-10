import { useState } from 'react';
import { View, Text, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import Cartao from '../components/Cartao';
import CampoTexto from '../components/CampoTexto';
import Botao from '../components/Botao';

function emailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

export default function TrocarEmailScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { session } = useAuth();
  const emailAtual = session?.user?.email ?? '';

  const [novoEmail, setNovoEmail] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    const alvo = novoEmail.trim();
    if (!emailValido(alvo)) {
      Alert.alert('E-mail inválido', 'Digite um e-mail válido.');
      return;
    }
    if (alvo.toLowerCase() === emailAtual.toLowerCase()) {
      Alert.alert('Mesmo e-mail', 'O novo e-mail é igual ao atual.');
      return;
    }
    if (alvo.toLowerCase() !== confirmar.trim().toLowerCase()) {
      Alert.alert('E-mails diferentes', 'Os dois campos precisam ser iguais.');
      return;
    }

    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ email: alvo });
    setSalvando(false);
    Keyboard.dismiss();

    if (error) {
      Alert.alert('Não foi possível solicitar', error.message);
      return;
    }
    Alert.alert(
      'Confirmação enviada',
      'Verifique seu e-mail (o antigo e o novo) para confirmar a mudança. O e-mail só troca depois de confirmar.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }

  return (
    <View style={styles.flex}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          bottomOffset={20}
        >
          <Cartao>
            <Text style={styles.rotulo}>E-mail atual</Text>
            <Text style={styles.valor}>{emailAtual}</Text>

            <CampoTexto
              rotulo="Novo e-mail"
              placeholder="voce@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={novoEmail}
              onChangeText={setNovoEmail}
              returnKeyType="next"
            />
            <CampoTexto
              rotulo="Confirmar novo e-mail"
              placeholder="Repita o novo e-mail"
              autoCapitalize="none"
              keyboardType="email-address"
              value={confirmar}
              onChangeText={setConfirmar}
              returnKeyType="done"
              onSubmitEditing={salvar}
            />
          </Cartao>

          <Text style={styles.nota}>
            O Supabase manda um e-mail de confirmação antes de efetivar a troca — não muda na hora.
          </Text>

          <Botao
            titulo={salvando ? 'Enviando...' : 'Solicitar troca de e-mail'}
            onPress={salvar}
            disabled={salvando}
          />
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: cores.fundo },
    container: { padding: 16 },
    rotulo: {
      fontSize: 11,
      color: cores.textoFraco,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    valor: { fontSize: 15, color: cores.texto, marginBottom: 12 },
    nota: { fontSize: 12, color: cores.textoFraco, lineHeight: 18, marginBottom: 16 },
  });
}
