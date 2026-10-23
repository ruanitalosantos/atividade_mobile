# Minhas Tarefas

Aplicativo móvel de **gerenciamento de tarefas pessoais**, desenvolvido em React Native com Expo como projeto da disciplina de Desenvolvimento de Aplicativos Móveis.

O usuário cria uma conta, faz login e gerencia suas tarefas (com prioridade, data de entrega e status). A tela inicial mostra o clima atual da sua localização. Todos os dados ficam salvos no aparelho, então o app funciona sem internet.

## Integrantes

| Nome | Curso |
|---|---|
| Ludmilla Táfny | Engenharia de Software |
| Ruan Santos | Engenharia de Software |

## Funcionalidades

- Cadastro e login de usuários, com sessão mantida ao reabrir o app
- Criar, listar, ver, editar e excluir tarefas
- Marcar tarefa como concluída/pendente
- Filtro: todas, pendentes, concluídas
- Destaque de tarefas atrasadas
- Clima atual pela geolocalização do aparelho
- Perfil com estatísticas e barra de progresso
- Aviso de modo offline
- Sair e excluir conta

## Como os requisitos foram atendidos

| Requisito | Como foi implementado |
|---|---|
| Plataforma iOS e/ou Android | React Native + Expo (roda em Android e iOS) |
| Pelo menos 5 telas com navegação | 6 telas: Login, Cadastro, Lista de tarefas, Formulário (nova/editar), Detalhes da tarefa, Perfil. Navegação com Expo Router (Stack) |
| Persistência de dados | Banco SQLite local (`expo-sqlite`) com tabelas `users`, `tasks` e `cache` |
| Design responsivo | Layout com Flexbox, largura máxima de 600px centralizada em tablets, safe areas e teclado tratados |
| Autenticação (login/cadastro) | [src/services/auth.ts](src/services/auth.ts) e [src/context/AuthContext.tsx](src/context/AuthContext.tsx) |
| CRUD completo | Entidade **Tarefa**, em [src/services/tasks.ts](src/services/tasks.ts) |
| Integração com API externa | [Open-Meteo](https://open-meteo.com) (clima atual), em [src/services/weather.ts](src/services/weather.ts) |
| Recurso do dispositivo | **Geolocalização** (`expo-location`): pega a posição do aparelho para buscar o clima e o nome da cidade |
| UI/UX mobile | Botões com área de toque ≥ 48px, feedback de carregamento, confirmações antes de excluir, mensagens de erro claras, labels de acessibilidade |
| Desempenho (< 2s) | Operações comuns são consultas SQLite locais (milissegundos); a chamada à API tem timeout de 8s e não bloqueia a tela |
| Segurança | Senhas guardadas como hash SHA-256 com salt aleatório por usuário; sessão no armazenamento criptografado do sistema (`expo-secure-store`); consultas SQL parametrizadas; toda consulta de tarefa filtra pelo usuário logado; mensagem de login genérica (não revela se o e-mail existe) |
| Funcionamento offline | Tarefas e login são 100% locais; o último clima consultado fica em cache e é exibido sem internet; banner avisa quando está offline |
| Tratamento de erros | `try/catch` em todas as operações com mensagens ao usuário, validação de formulários, erros específicos (`AuthError`, `ValidationError`, `WeatherError`) e `ErrorBoundary` do Expo Router |
| Documentação | Este README e comentários no código |

## Tecnologias

- [Expo](https://expo.dev) SDK 58 / React Native 0.88 / TypeScript
- Expo Router (navegação por arquivos)
- expo-sqlite (banco de dados local)
- expo-secure-store (sessão)
- expo-crypto (hash de senha)
- expo-location (geolocalização)
- @react-native-community/netinfo (detecção de conexão)
- API Open-Meteo (clima, gratuita e sem chave)

## Como executar

### O que é preciso

- [Node.js](https://nodejs.org) 20 ou mais recente, instalado no computador
- [Git](https://git-scm.com), para baixar o projeto
- Um celular Android ou iPhone com o app **Expo Go**, na versão mais recente da loja ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)). O projeto usa o Expo SDK 58, e versões antigas do Expo Go não abrem o app.

### Passo a passo

1. Baixe o projeto e entre na pasta:
   ```bash
   git clone https://github.com/ruanitalosantos/atividade_mobile.git
   cd atividade_mobile
   ```
2. Instale as dependências (só na primeira vez):
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npx expo start
   ```
4. Um QR code vai aparecer no terminal. Leia o código com o app **Expo Go** (Android) ou com a **câmera** (iPhone). O app abre no celular.
5. Na primeira tela, toque em **Cadastre-se** e crie uma conta. Não existe usuário pré-cadastrado: os dados ficam salvos só no celular.

### Se não funcionar

- **O celular não conecta ao computador:** os dois precisam estar na mesma rede Wi‑Fi. Se a rede bloquear a conexão (comum em redes de faculdade), rode `npx expo start --tunnel`.
- **O clima não aparece:** permita o acesso à localização quando o app pedir. Sem permissão, o restante do app funciona normalmente.
- **Usando um emulador:** com o Android Studio instalado e um emulador aberto, pressione `a` no terminal depois do `npx expo start`.

### Comandos úteis

```bash
npm run lint        # verificação de estilo/código
npm run typecheck   # checagem de tipos TypeScript
```

## Estrutura do projeto

```
src/
├── app/                      # Telas (cada arquivo é uma rota do Expo Router)
│   ├── _layout.tsx           # Layout raiz: banco de dados, autenticação e navegação
│   ├── login.tsx             # Tela 1 - Login
│   ├── register.tsx          # Tela 2 - Cadastro
│   └── (app)/                # Grupo de telas protegidas (exige login)
│       ├── _layout.tsx       # Redireciona para o login se não houver usuário
│       ├── index.tsx         # Tela 3 - Lista de tarefas + clima
│       ├── task-form.tsx     # Tela 4 - Criar / editar tarefa
│       ├── task/[id].tsx     # Tela 5 - Detalhes da tarefa
│       └── profile.tsx       # Tela 6 - Perfil e estatísticas
├── components/               # Componentes reutilizáveis (Button, Input, TaskItem, WeatherCard...)
├── context/AuthContext.tsx   # Estado global do usuário logado
├── db/database.ts            # Criação e migração do banco SQLite
├── services/                 # Regras de negócio e acesso a dados
│   ├── auth.ts               # Cadastro, login, sessão
│   ├── tasks.ts              # CRUD de tarefas
│   └── weather.ts            # Geolocalização + API Open-Meteo + cache offline
├── utils/date.ts             # Formatação e validação de datas
└── theme.ts                  # Cores e espaçamentos
```

### Arquitetura

As telas (`src/app`) cuidam só da interface. Elas chamam funções de `src/services`, que validam os dados e acessam o banco. A conexão com o SQLite vem do `SQLiteProvider` (no layout raiz) e o usuário logado vem do `AuthContext`.

### Modelo de dados

**users**: `id`, `name`, `email` (único), `password_hash`, `salt`, `created_at`

**tasks**: `id`, `user_id`, `title`, `description`, `priority` (`baixa` | `media` | `alta`), `due_date` (AAAA-MM-DD), `done` (0/1), `created_at`, `updated_at`

**cache**: `key`, `value` (JSON), `updated_at`. Guarda o último clima consultado, para uso offline.

## Fluxo de uso

1. Abra o app e toque em **Cadastre-se**.
2. Preencha nome, e-mail e senha (mín. 6 caracteres).
3. Permita o acesso à localização para ver o clima.
4. Toque no **+** para criar uma tarefa.
5. Toque no círculo de uma tarefa para concluí-la, ou na tarefa para ver os detalhes, editar ou excluir.
6. Em **Perfil**, veja suas estatísticas, saia ou exclua a conta.
