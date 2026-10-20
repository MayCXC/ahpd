# Install ahpd on Windows with one line:
#
#   irm https://ahpio.com/install.ps1 | iex
#
# The flags, and the AHPD_* variable each one reads. A PowerShell pipe cannot
# pass a parameter, so the variables are the way `irm | iex` chooses anything;
# a person with a terminal can also run the script as a block:
#
#   & ([scriptblock]::Create((irm https://ahpio.com/install.ps1))) -NoOnboard
#
#   -Version <v>   AHPD_VERSION     the package version, latest when omitted
#   -Package <p>   AHPD_PACKAGE     the package, @ahpd/server by default
#   -Runtime <r>   AHPD_RUNTIME     node or bun
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

  irm https://ahpio.com/install.ps1 | iex

Every flag also reads an AHPD_* variable, because a PowerShell pipe cannot pass
a parameter:

  -Version <v>   install this version of the package (AHPD_VERSION)
  -Package <p>   install this package (AHPD_PACKAGE, @ahpd/server by default)
  -Runtime <r>   node or bun (AHPD_RUNTIME)
  -NoOnboard     do not run ahpd configure (AHPD_NO_ONBOARD)
  -DryRun        print each step and change nothing (AHPD_DRY_RUN)
  -Verbose       print each command before it runs (AHPD_VERBOSE)
  -Help          print this help (AHPD_HELP)
  -Uninstall     remove the package and the PATH entry (AHPD_UNINSTALL)
  -Purge         with -Uninstall, also remove the configuration (AHPD_PURGE)

To pass a flag from the one line, run the script as a block:

  & ([scriptblock]::Create((irm https://ahpio.com/install.ps1))) -NoOnboard
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
  foreach ($name in @('ahpd.cmd', 'ahpd.exe', 'ahpd')) {
    $candidate = Join-Path $Folder $name
    if (Test-Path $candidate) { return $candidate }
  }
  return $null
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
  $arguments = @('install', '-g', '--no-fund', '--no-audit')
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
    # node-pty is optional. A shim that landed means the install is what the
    # person came for, and a terminal on pipes is the daemon's own fallback.
    if (Test-Path (Join-Path $Folder 'ahpd.cmd')) {
      Write-Warning 'npm install failed, but ahpd is installed; carrying on.'
      Write-Warning 'node-pty may not have built; terminals will use pipes.'
      Write-Warning 'Install the Visual Studio Build Tools with the C++ workload and run this again.'
      return
    }
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

  if ($Runtime -eq 'bun') {
    $folder = Resolve-Bun
  } else {
    Resolve-Node
    $folder = Get-NpmBin
  }

  $hadAhpd = $null -ne (Resolve-Ahpd $folder)
  $target = Get-PackageSpec

  Install-Package $target $folder
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

# A test sources this file with AHPD_INSTALL_NO_RUN=1, then calls
# Invoke-AhpdInstall, so the variables and every step are the ones a person gets.
if ($env:AHPD_INSTALL_NO_RUN -ne '1') {
  Invoke-AhpdInstall
}
