import { existsSync, watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { projectDirOf } from './disk.js';

/** The folders a session's customizations are read from. */
export interface WatchRoots {
  /** The personal scope: `CLAUDE_CONFIG_DIR`, or `~/.claude`. */
  configDir: string;
  /** The session's working directory, whose `.claude` is the project scope. */
  cwd?: string;
}

/** How long after the last change of a burst the list is read again. */
const WAIT_MS = 300;

/** The folders of a scope a customization is read from, each watched with its subfolders. */
const FOLDERS = ['agents', 'skills', 'commands', 'rules'];

/**
 * The folder of the installed plugins, watched without its subfolders: a
 * plugin's cache is a whole repository, and an install or a removal writes
 * the files at its top.
 */
const PLUGINS = 'plugins';

/**
 * The files in `PLUGINS` that list the installed plugins, and the only ones
 * there that are called for. The CLI writes `known_marketplaces.json` each
 * time it starts, and a call for it starts a probe, whose CLI writes it again.
 */
const INSTALLED = new Set(['installed_plugins.json', 'installed_plugins_v2.json']);

/** The files of a scope a customization is read from. */
const FILES = new Set(['CLAUDE.md', 'CLAUDE.local.md', 'settings.json', 'settings.local.json']);

/** The memory files at the top of a working directory. */
const MEMORY = new Set(['CLAUDE.md', 'CLAUDE.local.md']);

/**
 * Watch the Claude folders of a session, and call `onChange` when a
 * customization in them is written, edited or deleted.
 *
 * The personal folder and `<cwd>/.claude` are watched where a customization
 * is read from, and `cwd` itself only for its `CLAUDE.md` files. A
 * burst of changes is one call, `WAIT_MS` after its last change. A folder that
 * is not there yet is watched for from its parent, and from when it appears.
 *
 * A watcher is an extra rather than the answer: a folder that cannot be
 * watched is left out, and nothing here throws. The function it returns
 * closes every handle, and no call comes after it.
 */
export function watchFolders(roots: WatchRoots, onChange: () => void): () => void {
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const handles = new Set<FSWatcher>();

  const fire = (): void => {
    if (closed) return;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (!closed) onChange();
    }, WAIT_MS);
  };

  /** One folder watched through the shared wait, or nothing when it cannot be. */
  const opened = (at: string, recursive: boolean, onName: (name: string | null, event: string) => void): FSWatcher | undefined => {
    if (closed) return undefined;
    let watcher: FSWatcher;
    try { watcher = watch(at, { recursive }, (event, name) => onName(name === null ? null : String(name), event)); }
    catch { return undefined; }
    handles.add(watcher);
    // A failed handle takes only itself; an `error` with no listener ends the process.
    watcher.on('error', () => {
      watcher.close();
      handles.delete(watcher);
    });
    return watcher;
  };

  /**
   * A scope's folder: its customization folders with their subfolders, its
   * plugins folder and its own files without. Nothing else in it is watched,
   * because the rest - the transcripts under `projects`, `todos` - is the
   * CLI's own and changes nothing listed, and a watch of it costs a handle per
   * folder.
   *
   * A folder that appears, or is made again, is watched from then on. A scope
   * that is not there is watched for from its parent.
   */
  const scope = (dir: string): void => {
    const held = new Map<string, FSWatcher | undefined>();
    /** Watch one folder of the scope again, from what is there now. */
    const folder = (name: string): void => {
      const was = held.get(name);
      if (was !== undefined) { was.close(); handles.delete(was); }
      const at = join(dir, name);
      const onName = name === PLUGINS
        ? (file: string | null): void => { if (file === null || INSTALLED.has(file)) fire(); }
        : fire;
      held.set(name, existsSync(at) ? opened(at, name !== PLUGINS, onName) : undefined);
    };
    const open = (): void => {
      opened(dir, false, (name, event) => {
        if (name === null || FILES.has(name)) fire();
        // Only a folder made or removed. Windows also says `change` for a
        // folder when a file in it is written, and its own watch has that.
        else if (event === 'rename' && (name === PLUGINS || FOLDERS.includes(name))) {
          folder(name);
          fire();
        }
      });
      for (const name of [...FOLDERS, PLUGINS]) folder(name);
    };
    if (existsSync(dir)) {
      open();
      return;
    }
    const own = basename(dir);
    const parent = opened(dirname(dir), false, (name) => {
      if (name !== own || !existsSync(dir) || closed) return;
      parent?.close();
      if (parent !== undefined) handles.delete(parent);
      open();
      // What was written with the folder came before its watch.
      fire();
    });
  };

  scope(roots.configDir);
  if (roots.cwd !== undefined) {
    // None in the home folder, whose `.claude` is the personal folder.
    const project = projectDirOf(roots);
    // The project's `.claude` is watched for by the working directory's own
    // handle, which is open for the memory files anyway.
    if (project !== undefined && existsSync(project)) scope(project);
    let found = project === undefined || existsSync(project);
    opened(roots.cwd, false, (name) => {
      if (name !== null && MEMORY.has(name)) fire();
      if (!found && project !== undefined && name === '.claude' && existsSync(project)) {
        found = true;
        scope(project);
        fire();
      }
    });
  }

  return () => {
    closed = true;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    for (const handle of handles) handle.close();
    handles.clear();
  };
}
