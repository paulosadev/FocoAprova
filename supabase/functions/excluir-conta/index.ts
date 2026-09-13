// Edge Function: excluir-conta
// Apaga permanentemente a conta do usuário autenticado e todos os dados
// associados (disciplinas, sessões, questões, simulados, flashcards,
// anotações, perfil). Não pode ser desfeito.
// Precisa da service role (só o servidor consegue apagar o usuário do Auth).
// Deploy: supabase functions deploy excluir-conta

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return respostaErro('Não autenticado.', 401);
    }

    // cliente "do chamador" — só pra confirmar quem está pedindo a exclusão
    const supabaseChamador = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await supabaseChamador.auth.getUser();
    if (userError || !userData?.user) {
      return respostaErro('Sessão inválida.', 401);
    }
    const userId = userData.user.id;

    // cliente com service role — único jeito de apagar o usuário do Auth e
    // de limpar as tabelas ignorando RLS (garante limpeza completa mesmo
    // sem depender de ON DELETE CASCADE estar configurado em cada FK)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // todas têm user_id (confirmado contra o schema real) — simulado_materias
    // primeiro, já que referencia simulados por FK
    const tabelasPorUserId = [
      'simulado_materias',
      'checklist',
      'sessoes_estudo',
      'questoes',
      'anotacoes_erro',
      'flashcards',
      'disciplinas',
      'simulados',
    ];
    for (const tabela of tabelasPorUserId) {
      const { error } = await supabaseAdmin.from(tabela).delete().eq('user_id', userId);
      if (error) return respostaErro(`Erro ao apagar ${tabela}: ${error.message}`, 500);
    }

    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    const { error: erroAuth } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (erroAuth) {
      return respostaErro(`Dados apagados, mas falhou ao remover a conta: ${erroAuth.message}`, 500);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (erro) {
    return respostaErro(erro instanceof Error ? erro.message : 'Erro inesperado.', 500);
  }
});

function respostaErro(mensagem: string, status: number) {
  return new Response(JSON.stringify({ error: mensagem }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
