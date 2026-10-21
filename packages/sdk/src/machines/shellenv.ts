/** The environment an operator gives the shells this host starts. */

/**
 * An environment a deployment names, by variable.
 *
 * A string is what the variable is set to; `null` removes it. The two are not
 * the same answer, and the difference is the point: a daemon that runs as a
 * service with a private `XDG_CONFIG_HOME` can take that one variable away
 * from every shell it opens rather than only adding to what it inherits.
 */
export type ShellEnv = Record<string, string | null>;

/**
 * Whether a name is one a POSIX shell reads as a variable.
 *
 * A name it cannot read is not a variable it can export: `export 2>&1=x` is a
 * syntax error, and `unset a-b` names nothing. Both the daemon, which refuses
 * such a key in `config.json`, and the Claude backend, which writes an
 * `export` line for each one, ask this rather than carrying a rule each.
 */
export const isShellName = (name: string): boolean => /^[A-Za-z_][A-Za-z0-9_]*$/u.test(name);

/**
 * A base environment with the operator's map over it.
 *
 * The base is copied rather than changed, so the process's own `process.env`
 * comes back whole for the next caller. A name set to a string is set; a name
 * set to `null` is deleted, which is what makes the map able to remove a
 * variable as well as add one.
 */
export const shellEnvOf = (
  base: Record<string, string | undefined>,
  shellEnv?: ShellEnv,
): Record<string, string | undefined> => {
  const environment: Record<string, string | undefined> = { ...base };
  for (const [name, value] of Object.entries(shellEnv ?? {})) {
    if (value === null) delete environment[name];
    else environment[name] = value;
  }
  return environment;
};
