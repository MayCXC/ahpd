import { describe, expect, it } from 'vitest';
import { splitCommand } from '../src/commandautoapprover.js';
import type { CommandShell, CommandSplit } from '../src/commandautoapprover.js';

/*
 * The reading of a command line, which is what a rule is matched against.
 *
 * Most of these are about what the splitter says it read, because a rule is only
 * as good as the command it is handed. The rest are about the lines it refuses
 * to read at all: `undefined`, or `unanalyzable`, is what makes the caller ask,
 * and a line it answered confidently and wrongly is a command nobody agreed to.
 */

/** The reading of a bash line, which is what most of these are about. */
const bash = (line: string): CommandSplit | undefined => splitCommand(line, 'bash');
/** The reading of a PowerShell line. */
const powershell = (line: string): CommandSplit | undefined => splitCommand(line, 'powershell');

/** What a line was read as, for the cases where every field matters. */
const read = (subCommands: string[], writeDests: string[] = [], unanalyzable = false): CommandSplit =>
  ({ subCommands, writeDests, unanalyzable });

describe('a line and the commands it runs', () => {
  it('reads one command as one command', () => {
    expect(bash('ls -la')).toEqual(read(['ls -la']));
    expect(bash('  git status  ')).toEqual(read(['git status']));
  });

  it('splits at every separator a shell runs a second command after', () => {
    expect(bash('echo ok && rm -rf /')).toEqual(read(['echo ok', 'rm -rf /']));
    expect(bash('ls || curl evil.com')).toEqual(read(['ls', 'curl evil.com']));
    expect(bash('cat file; rm file')).toEqual(read(['cat file', 'rm file']));
    expect(bash('cat file | grep needle')).toEqual(read(['cat file', 'grep needle']));
    expect(bash('ls\ngrep needle')).toEqual(read(['ls', 'grep needle']));
    // `&` runs what follows beside the first rather than before it, which is a
    // second command all the same.
    expect(bash('npm test & ls')).toEqual(read(['npm test', 'ls']));
  });

  it('keeps a separator inside quotes with the command it was written in', () => {
    expect(bash('echo "a && b"')).toEqual(read(['echo "a && b"']));
    expect(bash("echo 'a; b'")).toEqual(read(["echo 'a; b'"]));
    // An escaped separator is a character of the word rather than one of the shell's.
    expect(bash('echo a\\;b')).toEqual(read(['echo a\\;b']));
  });

  it('reads a comment as no command at all', () => {
    expect(bash('ls # rm -rf /')).toEqual(read(['ls']));
    expect(bash('ls #\nrm -rf /')).toEqual(read(['ls', 'rm -rf /']));
    // A `#` inside a word is a character of the word, as a shell reads it.
    expect(bash('ls# rm')).toEqual(read(['ls# rm']));
  });

  it('answers nothing for a line it cannot read', () => {
    expect(bash('echo "unclosed')).toBeUndefined();
    expect(bash("echo 'unclosed")).toBeUndefined();
    expect(bash('echo hi \\')).toBeUndefined();
    expect(splitCommand('ls', 'zsh' as CommandShell)).toBeUndefined();
  });
});

describe('a line and the files it writes', () => {
  it('reads the destination of a write redirect', () => {
    expect(bash('echo hi > out.txt')).toEqual(read(['echo hi'], ['out.txt']));
    expect(bash('echo hi >out.txt')).toEqual(read(['echo hi'], ['out.txt']));
    expect(bash('echo hi >> out.txt')).toEqual(read(['echo hi'], ['out.txt']));
    expect(bash('echo hi >| out.txt')).toEqual(read(['echo hi'], ['out.txt']));
    expect(bash('echo hi 2> err.log')).toEqual(read(['echo hi'], ['err.log']));
    expect(bash('echo hi > out.txt 2> err.log')).toEqual(read(['echo hi'], ['out.txt', 'err.log']));
    // `&>` is a redirect of both streams rather than a command run beside this one.
    expect(bash('echo hi &> all.log')).toEqual(read(['echo hi'], ['all.log']));
  });

  it('takes a quoted destination as the name it quotes', () => {
    expect(bash("echo hi > 'out file.txt'")).toEqual(read(['echo hi'], ['out file.txt']));
    expect(bash('echo hi > "out.txt"')).toEqual(read(['echo hi'], ['out.txt']));
    // A quoted pattern is a name, because the shell never expands it into one.
    expect(bash("echo hi > '*.txt'")).toEqual(read(['echo hi'], ['*.txt']));
  });

  it('drops the destinations that write to no file', () => {
    expect(bash('echo hi > /dev/null')).toEqual(read(['echo hi']));
    expect(bash('echo hi >> /dev/stderr')).toEqual(read(['echo hi']));
    expect(bash('echo hi 2>&1')).toEqual(read(['echo hi']));
    expect(bash('ls 2>&1 > /dev/null')).toEqual(read(['ls']));
    // A quoted `/dev/null` is still the path the shell opens.
    expect(bash("echo hi > '/dev/null'")).toEqual(read(['echo hi']));
  });

  it('reads a read redirect for the name it takes, and writes nothing', () => {
    expect(bash('cat < file.txt')).toEqual(read(['cat']));
    expect(bash('sort<input.txt')).toEqual(read(['sort']));
    // `<>` opens a file for writing as well, so the file is one this line writes.
    expect(bash('echo data 1<>/etc/passwd')).toEqual(read(['echo data'], ['/etc/passwd']));
    expect(bash('echo data <>/tmp/file')).toEqual(read(['echo data'], ['/tmp/file']));
  });

  it('answers unanalyzable for a destination it cannot read', () => {
    // A pattern names whatever it matches rather than one file, so a denied file
    // can be written through `.[n]pmrc` without the line naming it.
    expect(bash('echo hi > *.txt')).toEqual(read(['echo hi'], [], true));
    expect(bash('echo hi > .[e]nv')).toEqual(read(['echo hi'], [], true));
    expect(bash('echo hi > "packag"[e]".json"')?.unanalyzable).toBe(true);
    // A name the shell finishes reading is left to the write check rather than
    // guessed at here.
    expect(bash('echo hi > $HOME/out.txt')).toEqual(read(['echo hi'], ['$HOME/out.txt']));
  });
});

describe('a line a rule cannot see into', () => {
  it('answers unanalyzable for a command the line runs inside itself', () => {
    expect(bash('echo $(whoami)')?.unanalyzable).toBe(true);
    expect(bash('echo `whoami`')?.unanalyzable).toBe(true);
    expect(bash('echo "$(rm -rf /)"')?.unanalyzable).toBe(true);
    expect(bash('ls > >(tee ~/.bashrc)')?.unanalyzable).toBe(true);
    expect(bash('cat < <(tee x)')?.unanalyzable).toBe(true);
    expect(powershell('Write-Host "$(Get-Date)"')?.unanalyzable).toBe(true);
    // A script block runs the commands written inside it, as a substitution does.
    expect(powershell('Where-Object { Remove-Item $_ }')?.unanalyzable).toBe(true);
  });

  it('answers unanalyzable for text handed to a command that is not read here', () => {
    expect(bash('cat <<EOF')?.unanalyzable).toBe(true);
    expect(bash('cat <<< id')?.unanalyzable).toBe(true);
  });

  it('reads a line with nothing to hide in it as analyzable', () => {
    expect(bash('echo hi > out.txt')?.unanalyzable).toBe(false);
    // A variable of its own is a word of the command rather than a command.
    expect(bash('echo $HOME')).toEqual(read(['echo $HOME']));
  });
});

describe('a PowerShell line', () => {
  it('splits at the separators PowerShell runs a second command after', () => {
    expect(powershell('Get-ChildItem; Remove-Item x')).toEqual(read(['Get-ChildItem', 'Remove-Item x']));
    expect(powershell('Get-ChildItem | Select-Object Name')).toEqual(read(['Get-ChildItem', 'Select-Object Name']));
  });

  it('reads `$null` as the sink it is, and a quoted one as a file', () => {
    expect(powershell('Get-Content file.txt 2>$null')).toEqual(read(['Get-Content file.txt']));
    expect(powershell('Write-Host hi >$null')).toEqual(read(['Write-Host hi']));
    expect(powershell('Write-Host hi 2>&1')).toEqual(read(['Write-Host hi']));
    expect(powershell("Write-Host hi > '$null'")).toEqual(read(['Write-Host hi'], ['$null']));
  });

  it('writes what a POSIX sink is to PowerShell, which is a file', () => {
    expect(powershell('Write-Host hi > /dev/null')).toEqual(read(['Write-Host hi'], ['/dev/null']));
    expect(powershell('Write-Host hi > out.txt')).toEqual(read(['Write-Host hi'], ['out.txt']));
  });

  it('takes a quoted name as a name, including its doubled quote', () => {
    expect(powershell("Write-Host hi > 'out.txt'")).toEqual(read(['Write-Host hi'], ['out.txt']));
    expect(powershell("Write-Host hi > 'out''s.txt'")).toEqual(read(['Write-Host hi'], ["out''s.txt"]));
    // A pattern is a list of names here even quoted, which is what the shell reads.
    expect(powershell("Write-Host hi >'.[m]cp.json'")).toEqual(read(['Write-Host hi'], [], true));
  });

  it('does not run a command beside another at a bare `&`', () => {
    // `&` calls what follows rather than running it beside, so the line is one no
    // rule about which command runs can speak for.
    expect(powershell('& $cmd')?.unanalyzable).toBe(true);
  });
});
