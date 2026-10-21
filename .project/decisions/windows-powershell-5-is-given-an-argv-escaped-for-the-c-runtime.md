---
title: Windows PowerShell 5.1 is given an argv escaped for the C runtime
status: accepted
date: 2026-10-20
refs:
  - "[code://packages/sdk/src/machines/terminals.ts#L126-L133](../../packages/sdk/src/machines/terminals.ts#L126-L133) - `psQuoted`, one word in PowerShell's single quotes"
  - "[code://packages/sdk/src/machines/terminals.ts#L212-L227](../../packages/sdk/src/machines/terminals.ts#L212-L227) - `argvLine`, an argv as one line behind the call operator"
  - "[code://packages/sdk/test/pty.test.ts#L367-L375](../../packages/sdk/test/pty.test.ts#L367-L375) - the case that fails under Windows PowerShell 5.1"
---

## Context

A terminal started with an argv on Windows runs it through the shell, as `& 'program' 'word' ...` under PowerShell.
Windows PowerShell 5.1 builds the program's command line from those words without escaping a `"` inside one: it wraps a word with whitespace in double quotes and copies the rest as it is.
So `node -e 'process.stdout.write(process.argv[1] ?? "")' 'a b'` reaches node as `?? ")`, a syntax error, on a Windows 10 VM with no PowerShell 7.
PowerShell 7.3 and later escape the words themselves, and the `check-windows` runner has PowerShell 7, so CI never saw it.
Windows PowerShell 5.1 also drops an empty word, and a word with whitespace that ends in `\` escapes its own closing quote.

## Decision

When the shell is Windows PowerShell, `powershell.exe`, each word after the program is escaped for the C runtime before it is quoted for PowerShell.
A `"` gets its preceding backslashes doubled and one more in front of it; a word with whitespace gets its trailing backslashes doubled; an empty word is written `""`.
`pwsh.exe`, `cmd.exe` and the POSIX shells are given the words as before.
Source: Softov, 2026-10-20, asked "How should p8 fix it?" for the argv a terminal runs under Windows PowerShell 5.1: "Escape for PS 5.1 (Recommended)".

## Consequences

A program run through Windows PowerShell 5.1 reads each word whole, as it does under PowerShell 7.
A word given to a PowerShell cmdlet or function instead of a program arrives with the escapes in it; the argv form names a program, so that is not the case it serves.
The escape is chosen by the shell's file name, which is how the shell's kind is already read.

## Options

- **Run an argv with no shell.** Lost: on Windows a `.cmd` such as `npm` cannot be spawned without a shell since CVE-2024-27980, so it would need a case of its own.
- **Skip the case under Windows PowerShell 5.1 and defer the bug.** Lost: a Windows 10 host with no PowerShell 7 keeps running broken argvs.
