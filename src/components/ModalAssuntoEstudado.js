import { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useTema } from '../context/ThemeContext';
import CampoTexto from './CampoTexto';
import Botao from './Botao';

// modal exibido ao marcar uma disciplina como estudada, perguntando o assunto.
// "Pular" marca sem anotar nada, "Salvar" marca e guarda o texto.
export default function ModalAssuntoEstudado({ visivel, onPular, onSalvar }) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (visivel) setTexto('');
  }, [visivel]);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onPular}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.fundo}>
          <TouchableWithoutFeedback>
            <View style={styles.caixa}>
              <Text style={styles.titulo}>O que você estudou?</Text>
              <CampoTexto
                placeholder="Ex: Verbos irregulares"
                value={texto}
                onChangeText={setTexto}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => onSalvar(texto)}
              />
              <View style={styles.linhaBotoes}>
                <Botao titulo="Pular" onPress={onPular} variante="secundario" style={{ flex: 1 }} />
                <Botao titulo="Salvar" onPress={() => onSalvar(texto)} style={{ flex: 1 }} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    fundo: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 24,
    },
    caixa: {
      backgroundColor: cores.superficie,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 12,
      padding: 20,
    },
    titulo: { fontSize: 16, fontWeight: '700', color: cores.texto, marginBottom: 14 },
    linhaBotoes: { flexDirection: 'row', gap: 10, marginTop: 4 },
  });
}
