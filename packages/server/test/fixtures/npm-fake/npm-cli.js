// The stand-in npm as the daemon starts it: its own Node with the script that
// `npm_execpath` names. It runs the `npm` shell stand-in beside it with the same
// arguments, and leaves the code that one left.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const ran = spawnSync(join(import.meta.dirname, 'npm'), process.argv.slice(2), { stdio: 'inherit' });
process.exit(ran.status ?? 1);
