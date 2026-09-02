import { createAudioPlayer } from 'expo-audio';

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
    console.log('Não foi possível tocar o som:', erro);
  }
}
