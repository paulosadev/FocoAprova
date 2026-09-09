import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// toca mesmo com o iPhone no silencioso, senão o alerta do timer passa despercebido
setAudioModeAsync({ playsInSilentMode: true }).catch((erro) => {
  if (__DEV__) console.log('Não foi possível configurar o modo de áudio:', erro);
});

// beep do timer: cria um player novo por chamada e libera depois
export function tocarAlerta() {
  try {
    const player = createAudioPlayer(require('../../assets/sounds/beep.wav'));
    player.play();
    setTimeout(() => {
      try {
        player.remove();
      } catch (erroLimpeza) {
        // já foi liberado, sem problema
      }
    }, 3000);
  } catch (erro) {
    if (__DEV__) console.log('Não foi possível tocar o som:', erro);
  }
}
