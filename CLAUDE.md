# Personal App

PWA de saúde e fitness. HTML single-file (`index.html`), sem framework, sem build.

## Stack
- HTML + JS vanilla em arquivo único (`index.html`)
- **v2.0 (em andamento):** Supabase = Auth (login email/senha) + Postgres. supabase-js via CDN, cliente global `sb`. Projeto ref `xyhstixqyhvgngkpkimv`.
- Dados na nuvem, offline-first: `save()` grava no localStorage na hora + espelha pro Supabase (`pushCloud`); `enterApp` puxa da nuvem no login (`pullCloud`). Tabela key-value `user_data` (user_id, chave, valor jsonb). Perfis em `profiles` (nome, role, altura, peso_inicial, peso_meta).
- Papéis: admin (Fernando) + cliente. Login cross-device funcionando.
- GitHub Pages: femsant0905-sudo/personal-app (produção, JÁ com login)
- PWA: manifest.json + service-worker.js
- Edge Functions em `supabase/functions/` (ex: `ler-exame`)

## Estrutura do index.html
1. `<style>` — CSS global
2. Dados estáticos: `TREINOS`, `REFEICOES`, `ALONGAMENTOS`
3. Storage: `sget/sset`, variáveis globais (`pesos`, `treinos`, `pressoes`, `diario`, `dietaLog`, `cargaHist`)
4. Funções render por página: `renderHome`, `renderDiario`, `renderTreino`, `renderAlong`, `renderDieta`, `renderCorpo`
5. Funções de ação: `save`, `toggleRefeicao`, `startTreino`, `salvarDiario`, etc.

## Treinos
- Semana (~45min): A Upper Push · B Lower · C Upper Pull · D Full Upper
- Fim de semana (~75min): E Lower Power · F Upper Power
- Timer E/F: compostos 120s, isolados 90s

## Dieta
- 5 refeições · 3 opções cada · macros calculados pela opção ativa
- Meta: 2200kcal / P160g / C220g / G65g

## Usuário
- Fernando · Android Termux (tablet) · testa no celular
- Não é dev profissional · quer resultados diretos sem complexidade
- Respostas curtas · não resumir o que foi feito
- Verificação = testar no app (ele não lê código). Sempre commitar após mudança funcional. Não dar push pra produção sem combinar quando for sensível.

## Próxima sessão — por onde retomar
> Detalhe completo na memória: pergunte "qual o status do projeto?" no início.

**Já pronto e no ar (Fase 3 COMPLETA):** login Supabase cross-device · sync de dados · perfil/onboarding/IMC por usuário · **treino e dieta como dados por cliente** (tabelas `planos_treino`/`planos_dieta`) · tela de admin "Montar Plano" (escolhe cliente, edita treino/dieta) · **cliente também edita o próprio** plano · **dias de treino livres** (cria/nomeia/remove, sem A–F fixo) · **perfil de saúde por usuário** (`profiles.saude`: objetivo, restrições, doenças, etc., admin vê pra montar) · conta nova começa ZERADA. Esposa já usa (conta cliente, instalada no iPhone).

**Também no ar:** `METAS` de macros por usuário (`profiles.metas`) · import do Whoop por CSV (FC repouso/HRV na aba Corpo) · plano pessoal do Fernando gravado (treino Push/Pull/Legs, dieta nos horários dele, retatrutida no perfil de saúde — meta 95kg). **Conta admin do Fernando = `femsant@outlook.com`** (não o gmail).

**🔓 BACKEND DESTRAVADO (2026-06-01):** Edge Functions funcionando. Deploy via Supabase CLI: `npx --yes supabase functions deploy <nome> --project-ref xyhstixqyhvgngkpkimv --no-verify-jwt` (de dentro de `personal-app/`, com `SUPABASE_ACCESS_TOKEN` setado; sem Docker/init). `ler-exame` no ar (405 em GET). Receita completa na memória ([[backend-edge-functions-roadmap]]).

**RETOMAR POR:**
1. **Testar o PDF de exames** ponta a ponta (front pronto, função no ar — faltou só Fernando testar).
2. **Coach AI** (Fase B): função `coach` (lê `profiles.saude` + dados, chama Anthropic) + tela de chat. Desenho na memória.
3. **Whoop API auto-sync** (Fase C): app de dev no Whoop + OAuth + função de sync. Mais trabalhoso.
4. **Fase 2** — criar conta real do amigo (esposa já criou).
5. Refinamentos diversos.
