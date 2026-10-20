---
title: ACP agents, their links and their variables
---

Read from each vendor's own docs on 2026-10-19. The URL of each row is the page the facts came from.

## Links

| Id | Site | Company |
| --- | --- | --- |
| codex | https://developers.openai.com/codex | https://openai.com |
| gemini | https://geminicli.com | https://google.com |
| copilot | https://github.com/features/copilot/cli | https://github.com |
| opencode | https://opencode.ai | https://anoma.ly |
| kilo | https://kilo.ai/cli | https://kilo.ai |
| goose | https://goose-docs.ai | https://aaif.io |
| pi | https://pi.dev | https://earendil.com |
| dsh | https://deepseek-harness.github.io/deepseek-harness/ | https://www.deepseek.com |
| devin | https://docs.devin.ai/cli | https://cognition.com |
| cursor | https://cursor.com/cli | https://cursor.com |
| amp | https://ampcode.com | https://ampcode.com |
| qwen | https://qwenlm.github.io/qwen-code-docs/en/users/overview | https://qwen.ai |
| cline | https://cline.bot/cli | https://cline.bot |
| omp | https://omp.sh | https://stencil.so |

## Variables

A provider key is a key such as `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or `OPENROUTER_API_KEY`.

| Id | Variable | What it does | Secret | Source |
| --- | --- | --- | --- | --- |
| codex | `CODEX_API_KEY` | The API key, read before `OPENAI_API_KEY` | yes | https://developers.openai.com/codex/config-file/environment-variables |
| codex | `OPENAI_API_KEY` | The API key when `CODEX_API_KEY` is not set | yes | same |
| codex | `CODEX_HOME` | The folder for the config and the sessions; it must exist | no | same |
| gemini | `GEMINI_API_KEY` | The Gemini API key | yes | https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/reference/configuration.md |
| gemini | `GOOGLE_API_KEY` | The Vertex AI key | yes | same |
| gemini | `GEMINI_CLI_HOME` | The folder for the settings | no | same |
| gemini | `GEMINI_MODEL` | The model | no | same |
| copilot | `COPILOT_GITHUB_TOKEN` | The GitHub token, read before `GH_TOKEN` and `GITHUB_TOKEN` | yes | https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#environment-variables |
| copilot | `COPILOT_HOME` | The folder for the config and the sessions | no | same |
| copilot | `COPILOT_MODEL` | The model | no | same |
| copilot | `COPILOT_AUTO_UPDATE` | `false` stops the update | no | same |
| opencode | `OPENCODE_CONFIG` | The config file | no | https://opencode.ai/docs/cli/#environment-variables |
| opencode | `OPENCODE_CONFIG_DIR` | The config folder | no | same |
| opencode | `OPENCODE_DISABLE_AUTOUPDATE` | Any value stops the update | no | same |
| kilo | `KILO_API_KEY` | The Kilo API key | yes | https://kilo.ai/docs/code-with-ai/platforms/cli |
| kilo | `KILO_CONFIG_DIR` | The config folder | no | same |
| kilo | `KILO_PROVIDER` | The provider | no | same |
| kilo | `KILOCODE_MODEL` | The model | no | same |
| goose | `GOOSE_PROVIDER` | The provider | no | https://goose-docs.ai/docs/guides/environment-variables/ |
| goose | `GOOSE_MODEL` | The model | no | same |
| goose | `GOOSE_PROVIDER__API_KEY` | The key of the provider | yes | same |
| goose | `GOOSE_PATH_ROOT` | The folder for the config and the data | no | same |
| pi | `PI_CODING_AGENT_DIR` | The folder for the config and the sessions | no | https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/environment-variables.md |
| pi | `PI_SKIP_VERSION_CHECK` | Any value stops the version check | no | same |
| dsh | `DEEPSEEK_API_KEY` | The DeepSeek API key | yes | https://github.com/deepseek-ai/deepseek-harness |
| dsh | `DSH_HOME` | The folder for the config and the sessions | no | same |
| devin | `WINDSURF_API_KEY` | The key that `devin acp` signs in with | yes | https://docs.devin.ai/cli/reference/commands.md |
| devin | `DEVIN_MODEL` | The model | no | same |
| cursor | `CURSOR_API_KEY` | The Cursor API key | yes | https://cursor.com/docs/cli/reference/configuration.md |
| cursor | `CURSOR_CONFIG_DIR` | The config folder | no | same |
| amp | `AMP_API_KEY` | The Amp API key | yes | https://ampcode.com/docs/markdown/cli/settings |
| amp | `AMP_SKIP_UPDATE_CHECK` | `1` stops the update check | no | same |
| qwen | `OPENAI_API_KEY` | The key of an OpenAI-compatible provider | yes | https://raw.githubusercontent.com/QwenLM/qwen-code/main/docs/users/configuration/settings.md |
| qwen | `OPENAI_BASE_URL` | The URL of that provider | no | same |
| qwen | `OPENAI_MODEL` | The model | no | same |
| qwen | `QWEN_HOME` | The folder for the config and the sessions | no | same |
| cline | `CLINE_API_KEY` | The key, instead of a sign-in | yes | https://docs.cline.bot/usage/acp.md |
| cline | `CLINE_PROVIDER` | The provider | no | same |
| cline | `CLINE_MODEL` | The model | no | same |
| cline | `CLINE_DIR` | The config folder | no | https://docs.cline.bot/cli/cli-reference.md |
| omp | `PI_CODING_AGENT_DIR` | The agent folder | no | https://raw.githubusercontent.com/can1357/oh-my-pi/main/docs/environment-variables.md |
| omp | `OMP_PROFILE` | The profile | no | same |
| omp | `OMP_AUTH_BROKER_URL` | The URL of a remote broker for keys | no | same |
| omp | `OMP_AUTH_BROKER_TOKEN` | The token for that broker | yes | same |

## Not confirmed

- Kilo's docs do not say that Kilo reads `OPENCODE_DISABLE_AUTOUPDATE`, which its preset sets.
- The ACP registry starts Qwen with `--acp --experimental-skills`; the preset gives only `--acp`.
- No vendor documents a model variable for codex, opencode, cursor, amp or pi.
