param([string]$Skill = 'bmad-build')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if ($Skill -notmatch '^bmad(?:-[a-z0-9]+)*$') { throw 'Nome de skill inválido.' }
$taskPython = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
if (-not (Test-Path -LiteralPath $taskPython)) { $taskPython = (Get-Command python -ErrorAction Stop).Source }
$localPackages = Join-Path $projectRoot 'tmp/python-packages'
if (-not (Test-Path -LiteralPath (Join-Path $localPackages 'jinja2'))) {
  uv pip install --python $taskPython --target $localPackages --cache-dir (Join-Path $projectRoot 'tmp/uv-cache') 'jinja2>=3.1'
  if ($LASTEXITCODE -ne 0) { throw 'Falha na instalação local do Jinja2.' }
}
$previousPythonPath = $env:PYTHONPATH
try {
  $env:PYTHONPATH = $localPackages
  & $taskPython (Join-Path $projectRoot '_bmad/scripts/render_skill.py') --project-root $projectRoot --skill (Join-Path $projectRoot ".agents/skills/$Skill")
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao renderizar o workflow BMAD.' }
} finally { $env:PYTHONPATH = $previousPythonPath }
