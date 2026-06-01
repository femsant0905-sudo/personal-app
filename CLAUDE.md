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

**RETOMAR POR:**
1. **Fase 2** — criar conta real do amigo (esposa já criou). Fluxo: ele abre o site no Safari → "Criar conta" → onboarding (altura em cm) → perfil de saúde → você monta treino/dieta dele na tela de admin.
2. Refinamentos que Fernando pedir (ex: `METAS` de macros por usuário — hoje ainda global).

**PAUSADO — dependem de Edge Function funcionando (mesmo bloqueio):**
- **Coach AI** (desenho aprovado): cada usuário conversa com o Claude sobre o próprio plano; Claude lê o perfil de saúde + dados. Função `coach` com modo conselho/gerar. Detalhe na memória.
- **Import de PDF de exame:** código pronto, mas Edge Function `ler-exame` retorna `NOT_FOUND` (deploy não pegou). Resolver o deploy destrava o Coach AI E o PDF de uma vez.
