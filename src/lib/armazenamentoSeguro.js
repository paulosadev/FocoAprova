import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';

// Guarda a sessão do Supabase (access + refresh token) cifrada: o texto
// cifrado fica no AsyncStorage e a chave AES de 256 bits fica no
// Keychain/Keystore via SecureStore. Assim não esbarra no limite de
// 2048 bytes do SecureStore no Android, mas os tokens nunca ficam em
// texto puro no disco.
// Baseado no LargeSecureStore da documentação do Supabase.

async function cifrar(chave, valor) {
  const chaveAES = crypto.getRandomValues(new Uint8Array(256 / 8));
  const cipher = new aesjs.ModeOfOperation.ctr(chaveAES, new aesjs.Counter(1));
  const bytesCifrados = cipher.encrypt(aesjs.utils.utf8.toBytes(valor));

  await SecureStore.setItemAsync(chave, aesjs.utils.hex.fromBytes(chaveAES));
  return aesjs.utils.hex.fromBytes(bytesCifrados);
}

async function decifrar(chave, valorCifrado) {
  const chaveAESHex = await SecureStore.getItemAsync(chave);
  if (!chaveAESHex) return null;

  const cipher = new aesjs.ModeOfOperation.ctr(
    aesjs.utils.hex.toBytes(chaveAESHex),
    new aesjs.Counter(1),
  );
  const bytesDecifrados = cipher.decrypt(aesjs.utils.hex.toBytes(valorCifrado));
  return aesjs.utils.utf8.fromBytes(bytesDecifrados);
}

export const armazenamentoSeguro = {
  async getItem(chave) {
    const cifrado = await AsyncStorage.getItem(chave);
    if (!cifrado) return null;
    try {
      return await decifrar(chave, cifrado);
    } catch {
      // chave AES sumiu ou dado corrompido: limpa e força novo login
      await this.removeItem(chave);
      return null;
    }
  },
  async setItem(chave, valor) {
    const cifrado = await cifrar(chave, valor);
    await AsyncStorage.setItem(chave, cifrado);
  },
  async removeItem(chave) {
    await AsyncStorage.removeItem(chave);
    await SecureStore.deleteItemAsync(chave);
  },
};
