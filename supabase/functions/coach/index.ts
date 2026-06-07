// Supabase Edge Function: coach
// Recebe o histórico da conversa, puxa os dados do próprio usuário (RLS),
// monta o contexto + persona e chama o Claude (Sonnet). Devolve a resposta.
//
// Secret necessário: ANTHROPIC_API_KEY. SUPABASE_URL/ANON_KEY são automáticos.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const MODEL = "claude-sonnet-4-6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function diasAtras(n: number): string { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

// deno-lint-ignore no-explicit-any
function montarContexto(prof: any, ud: any, ptreino: any): string {
  const s = (prof && prof.saude) || {};
  const pesos = Array.isArray(ud.ff_pesos) ? ud.ff_pesos : [];
  const pressoes = ud.ff_pressoes || {};
  const dietaLog = ud.ff_dieta || {};
  const cargas = ud.ff_cargas || {};
  const whoop = Array.isArray(ud.ff_whoop) ? ud.ff_whoop : [];
  const refs = ud.ff_referencias || { itens: [] };
  const treinos = ud.ff_treinos || {};
  const L: string[] = [];
  L.push(`Nome: ${prof?.nome || "-"}`);
  if (s.sexo) L.push(`Sexo: ${s.sexo}`);
  if (prof?.altura) L.push(`Altura: ${prof.altura} m`);
  const pesoAtual = pesos.length ? pesos[pesos.length - 1].peso : prof?.peso_inicial;
  if (pesoAtual) L.push(`Peso atual: ${pesoAtual} kg`);
  if (prof?.peso_meta) L.push(`Meta de peso: ${prof.peso_meta} kg`);
  if (pesos.length > 1) L.push(`Peso inicial registrado: ${pesos[0].peso} kg (${pesos[0].data})`);
  if (s.objetivo) L.push(`Objetivo: ${s.objetivo}`);
  if (s.nivel) L.push(`Nível de treino: ${s.nivel}`);
  if (s.dias) L.push(`Dias/semana disponíveis: ${s.dias}`);
  if (s.doencas) L.push(`Doenças/condições: ${s.doencas}`);
  if (s.lesoes) L.push(`Lesões/dores: ${s.lesoes}`);
  if (s.alimentar) L.push(`Restrições alimentares: ${s.alimentar}`);
  if (s.medicamentos) L.push(`Medicamentos: ${s.medicamentos}`);
  if (s.obs) L.push(`Observações: ${s.obs}`);
  if (prof?.metas) { const m = prof.metas; L.push(`Meta de macros: ${m.kcal} kcal, P ${m.prot}g, C ${m.carb}g, G ${m.gord}g`); }
  const pks = Object.keys(pressoes).sort();
  if (pks.length) { const p = pressoes[pks[pks.length - 1]]; L.push(`Última pressão (${p.data}): manhã ${p.manha || "-"}, noite ${p.noite || "-"}`); }
  if (whoop.length) {
    const w = whoop[whoop.length - 1];
    L.push(`Whoop mais recente (${w.data}): FC repouso ${w.rhr ?? "-"} bpm, HRV ${w.hrv ?? "-"} ms, recovery ${w.recovery ?? "-"}%`);
    const ult = whoop.slice(-7).filter((x: any) => typeof x.rhr === "number");
    if (ult.length > 1) { const med = Math.round(ult.reduce((a: number, b: any) => a + b.rhr, 0) / ult.length); L.push(`FC repouso média (últimos ${ult.length} dias): ${med} bpm`); }
    const uhrv = whoop.slice(-7).filter((x: any) => typeof x.hrv === "number");
    if (uhrv.length > 1) { const med = Math.round(uhrv.reduce((a: number, b: any) => a + b.hrv, 0) / uhrv.length); L.push(`HRV média (últimos ${uhrv.length} dias): ${med} ms`); }
  }
  const ini7 = diasAtras(7);
  const diasDieta = Object.keys(dietaLog).filter((k) => k >= ini7);
  let marc = 0; diasDieta.forEach((k) => { const dd = dietaLog[k]; ["whey", "cafe", "almoco", "lanche", "jantar"].forEach((id) => { if (dd[id]) marc++; }); });
  L.push(`Dieta (últimos 7 dias): ${marc} refeições marcadas em ${diasDieta.length} dias com registro`);
  const treinosSemana = Object.keys(treinos).filter((k) => k >= ini7);
  L.push(`Treinos feitos (últimos 7 dias): ${treinosSemana.length}`);
  if (ptreino?.plano && Array.isArray(ptreino.plano)) {
    const nomes = ptreino.plano.filter((d: any) => d.ex && d.ex.length).map((d: any) => d.nome).join("; ");
    if (nomes) L.push(`Plano de treino atual: ${nomes}`);
  }
  const exNomes = Object.keys(cargas).slice(0, 8);
  if (exNomes.length) {
    const cg = exNomes.map((nome) => {
      const h = cargas[nome]; if (!h || !h.length) return null;
      const last = h[h.length - 1]; const kg = last.series && last.series.length ? last.series[last.series.length - 1].kg : null;
      return kg ? `${nome}: ${kg}kg` : null;
    }).filter(Boolean).join("; ");
    if (cg) L.push(`Cargas recentes — ${cg}`);
  }
  if (refs.itens && refs.itens.length) { const ex = refs.itens.map((i: any) => `${i.label}: ${i.valor}`).join("; "); L.push(`Exames de referência: ${ex}`); }
  return L.join("\n");
}

const COMPOSTOS = ["Supino", "Leg Press", "Remada", "Desenvolvimento", "Puxada", "Mesa Flexora", "Agachamento", "Elevação Pélvica"];
function isComp(n: string): boolean { const x = String(n || ""); return COMPOSTOS.some((k) => x.indexOf(k) >= 0); }
// deno-lint-ignore no-explicit-any
function sanitizePlano(plano: any): any[] {
  if (!Array.isArray(plano)) return [];
  return plano.map((d: any) => ({
    id: "d" + Math.random().toString(36).slice(2, 8),
    nome: String(d?.nome || "").trim(),
    sub: String(d?.sub || "").trim(),
    ex: (Array.isArray(d?.ex) ? d.ex : []).filter((e: any) => e && String(e.nome || "").trim()).map((e: any) => ({
      nome: String(e.nome).trim(), s: parseInt(e.s) || 3, r: String(e.r || "").trim() || "12", comp: isComp(e.nome), desc: String(e.desc || "").trim(),
    })),
  })).filter((d: any) => d.nome || d.ex.length);
}
const TOOL_TREINO = {
  name: "atualizar_treino",
  description: "Atualiza/substitui o plano de treino do usuário no app. Use quando o usuário pedir um treino novo ou um ajuste, ou quando combinarem isso na conversa. Respeite SEMPRE as restrições do usuário (cardíaco: sem Valsalva/cargas máximas, 12–15 reps, descanso 60–90s; lesões).",
  input_schema: {
    type: "object",
    properties: {
      plano: {
        type: "array", description: "Lista de dias de treino",
        items: {
          type: "object",
          properties: {
            nome: { type: "string", description: "Nome do dia (ex: Push — Peito/Ombro/Tríceps)" },
            sub: { type: "string", description: "Grupos musculares (opcional)" },
            ex: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" }, s: { type: "integer", description: "séries" }, r: { type: "string", description: "reps, ex: 12–15" }, desc: { type: "string", description: "dica curta (opcional)" },
                },
                required: ["nome", "s", "r"],
              },
            },
          },
          required: ["nome", "ex"],
        },
      },
    },
    required: ["plano"],
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ erro: "Método não permitido." }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ erro: "Não autenticado." }, 401);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const ures = await supabase.auth.getUser();
  const user = ures.data && ures.data.user;
  if (ures.error || !user) return json({ erro: "Sessão inválida." }, 401);

  let historico: { role: string; content: string }[] = [];
  try { const body = await req.json(); historico = Array.isArray(body?.historico) ? body.historico : []; }
  catch (_e) { return json({ erro: "Corpo inválido." }, 400); }

  let msgs = historico
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 4000) }))
    .filter((m) => m.content);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  msgs = msgs.slice(-12);
  if (!msgs.length) return json({ erro: "Sem mensagem." }, 400);
  if (!ANTHROPIC_API_KEY) return json({ erro: "ANTHROPIC_API_KEY não configurada." }, 500);

  const uid = user.id;
  const prof = (await supabase.from("profiles").select("nome,role,sexo,altura,peso_inicial,peso_meta,saude,metas").eq("id", uid).single()).data;
  const udRows = (await supabase.from("user_data").select("chave,valor").eq("user_id", uid)).data || [];
  // deno-lint-ignore no-explicit-any
  const ud: any = {}; udRows.forEach((r: any) => { ud[r.chave] = r.valor; });
  const ptreino = (await supabase.from("planos_treino").select("plano").eq("user_id", uid).maybeSingle()).data;

  const contexto = montarContexto(prof, ud, ptreino);

  // limite diário por usuário (admin ilimitado) — freio de custo
  const LIMITE = 15;
  const hoje = new Date().toISOString().slice(0, 10);
  const uso = ud.ff_coach_uso || { dia: "", n: 0 };
  const isAdmin = prof?.role === "admin";
  if (!isAdmin) {
    const nHoje = uso.dia === hoje ? (uso.n || 0) : 0;
    if (nHoje >= LIMITE) return json({ resposta: "Você atingiu o limite de " + LIMITE + " mensagens de hoje. Volte amanhã 🙂" });
  }

  const system = [{
    type: "text",
    text:
      "Você é o coach de saúde e treino do app pessoal de " + (prof?.nome || "o usuário") + ", em português do Brasil. " +
      "Seja direto, prático, gentil e motivador — tom de personal/nutricionista experiente. Use os DADOS DO USUÁRIO pra dar conselhos CONCRETOS e personalizados, citando os números dele quando fizer sentido. Evite respostas genéricas ou longas demais.\n\n" +
      "REGRAS IMPORTANTES:\n" +
      "- Respeite SEMPRE as restrições, lesões e condições do usuário. Nunca recomende algo contraindicado (ex.: restrição cardíaca = nada de Valsalva/cargas máximas; gota = atenção a purinas e hidratação).\n" +
      "- Você NÃO é médico. Para dor no peito, sintomas preocupantes, alterações de pressão/frequência cardíaca ou decisões sobre medicação, oriente procurar o médico/cardiologista — não dê veredito clínico.\n" +
      "- Se faltar dado pra responder bem, peça ao usuário ou sugira registrar no app.\n" +
      "- Foque no que ajuda o objetivo dele.\n" +
      "- Você PODE atualizar o treino do usuário no app com a ferramenta atualizar_treino — use quando ele pedir um treino novo/ajuste ou quando combinarem na conversa. Antes de chamar, diga em 1 frase o que vai montar; depois, avise que salvou e que ele vê na aba Treino e pode pedir ajustes. NUNCA altere o treino sem o usuário querer.\n\n" +
      "DADOS DO USUÁRIO (privados, só dele):\n" + contexto,
    cache_control: { type: "ephemeral" },
  }];

  const tools = [TOOL_TREINO];
  // deno-lint-ignore no-explicit-any
  const convo: any[] = msgs.slice();
  let treinoAtualizado = false;
  let texto = "";
  for (let round = 0; round < 3; round++) {
    let resp: Response;
    try {
      resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, max_tokens: 1500, system, tools, messages: convo }),
      });
    } catch (_e) { return json({ erro: "Falha ao conectar na API do Claude." }, 502); }
    if (!resp.ok) { const detalhe = await resp.text(); return json({ erro: "Erro no coach.", detalhe }, 502); }
    const data = await resp.json();
    const blocks = data?.content || [];
    const toolUse = blocks.find((b: any) => b.type === "tool_use" && b.name === "atualizar_treino");
    if (data.stop_reason === "tool_use" && toolUse) {
      const plano = sanitizePlano(toolUse.input?.plano);
      let resultText = "Treino atualizado com sucesso.";
      if (!plano.length) { resultText = "Plano vazio — não alterei nada."; }
      else {
        const up = await supabase.from("planos_treino").upsert({ user_id: uid, plano, criado_por: uid, updated_at: new Date().toISOString() });
        if (up.error) resultText = "Erro ao salvar o treino: " + up.error.message;
        else treinoAtualizado = true;
      }
      convo.push({ role: "assistant", content: blocks });
      convo.push({ role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: resultText }] });
      continue;
    }
    texto = blocks.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
    break;
  }
  try {
    const nNovo = (uso.dia === hoje ? (uso.n || 0) : 0) + 1;
    await supabase.from("user_data").upsert({ user_id: uid, chave: "ff_coach_uso", valor: { dia: hoje, n: nNovo }, updated_at: new Date().toISOString() });
  } catch (_e) { /* ignora */ }
  return json({ resposta: texto || "(sem resposta)", treino_atualizado: treinoAtualizado });
});
