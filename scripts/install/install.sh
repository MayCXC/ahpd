#!/usr/bin/env bash
#
# Install ahpd with one line:
#
#   curl -fsSL https://ahpio.com/install.sh | bash
#
# Then uninstall it with:
#
#   curl -fsSL https://ahpio.com/install.sh | bash -s -- --uninstall
#
# The flags, and the AHPD_* variable each one reads when a pipe cannot pass it:
#
#   --version <v>   AHPD_VERSION     the package version, latest when omitted
#   --package <p>   AHPD_PACKAGE     the package, @ahpd/server by default
#   --runtime <r>   AHPD_RUNTIME     node or bun
#   --no-onboard    AHPD_NO_ONBOARD  do not run ahpd configure
#   --dry-run       AHPD_DRY_RUN     print each step and change nothing
#   --verbose       AHPD_VERBOSE     print each command before it runs
#   --help          AHPD_HELP        print this help
#   --uninstall     AHPD_UNINSTALL   remove what the install put there
#   --purge         AHPD_PURGE       with --uninstall, remove the configuration
#
# The script installs into the person's home folder and never needs sudo. It
# reads a question from /dev/tty, because a piped script reads stdin from the
# pipe, and it stops with the command when there is no terminal to ask on.

set -euo pipefail

# The comment the install writes above its PATH line, and the only line the
# uninstall removes. A person reading their rc file finds the line by it.
MARKER='# added by the ahpd install script'

# Where nvm and Bun are installed from. Both are the commands their own
# documentation gives for a script that cannot ask a person to run one.
NVM_INSTALL_URL='https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh'
BUN_INSTALL_URL='https://bun.com/install'

PACKAGE="${AHPD_PACKAGE:-@ahpd/server}"
VERSION="${AHPD_VERSION:-}"
RUNTIME="${AHPD_RUNTIME:-node}"

NO_ONBOARD=0
DRY_RUN=0
VERBOSE=0
HELP=0
UNINSTALL=0
PURGE=0

NODE=''
NPM=''
BUN=''
BIN=''
AHPD=''

on() {
  case "${1:-}" in
    ''|0|false|FALSE|no|NO) return 1 ;;
    *) return 0 ;;
  esac
}

if on "${AHPD_NO_ONBOARD:-}"; then NO_ONBOARD=1; fi
if on "${AHPD_DRY_RUN:-}"; then DRY_RUN=1; fi
if on "${AHPD_VERBOSE:-}"; then VERBOSE=1; fi
if on "${AHPD_HELP:-}"; then HELP=1; fi
if on "${AHPD_UNINSTALL:-}"; then UNINSTALL=1; fi
if on "${AHPD_PURGE:-}"; then PURGE=1; fi

say() { printf 'ahpd: %s\n' "$*"; }
warn() { printf 'ahpd: %s\n' "$*" >&2; }
fail() { local code="$1"; shift; printf 'ahpd: %s\n' "$*" >&2; exit "$code"; }

# One command, printed instead of run under --dry-run, and named under
# --verbose. A command that fails is the caller's to read: `run_cmd` in an `if`
# is a step whose failure the script goes on from.
run_cmd() {
  if [ "$DRY_RUN" -eq 1 ]; then
    say "would run: $*"
    return 0
  fi
  if [ "$VERBOSE" -eq 1 ]; then
    printf 'ahpd: %s\n' "$*" >&2
  fi
  "$@"
}

usage() {
  cat <<'EOF'
Install ahpd with one line:

  curl -fsSL https://ahpio.com/install.sh | bash

A flag passes through the pipe after `bash -s --`, and every flag also reads an
AHPD_* variable, because a PowerShell pipe cannot pass parameters at all.

  --version <v>   install this version of the package (AHPD_VERSION)
  --package <p>   install this package (AHPD_PACKAGE, @ahpd/server by default)
  --runtime <r>   node or bun (AHPD_RUNTIME)
  --no-onboard    do not run ahpd configure (AHPD_NO_ONBOARD)
  --dry-run       print each step and change nothing (AHPD_DRY_RUN)
  --verbose       print each command before it runs (AHPD_VERBOSE)
  --help          print this help (AHPD_HELP)
  --uninstall     stop the daemon, remove the package and the PATH line (AHPD_UNINSTALL)
  --purge         with --uninstall, also remove the configuration (AHPD_PURGE)

The script installs into your home folder and never needs sudo.
EOF
}

need() {
  if [ "$#" -lt 2 ]; then
    fail 2 "$1 needs a value."
  fi
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --version)
        need "$@"
        VERSION="$2"
        shift 2
        ;;
      --version=*)
        VERSION="${1#*=}"
        shift
        ;;
      --package)
        need "$@"
        PACKAGE="$2"
        shift 2
        ;;
      --package=*)
        PACKAGE="${1#*=}"
        shift
        ;;
      --runtime)
        need "$@"
        RUNTIME="$2"
        shift 2
        ;;
      --runtime=*)
        RUNTIME="${1#*=}"
        shift
        ;;
      --no-onboard)
        NO_ONBOARD=1
        shift
        ;;
      --dry-run)
        DRY_RUN=1
        shift
        ;;
      --verbose)
        VERBOSE=1
        shift
        ;;
      --help|-h)
        HELP=1
        shift
        ;;
      --uninstall)
        UNINSTALL=1
        shift
        ;;
      --purge)
        PURGE=1
        shift
        ;;
      --)
        shift
        if [ "$#" -gt 0 ]; then
          fail 2 "Unexpected argument: $1."
        fi
        ;;
      -*)
        fail 2 "Unknown flag: $1."
        ;;
      *)
        fail 2 "Unexpected argument: $1."
        ;;
    esac
  done

  case "$RUNTIME" in
    node|bun) ;;
    *) fail 2 "Unknown runtime: $RUNTIME. Use node or bun." ;;
  esac

  if [ "$PURGE" -eq 1 ] && [ "$UNINSTALL" -eq 0 ]; then
    fail 2 "--purge needs --uninstall."
  fi
}

# Claude Code's rule: an install into the home folder has no reason to be root,
# and a root process leaves files the person cannot edit. A root shell that was
# not reached through sudo, as a container's is, is left alone.
refuse_sudo() {
  if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ]; then
    fail 1 "Do not run this with sudo: it installs into your home folder. Run it as $SUDO_USER."
  fi
}

interactive() {
  if [ ! -t 1 ]; then
    return 1
  fi
  if ( : < /dev/tty ) 2>/dev/null; then
    return 0
  fi
  return 1
}

ask_yes() {
  local answer=''
  printf '%s [Y/n] ' "$1" >&2
  if ! IFS= read -r answer < /dev/tty; then
    answer=''
  fi
  case "$answer" in
    n|N|no|NO) return 1 ;;
    *) return 0 ;;
  esac
}

node_version() {
  local value
  value="$("$1" --version 2>/dev/null)" || return 1
  printf '%s\n' "${value#v}"
}

# Node 22.1 is the floors of `engines.node` in packages/server/package.json and
# in the workspace root.
node_fits() {
  local value major minor rest
  value="$(node_version "$1")" || return 1
  major="${value%%.*}"
  rest="${value#*.}"
  minor="${rest%%.*}"
  case "$major" in
    ''|*[!0-9]*) return 1 ;;
  esac
  case "$minor" in
    ''|*[!0-9]*) minor=0 ;;
  esac
  if [ "$major" -gt 22 ]; then return 0; fi
  if [ "$major" -eq 22 ] && [ "$minor" -ge 1 ]; then return 0; fi
  return 1
}

# The node on PATH first, then the newest one nvm holds. A node on PATH that is
# too old is not the answer, so nvm is still read.
find_node() {
  local one dir
  if one="$(command -v node 2>/dev/null)"; then
    if node_fits "$one"; then
      printf '%s\n' "$one"
      return 0
    fi
  fi
  dir="${NVM_DIR:-$HOME/.nvm}/versions/node"
  if [ ! -d "$dir" ]; then
    return 1
  fi
  for one in $(ls -1 "$dir" 2>/dev/null | sort -rV); do
    if [ -x "$dir/$one/bin/node" ] && node_fits "$dir/$one/bin/node"; then
      printf '%s\n' "$dir/$one/bin/node"
      return 0
    fi
  done
  return 1
}

node_hint() {
  printf 'Node 22.1 or later is required. Install it with nvm:\n' >&2
  printf '  curl -o- %s | bash\n' "$NVM_INSTALL_URL" >&2
  printf '  nvm install 22\n' >&2
}

ensure_node() {
  local found
  if found="$(find_node)"; then
    NODE="$found"
  else
    if [ "$DRY_RUN" -eq 1 ]; then
      say "Node 22.1 or later is not on the PATH. It would be installed with nvm:"
      printf '  curl -o- %s | bash\n' "$NVM_INSTALL_URL"
      printf '  nvm install 22\n'
      exit 0
    fi
    if ! interactive; then
      node_hint
      exit 1
    fi
    if ! ask_yes 'Node 22.1 or later is needed. Install it with nvm now?'; then
      node_hint
      exit 1
    fi
    say 'Installing nvm and Node 22.'
    run_cmd sh -c "curl -o- '$NVM_INSTALL_URL' | bash"
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    if [ ! -f "$NVM_DIR/nvm.sh" ]; then
      fail 1 "nvm did not install into $NVM_DIR."
    fi
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh"
    run_cmd nvm install 22
    if ! found="$(find_node)"; then
      fail 1 "Node 22.1 or later is still not on the PATH after the install."
    fi
    NODE="$found"
  fi

  NPM="$(dirname "$NODE")/npm"
  if [ ! -x "$NPM" ]; then
    NPM="$(command -v npm 2>/dev/null || true)"
  fi
  if [ -z "$NPM" ]; then
    fail 1 "npm was not found beside $NODE."
  fi
}

ensure_bun() {
  BUN="$(command -v bun 2>/dev/null || true)"
  if [ -z "$BUN" ]; then
    fail 1 "Bun is not on the PATH. Install it with: curl -fsSL $BUN_INSTALL_URL | bash"
  fi
  BIN="${BUN_INSTALL:-$HOME/.bun}/bin"
}

# npm's global folder when the person can write to it, and ~/.npm-global when
# they cannot: a global install under /usr/local is one npm refuses, and sudo is
# not how the install answers that.
resolve_prefix() {
  local prefix
  prefix="$("$NPM" prefix -g 2>/dev/null || true)"
  if [ -z "$prefix" ]; then
    prefix="$("$NPM" config get prefix 2>/dev/null || true)"
  fi
  if [ -z "$prefix" ] || [ ! -d "$prefix" ] || [ ! -w "$prefix" ]; then
    say "The global npm prefix is not writable; using $HOME/.npm-global."
    run_cmd "$NPM" config set prefix "$HOME/.npm-global"
    prefix="$HOME/.npm-global"
    if [ "$DRY_RUN" -eq 0 ]; then
      mkdir -p "$prefix/bin"
    fi
  fi
  BIN="$prefix/bin"
}

# npm 11.16 is where --allow-scripts arrived. A node-pty that npm does not build
# leaves terminals on pipes, which the daemon already handles.
npm_allows_scripts() {
  local value major minor rest
  value="$("$NPM" --version 2>/dev/null)" || return 1
  major="${value%%.*}"
  rest="${value#*.}"
  minor="${rest%%.*}"
  case "$major" in
    ''|*[!0-9]*) return 1 ;;
  esac
  case "$minor" in
    ''|*[!0-9]*) minor=0 ;;
  esac
  if [ "$major" -gt 11 ]; then return 0; fi
  if [ "$major" -eq 11 ] && [ "$minor" -ge 16 ]; then return 0; fi
  return 1
}

package_spec() {
  if [ -n "$VERSION" ]; then
    printf '%s@%s\n' "$PACKAGE" "$VERSION"
  else
    printf '%s\n' "$PACKAGE"
  fi
}

# A node-pty that did not build is a warning, because the package is optional
# and the install is what a person came for.
warn_pty() {
  case "$1" in
    *node-pty*) ;;
    *) return 0 ;;
  esac
  case "$1" in
    *gyp*|*"build error"*|*"command failed"*) ;;
    *) return 0 ;;
  esac
  warn 'node-pty did not build; terminals will use pipes.'
  case "$(uname -s)" in
    Darwin) warn 'Run xcode-select --install, then run this again.' ;;
    *) warn 'Install python3, make and a C++ compiler, then run this again.' ;;
  esac
}

install_package() {
  local target args output status
  target="$(package_spec)"

  if [ "$RUNTIME" = bun ]; then
    run_cmd "$BUN" add -g "$target"
    return 0
  fi

  args=(install -g --no-fund --no-audit)
  if npm_allows_scripts; then
    args+=(--allow-scripts=node-pty)
  fi
  args+=("$target")

  if [ "$DRY_RUN" -eq 1 ]; then
    say "would run: $NPM ${args[*]}"
    return 0
  fi

  status=0
  output="$("$NPM" "${args[@]}" 2>&1)" || status=$?
  if [ -n "$output" ]; then
    printf '%s\n' "$output"
  fi
  warn_pty "$output"
  if [ "$status" -eq 0 ]; then
    return 0
  fi
  if [ -x "$BIN/ahpd" ] || command -v ahpd >/dev/null 2>&1; then
    warn "npm install exited $status, but ahpd is installed; carrying on."
    return 0
  fi
  fail "$status" "npm install failed."
}

shell_name() {
  local value="${SHELL:-}"
  printf '%s\n' "${value##*/}"
}

rc_path() {
  # A container often has no SHELL, so an unset one falls to ~/.profile.
  case "$(shell_name)" in
    zsh) printf '%s\n' "$HOME/.zshrc" ;;
    bash) printf '%s\n' "$HOME/.bashrc" ;;
    fish) printf '%s\n' "${XDG_CONFIG_HOME:-$HOME/.config}/fish/config.fish" ;;
    *) printf '%s\n' "$HOME/.profile" ;;
  esac
}

path_line() {
  if [ "$(shell_name)" = fish ]; then
    printf 'fish_add_path %s\n' "$BIN"
  else
    printf 'export PATH="%s:$PATH"\n' "$BIN"
  fi
}

write_path() {
  local rc line
  rc="$(rc_path)"
  line="$(path_line)"
  # A prefix that is already on the PATH, as /usr/local is in a container,
  # needs no line of its own.
  case ":$PATH:" in
    *":$BIN:"*) return 0 ;;
  esac
  if [ -f "$rc" ] && grep -Fq "$MARKER" "$rc"; then
    return 0
  fi
  if [ "$DRY_RUN" -eq 1 ]; then
    say "would add $BIN to PATH in $rc"
    return 0
  fi
  mkdir -p "$(dirname "$rc")"
  printf '\n%s\n%s\n' "$MARKER" "$line" >> "$rc"
  say "Added $BIN to PATH in $rc."
}

remove_path() {
  local rc temp
  rc="$(rc_path)"
  if [ ! -f "$rc" ]; then
    return 0
  fi
  if ! grep -Fq "$MARKER" "$rc"; then
    return 0
  fi
  if [ "$DRY_RUN" -eq 1 ]; then
    say "would remove the PATH line from $rc"
    return 0
  fi
  temp="$rc.ahpd.$$"
  awk -v marker="$MARKER" 'skip { skip=0; next } $0 == marker { skip=1; next } { print }' "$rc" > "$temp"
  # Written back into the file rather than moved over it, so a linked rc file
  # stays a link and keeps its mode.
  cat "$temp" > "$rc"
  rm -f "$temp"
  say "Removed the PATH line from $rc."
}

purge_config() {
  local dir
  dir="${XDG_CONFIG_HOME:-$HOME/.config}/ahpd"
  if [ "$DRY_RUN" -eq 1 ]; then
    say "would remove $dir"
    return 0
  fi
  if [ -d "$dir" ]; then
    rm -rf "$dir"
    say "Removed $dir."
  fi
}

# The one command that is ahpd in this machine, in this order: the bin folder
# this install wrote into, then the PATH.
resolve_ahpd() {
  if [ -n "$BIN" ] && [ -x "$BIN/ahpd" ]; then
    printf '%s\n' "$BIN/ahpd"
    return 0
  fi
  command -v ahpd 2>/dev/null
}

# Where daemon/31 writes the file that says a service exists. A daemon that a
# manager holds also records `service` in its record, which is what `ahpd
# status --json` reads.
service_file() {
  case "$(uname -s)" in
    Linux) printf '%s\n' "${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/ahpd.service" ;;
    Darwin) printf '%s\n' "$HOME/Library/LaunchAgents/dev.ahpd.daemon.plist" ;;
    *) printf '\n' ;;
  esac
}

service_installed() {
  local file
  file="$(service_file)"
  if [ -n "$file" ] && [ -f "$file" ]; then
    return 0
  fi
  if [ -z "$AHPD" ]; then
    return 1
  fi
  case "$("$AHPD" status --json 2>/dev/null || true)" in
    *'"service"'*) return 0 ;;
  esac
  return 1
}

daemon_running() {
  if [ -z "$AHPD" ]; then
    return 1
  fi
  "$AHPD" status --json >/dev/null 2>&1
}

do_install() {
  local had_ahpd=0 ahpd=''

  if [ "$RUNTIME" = bun ]; then
    ensure_bun
  else
    ensure_node
    resolve_prefix
  fi

  if ahpd="$(resolve_ahpd || true)"; then
    if [ -n "$ahpd" ]; then
      had_ahpd=1
    fi
  fi

  install_package
  write_path

  # An upgrade reloads the plugins and says how to pick the new version up. The
  # daemon is never restarted here: it may be serving a turn.
  if [ "$had_ahpd" -eq 1 ]; then
    ahpd="$(resolve_ahpd || true)"
    if [ -n "$ahpd" ]; then
      if ! run_cmd "$ahpd" plugin update all; then
        warn 'ahpd plugin update all failed; the installed plugins stay as they are.'
      fi
    fi
    say 'Run ahpd restart to load the new version and its plugins.'
  fi

  # The questions read /dev/tty, because this script's stdin is the pipe it
  # came in on. Without a terminal there is nobody to ask.
  if [ "$NO_ONBOARD" -eq 0 ] && interactive; then
    ahpd="$(resolve_ahpd || true)"
    if [ -n "$ahpd" ]; then
      run_cmd "$ahpd" configure < /dev/tty
    else
      warn 'ahpd is not on the PATH; run ahpd configure yourself.'
    fi
  fi

  say 'Next: ahpd service install'
}

do_uninstall() {
  local found target bun

  if [ "$RUNTIME" = bun ]; then
    BIN="${BUN_INSTALL:-$HOME/.bun}/bin"
  else
    if found="$(find_node)"; then
      NODE="$found"
      NPM="$(dirname "$NODE")/npm"
      if [ ! -x "$NPM" ]; then
        NPM="$(command -v npm 2>/dev/null || true)"
      fi
    fi
  fi

  AHPD="$(command -v ahpd 2>/dev/null || true)"
  # The package name, not the version: npm removes what is installed, and a
  # version the person named may be the one an upgrade replaced.
  target="$PACKAGE"

  # The service goes first: a manager that still holds the daemon would start
  # it again after the package is gone.
  if [ -n "$AHPD" ] && service_installed; then
    if ! run_cmd "$AHPD" service uninstall; then
      warn 'ahpd service uninstall failed; the service may still be installed.'
    fi
  fi

  if daemon_running; then
    if ! run_cmd "$AHPD" stop; then
      fail 1 'ahpd stop failed; nothing was removed.'
    fi
  fi

  if [ "$RUNTIME" = bun ]; then
    bun="$(command -v bun 2>/dev/null || true)"
    if [ -z "$bun" ]; then
      fail 1 'Bun is not on the PATH.'
    fi
    run_cmd "$bun" remove -g "$target"
  else
    if [ -z "${NPM:-}" ]; then
      fail 1 'npm was not found. Install Node 22.1 or later, then run this again.'
    fi
    run_cmd "$NPM" uninstall -g "$target"
  fi

  remove_path

  if [ "$PURGE" -eq 1 ]; then
    purge_config
  else
    say "Kept ${XDG_CONFIG_HOME:-$HOME/.config}/ahpd and its plugins."
  fi
  # The npm prefix and its line in ~/.npmrc stay: another package may be under
  # the same prefix, and the file is the person's.
  if [ -f "$HOME/.npmrc" ] && grep -Fq 'prefix=' "$HOME/.npmrc" 2>/dev/null; then
    say "Kept the npm prefix in $HOME/.npmrc."
  fi
  say 'Done.'
}

main() {
  parse_args "$@"
  if [ "$HELP" -eq 1 ]; then
    usage
    return 0
  fi
  refuse_sudo
  if [ "$UNINSTALL" -eq 1 ]; then
    do_uninstall
    return 0
  fi
  do_install
}

# A test sources this file with AHPD_INSTALL_NO_RUN=1, then calls `main` with
# the flags it wants, so the flags and every step are the ones a person gets.
if [ "${AHPD_INSTALL_NO_RUN:-0}" != "1" ]; then
  main "$@"
fi
