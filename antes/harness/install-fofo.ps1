param(
  [string]$Destination = (Join-Path $PSScriptRoot '..\.harness\vendor\Agentic-SDLC')
)

$target = [System.IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $target) {
  throw "El destino ya existe: $target. Use esa copia o elimínela explícitamente antes de instalar otra."
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
git clone --depth 1 https://github.com/Sweet-Papa-Technologies/Agentic-SDLC.git $target
Write-Output "FoFo instalado en $target"
