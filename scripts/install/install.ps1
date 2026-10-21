# Install ahpd on Windows with one line:
#
#   irm https://ahpio.com/ahpd/install.ps1 | iex
#
# The flags, and the AHPD_* variable each one reads. A PowerShell pipe cannot
# pass a parameter, so the variables are the way `irm | iex` chooses anything;
# a person with a terminal can also run the script as a block:
#
#   & ([scriptblock]::Create((irm https://ahpio.com/ahpd/install.ps1))) -NoOnboard
#
#   -Version <v>   AHPD_VERSION     the package version, latest when omitted
#   -Package <p>   AHPD_PACKAGE     the package, @ahpd/server by default
#   -Runtime <r>   AHPD_RUNTIME     node or bun
#   -Yes           AHPD_YES         update an installed ahpd without asking
#   -NoOnboard     AHPD_NO_ONBOARD  do not run ahpd configure
#   -DryRun        AHPD_DRY_RUN     print each step and change nothing
#   -Verbose       AHPD_VERBOSE     print each command before it runs
#   -Help          AHPD_HELP        print this help
#   -Uninstall     AHPD_UNINSTALL   stop the daemon and remove the package and PATH entry
#   -Purge         AHPD_PURGE       with -Uninstall, remove the configuration
#
# Under `iex` the script must not call `exit`: that closes the person's window
# before they can read the error. Every failure is a `throw`, which prints and
# leaves the session open.

param(
  [string]$Version = $env:AHPD_VERSION,
  [string]$Package = $env:AHPD_PACKAGE,
  [string]$Runtime = $env:AHPD_RUNTIME,
  [switch]$Yes,
  [switch]$NoOnboard,
  [switch]$DryRun,
  [switch]$Verbose,
  [switch]$Help,
  [switch]$Uninstall,
  [switch]$Purge
)

function Test-Enabled([string]$Name) {
  $value = [Environment]::GetEnvironmentVariable($Name)
  if (-not $value) { return $false }
  return $value -notin @('0', 'false', 'FALSE', 'no', 'NO')
}

function Write-Say([string]$Message) {
  Write-Host "ahpd: $Message"
}

function Show-Usage {
  Write-Host @'
Install ahpd on Windows with one line:

  irm https://ahpio.com/ahpd/install.ps1 | iex

Every flag also reads an AHPD_* variable, because a PowerShell pipe cannot pass
a parameter:

  -Version <v>   install this version of the package (AHPD_VERSION)
  -Package <p>   install this package (AHPD_PACKAGE, @ahpd/server by default)
  -Runtime <r>   node or bun (AHPD_RUNTIME)
  -Yes           update an installed ahpd without asking (AHPD_YES)
  -NoOnboard     do not run ahpd configure (AHPD_NO_ONBOARD)
  -DryRun        print each step and change nothing (AHPD_DRY_RUN)
  -Verbose       print each command before it runs (AHPD_VERBOSE)
  -Help          print this help (AHPD_HELP)
  -Uninstall     remove the package and the PATH entry (AHPD_UNINSTALL)
  -Purge         with -Uninstall, also remove the configuration (AHPD_PURGE)

To pass a flag from the one line, run the script as a block:

  & ([scriptblock]::Create((irm https://ahpio.com/ahpd/install.ps1))) -NoOnboard
'@
}

function Get-HomeFolder {
  if ($env:USERPROFILE) { return $env:USERPROFILE }
  if ($env:HOME) { return $env:HOME }
  throw 'Cannot find your home folder: USERPROFILE and HOME are both unset.'
}

function Get-NodeVersion {
  $command = Get-Command node -CommandType Application -ErrorAction SilentlyContinue
  if (-not $command) { return $null }
  $text = (& node --version 2>$null)
  if ($LASTEXITCODE -ne 0) { return $null }
  return ("$text" -replace '^v', '').Trim()
}

# Node 22.1 is the floor of `engines.node` in packages/server/package.json.
function Test-NodeFits([string]$Value) {
  if (-not $Value) { return $false }
  $parts = $Value.Split('.')
  $major = 0
  $minor = 0
  if (-not [int]::TryParse($parts[0], [ref]$major)) { return $false }
  if ($parts.Length -gt 1) { [void][int]::TryParse($parts[1], [ref]$minor) }
  return ($major -gt 22) -or (($major -eq 22) -and ($minor -ge 1))
}

# One runtime line, in the words `ahpd configure` uses: what is there, the
# version `--version` printed, and whether ahpd runs on it.
function Write-RuntimeLine([string]$Name, [string]$Program) {
  # As in Resolve-Ahpd: an npm shim folder holds an extensionless file beside
  # the .cmd, and only the .cmd or .exe runs.
  $found = @(Get-Command $Program -CommandType Application -ErrorAction SilentlyContinue)
  $command = $found | Where-Object { $_.Extension -in @('.cmd', '.exe') } | Select-Object -First 1
  if (-not $command) { $command = $found | Select-Object -First 1 }
  if (-not $command) {
    Write-Host "$Name not found"
    return
  }
  $line = $null
  $output = & $command.Source --version 2>$null
  if ($LASTEXITCODE -eq 0 -and $output) {
    $line = @($output)[0].ToString().Trim()
  }
  if (-not $line) {
    Write-Host "$Name at $($command.Source) (could not read its version)"
    return
  }
  if ($Program -eq 'node') {
    if (Test-NodeFits ($line -replace '^v', '')) {
      Write-Host "Node $line (runs ahpd)"
    } else {
      Write-Host "Node $line (ahpd does not run on it; it needs Node 22.1 or newer)"
    }
  } elseif ($Program -eq 'deno') {
    Write-Host "Deno $line (runs ahpd; each plugin it loads needs an npm: spec)"
  } else {
    Write-Host "$Name $line (runs ahpd)"
  }
}

# What this machine has, before anything is installed: a person whose install
# stops sees which runtime was missing or too old.
function Write-Runtimes {
  Write-RuntimeLine 'Node' 'node'
  Write-RuntimeLine 'Bun' 'bun'
  Write-RuntimeLine 'Deno' 'deno'
}

function Get-NpmVersion {
  $command = Get-Command npm -CommandType Application -ErrorAction SilentlyContinue
  if (-not $command) { return $null }
  $text = (& npm --version 2>$null)
  if ($LASTEXITCODE -ne 0) { return $null }
  return "$text".Trim()
}

# npm 11.16 is where --allow-scripts arrived.
function Test-AllowsScripts([string]$Value) {
  if (-not $Value) { return $false }
  $parts = $Value.Split('.')
  $major = 0
  $minor = 0
  if (-not [int]::TryParse($parts[0], [ref]$major)) { return $false }
  if ($parts.Length -gt 1) { [void][int]::TryParse($parts[1], [ref]$minor) }
  return ($major -gt 11) -or (($major -eq 11) -and ($minor -ge 16))
}

# On Windows the global prefix is the folder the shims land in.
function Get-NpmBin {
  $prefix = (& npm prefix -g 2>$null)
  if ($LASTEXITCODE -ne 0 -or -not $prefix) {
    throw 'Could not read the npm global prefix. Open a new window and run this again.'
  }
  return "$prefix".Trim()
}

function Test-Interactive {
  # Under `irm | iex` the input is the pipe, so input redirection says nothing
  # about whether a person is watching. The output does: a window shows it.
  return -not [Console]::IsOutputRedirected
}

function Confirm-Action([string]$Question) {
  $answer = Read-Host "$Question [Y/n]"
  return ($answer -notmatch '^(n|no)$')
}

function Install-Node {
  & winget install OpenJS.NodeJS.LTS
  if ($LASTEXITCODE -ne 0) {
    throw "winget install OpenJS.NodeJS.LTS failed with exit code $LASTEXITCODE."
  }
  # winget writes the new PATH for the next session; this one reads it again so
  # the rest of the script can see node.
  $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  $user = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$machine;$user"
}

function Resolve-Node {
  $value = Get-NodeVersion
  if (Test-NodeFits $value) { return }
  $hint = 'Node 22.1 or later is required. Install it with: winget install OpenJS.NodeJS.LTS'
  if (-not (Test-Interactive)) { throw $hint }
  if (-not (Confirm-Action 'Node 22.1 or later is needed. Install it with winget now?')) {
    throw $hint
  }
  Write-Say 'Installing Node with winget.'
  Install-Node
  $value = Get-NodeVersion
  if (-not (Test-NodeFits $value)) {
    throw 'Node 22.1 or later is still not on the PATH. Open a new window and run this again.'
  }
}

function Resolve-Bun {
  $command = Get-Command bun -CommandType Application -ErrorAction SilentlyContinue
  if (-not $command) {
    throw 'Bun is not on the PATH. Install it with: powershell -c "irm bun.sh/install.ps1|iex"'
  }
  if ($env:BUN_INSTALL) { return (Join-Path $env:BUN_INSTALL 'bin') }
  return (Join-Path (Get-HomeFolder) '.bun\bin')
}

function Get-UserPathEntries {
  $value = [Environment]::GetEnvironmentVariable('Path', 'User')
  if (-not $value) { return @() }
  return @($value.Split(';') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
}

function Test-PathEntry([string[]]$Entries, [string]$Folder) {
  $target = $Folder.TrimEnd('\')
  foreach ($entry in $Entries) {
    if ($entry.TrimEnd('\') -ieq $target) { return $true }
  }
  return $false
}

function Add-UserPath([string]$Folder) {
  $entries = @(Get-UserPathEntries)
  if (Test-PathEntry $entries $Folder) {
    $env:Path = "$Folder;$env:Path"
    return $false
  }
  if ($isDryRun) {
    Write-Say "would add $Folder to your user PATH"
    return $true
  }
  $new = (@($entries) + $Folder) -join ';'
  [Environment]::SetEnvironmentVariable('Path', $new, 'User')
  $env:Path = "$Folder;$env:Path"
  Write-Say "Added $Folder to your user PATH."
  return $true
}

# The PATH entry the install added is removed by value, because a Windows PATH
# has no comment to find it by. The install adds the entry only when it is
# absent, so an entry that is there is the one it wrote.
function Remove-UserPath([string]$Folder) {
  $entries = @(Get-UserPathEntries)
  if (-not (Test-PathEntry $entries $Folder)) { return $false }
  if ($isDryRun) {
    Write-Say "would remove $Folder from your user PATH"
    return $true
  }
  $target = $Folder.TrimEnd('\')
  $kept = @($entries | Where-Object { $_.TrimEnd('\') -ine $target })
  [Environment]::SetEnvironmentVariable('Path', ($kept -join ';'), 'User')
  Write-Say "Removed $Folder from your user PATH."
  return $true
}

function Get-ConfigDir {
  if ($env:XDG_CONFIG_HOME) { return (Join-Path $env:XDG_CONFIG_HOME 'ahpd') }
  return (Join-Path (Get-HomeFolder) '.config\ahpd')
}

function Resolve-Ahpd([string]$Folder) {
  # npm puts an ahpd.cmd and an extensionless shell shim side by side, and both
  # are found; the one Windows runs is the .cmd or .exe.
  $found = @(Get-Command ahpd -CommandType Application -ErrorAction SilentlyContinue)
  $command = $found | Where-Object { $_.Extension -in @('.cmd', '.exe') } | Select-Object -First 1
  if (-not $command) { $command = $found | Select-Object -First 1 }
  if ($command) { return $command.Source }
  if ($Folder) {
    foreach ($name in @('ahpd.cmd', 'ahpd.exe', 'ahpd')) {
      $candidate = Join-Path $Folder $name
      if (Test-Path $candidate) { return $candidate }
    }
  }
  return $null
}

function Get-AhpdVersion([string]$Program) {
  $output = & $Program --version 2>$null
  if ($LASTEXITCODE -ne 0) { return $null }
  $line = @($output)[0]
  if (-not $line) { return $null }
  return ("$line".Trim() -replace '^v', '')
}

# The version the install moves to: the one -Version named, or the newest the
# registry has for the package.
function Get-TargetVersion {
  if ($Version) { return ($Version -replace '^v', '') }
  $output = & npm view $Package version 2>$null
  if ($LASTEXITCODE -ne 0) { return $null }
  $line = @($output)[0]
  if (-not $line) { return $null }
  return ("$line".Trim() -replace '^v', '')
}

# On Windows npm puts the folder's name in the PATH, and the shims and their
# node_modules beside each other in that folder, so the folder an ahpd.cmd is
# in is the prefix. A folder without node_modules is not one npm made.
function Test-NpmPrefix([string]$Folder) {
  if (-not (Test-Path $Folder -PathType Container)) { return $false }
  return (Test-Path (Join-Path $Folder 'node_modules') -PathType Container)
}

function Test-Writable([string]$Folder) {
  if ($isDryRun) { return $true }
  $probe = Join-Path $Folder ('.ahpd-write-check-' + [guid]::NewGuid().ToString('N'))
  try {
    [void][System.IO.File]::WriteAllText($probe, '')
    Remove-Item $probe -Force -ErrorAction SilentlyContinue
    return $true
  } catch {
    return $false
  }
}

# The update is the person's to allow: it changes an ahpd that is already
# installed, and where. -Yes and AHPD_YES answer for them; a run with no
# console has nobody to ask, so it stops unless one of them was given.
function Confirm-Update([string]$Old, [string]$New, [string]$Folder) {
  Write-Say "ahpd $Old is installed at $Folder."
  if ($isYes) { return }
  # Nothing is changed under -DryRun, so the question is printed and the walk
  # through the steps goes on.
  if ($isDryRun) {
    Write-Host "Update it to ${New}? [Y/n] " -NoNewline
    return
  }
  if (-not (Test-Interactive)) {
    Write-Host "Update it to ${New}? [Y/n] " -NoNewline
    throw "There is no terminal to answer on. Run this again with -Yes to update ahpd $Old at $Folder to $New."
  }
  if (-not (Confirm-Action "Update it to ${New}?")) {
    throw "Left ahpd $Old at $Folder as it is."
  }
}

# The update is done when the `ahpd` the window finds prints the new version.
# An old ahpd earlier on the PATH, or a second one in another folder, is what
# this stops on: that is the install that looked done and left the old one.
function Assert-InstalledVersion([string]$Want, [string]$Folder) {
  if ($isDryRun) {
    Write-Say "would check: ahpd --version prints $Want"
    return
  }
  $found = Resolve-Ahpd
  if (-not $found) {
    throw "ahpd $Want was installed at $Folder, but ahpd is not on the PATH. Add $Folder to the PATH and run this again."
  }
  $seen = Get-AhpdVersion $found
  if ($seen -ne $Want) {
    $printed = if ($seen) { $seen } else { 'no version' }
    throw "ahpd at $found prints $printed, not $Want. That is a second ahpd: remove it, or put $Folder first on the PATH."
  }
  Write-Say "ahpd $Want is installed at $found."
}

function Get-PackageSpec {
  if ($Version) { return "$Package@$Version" }
  return $Package
}

function Install-Package([string]$Target, [string]$Folder) {
  if ($Runtime -eq 'bun') {
    if ($isDryRun) {
      Write-Say "would run: bun add -g $Target"
      return
    }
    if ($isVerbose) { Write-Host "ahpd: bun add -g $Target" }
    & bun add -g $Target
    if ($LASTEXITCODE -ne 0) {
      throw "bun add failed with exit code $LASTEXITCODE."
    }
    return
  }

  $npmVersion = Get-NpmVersion
  if (-not $npmVersion) {
    throw 'npm was not found beside Node. Open a new window and run this again.'
  }
  # The folder is named here rather than as an npm setting: the script changes
  # the folder it installs into, not the person's npm configuration.
  $arguments = @('install', '-g', '--prefix', $Folder, '--no-fund', '--no-audit')
  if (Test-AllowsScripts $npmVersion) {
    $arguments += '--allow-scripts=node-pty'
  }
  $arguments += $Target
  if ($isDryRun) {
    Write-Say "would run: npm $($arguments -join ' ')"
    return
  }
  if ($isVerbose) { Write-Host "ahpd: npm $($arguments -join ' ')" }
  & npm @arguments
  if ($LASTEXITCODE -ne 0) {
    # An ahpd from an earlier install is no reason to call a failed install a
    # success: it is how a script ran to its end and left the old version there.
    throw "npm install failed with exit code $LASTEXITCODE."
  }
}

function Invoke-AhpdUninstall {
  if ($Runtime -eq 'bun') {
    $folder = Resolve-Bun
  } else {
    if (-not (Get-NpmVersion)) {
      throw 'npm was not found. Install Node 22.1 or later, then run this again.'
    }
    $folder = Get-NpmBin
  }

  $ahpd = Resolve-Ahpd $folder

  # No service step: daemon/31 gives Windows no service to remove.
  if ($ahpd) {
    & $ahpd status *> $null
    if ($LASTEXITCODE -eq 0) {
      if ($isDryRun) {
        Write-Say 'would run: ahpd stop'
      } else {
        & $ahpd stop
        if ($LASTEXITCODE -ne 0) {
          throw 'ahpd stop failed; nothing was removed.'
        }
      }
    }
  }

  if ($isDryRun) {
    if ($Runtime -eq 'bun') {
      Write-Say "would run: bun remove -g $Package"
    } else {
      Write-Say "would run: npm uninstall -g $Package"
    }
  } elseif ($Runtime -eq 'bun') {
    & bun remove -g $Package
    if ($LASTEXITCODE -ne 0) {
      throw "bun remove failed with exit code $LASTEXITCODE."
    }
  } else {
    & npm uninstall -g $Package
    if ($LASTEXITCODE -ne 0) {
      throw "npm uninstall failed with exit code $LASTEXITCODE."
    }
  }

  $null = Remove-UserPath $folder

  # The npm prefix and the npmrc stay: another package may be under the prefix,
  # and the file is the person's.
  $configDir = Get-ConfigDir
  if ($isPurge) {
    if (Test-Path $configDir) {
      if ($isDryRun) {
        Write-Say "would remove $configDir"
      } else {
        Remove-Item -Recurse -Force $configDir
        Write-Say "Removed $configDir."
      }
    }
  } else {
    Write-Say "Kept $configDir and its plugins."
  }
  Write-Say 'Done.'
}

function Invoke-AhpdInstall {
  if ($showHelp) {
    Show-Usage
    return
  }

  if ($Runtime -notin @('node', 'bun')) {
    throw "Unknown runtime: $Runtime. Use node or bun."
  }

  if ($isPurge -and -not $isUninstall) {
    throw 'Purge needs Uninstall.'
  }

  if ($isUninstall) {
    Invoke-AhpdUninstall
    return
  }

  # Before the runtime check, so a stop names what this machine has. Under
  # -DryRun too, where the lines are the same ones.
  Write-Runtimes

  $new = $null
  if ($Runtime -eq 'bun') {
    $folder = Resolve-Bun
  } else {
    Resolve-Node

    # An ahpd on the PATH is updated where it is, before a folder is chosen:
    # the folder that holds this ahpd is the one the update goes into, and a
    # second copy elsewhere is what left the old version in the window.
    $installed = Resolve-Ahpd
    if ($installed) {
      $old = Get-AhpdVersion $installed
      if (-not $old) {
        throw "$installed did not print a version for --version, so this script will not replace it."
      }
      if (-not (Get-NpmVersion)) {
        throw 'npm was not found beside Node. Open a new window and run this again.'
      }
      $new = Get-TargetVersion
      if (-not $new) {
        throw "Could not read the newest version of $Package from npm. Run npm view $Package version to see why."
      }
      $prefix = Split-Path -Parent $installed
      if ($old -eq $new) {
        Write-Say "ahpd $old is installed at $prefix, already at $new. Nothing to update."
        return
      }
      if (-not (Test-NpmPrefix $prefix)) {
        throw "ahpd $old is at $installed, which is not a folder npm installed it in. Remove it there, or update it the way it was installed."
      }
      if (-not (Test-Writable $prefix)) {
        throw "ahpd $old is at $prefix, which is not writable. Update it yourself, or install it into a folder of your own."
      }
      $folder = $prefix
      Confirm-Update $old $new $folder
    } else {
      $folder = Get-NpmBin
    }
  }

  $hadAhpd = $null -ne (Resolve-Ahpd $folder)
  $target = Get-PackageSpec

  Install-Package $target $folder

  # Only an update has a version to check: the first install has no ahpd to
  # compare with, and the paths it writes are the ones it just chose.
  if ($new) {
    Assert-InstalledVersion $new $folder
  }

  $null = Add-UserPath $folder

  # An upgrade reloads the plugins and says how to pick the new version up. The
  # daemon is never restarted here: it may be serving a turn.
  if ($hadAhpd) {
    $ahpd = Resolve-Ahpd $folder
    if ($ahpd) {
      if ($isDryRun) {
        Write-Say 'would run: ahpd plugin update all'
      } else {
        & $ahpd plugin update all
        if ($LASTEXITCODE -ne 0) {
          Write-Warning 'ahpd plugin update all failed; the installed plugins stay as they are.'
        }
      }
    }
    Write-Say 'Run ahpd restart to load the new version and its plugins.'
  }

  if (-not $noOnboard -and (Test-Interactive)) {
    $ahpd = Resolve-Ahpd $folder
    if ($ahpd) {
      if ($isDryRun) {
        Write-Say 'would run: ahpd configure'
      } else {
        & $ahpd configure
      }
    } else {
      Write-Warning 'ahpd is not on the PATH; run ahpd configure yourself.'
    }
  }

  # No `ahpd service install` line: daemon/31 gives Windows no service to install.
  Write-Say "Installed $target."
}

if (-not $Package) { $Package = '@ahpd/server' }
if (-not $Runtime) { $Runtime = 'node' }

$noOnboard = $NoOnboard.IsPresent -or (Test-Enabled 'AHPD_NO_ONBOARD')
$isDryRun = $DryRun.IsPresent -or (Test-Enabled 'AHPD_DRY_RUN')
$isVerbose = $Verbose.IsPresent -or (Test-Enabled 'AHPD_VERBOSE')
$showHelp = $Help.IsPresent -or (Test-Enabled 'AHPD_HELP')
$isUninstall = $Uninstall.IsPresent -or (Test-Enabled 'AHPD_UNINSTALL')
$isPurge = $Purge.IsPresent -or (Test-Enabled 'AHPD_PURGE')
$isYes = $Yes.IsPresent -or (Test-Enabled 'AHPD_YES')

# A test sources this file with AHPD_INSTALL_NO_RUN=1, then calls
# Invoke-AhpdInstall, so the variables and every step are the ones a person gets.
if ($env:AHPD_INSTALL_NO_RUN -ne '1') {
  Invoke-AhpdInstall
}
