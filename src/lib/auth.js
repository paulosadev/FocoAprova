import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../supabaseClient';

// fecha a aba do navegador automaticamente quando o auth volta pro app
WebBrowser.maybeCompleteAuthSession();

// URI de retorno: em build standalone vira "focoaprova://" (scheme do app.json).
// Precisa estar na lista de "Redirect URLs" do Supabase (Authentication > URL Configuration).
export const redirectTo = makeRedirectUri();
export const redirectRedefinirSenha = makeRedirectUri({ path: 'redefinir-senha' });

if (__DEV__) {
  console.log('[auth] redirectTo =', redirectTo);
  console.log('[auth] redirectRedefinirSenha =', redirectRedefinirSenha);
}

export function extrairParametros(url) {
  const params = {};
  const posHash = url.indexOf('#');
  const posQuery = url.indexOf('?');
  const inicio = posHash !== -1 ? posHash : posQuery;
  if (inicio === -1) return params;

  url
    .slice(inicio + 1)
    .split('&')
    .forEach((par) => {
      const [chave, valor] = par.split('=');
      if (chave) params[decodeURIComponent(chave)] = decodeURIComponent(valor || '');
    });
  return params;
}

// Abre o fluxo OAuth do Google via Supabase e grava a sessão no app.
// Retorna { cancelado: boolean }; lança em caso de erro real.
export async function entrarComGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (resultado.type !== 'success') return { cancelado: true };

  const params = extrairParametros(resultado.url);
  if (params.error) throw new Error(params.error_description || params.error);

  // fluxo implícito: tokens no fragmento (#access_token / #refresh_token)
  if (params.access_token && params.refresh_token) {
    const { error: erroSessao } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (erroSessao) throw erroSessao;
    return { cancelado: false };
  }

  // fluxo PKCE: código de troca (?code=)
  if (params.code) {
    const { error: erroTroca } = await supabase.auth.exchangeCodeForSession(params.code);
    if (erroTroca) throw erroTroca;
    return { cancelado: false };
  }

  throw new Error('Não foi possível ler a resposta do Google.');
}

// Dispara o e-mail com o link de redefinição de senha.
export async function enviarResetSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirectRedefinirSenha,
  });
  if (error) throw error;
}

// Captura o link de recuperação de senha aqui, na carga do módulo — bem
// antes de qualquer tela montar. Se a RedefinirSenhaScreen tentasse ler a
// URL sozinha (Linking.getInitialURL()/useURL()), perderia o evento sempre
// que o app já estivesse aberto em segundo plano: o expo-router já consome
// esse mesmo evento pra decidir navegar pra essa tela, e o listener da tela
// só é registrado DEPOIS que a navegação e o mount acontecem — tarde demais
// pra receber o mesmo evento (emissores de evento em JS não reenviam pro
// passado). Esse módulo é importado bem no topo da árvore (app/_layout.tsx
// -> LoginScreen -> auth.js), então roda antes do expo-router montar.
let urlRecuperacaoPendente = null;
const ouvintesRecuperacao = new Set();

function registrarUrlRecuperacao(url) {
  if (!url) return;
  const params = extrairParametros(url);
  if (!params.access_token && !params.refresh_token && !params.error) return;
  urlRecuperacaoPendente = url;
  ouvintesRecuperacao.forEach((callback) => callback(url));
}

Linking.getInitialURL().then(registrarUrlRecuperacao);
Linking.addEventListener('url', ({ url }) => registrarUrlRecuperacao(url));

// Consome (e limpa) a URL de recuperação pendente, se já tiver chegado.
export function consumirUrlRecuperacaoPendente() {
  const url = urlRecuperacaoPendente;
  urlRecuperacaoPendente = null;
  return url;
}

// Assina uma URL de recuperação que ainda não chegou (ex: a tela montou
// antes do evento, ou o app abriu direto nela). Retorna a função pra cancelar.
export function aoReceberUrlRecuperacao(callback) {
  ouvintesRecuperacao.add(callback);
  return () => ouvintesRecuperacao.delete(callback);
}
