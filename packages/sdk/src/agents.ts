/**
 * The agents a setup can find, and how each one is installed.
 *
 * A row is what the daemon needs to know about an agent it did not start: the
 * preset id a client names, what to call it, the command that speaks ACP, and
 * the line that installs it. `@ahpd/agent-acp` takes each row's name and command
 * from here, so the command a person is told to install and the command the
 * daemon spawns have one source. The rest of a preset - its arguments, its
 * environment and its machine - stays in that package, because the daemon never
 * spawns an agent itself.
 *
 * The list lives in the sdk rather than in `@ahpd/agent-acp` because `@ahpd/server`
 * reads it to offer an agent it found on PATH, and `pnpm boundary` does not let
 * the server import a package that runs an agent.
 *
 * Every install line is the vendor's own, copied from its install docs or its
 * npm package page and checked on 2026-10-19. A system a vendor does not give a
 * line for is left out rather than guessed at, and the row's `page` is what a
 * person on that system is shown instead. A line is never made up from a product
 * name: `codex` has no ACP mode, so Codex's line installs `codex-acp`, the
 * command its preset runs.
 */

/** One known agent, as the daemon and a setup read it. */
export interface KnownAgent {
  /** The preset id a client names, which is also this row's key. */
  id: string;
  /** What a client reads instead of the id. */
  name: string;
  /** The program to spawn as the ACP server. */
  command: string;
  /**
   * The line that installs it, by system, as the vendor's own docs give it.
   *
   * `all` is what a system with no key of its own uses; a system's key wins over
   * it. A system with neither is left to `page`.
   */
  install?: {
    /** A line that works on every system the vendor supports. */
    all?: string;
    /** Linux. */
    linux?: string;
    /** macOS. */
    darwin?: string;
    /** Windows. */
    win32?: string;
  };
  /** The vendor's install page, for a system the lines do not cover. */
  page?: string;
}

/** How a known agent is installed on `platform`, or nothing when the row has no line for it. */
export const installLine = (agent: KnownAgent, platform: NodeJS.Platform): string | undefined => {
  const install = agent.install;
  if (install === undefined) return undefined;
  if (platform === 'linux' || platform === 'darwin' || platform === 'win32') {
    return install[platform] ?? install.all;
  }
  return install.all;
};

/**
 * Every agent a setup knows, by the preset id a client names.
 *
 * The npm lines are `npm i -g <package>` for the package `versions.json` installs
 * for that part. The rest are copied from the vendor's docs, and a system the
 * docs do not name is absent rather than filled in.
 */
export const knownAgents: Record<string, KnownAgent> = {
  codex: {
    id: 'codex',
    name: 'Codex',
    command: 'codex-acp',
    install: { all: 'npm i -g @agentclientprotocol/codex-acp' },
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    command: 'gemini',
    install: { all: 'npm i -g @google/gemini-cli' },
  },
  copilot: {
    id: 'copilot',
    name: 'Copilot',
    command: 'copilot',
    install: { all: 'npm i -g @github/copilot' },
  },
  opencode: {
    id: 'opencode',
    name: 'OpenCode',
    command: 'opencode',
    install: {
      linux: 'curl -fsSL https://opencode.ai/install | bash',
      darwin: 'curl -fsSL https://opencode.ai/install | bash',
      win32: 'npm install -g opencode-ai',
    },
  },
  kilo: {
    id: 'kilo',
    name: 'Kilo',
    command: 'kilo',
    install: { all: 'npm i -g @kilocode/cli' },
  },
  goose: {
    id: 'goose',
    name: 'Goose',
    command: 'goose',
    install: {
      linux: 'curl -fsSL https://github.com/aaif-goose/goose/releases/download/stable/download_cli.sh | bash',
      darwin: 'curl -fsSL https://github.com/aaif-goose/goose/releases/download/stable/download_cli.sh | bash',
      // Windows has no line: the docs' one-line form is for Git Bash and MSYS2,
      // and PowerShell is a two-step download and run, so the page covers it.
    },
    page: 'https://goose-docs.ai/docs/getting-started/installation/',
  },
  pi: {
    id: 'pi',
    name: 'Pi',
    command: 'pi-acp',
    install: { all: 'npm i -g pi-acp' },
  },
  dsh: {
    id: 'dsh',
    name: 'dsh',
    command: 'dsh',
    install: { all: 'npm i -g @deepseek-ai/dsh' },
  },
  devin: {
    id: 'devin',
    name: 'Devin',
    command: 'devin',
    install: {
      linux: 'curl -fsSL https://cli.devin.ai/install.sh | bash',
      darwin: 'curl -fsSL https://cli.devin.ai/install.sh | bash',
      win32: 'irm https://static.devin.ai/cli/setup.ps1 | iex',
    },
  },
  cursor: {
    id: 'cursor',
    name: 'Cursor',
    command: 'cursor-agent',
    install: {
      linux: 'curl https://cursor.com/install -fsS | bash',
      darwin: 'curl https://cursor.com/install -fsS | bash',
      win32: "irm 'https://cursor.com/install?win32=true' | iex",
    },
  },
  amp: {
    id: 'amp',
    name: 'Amp',
    command: 'amp-acp',
    // The adapter's own README offers prebuilt binaries and `npx -y amp-acp`,
    // and no line that installs the command globally, so every system is left
    // to the page rather than given a line the project does not document.
    page: 'https://github.com/tao12345666333/amp-acp#readme',
  },
  qwen: {
    id: 'qwen',
    name: 'Qwen Code',
    command: 'qwen',
    install: { all: 'npm i -g @qwen-code/qwen-code' },
  },
};
