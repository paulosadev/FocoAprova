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

export default function TrocarSenhaScreen() {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const { session } = useAuth();
  const email = session?.user?.email ?? '';

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!senhaAtual) {
      Alert.alert('Falta a senha atual', 'Digite sua senha atual para confirmar.');
      return;
    }
    if (novaSenha.length < 8) {
      Alert.alert('Senha curta', 'A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      Alert.alert('Senhas diferentes', 'A nova senha e a confirmação precisam ser iguais.');
      return;
    }

    setSalvando(true);

    // reautentica com a senha atual antes de trocar
    const { error: erroReauth } = await supabase.auth.signInWithPassword({
      email,
      password: senhaAtual,
    });
    if (erroReauth) {
      setSalvando(false);
      Alert.alert('Senha atual incorreta', 'Confira a senha atual e tente de novo.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setSalvando(false);
    Keyboard.dismiss();

    if (error) {
      Alert.alert('Não foi possível trocar', error.message);
      return;
    }
    Alert.alert('Senha atualizada!', 'Sua senha foi alterada com sucesso.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
            <Text style={styles.aviso}>
              Confirme sua senha atual e escolha uma nova (mínimo 8 caracteres).
            </Text>
            <CampoTexto
              rotulo="Senha atual"
              secureTextEntry
              value={senhaAtual}
              onChangeText={setSenhaAtual}
              returnKeyType="next"
            />
            <CampoTexto
              rotulo="Nova senha"
              secureTextEntry
              value={novaSenha}
              onChangeText={setNovaSenha}
              returnKeyType="next"
            />
            <CampoTexto
              rotulo="Confirmar nova senha"
              secureTextEntry
              value={confirmar}
              onChangeText={setConfirmar}
              returnKeyType="done"
              onSubmitEditing={salvar}
            />
          </Cartao>

          <Botao
            titulo={salvando ? 'Salvando...' : 'Trocar senha'}
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
    aviso: { fontSize: 13, color: cores.textoSecundario, lineHeight: 19, marginBottom: 12 },
  });
}
