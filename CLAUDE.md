# Personal App

PWA de saúde e fitness. HTML single-file (`index.html`), sem framework, sem build.

## Stack
- HTML + JS vanilla em arquivo único
- localStorage para persistência
- GitHub Pages: femsant0905-sudo/personal-app
- PWA: manifest.json + service-worker.js

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
