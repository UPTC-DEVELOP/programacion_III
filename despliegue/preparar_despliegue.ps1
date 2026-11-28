# Arma la carpeta dist\htdocs con todo lo que se sube al hosting (InfinityFree u otro):
#   htdocs\                 -> frontend de TallerPro (index.html, crud_*, Login, api, ...)
#   htdocs\panther\rest\    -> backend Panther (PHP)
#
# Uso (desde la carpeta del proyecto):
#   powershell -ExecutionPolicy Bypass -File despliegue\preparar_despliegue.ps1

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $raiz 'dist\htdocs'
$backend = Join-Path $raiz 'panther-master\backend_panther\panther\rest'
$prod = Join-Path $backend 'cxn\LoginMysql.prod.php'

# Se vacía el contenido (no la carpeta) por si dist está abierta en el Explorador
if (Test-Path (Join-Path $raiz 'dist')) { Get-ChildItem (Join-Path $raiz 'dist') -Force | Remove-Item -Recurse -Force }
New-Item -ItemType Directory -Force $dist | Out-Null

# ---------- Frontend ----------
$frontend = @('index.html', 'script.js', 'styles.css', 'logo', 'imagenes', 'api', 'Login',
              'crud_clientes', 'crud_empleados', 'crud_administrador')
foreach ($f in $frontend) {
    Copy-Item (Join-Path $raiz $f) $dist -Recurse
}
Get-ChildItem $raiz -File -Filter 'imagen*' | Copy-Item -Destination $dist

# ---------- Backend ----------
$destinoBackend = Join-Path $dist 'panther\rest'
New-Item -ItemType Directory -Force $destinoBackend | Out-Null
Copy-Item (Join-Path $backend '*') $destinoBackend -Recurse
Copy-Item (Join-Path $backend '.htaccess') $destinoBackend
# La plantilla de ejemplo no se publica
Remove-Item (Join-Path $destinoBackend 'cxn\LoginMysql.prod.example.php')

# Zip para subirlo con el File Manager del hosting y usar "Extract"
# Se arma a mano con rutas "/" : Compress-Archive de Windows PowerShell 5 usa "\" y
# el servidor Linux extrae archivos sueltos llamados "Login\Login.html" en vez de carpetas
$zip = Join-Path $raiz 'dist\tallerpro.zip'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archivoZip = [System.IO.Compression.ZipFile]::Open($zip, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $base = (Resolve-Path $dist).Path.TrimEnd('\') + '\'
    Get-ChildItem $dist -Recurse -File -Force | ForEach-Object {
        $nombre = $_.FullName.Substring($base.Length).Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archivoZip, $_.FullName, $nombre) | Out-Null
    }
} finally {
    $archivoZip.Dispose()
}

Write-Host "Listo: $dist" -ForegroundColor Green
Write-Host "Zip:   $zip" -ForegroundColor Green
if (Test-Path $prod) {
    Write-Host "Se incluyo cxn\LoginMysql.prod.php (datos de MySQL del hosting)." -ForegroundColor Green
} else {
    Write-Host "OJO: falta cxn\LoginMysql.prod.php. Sin ese archivo el backend intentara conectarse a localhost." -ForegroundColor Yellow
    Write-Host "     Copia LoginMysql.prod.example.php como LoginMysql.prod.php y llena los datos del panel." -ForegroundColor Yellow
}
Write-Host "Sube el CONTENIDO de dist\htdocs a la carpeta htdocs del hosting (FTP o Administrador de archivos)."
