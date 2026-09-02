# FocoAprova

Aplicativo mobile para organizar os estudos de quem está se preparando para vestibular, ENEM ou concurso: cronograma de matérias, timer de foco, registro de questões e simulados, e acompanhamento de progresso.

## Funcionalidades

- **Início**: contagem regressiva para a prova e visão rápida das matérias do dia
- **Timer**: sessões de estudo com modo foco em tela cheia e alerta sonoro
- **Cronograma**: organização semanal das matérias por dia
- **Questões**: meta diária de questões resolvidas e desempenho por matéria
- **Simulado**: registro de simulados com detalhamento de acertos por matéria
- **Progresso**: sequência de dias estudados e evolução por matéria
- **Perfil**: dados do usuário, objetivo de estudo, data da prova e tema (claro/escuro)
- Login e sincronização de dados via Supabase

## Tecnologias

- [Expo](https://expo.dev) / React Native
- [Expo Router](https://docs.expo.dev/router/introduction/) (navegação em drawer)
- [Supabase](https://supabase.com) (autenticação e banco de dados)
- Expo Audio e Expo Notifications

## Como rodar

1. Instalar as dependências:

   ```bash
   npm install
   ```

2. Iniciar o app:

   ```bash
   npm run start
   ```

   No terminal do Expo, escolha abrir no emulador Android/iOS, no Expo Go ou no navegador (`npm run web`).
