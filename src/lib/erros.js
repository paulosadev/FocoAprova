// traduz as mensagens de erro mais comuns do Supabase/Postgres (vêm em
// inglês da API) pra mostrar nos Alert.alert — sem isso, o título do alerta
// fica em português e o corpo em inglês.

const TRADUCOES = [
  [/invalid login credentials/i, () => 'E-mail ou senha incorretos.'],
  [/email not confirmed/i, () => 'E-mail ainda não confirmado. Verifique sua caixa de entrada.'],
  [/user already registered|already been registered|already registered/i, () => 'Esse e-mail já tem uma conta.'],
  [/password should be at least (\d+) characters?/i, (m) => `A senha precisa ter pelo menos ${m[1]} caracteres.`],
  [/new password should be different from the old password/i, () => 'A nova senha precisa ser diferente da atual.'],
  [/for security purposes.*after (\d+) seconds?/i, (m) => `Por segurança, espere ${m[1]} segundos e tente de novo.`],
  [/email rate limit exceeded|rate limit/i, () => 'Muitas tentativas em pouco tempo. Espere um pouco e tente de novo.'],
  [/network request failed|failed to fetch/i, () => 'Falha de conexão. Verifique sua internet e tente de novo.'],
  [/jwt expired|session.*expired|invalid.*session/i, () => 'Sua sessão expirou. Saia e entre de novo.'],
  [/invalid email/i, () => 'E-mail inválido.'],
  [/user not found/i, () => 'Usuário não encontrado.'],
  [/unable to validate email address/i, () => 'Não foi possível validar esse e-mail.'],
  [/duplicate key value/i, () => 'Esse registro já existe.'],
  [/violates foreign key constraint/i, () => 'Não foi possível completar — um item relacionado não foi encontrado.'],
  [/violates row-level security/i, () => 'Você não tem permissão para fazer essa ação.'],
  [/violates not-null constraint/i, () => 'Falta preencher uma informação obrigatória.'],
];

export function mensagemErro(erro, alternativa) {
  const texto = (typeof erro === 'string' ? erro : erro?.message) || '';
  if (!texto) return alternativa || 'Algo deu errado. Tente de novo.';

  for (const [padrao, traduzir] of TRADUCOES) {
    const encontrado = texto.match(padrao);
    if (encontrado) return traduzir(encontrado);
  }
  return texto;
}
