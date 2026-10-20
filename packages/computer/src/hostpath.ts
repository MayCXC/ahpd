import { hostPathOf } from '@ahpd/sdk';

/*
 * A host path as this package compares it with what Docker reports.
 *
 * On Linux and macOS a path is its own text, since a backslash is a character
 * a name may hold and case is a difference. On Windows the separators are one
 * and case is no difference, as Windows itself reads a path, and Docker Desktop
 * may name a bind's source by the path its own Linux VM reaches the drive at.
 */

export const windowsHost = process.platform === 'win32';

/** A host path in the one spelling two of them are compared in. */
export const spelledOnHost = (path: string): string => (windowsHost ? path.replaceAll('\\', '/').toLowerCase() : path);

/**
 * A mount's source as the host path it names.
 *
 * Docker on Linux reports a bind's source as the host path it was given.
 * Docker Desktop on Windows may report it as the path its own Linux VM reaches
 * the drive by - `/run/desktop/mnt/host/c/...` under WSL 2, `/host_mnt/c/...`
 * before it - so on Windows either is read back as `C:\...`.
 */
export const sourceOnHost = (source: string): string => {
  if (!windowsHost) return source;
  const vm = /^\/(?:run\/desktop\/mnt\/host|host_mnt)(\/[a-z](?:\/.*)?)$/.exec(source);
  return vm === null ? source : hostPathOf(vm[1] as string);
};

/** Whether a source Docker reported names this host path. */
export const sameHostPath = (source: string, path: string): boolean =>
  spelledOnHost(sourceOnHost(source)) === spelledOnHost(path);
