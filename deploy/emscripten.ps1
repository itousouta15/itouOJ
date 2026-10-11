# Load an installed SDK into this process so child builds inherit its environment.
function Enable-EmscriptenEnvironment {
    param([string]$SdkPath = "")

    if (-not $SdkPath) { $SdkPath = $env:EMSDK }
    if (-not $SdkPath) {
        $candidates = @(
            (Join-Path $HOME "emsdk"),
            (Join-Path $env:LOCALAPPDATA "emsdk"),
            (Join-Path $env:SystemDrive "emsdk"),
            (Join-Path $env:TEMP "opencode\itou-emsdk")
        )
        foreach ($candidate in $candidates) {
            if (Test-Path -LiteralPath (Join-Path $candidate "emsdk_env.ps1")) {
                $SdkPath = $candidate
                break
            }
        }
    }
    if (-not $SdkPath) {
        throw "Emscripten SDK not found. Install and activate 4.0.23, then run .\deploy\deploy.ps1 -EmsdkPath <SDK directory>. See docs/guides/itoulang.md."
    }

    $SdkPath = (Resolve-Path -LiteralPath $SdkPath).Path
    $envScript = Join-Path $SdkPath "emsdk_env.ps1"
    if (-not (Test-Path -LiteralPath $envScript)) {
        throw "SDK directory is missing emsdk_env.ps1: $SdkPath"
    }
    Write-Host "== Loading Emscripten SDK: $SdkPath =="
    # Run in a child scope: the official script enables StrictMode, but its
    # process environment changes still propagate to subsequent Node builds.
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & $envScript
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previous
    }
    if ($exitCode -ne 0) { throw "Emscripten SDK environment setup failed (exit code $exitCode)" }
    $toolchain = Join-Path $SdkPath "upstream\emscripten\cmake\Modules\Platform\Emscripten.cmake"
    if (-not $env:EMSDK -or -not (Test-Path -LiteralPath $toolchain)) {
        throw "Emscripten SDK is not activated. Run & `"$SdkPath\emsdk.ps1`" install 4.0.23, then & `"$SdkPath\emsdk.ps1`" activate 4.0.23."
    }
}
