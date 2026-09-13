import { useState, useEffect, useRef } from 'react';
import { buscarEstados, buscarMunicipios } from './ibge';

// cascata Estado -> Cidade via IBGE, com fallback pra texto livre em caso de
// falha de rede. `ativo` controla quando a lista de estados é buscada (só
// quando o formulário que usa isso está de fato visível). Compartilhado entre
// o Cadastro (LoginScreen) e a edição de Perfil.
export function useEstadoCidade({ ativo }) {
  const [estados, setEstados] = useState([]);
  const [carregandoEstados, setCarregandoEstados] = useState(false);
  const [estadoFallback, setEstadoFallback] = useState(false);
  const [estadoLivre, setEstadoLivre] = useState('');
  const [estadoSelecionado, setEstadoSelecionado] = useState(null); // { sigla, nome }

  const [cidades, setCidades] = useState([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [cidadeFallback, setCidadeFallback] = useState(false);
  const [cidade, setCidade] = useState('');

  // sigla que ainda não pôde ser casada porque a lista de estados não tinha
  // chegado ainda (ex: preencher() chamado antes do fetch terminar)
  const siglaPendenteRef = useRef(null);

  useEffect(() => {
    if (!ativo || estados.length > 0 || estadoFallback) return;
    setCarregandoEstados(true);
    buscarEstados()
      .then((lista) => {
        setEstados(lista);
        const siglaPendente = siglaPendenteRef.current;
        if (siglaPendente) {
          siglaPendenteRef.current = null;
          const encontrado = lista.find((e) => e.sigla === siglaPendente);
          if (encontrado) {
            setEstadoSelecionado(encontrado);
            carregarCidades(encontrado.sigla);
          } else {
            setEstadoFallback(true);
          }
        }
      })
      .catch(() => setEstadoFallback(true))
      .finally(() => setCarregandoEstados(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo]);

  function carregarCidades(sigla) {
    setCidades([]);
    setCidadeFallback(false);
    setCarregandoCidades(true);
    buscarMunicipios(sigla)
      .then(setCidades)
      .catch(() => setCidadeFallback(true))
      .finally(() => setCarregandoCidades(false));
  }

  // `opcao` vem do SeletorLista no formato { rotulo, valor } — normaliza pro
  // mesmo formato { sigla, nome } usado pelo resto do hook (ex: preencher())
  function selecionarEstado(opcao) {
    setEstadoSelecionado({ sigla: opcao.valor, nome: opcao.rotulo });
    setCidade('');
    carregarCidades(opcao.valor);
  }

  // usar ao abrir um formulário que já tem estado/cidade salvos (ex: Editar perfil)
  function preencher(siglaSalva, cidadeSalva) {
    setCidade(cidadeSalva || '');
    setEstadoSelecionado(null);
    setEstadoFallback(false);
    setEstadoLivre(siglaSalva || '');
    if (!siglaSalva) return;

    if (estados.length) {
      const encontrado = estados.find((e) => e.sigla === siglaSalva);
      if (encontrado) {
        setEstadoSelecionado(encontrado);
        carregarCidades(encontrado.sigla);
        return;
      }
    }
    siglaPendenteRef.current = siglaSalva;
  }

  return {
    estados,
    carregandoEstados,
    estadoFallback,
    estadoLivre,
    setEstadoLivre,
    estadoSelecionado,
    selecionarEstado,
    preencher,
    cidades,
    carregandoCidades,
    cidadeFallback,
    cidade,
    setCidade,
  };
}
