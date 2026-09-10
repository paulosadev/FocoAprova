import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../supabaseClient';

// fecha a aba do navegador automaticamente quando o auth volta pro app
WebBrowser.maybeCompleteAuthSession();

// URI de retorno: em build standalone vira "focoaprova://" (scheme do app.json).
// Precisa estar na lista de "Redirect URLs" do Supabase (Authentication > URL Configuration).
export const redirectTo = makeRedirectUri();

if (__DEV__) console.log('[auth] redirectTo =', redirectTo);

function extrairParametros(url) {
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
