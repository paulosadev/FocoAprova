import AsyncStorage from '@react-native-async-storage/async-storage';

// preferências locais simples (mesmo padrão do tema): guardadas no AsyncStorage
// e lidas de um cache em memória pra quem não é componente (ex: som.js)

const CHAVE_SOM = '@focoaprova_som_ativado';

let somAtivadoCache = true;

// carrega o quanto antes pro cache; som.js já pode ler mesmo antes do provider montar
AsyncStorage.getItem(CHAVE_SOM)
  .then((valor) => {
    if (valor !== null) somAtivadoCache = valor === 'true';
  })
  .catch(() => {});

export function getSomAtivado() {
  return somAtivadoCache;
}

export async function carregarSomAtivado() {
  try {
    const valor = await AsyncStorage.getItem(CHAVE_SOM);
    somAtivadoCache = valor === null ? true : valor === 'true';
  } catch {
    somAtivadoCache = true;
  }
  return somAtivadoCache;
}

export async function salvarSomAtivado(ativado) {
  somAtivadoCache = ativado;
  try {
    await AsyncStorage.setItem(CHAVE_SOM, ativado ? 'true' : 'false');
  } catch {
    // se não salvar, a preferência vale só pra esta sessão
  }
}
