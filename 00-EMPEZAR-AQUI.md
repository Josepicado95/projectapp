# 00 — Empezar aquí (antes de tocar código)

Este documento es para ANTES de abrir Claude Code. Es la parte "manual": instalar herramientas
y aprender 5 comandos de terminal. No necesitas saber programar para esto, solo seguir los pasos.

No te saltes nada aunque parezca obvio — la idea es que entiendas QUÉ es cada cosa, no solo
copiar y pegar comandos.

---

## 0.1 ¿Qué es "la terminal" y por qué la necesito?

La terminal es una ventana donde escribes comandos de texto en vez de hacer clic. Todo lo que
vamos a construir (Next.js, Python, Docker, git, Claude Code) se controla desde ahí. Da miedo
las primeras veces, pero son ~10 comandos que vas a usar todo el tiempo y se vuelven automáticos.

**Vas a usar la terminal integrada de VS Code**, así que no necesitas abrir nada raro por
separado.

---

## 0.2 Instalar el editor de código: VS Code

1. Ve a https://code.visualstudio.com/ y descarga la versión para tu sistema operativo.
2. Instálalo (siguiente, siguiente, siguiente).
3. Ábrelo. Para abrir la terminal integrada: `Ctrl + ñ` (o `` Ctrl + ` `` en teclado en inglés)
   en Windows/Linux, o `Cmd + ñ` / `Cmd + \`` en Mac.

Deberías ver una ventana de texto negra en la parte de abajo de VS Code. Eso es la terminal.

---

## 0.3 Mini-glosario de terminal (los 6 comandos que vas a usar siempre)

Escribe esto en la terminal (uno por uno, presiona Enter después de cada uno) solo para
familiarizarte. No te preocupes si no entiendes todo todavía.

| Comando | Qué hace | Ejemplo |
|---|---|---|
| `pwd` (Mac/Linux) o `cd` solo (Windows) | Te dice "¿en qué carpeta estoy?" | `pwd` |
| `ls` (Mac/Linux) o `dir` (Windows) | Lista lo que hay en la carpeta actual | `ls` |
| `cd nombre-carpeta` | Entra a una carpeta | `cd Documentos` |
| `cd ..` | Sale a la carpeta de arriba (un nivel) | `cd ..` |
| `mkdir nombre` | Crea una carpeta nueva | `mkdir aventuras-app` |
| `code .` | Abre la carpeta actual en VS Code | `code .` |

> Tip: en la terminal puedes presionar `Tab` para autocompletar nombres de carpetas/archivos.
> Te ahorra muchísimo tiempo y evita errores de tipeo.

---

## 0.4 Instalar Git

Git es la herramienta que guarda el "historial" de cambios de tu código (como un "Ctrl+Z"
gigante con superpoderes). La vamos a usar desde la Fase 1.

1. Descarga desde https://git-scm.com/downloads e instala (opciones por defecto están bien).
2. Verifica que se instaló, en la terminal:
   ```
   git --version
   ```
   Debería mostrarte un número de versión (ej: `git version 2.45.0`).
3. Configura tu nombre y correo (Git los usa para "firmar" tus cambios):
   ```
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu-correo@ejemplo.com"
   ```

---

## 0.5 Instalar Node.js (necesario para JavaScript/Next.js)

1. Ve a https://nodejs.org/ y descarga la versión **LTS** (la recomendada, no la "Current").
2. Instálala.
3. Verifica:
   ```
   node -v
   npm -v
   ```
   Deberías ver dos números de versión (ej: `v22.x.x` y `10.x.x`).

`npm` es el "gestor de paquetes" de Node — lo vas a usar para instalar librerías.

---

## 0.6 Instalar Python

1. Ve a https://www.python.org/downloads/ y descarga la última versión estable.
2. **Importante (Windows):** durante la instalación, marca la casilla "Add Python to PATH"
   antes de darle a Instalar.
3. Verifica:
   - Mac/Linux: `python3 --version`
   - Windows: `python --version`

---

## 0.7 Instalar Docker Desktop

1. Ve a https://www.docker.com/products/docker-desktop/ y descarga para tu sistema.
2. Instálalo y ábrelo al menos una vez (puede pedirte reiniciar el computador).
3. Verifica:
   ```
   docker --version
   ```

Docker no lo vamos a usar de inmediato (eso es Fase 3 en adelante), pero mejor tenerlo listo.

---

## 0.8 Crear cuenta en GitHub

Ve a https://github.com/ y crea una cuenta gratuita si no tienes. Ahí vivirá tu repositorio
(monorepo) del proyecto.

---

## 0.9 Instalar Claude Code

⚠️ **Importante sobre costos:** Claude Code requiere un plan de pago de Claude (Pro, Max,
Team o un acceso de API/Console con créditos) — el plan gratuito de Claude.ai no incluye
Claude Code. Si tienes Claude Pro, eso normalmente es suficiente para este tipo de uso. Si no
quieres una suscripción mensual, la alternativa es una cuenta de API/Console con créditos de
pago por uso (puedes empezar con poco saldo y ver cuánto consumes). Vale la pena que revises
las opciones actuales y precios en https://docs.claude.com antes de decidir, porque pueden
cambiar.

Instalación (instalador nativo, recomendado en 2026):

- **Mac/Linux:**
  ```
  curl -fsSL https://claude.ai/install.sh | bash
  ```
- **Windows (PowerShell):**
  ```
  irm https://claude.ai/install.ps1 | iex
  ```

Verifica:
```
claude --version
```

---

## 0.10 Crear la carpeta del proyecto y arrancar Claude Code

```
mkdir aventuras-app
cd aventuras-app
code .
```

Esto abre VS Code en esa carpeta vacía. Abre la terminal integrada (sección 0.2) y ejecuta:

```
claude
```

La primera vez se abrirá tu navegador para que inicies sesión con tu cuenta de Claude. Una vez
autenticado, vuelve a la terminal — ahora estás "dentro" de Claude Code.

---

## 0.11 Instalar el plugin Superpowers

Dentro de la sesión de Claude Code (no en la terminal normal, sino en el chat que se abrió),
escribe:

```
/plugin install superpowers@claude-plugins-official
```

Esto le da a Claude Code un conjunto de "skills" — formas estructuradas de planear y trabajar.
Vamos a ajustar cómo se usan en el archivo `CLAUDE.md`.

---

## 0.12 Colocar los archivos guía del proyecto

Copia los archivos `CLAUDE.md` y `ROADMAP.md` (que te entregué junto a este documento) dentro
de la carpeta `aventuras-app/` (en la raíz, junto a donde estás parado en la terminal).

Estos dos archivos son los que hacen que Claude Code sepa cómo trabajar contigo. `CLAUDE.md`
se carga automáticamente cada vez que abres una sesión.

---

## 0.13 Tu primer mensaje a Claude Code

Con `CLAUDE.md` y `ROADMAP.md` ya en la carpeta, escribe esto en el chat de Claude Code:

```
Lee CLAUDE.md y ROADMAP.md completos. Confírmame que entendiste las reglas (en especial
la Regla #1) y luego empecemos con la Fase 1, Sesión 1.
```

A partir de ahí, Claude Code debería empezar a actuar como tu mentor según las reglas del
`CLAUDE.md`, no como alguien que programa por ti.

---

## Checklist final antes de avanzar

- [ ] VS Code instalado, sé abrir la terminal integrada
- [ ] `git --version` funciona y configuré nombre/correo
- [ ] `node -v` y `npm -v` funcionan
- [ ] `python3 --version` (o `python --version`) funciona
- [ ] `docker --version` funciona
- [ ] Tengo cuenta de GitHub
- [ ] `claude --version` funciona y pude iniciar sesión
- [ ] Instalé Superpowers con `/plugin install superpowers@claude-plugins-official`
- [ ] `CLAUDE.md` y `ROADMAP.md` están en la carpeta `aventuras-app/`

Cuando todo esté en verde, ¡felicidades! Acabas de hacer el setup completo de un entorno de
desarrollo profesional. Eso ya es un logro, aunque todavía no hayamos escrito ni una línea de
la app. 🎒
