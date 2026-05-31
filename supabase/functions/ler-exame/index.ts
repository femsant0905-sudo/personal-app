// Supabase Edge Function: ler-exame
// Recebe um PDF de exame (base64), pede pro Claude extrair os valores de
// referência (LDL, HDL, glicose, pressão, score de cálcio...) e devolve JSON.
//
// Segredo necessário (Supabase → Edge Functions → Secrets):
//   ANTHROPIC_API_KEY = sk-ant-...
//
// SUPABASE_URL e SUPABASE_ANON_KEY são injetados automaticamente pelo Supabase.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const MODEL = "claude-sonnet-4-6"; // Sonnet: preciso o suficiente pra dado médico

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Ferramenta que força o Claude a devolver os dados no formato que o app usa.
const TOOL = {
  name: "registrar_exame",
  description:
    "Registra os valores de referência extraídos de um exame médico laboratorial.",
  input_schema: {
    type: "object",
    properties: {
      itens: {
        type: "array",
        description:
          "Valores de referência relevantes encontrados no exame (lipídios, glicose, pressão arterial, score de cálcio, função renal/hepática, etc.).",
        items: {
          type: "object",
          properties: {
            label: {
              type: "string",
              description: "Nome do exame ou medida. Ex: LDL, HDL, Glicose, Pressão arterial.",
            },
            valor: {
              type: "string",
              description: "Valor com unidade, exatamente como no exame. Ex: 46 mg/dL, 128/95.",
            },
          },
          required: ["label", "valor"],
        },
      },
      nota: {
        type: "string",
        description:
          "Observação curta opcional (ex: data do exame ou ponto de atenção). Vazio se não houver.",
      },
    },
    required: ["itens"],
  },
} as const;

const SYSTEM = [
  {
    type: "text",
    text:
      "Você extrai dados de exames médicos laboratoriais em português do Brasil. " +
      "Leia o PDF e registre apenas valores de referência que valem acompanhar ao longo do tempo " +
      "(colesterol total, LDL, HDL, triglicerídeos, glicose, HbA1c, pressão arterial, score de cálcio coronário, " +
      "ácido úrico, creatinina, função hepática, vitamina D, etc.). " +
      "Use exatamente os números e unidades do exame — NUNCA invente, estime ou arredonde valores. " +
      "Se um valor não estiver no documento, não o inclua. Sempre chame a ferramenta registrar_exame.",
    // cache do prefixo (system + tools); pode não atingir o mínimo de tokens, é inofensivo
    cache_control: { type: "ephemeral" },
  },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ erro: "Método não permitido." }, 405);

  // 1) Verificar o usuário (JWT do Supabase no header Authorization)
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ erro: "Não autenticado." }, 401);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ erro: "Sessão inválida. Faça login de novo." }, 401);
  }

  // 2) Ler o PDF (base64) do corpo
  let pdfBase64 = "";
  try {
    const body = await req.json();
    pdfBase64 = (body?.pdf_base64 ?? "").toString();
  } catch (_e) {
    return json({ erro: "Corpo inválido." }, 400);
  }
  if (!pdfBase64) return json({ erro: "Nenhum PDF enviado." }, 400);

  if (!ANTHROPIC_API_KEY) {
    return json({ erro: "ANTHROPIC_API_KEY não configurada no Supabase." }, 500);
  }

  // 3) Chamar a API do Claude com o PDF + ferramenta de extração
  let resp: Response;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: "tool", name: "registrar_exame" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfBase64,
                },
              },
              {
                type: "text",
                text: "Extraia os valores de referência deste exame e registre-os.",
              },
            ],
          },
        ],
      }),
    });
  } catch (_e) {
    return json({ erro: "Falha ao conectar na API do Claude." }, 502);
  }

  if (!resp.ok) {
    const detalhe = await resp.text();
    return json({ erro: "Erro na leitura do exame.", detalhe }, 502);
  }

  const data = await resp.json();
  const bloco = (data?.content ?? []).find(
    (b: { type?: string; name?: string }) =>
      b?.type === "tool_use" && b?.name === "registrar_exame",
  );
  if (!bloco) return json({ erro: "Não consegui extrair dados do exame." }, 422);

  const itens = Array.isArray(bloco.input?.itens) ? bloco.input.itens : [];
  const nota = (bloco.input?.nota ?? "").toString();

  // 4) Devolver pro app (o usuário confere antes de salvar)
  return json({ itens, nota });
});
