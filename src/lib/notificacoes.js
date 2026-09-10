import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_JA_SOLICITADA = '@focoaprova_notificacao_ja_solicitada';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function permissaoNotificacaoConcedida() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// pede a permissão UMA única vez na vida do app (primeira entrada, depois da
// Boas-vindas/Objetivo). Se a pessoa negar, nunca mais pergunta.
export async function garantirPermissaoNotificacao() {
  try {
    const jaSolicitada = await AsyncStorage.getItem(CHAVE_JA_SOLICITADA);
    if (jaSolicitada) return;

    const atual = await Notifications.getPermissionsAsync();
    if (atual.status === 'undetermined' || atual.canAskAgain) {
      await Notifications.requestPermissionsAsync();
    }
    await AsyncStorage.setItem(CHAVE_JA_SOLICITADA, '1');
  } catch (erro) {
    if (__DEV__) console.log('Não foi possível solicitar notificação:', erro);
  }
}

export async function notificar(titulo, corpo) {
  try {
    const permitido = await permissaoNotificacaoConcedida();
    if (!permitido) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'FocoAprova',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: corpo },
      trigger: null,
    });
  } catch (erro) {
    if (__DEV__) console.log('Não foi possível notificar:', erro);
  }
}
