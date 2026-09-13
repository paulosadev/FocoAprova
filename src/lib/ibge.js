import AsyncStorage from '@react-native-async-storage/async-storage';

// estados e municípios do IBGE — API pública, sem chave, CORS liberado.
// Estados praticamente nunca mudam, então cacheamos em disco (AsyncStorage)
// além do cache em memória; municípios só ficam em memória durante a sessão.

const CHAVE_ESTADOS = '@focoaprova_ibge_estados';
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome';

let estadosCache = null;
const municipiosCachePorUf = new Map();

// { sigla: 'MA', nome: 'Maranhão' }[] — lança erro se não conseguir buscar
// nem tem nada em cache (disco), pra quem chama decidir o fallback.
export async function buscarEstados() {
  if (estadosCache) return estadosCache;

  try {
    const resposta = await fetch(URL_ESTADOS);
    if (!resposta.ok) throw new Error(`IBGE respondeu ${resposta.status}`);
    const dados = await resposta.json();
    const estados = dados.map((e) => ({ sigla: e.sigla, nome: e.nome }));
    estadosCache = estados;
    AsyncStorage.setItem(CHAVE_ESTADOS, JSON.stringify(estados)).catch(() => {});
    return estados;
  } catch (erroRede) {
    try {
      const salvos = await AsyncStorage.getItem(CHAVE_ESTADOS);
      if (salvos) {
        estadosCache = JSON.parse(salvos);
        return estadosCache;
      }
    } catch {
      // sem cache em disco também — segue pro throw abaixo
    }
    throw erroRede;
  }
}

// { nome: 'São Luís' }[] — lança erro se a busca falhar, pra quem chama cair
// no campo de texto livre em vez de travar o cadastro.
export async function buscarMunicipios(uf) {
  if (municipiosCachePorUf.has(uf)) return municipiosCachePorUf.get(uf);

  const resposta = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
  );
  if (!resposta.ok) throw new Error(`IBGE respondeu ${resposta.status}`);
  const dados = await resposta.json();
  const municipios = dados.map((m) => ({ nome: m.nome }));
  municipiosCachePorUf.set(uf, municipios);
  return municipios;
}
