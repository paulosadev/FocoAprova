import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

export async function pedirPermissaoNotificacao() {
  const atual = await Notifications.getPermissionsAsync();
  if (atual.status === 'granted') return true;
  const resposta = await Notifications.requestPermissionsAsync();
  return resposta.status === 'granted';
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
    console.log('Não foi possível notificar:', erro);
  }
}
