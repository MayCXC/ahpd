---
title: The sdk's text, old and new
created: 2026-10-31
refs:
  - git://c7f7d186 - the commit of ahpd the texts were read at
  - "[code://.project/plans/host/20261031-1200-the-sdk-text-is-plain/task-01-the-rules-and-the-terms-are-written.md](../plans/host/20261031-1200-the-sdk-text-is-plain/task-01-the-rules-and-the-terms-are-written.md) - the task that writes this list"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L72-L272](../../packages/sdk/src/host/sessionconfig.ts#L72-L272) - the new session form"
  - "[code://packages/sdk/src/host/owners.ts#L280-L286](../../packages/sdk/src/host/owners.ts#L280-L286) - the team and project row"
  - "[code://packages/sdk/src/resources/recordschannel.ts#L390-L408](../../packages/sdk/src/resources/recordschannel.ts#L390-L408) - the put and remove texts made from parts"
---

# The sdk's text, old and new

This note holds the rules, the terms and each text of plan host/20261031-1200, for Softov to approve before any code.
After he approves, *Rules* and *Terms* go into `docs/sdk/TEXT.md`, and tasks 02 and 03 copy the texts from *Strings*.

Each row marked **check** is a choice that the brief does not settle. *Choices to check* lists them.

## Rules

### Writing

- Write for the person who uses the app, not for a developer who reads the code.
- Use everyday words. Do not use code names or internal terms.
- Say what a thing does for the person. Do not say how the code does it.
- Keep each important consequence, such as "its open sessions end first".
- Use the terms of *Terms*, the same way in each place.
- Write titles in sentence case: "Save an agent", not "Save An Agent".
- A command title is a verb and an object: "List tokens", not "Tokens".
- A description says what the thing does, in the present tense: "Creates or changes an agent."
- A description speaks to the reader as "you".
- A form title names the choice. A form description says what the choice changes.
- Read the code before you rewrite a text that is not clear.

### Translation

- Make the English text better first. Translate the new English.
- Translate the meaning, not word by word.
- Keep placeholders, values, identifiers and protocol names as they are, such as `.env` and `node_modules`.
- Do not make a sentence from translated parts.
- Portuguese is Brazilian Portuguese, and speaks to the reader as "você".
- Spanish speaks to the reader as "tú". **check**
- A changed English text changes `pt.json` and `es.json` in the same commit.

## Terms

| English | Portuguese | Spanish | Note |
| --- | --- | --- | --- |
| session | sessão | sesión | |
| chat | chat | chat | |
| agent | agente | agente | |
| engine | motor | motor | The kind of agent a host can run, such as Claude or Codex. **check** |
| connector | conector | conector | |
| adapter | adaptador | adaptador | A service that a connector can connect to. Kept, because ahpw shows the word. |
| host | host | host | Kept in each language. |
| worktree | worktree | worktree | A git term. The catalogs keep it now. |
| branch | branch | rama | As the catalogs have it now. |
| upstream | upstream | upstream | A git term. |
| folder | pasta | carpeta | |
| file | arquivo | archivo | |
| repository | repositório | repositorio | |
| pattern | padrão | patrón | A `.gitignore` pattern. |
| person | pessoa | persona | A user of this host. The code says `user`; the text says person. |
| team | time | equipo | |
| project | projeto | proyecto | |
| role | papel | rol | **check** Portuguese could also be "função". |
| permission | permissão | permiso | A grant. The code says `grant`; the text says permission. |
| token | token | token | |
| policy | política | política | |
| usage | uso | uso | |
| owner | dono | dueño | Who usage is charged to: a person, a team or a project. The code says pool. **check** |
| computer | computador | computadora | Spanish "equipo" is taken by team. **check** |
| model | modelo | modelo | |
| plugin | plugin | plugin | |
| sign-in | login | inicio de sesión | Spanish uses "sesión" here, as each Spanish app does. **check** |
| create | criar | crear | |
| save | salvar | guardar | Create or change. |
| remove | remover | quitar | |
| check | verificar | comprobar | Test that a thing works, and show its state. |

## Strings

### The new session form

The key is the catalog path under `session`. A row with no Portuguese or Spanish in the catalogs today says "(none)" in the old text.

| Key | Old English | New English | Portuguese | Spanish |
| --- | --- | --- | --- | --- |
| `isolation.title` | Isolation | Work in **check** | Trabalhar em | Trabajar en |
| `isolation.description` | Where the agent should make changes | Where the agent makes its changes. | Onde o agente faz as alterações. | Dónde hace el agente sus cambios. |
| `isolation.enum.folder` | Folder | This folder | Esta pasta | Esta carpeta |
| `isolation.enum.worktree` | Worktree | A new worktree | Uma worktree nova | Un worktree nuevo |
| `isolation.enumDescriptions.folder` | Work directly in the folder (none) | The agent changes the files in this folder. | O agente altera os arquivos desta pasta. | El agente cambia los archivos de esta carpeta. |
| `isolation.enumDescriptions.worktree` | Work in a git worktree of its own, so two sessions in one repository do not edit under each other (none) | The agent works in its own copy of the repository, so other sessions do not change the same files. | O agente trabalha numa cópia própria do repositório, e outras sessões não alteram os mesmos arquivos. | El agente trabaja en su propia copia del repositorio, y otras sesiones no cambian los mismos archivos. |
| `branch.title` | Branch | Branch | Branch | Rama |
| `branch.description` | Base branch the worktree starts from | The branch the new worktree starts from. | A branch de onde a worktree nova parte. | La rama de la que parte el worktree nuevo. |
| `worktreeIncludeFiles.title` | Files to bring along | Files to copy | Arquivos a copiar | Archivos que copiar |
| `worktreeIncludeFiles.description` | Patterns, in .gitignore syntax, for git-ignored files to copy into the worktree, such as .env | Files that git ignores and the worktree needs, such as .env. Write them as .gitignore patterns. | Arquivos que o git ignora e a worktree precisa, como .env. Escreva como padrões do .gitignore. | Archivos que git ignora y el worktree necesita, como .env. Escríbelos como patrones de .gitignore. |
| `worktreeIncludeFiles.items.title` | Pattern | Pattern | Padrão | Patrón |
| `worktreeSymlinkFolders.title` | Folders to share | Folders to share | Pastas a compartilhar | Carpetas compartidas |
| `worktreeSymlinkFolders.description` | Patterns, in .gitignore syntax, for git-ignored folders to link into the worktree, such as node_modules | Folders that git ignores and the worktree uses from this folder, such as node_modules. A change in them changes both. Write them as .gitignore patterns. | Pastas que o git ignora e a worktree usa desta pasta, como node_modules. Uma alteração nelas altera as duas. Escreva como padrões do .gitignore. | Carpetas que git ignora y el worktree usa desde esta carpeta, como node_modules. Un cambio en ellas cambia ambos. Escríbelas como patrones de .gitignore. |
| `worktreeSymlinkFolders.items.title` | Pattern | Pattern | Padrão | Patrón |
| `worktreeBranchPrefix.title` | Branch prefix | Branch prefix | Prefixo da branch | Prefijo de rama |
| `worktreeBranchPrefix.description` | Prepended to the branch created for the worktree. | Text at the start of the new branch's name, such as build/. | Texto no início do nome da branch nova, como build/. | Texto al inicio del nombre de la rama nueva, como build/. |
| `worktreeCreateNewBranch.title` | Create a branch | New branch | Branch nova | Rama nueva |
| `worktreeCreateNewBranch.description` | Make a branch for the worktree, or check out the chosen one as it is. | Start the worktree on a new branch, or on the chosen branch. | Começa a worktree numa branch nova, ou na branch escolhida. | Empieza el worktree en una rama nueva, o en la rama elegida. |
| `worktreeCreateNewBranch.enum.true` | Create one | Yes, a new branch | Sim, uma branch nova | Sí, una rama nueva |
| `worktreeCreateNewBranch.enum.false` | Continue the chosen branch | No, use the chosen branch | Não, usar a branch escolhida | No, usar la rama elegida |
| `worktreeBranchTrack.title` | Track upstream | Track upstream | Acompanhar o upstream | Seguir el upstream |
| `worktreeBranchTrack.description` | Whether the created branch tracks the upstream of the one it started from. | Give the new branch the upstream of the branch it starts from. | Dá à branch nova o upstream da branch de onde ela parte. | Da a la rama nueva el upstream de la rama de la que parte. |
| `worktreeBranchTrack.enum.true` | Track it | Track it | Acompanhar | Seguirlo |
| `worktreeBranchTrack.enum.false` | Leave it untracked | Do not track | Não acompanhar | No seguirlo |
| `scope.title` | Team and project | Team and project | Time e projeto | Equipo y proyecto |
| `scope.description` | Which team and project this session charges its work to | The team and project that this session's usage goes to. | O time e o projeto para onde vai o uso desta sessão. | El equipo y el proyecto a los que va el uso de esta sesión. |
| `connectors.title` | Connectors (none) | Connectors | Conectores | Conectores |
| `connectors.description` | The connectors this session may use, by name. (none) | The connectors this session can use. | Os conectores que esta sessão pode usar. | Los conectores que esta sesión puede usar. |

### Commands

The key is `methods.<method>`.

| Method | Old title and description | New English | Portuguese | Spanish |
| --- | --- | --- | --- | --- |
| `x-ahpd/me` | Who am I. Who this connection is, what it may do and where its work is charged. | Who am I. Who you are on this host, what you can do, and where your usage goes. | Quem sou eu. Quem você é neste host, o que pode fazer e para onde vai o seu uso. | Quién soy. Quién eres en este host, qué puedes hacer y a dónde va tu uso. |
| `x-ahpd/tokens/mint` | Mint a token. A token of yours, limited to grants you hold, shown once. | Create a token. Creates a token with some or all of your permissions. It is shown only once. | Criar um token. Cria um token com parte ou todas as suas permissões. Ele aparece uma vez só. | Crear un token. Crea un token con parte o todos tus permisos. Se muestra una sola vez. |
| `x-ahpd/tokens/list` | Tokens. The tokens you hold, without their hashes. | List tokens. Your tokens. A token's secret is not shown again. | Listar tokens. Os seus tokens. O segredo de um token não aparece de novo. | Listar tokens. Tus tokens. El secreto de un token no se vuelve a mostrar. |
| `x-ahpd/tokens/revoke` | Revoke a token. Take one of your tokens out; the next call with it is refused. | Revoke a token. Stops one of your tokens. It stops working at once. | Revogar um token. Desativa um dos seus tokens. Ele para de funcionar na hora. | Revocar un token. Desactiva uno de tus tokens. Deja de funcionar al instante. |
| `x-ahpd/usage/pools` | Usage pools. The pools something was charged to that you may read. | List usage owners. The people, teams and projects whose usage you can see. | Listar os donos do uso. As pessoas, times e projetos cujo uso você pode ver. | Listar los dueños del uso. Las personas, equipos y proyectos cuyo uso puedes ver. |
| `x-ahpd/usage/totals` | Usage totals. A pool's day, week and month. | Show usage totals. The usage of one owner for the day, the week and the month. | Mostrar o total de uso. O uso de um dono no dia, na semana e no mês. | Mostrar el total de uso. El uso de un dueño en el día, la semana y el mes. |
| `x-ahpd/usage/range` | Usage over a range. A pool's total between from and until. | Show usage between dates. The total usage of one owner between two dates. | Mostrar o uso entre datas. O uso total de um dono entre duas datas. | Mostrar el uso entre fechas. El uso total de un dueño entre dos fechas. |
| `x-ahpd/usage/records` | Usage records. The records charged to a pool between from and until. | List usage records. Each charge to one owner between two dates. | Listar os registros de uso. Cada cobrança de um dono entre duas datas. | Listar los registros de uso. Cada cargo de un dueño entre dos fechas. |
| `x-ahpd/usage/groups` | Usage by group. The records you may read, summed by user, team and project. | Show usage by group. The usage you can see, added up by person, team and project. | Mostrar o uso por grupo. O uso que você pode ver, somado por pessoa, time e projeto. | Mostrar el uso por grupo. El uso que puedes ver, sumado por persona, equipo y proyecto. |
| `x-ahpd/agents/put` | Make an agent. Makes or changes one agent record, and serves it. | Save an agent. Creates or changes an agent. It is ready to use at once. | Salvar um agente. Cria ou altera um agente. Ele fica pronto para usar na hora. | Guardar un agente. Crea o cambia un agente. Queda listo para usar al instante. |
| `x-ahpd/agents/remove` | Remove an agent. Ends the sessions on one agent and takes its record out. | Remove an agent. Removes the agent. Its open sessions end first. | Remover um agente. Remove o agente. As sessões abertas dele terminam antes. | Quitar un agente. Quita el agente. Sus sesiones abiertas terminan antes. |
| `x-ahpd/agents/check` | Check an agent. Builds one agent's backend and asks its probe, then answers the row. | Check an agent. Tests that the agent starts, and shows its state. | Verificar um agente. Testa se o agente inicia e mostra o estado dele. | Comprobar un agente. Prueba que el agente arranca y muestra su estado. |
| `x-ahpd/connectors/put` | Make a connector. Makes or changes one connector, and opens it. | Save a connector. Creates or changes a connector, and connects it. | Salvar um conector. Cria ou altera um conector e o conecta. | Guardar un conector. Crea o cambia un conector y lo conecta. |
| `x-ahpd/connectors/signin` | Start a sign-in. Starts a sign-in for an adapter, and answers the URL a person opens. | Start a sign-in. Starts the sign-in for a new connector, and gives the link to open. | Iniciar um login. Inicia o login de um conector novo e dá o link a abrir. | Empezar un inicio de sesión. Empieza el inicio de sesión de un conector nuevo y da el enlace que hay que abrir. |
| `x-ahpd/connectors/signin-finish` | Finish a sign-in. Exchanges the pasted code for the key, and makes the connector. | Finish a sign-in. Uses the pasted code to finish the sign-in, and creates the connector. | Concluir o login. Usa o código colado para concluir o login e cria o conector. | Terminar el inicio de sesión. Usa el código pegado para terminar el inicio de sesión y crea el conector. |
| `x-ahpd/connectors/remove` | Remove a connector. Closes one connector and takes it out. | Remove a connector. Disconnects the connector and removes it. | Remover um conector. Desconecta o conector e o remove. | Quitar un conector. Desconecta el conector y lo quita. |
| `x-ahpd/connectors/check` | Check a connector. Runs one open connector's own check, and answers the row. | Check a connector. Tests that the connector works, and shows its state. | Verificar um conector. Testa se o conector funciona e mostra o estado dele. | Comprobar un conector. Prueba que el conector funciona y muestra su estado. |
| `x-ahpd/connectors/note` | Note a call. Keeps one call's outcome in an open connector's health, for the plugin whose adapter it is. | Record a call result. Records if a call through the connector worked. Only the connector's plugin uses it. | Registrar o resultado de uma chamada. Registra se uma chamada pelo conector funcionou. Só o plugin do conector usa isto. | Registrar el resultado de una llamada. Registra si una llamada por el conector funcionó. Solo el plugin del conector lo usa. |
| `x-ahpd/connectors/models` | List a connector's models. Answers the models one open provider connector serves, and which of them the caller may call. | List a connector's models. The models the connector offers, and which ones you can use. | Listar os modelos de um conector. Os modelos que o conector oferece e quais você pode usar. | Listar los modelos de un conector. Los modelos que ofrece el conector y cuáles puedes usar. |

### Put and remove of a records domain

Today each title is `Put a ${scheme}` and `Remove a ${scheme}`. Each domain gets whole sentences, as the plan's *Answers* says.

| Method | New English | Portuguese | Spanish |
| --- | --- | --- | --- |
| `x-ahpd/users/put` | Save a person. Adds a person to this host, or changes their record. | Salvar uma pessoa. Adiciona uma pessoa a este host ou altera o registro dela. | Guardar una persona. Añade una persona a este host o cambia su registro. |
| `x-ahpd/users/remove` | Remove a person. Removes a person from this host. | Remover uma pessoa. Remove uma pessoa deste host. | Quitar una persona. Quita una persona de este host. |
| `x-ahpd/teams/put` | Save a team. Creates a team, or changes its title. | Salvar um time. Cria um time ou altera o título dele. | Guardar un equipo. Crea un equipo o cambia su título. |
| `x-ahpd/teams/remove` | Remove a team. Removes a team. | Remover um time. Remove um time. | Quitar un equipo. Quita un equipo. |
| `x-ahpd/projects/put` | Save a project. Creates a project, or changes its title. | Salvar um projeto. Cria um projeto ou altera o título dele. | Guardar un proyecto. Crea un proyecto o cambia su título. |
| `x-ahpd/projects/remove` | Remove a project. Removes a project. | Remover um projeto. Remove um projeto. | Quitar un proyecto. Quita un proyecto. |
| `x-ahpd/roles/put` | Save a role. Creates a role, or changes what it allows. | Salvar um papel. Cria um papel ou altera o que ele permite. | Guardar un rol. Crea un rol o cambia lo que permite. |
| `x-ahpd/roles/remove` | Remove a role. Removes a role. | Remover um papel. Remove um papel. | Quitar un rol. Quita un rol. |
| `x-ahpd/policies/put` | Save a policy. Creates or changes a policy. | Salvar uma política. Cria ou altera uma política. | Guardar una política. Crea o cambia una política. |
| `x-ahpd/policies/remove` | Remove a policy. Removes a policy. | Remover uma política. Remove uma política. | Quitar una política. Quita una política. |
| a domain that gives none | Save a record. Creates or changes a record. Remove a record. Removes a record. | Salvar um registro. Cria ou altera um registro. Remover um registro. Remove um registro. | Guardar un registro. Crea o cambia un registro. Quitar un registro. Quita un registro. |

### Channels and schemes

The key is `channels.<scheme>` for a channel and `schemes.<scheme>` for a scheme. The people and policy channels show the text of their scheme, so one row covers both keys.

| Key | Old title and description | New English | Portuguese | Spanish |
| --- | --- | --- | --- | --- |
| `channels.x-ahpd-agents` | Agents. The agents this host serves, each a record of an engine. | Agents. The agents on this host. | Agentes. Os agentes deste host. | Agentes. Los agentes de este host. |
| `channels.x-ahpd-engines` | Engines. The engines this host serves. | Engines. The kinds of agent this host can run. | Motores. Os tipos de agente que este host pode executar. | Motores. Los tipos de agente que este host puede ejecutar. |
| `channels.x-ahpd-adapters` | Adapters. The adapters this host serves. | Adapters. The services a connector can connect to. | Adaptadores. Os serviços aos quais um conector pode se conectar. | Adaptadores. Los servicios a los que se puede conectar un conector. |
| `channels.x-ahpd-connectors` | Connectors. The connectors made from the adapters this host serves. | Connectors. This host's connections to outside services. | Conectores. As conexões deste host com serviços externos. | Conectores. Las conexiones de este host con servicios externos. |
| `schemes.user`, `channels.x-ahpd-users` | People. Somebody who may use this host, and what their record holds. | People. The people who can use this host. | Pessoas. As pessoas que podem usar este host. | Personas. Las personas que pueden usar este host. |
| `schemes.team`, `channels.x-ahpd-teams` | Teams. Teams people belong to. | Teams. The teams people belong to. | Times. Os times aos quais as pessoas pertencem. | Equipos. Los equipos a los que pertenecen las personas. |
| `schemes.project`, `channels.x-ahpd-projects` | Projects. Projects people work on. | Projects. The projects people work on. | Projetos. Os projetos em que as pessoas trabalham. | Proyectos. Los proyectos en los que trabajan las personas. |
| `schemes.role`, `channels.x-ahpd-roles` | Roles. What a person with this role may do. | Roles. What each role lets a person do. | Papéis. O que cada papel permite a uma pessoa fazer. | Roles. Lo que cada rol permite hacer a una persona. |
| `schemes.policy`, `channels.x-ahpd-policies` | Policies. Who may use which agent, model and computer, and how much. | Policies. Who can use which agent, model and computer, and how much. | Políticas. Quem pode usar qual agente, modelo e computador, e quanto. | Políticas. Quién puede usar qué agente, modelo y computadora, y cuánto. |
| `schemes.usage` | Usage. What this host has been charged, per pool. | Usage. The usage on this host, by owner. | Uso. O uso neste host, por dono. | Uso. El uso en este host, por dueño. |

## Choices to check

| Choice | What this list does | The other way |
| --- | --- | --- |
| The title of `isolation` | "Work in", with "This folder" and "A new worktree" | Keep "Isolation", with "Folder" and "Worktree" |
| The word for a usage pool | "owner", as the code charges a pool to its owner | "account", which clashes with the agent accounts |
| Spanish form of "you" | "tú" | "usted" |
| Spanish word for computer | "computadora", as "equipo" is team | "ordenador", the word in Spain |
| Portuguese word for role | "papel" | "função" |
| The word for engine | "motor" in Portuguese and Spanish | keep "engine" in each language |
| Spanish word for sign-in | "inicio de sesión", beside "sesión" for a session | "acceso" |

## Not in this list

- The text of the `computer` row. The sdk only puts it first in the form; another layer writes it.
- The host settings of `host/root.ts` and `vscoderootconfig.ts`. They are settings, not the new session form.
- The automation presets and the fields of a policy record. They are records' forms, for a later plan.
- The tool titles of `tools/`. The model reads them, and they stay English.
- Refusals and errors. The plan's *Answers* puts them in a later plan.
