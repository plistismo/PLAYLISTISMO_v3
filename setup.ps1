$ErrorActionPreference = "Stop"

Write-Host "== Tailwind Production Setup =="

# Garantir src
if (!(Test-Path ".\src")) {
    New-Item -ItemType Directory -Path ".\src" | Out-Null
}

# Criar index.css
$cssPath = ".\src\index.css"
if (!(Test-Path $cssPath)) {
@"
@tailwind base;
@tailwind components;
@tailwind utilities;
"@ | Set-Content -Encoding UTF8 $cssPath
}

# Criar tailwind.config.js
$tailwindConfig = ".\tailwind.config.js"
if (!(Test-Path $tailwindConfig)) {
@"
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
"@ | Set-Content -Encoding UTF8 $tailwindConfig
}

# Criar postcss.config.js
$postcssConfig = ".\postcss.config.js"
if (!(Test-Path $postcssConfig)) {
@"
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
"@ | Set-Content -Encoding UTF8 $postcssConfig
}

# Remover CDN do Tailwind
$indexHtml = ".\index.html"
(Get-Content $indexHtml) |
    Where-Object { $_ -notmatch "cdn.tailwindcss.com" } |
    Set-Content -Encoding UTF8 $indexHtml

# Injetar CSS no index.tsx
$indexTsx = ".\index.tsx"
$cssImport = "import './src/index.css';"

$content = Get-Content $indexTsx
if ($content -notcontains $cssImport) {
    @($cssImport) + $content | Set-Content -Encoding UTF8 $indexTsx
}

# Instalar dependencias
npm install

Write-Host "== Tailwind pronto para producao =="
