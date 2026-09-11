// Edge Function: gerar-flashcards
// Gera flashcards via Groq, respeitando o limite diário de 10 por disciplina por usuário.
// Deploy: supabase functions deploy gerar-flashcards
// Secret:  supabase secrets set GROQ_API_KEY=...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LIMITE_DIARIO = 10;
const MAX_POR_CHAMADA = 5;
const MODELO_GROQ = 'openai/gpt-oss-120b';

type Flashcard = { frente: string; verso: string };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return respostaErro('Não autenticado.', 401);
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      return respostaErro('IA não configurada no servidor.', 500);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return respostaErro('Sessão inválida.', 401);
    }
    const usuario = userData.user;

    const body = await req.json().catch(() => null);
    const disciplinaNome = typeof body?.disciplina_nome === 'string' ? body.disciplina_nome.trim() : '';
    const assunto = typeof body?.assunto === 'string' ? body.assunto.trim() : '';
    const dataLocal = typeof body?.data_local === 'string' ? body.data_local : '';

    if (!disciplinaNome || !assunto || !dataLocal) {
      return respostaErro('Informe disciplina, assunto e a data.', 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataLocal)) {
      return respostaErro('Data inválida.', 400);
    }

    const inicioDia = `${dataLocal}T00:00:00.000Z`;
    const fimDia = `${dataLocal}T23:59:59.999Z`;

    const { count, error: countError } = await supabase
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', usuario.id)
      .eq('disciplina_nome', disciplinaNome)
      .eq('gerado_por_ia', true)
      .gte('created_at', inicioDia)
      .lte('created_at', fimDia);

    if (countError) {
      return respostaErro(countError.message, 500);
    }

    const jaGerados = count ?? 0;
    if (jaGerados >= LIMITE_DIARIO) {
      return respostaErro(
        `Limite diário de ${LIMITE_DIARIO} flashcards por IA atingido para ${disciplinaNome} hoje.`,
        429,
      );
    }

    const restante = LIMITE_DIARIO - jaGerados;
    const quantidade = Math.min(MAX_POR_CHAMADA, restante);

    const cartoesGerados = await gerarComGroq(groqApiKey, disciplinaNome, assunto, quantidade);

    if (cartoesGerados.length === 0) {
      return respostaErro('A IA não conseguiu gerar flashcards para esse assunto. Tente reformular.', 502);
    }

    const linhas = cartoesGerados.map((c) => ({
      user_id: usuario.id,
      disciplina_nome: disciplinaNome,
      frente: c.frente,
      verso: c.verso,
      review_stage: 0,
      proxima_revisao: dataLocal,
      gerado_por_ia: true,
    }));

    const { data: inseridos, error: insertError } = await supabase
      .from('flashcards')
      .insert(linhas)
      .select('id');

    if (insertError) {
      return respostaErro(insertError.message, 500);
    }

    const criados = inseridos?.length ?? 0;

    return new Response(
      JSON.stringify({
        criados,
        restante_hoje: Math.max(0, LIMITE_DIARIO - jaGerados - criados),
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
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

async function gerarComGroq(
  apiKey: string,
  disciplina: string,
  assunto: string,
  quantidade: number,
): Promise<Flashcard[]> {
  const prompt = `Você é um assistente que cria flashcards de estudo em português do Brasil para concursos/vestibulares.
Disciplina: ${disciplina}
Assunto: ${assunto}

Gere exatamente ${quantidade} flashcards sobre esse assunto. Cada flashcard deve ter:
- "frente": uma pergunta ou termo curto e claro
- "verso": a resposta correta, objetiva (1 a 3 frases)

Não repita perguntas entre si. Não inclua números ou marcadores no texto.

Responda estritamente em JSON, no formato:
{"flashcards": [{"frente": "...", "verso": "..."}, ...]}
com exatamente ${quantidade} itens no array "flashcards". Não escreva nada fora desse JSON.`;

  const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODELO_GROQ,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!resposta.ok) {
    const textoErro = await resposta.text();
    throw new Error(`Erro na API do Groq (${resposta.status}): ${textoErro.slice(0, 200)}`);
  }

  const json = await resposta.json();
  const texto = json?.choices?.[0]?.message?.content;
  if (!texto) return [];

  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return [];
  }
  const itens = Array.isArray((corpo as { flashcards?: unknown })?.flashcards)
    ? (corpo as { flashcards: unknown[] }).flashcards
    : [];

  return itens
    .filter(
      (item): item is Flashcard =>
        !!item &&
        typeof (item as Flashcard).frente === 'string' &&
        (item as Flashcard).frente.trim().length > 0 &&
        typeof (item as Flashcard).verso === 'string' &&
        (item as Flashcard).verso.trim().length > 0,
    )
    .slice(0, quantidade)
    .map((item) => ({ frente: item.frente.trim(), verso: item.verso.trim() }));
}
