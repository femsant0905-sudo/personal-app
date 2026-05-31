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

**Já pronto e no ar:** login Supabase cross-device · sync de dados na nuvem · perfil/onboarding/IMC por usuário · card "Dados de referência" editável por usuário.

**RETOMAR PELA Fase 3b — treinos viram dados:**
- Tirar `TREINOS` do código → virar dados editáveis no Postgres, um plano de treino por cliente.
- Tela de admin pra montar/atribuir treinos.
- **Ao montar, oferecer 2 origens:** (a) **pedir ao Personal** (manual) OU (b) **pedir à IA** (Claude gera o treino e aloca no app, respeitando perfil/restrições do usuário — ex. gota, restrição cardíaca, cargas moderadas). A opção IA reusa a arquitetura de Edge Function → API Anthropic.
- Depois: Fase 3c (dieta vira dados) · Fase 2 (criar contas reais da esposa e do amigo).

**PAUSADO (retomar quando quiser):** import de PDF de exame. Código pronto (front + Edge Function `ler-exame`), MAS a função retorna `NOT_FOUND` — não está publicada com o nome `ler-exame`. Resolver o deploy: conferir nome real da função no painel Supabase / re-deploy. Botão no app fica visível mas dá erro até lá.
