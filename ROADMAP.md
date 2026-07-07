# ROADMAP — Aventuras

Este archivo es el "mapa" del proyecto. Claude Code lo lee junto con `CLAUDE.md` y lo va
actualizando (marcando checkboxes, agregando notas) al final de cada sesión.

## Cómo leer este roadmap

- Cada **Fase** tiene: un objetivo de aprendizaje, un entregable concreto (algo que puedas
  ver/probar), y un checklist de sub-tareas.
- Los tiempos estimados son **orientativos, no una meta a cumplir**. Lo normal es que las
  primeras fases vayan más lento (estás construyendo "memoria muscular" con la terminal,
  git, etc.) y que luego agarres ritmo. Si una fase te toma el doble de lo estimado, es
  completamente normal — eso es aprender, no un fracaso.
- A tu ritmo (~2h Mar-Sáb, ~6h Dom/Lun ≈ 22h/semana), un cálculo realista para llegar a la
  **Fase 12 (app desplegada en producción)** es de aproximadamente **3 a 5 meses**. Suena
  largo, pero para el alcance (frontend + backend + DB + auth + microservicio Python +
  Docker + CI/CD + deploy) eso es, de hecho, rápido — y vas a tener un proyecto real para
  mostrar en entrevistas mucho antes de llegar a la Fase 12, porque cada fase produce algo
  funcional.

---

## Vista general

| Fase | Tema | Qué aprendes principalmente | Estimado |
|---|---|---|---|
| 0 | Entorno | Terminal, git, Node, Python, Docker, Claude Code | (ver `00-EMPEZAR-AQUI.md`) |
| 1 | Git/GitHub + monorepo | Git básico, estructura de proyecto, primeros "hello world" | 1-2 semanas |
| 2 | Frontend con datos falsos | React, Next.js, componentes, Tailwind | 1.5-2 semanas |
| 3 | Base de datos | Modelado, SQL, PostgreSQL en Docker, Prisma | 1-2 semanas |
| 4 | Backend real (CRUD) | API routes/Server Actions, conectar DB | 1-1.5 semanas |
| 5 | Login | Autenticación, sesiones, rutas protegidas | 1-1.5 semanas |
| 6 | Check-in diario | Formularios, modelado de datos en el tiempo | 1 semana |
| 7 | Motor de recomendaciones (Python) | Python, FastAPI, Pydantic, pytest | 1.5-2 semanas |
| 8 | Integración Next.js ↔ Python | Comunicación entre servicios | 0.5-1 semana |
| 9 | Visualización de progreso | Gráficas, agregación de datos | 1 semana |
| 10 | Docker Compose completo | Contenedores, redes, variables de entorno | 0.5-1 semana |
| 11 | CI con GitHub Actions | Pipelines, lint, tests automáticos | 1 semana |
| 12 | Deploy a producción | Vercel, Railway/Neon, CD | 1-1.5 semanas |
| 13 | Pulir / iterar | Lo que tú quieras agregar después | Continuo |
| 14 | Fondo cinematográfico animado | Three.js/WebGL, shaders, animación por canvas | ✅ Completa |
| 15 | App móvil (Expo/React Native) | Expo Router, NativeWind, auth JWT, hooks de React Native | En progreso (ver sección propia) |

---

## Fase 0 — Entorno

Ver `00-EMPEZAR-AQUI.md`. No se repite aquí.

- [ ] Checklist de `00-EMPEZAR-AQUI.md` completo

---

## Fase 1 — Git/GitHub + estructura del monorepo

**Objetivo de aprendizaje:** entender git como "historial con superpoderes", crear un
repositorio, hacer commits y push, y dejar la estructura base del monorepo con un
"hello world" funcionando en cada parte (Next.js y Python).

**Entregable:** un repo en GitHub con la carpeta `apps/web` (Next.js) mostrando una página
de bienvenida, y `apps/recommender` (FastAPI) respondiendo en `/` con un mensaje, ambos
corriendo en tu máquina.

### Sesiones sugeridas

- **1.1 — Git básico**: `git init`, `git status`, `git add`, `git commit`. Crear el repo en
  GitHub y conectar tu carpeta local (`git remote add origin ...`, `git push`).
  - [ ] Repo creado en GitHub
  - [ ] Primer commit hecho y pusheado
  - [ ] Entiendo qué es "staging area" (lo que hace `git add`) vs un commit

- **1.2 — Estructura del monorepo**: crear carpetas `apps/web`, `apps/recommender`,
  `packages/` (vacía por ahora), `.gitignore` raíz, `README.md` con descripción del
  proyecto y la arquitectura (puedes copiar el resumen de `CLAUDE.md`, secc. 7).
  - [ ] Estructura de carpetas creada
  - [ ] `.gitignore` configurado (Claude Code te lo genera y explica)
  - [ ] `README.md` inicial con la descripción del proyecto

- **1.3 — Hello World en Next.js**: usar `create-next-app` dentro de `apps/web`, correr
  `npm run dev`, ver la página por defecto en el navegador, y recorrer juntos qué archivos
  se generaron (qué es `app/`, `page.tsx`, `layout.tsx`, `package.json`, etc.)
  - [ ] `apps/web` corre localmente (`npm run dev`)
  - [ ] Entiendo para qué sirve `page.tsx` y `layout.tsx`
  - [ ] Cambié el texto de la página de inicio por algo propio ("Aventuras")

- **1.4 — Hello World en FastAPI**: crear un entorno virtual de Python dentro de
  `apps/recommender`, instalar FastAPI, crear un endpoint `/` que devuelva un JSON simple,
  correrlo localmente.
  - [ ] Entorno virtual creado y activado (entiendo para qué sirve un venv)
  - [ ] FastAPI instalado, endpoint `/` responde un JSON
  - [ ] Entiendo qué es un "endpoint" y qué es un "servidor de desarrollo"

- **1.5 — Práctica de flujo de ramas (branches)**: crear una rama, hacer un cambio pequeño
  (ej: agregar tu nombre al README), commit, push, y abrir un Pull Request en GitHub (aunque
  trabajes solo, así practicas el flujo profesional). Mergear el PR.
  - [ ] Creé una rama, hice un cambio, y abrí un PR
  - [ ] Entiendo la diferencia entre `main` y una rama de feature
  - [ ] Mergeé el PR y volví a `main`

**Checkpoint de cierre de Fase 1:** ¿puedes explicar con tus palabras qué hace `git add`,
qué hace `git commit` y qué hace `git push`, y por qué son 3 pasos distintos?

---

## Fase 2 — Frontend con datos falsos (mock data)

**Objetivo de aprendizaje:** React (componentes, props, estado con `useState`), routing y
layouts de Next.js, estilos con Tailwind. Todo con datos hardcodeados en el código (sin DB
todavía) para enfocarte en la UI primero.

**Entregable:** una app navegable con (1) un Dashboard que lista "Aventuras" de ejemplo,
(2) una página de detalle de una Aventura con su lista de "Misiones", y (3) una página de
"Check-in diario" con un formulario (que por ahora solo muestra los valores en consola).

### Sub-tareas

- [ ] Definir en código (TypeScript) los "tipos" `Adventure` y `Mission` con sus campos
      (título, descripción, dificultad, estado, etc.) — esto es tu primer contacto con
      tipado en TypeScript
- [ ] Crear un array de Aventuras de ejemplo (mock data) y mostrarlo en el Dashboard como
      tarjetas (un componente `AdventureCard`)
- [ ] Configurar Tailwind (si `create-next-app` no lo dejó ya) y darle estilo básico a las
      tarjetas
- [ ] Crear la página de detalle de una Aventura (ruta dinámica, ej: `/adventures/[id]`),
      mostrando sus Misiones de ejemplo
- [ ] Crear un componente `MissionItem` que muestre el nombre, dificultad y un checkbox de
      "completada" (estado local con `useState`, sin guardar nada todavía)
- [ ] Crear la página de Check-in diario con un formulario controlado (sliders o inputs
      numéricos para energía/ánimo/estrés/descanso) que al enviarlo haga `console.log` de
      los valores
- [ ] Layout general: navegación entre Dashboard / Aventura / Check-in (`layout.tsx`)

**Checkpoint de cierre de Fase 2:** ¿puedes explicar la diferencia entre "props" y "state"
en un componente de React, con un ejemplo de tu propia app?

---

## Fase 3 — Base de datos (PostgreSQL + Docker + Prisma)

> ⚠️ **Cambio de modo de trabajo:** a partir de esta fase entramos en **Modo B** ("delego y
> reviso", ver `CLAUDE.md` sección 1) en vez de Modo A. Claude Code genera la
> implementación, pero SIEMPRE acompañada de explicación línea por línea, un ejercicio de
> revisión activa, y un checkpoint — nunca "código generado, listo, siguiente". Este cambio
> se adelantó respecto al plan original (que sugería Fase 4-5) por preparación para una
> posible oferta de trabajo que requiere saber dirigir y revisar agentes de IA con
> Superpowers.

**Objetivo de aprendizaje:** modelado relacional (entidades y relaciones), SQL básico,
levantar PostgreSQL en un contenedor Docker, y usar Prisma como capa de acceso a datos —
y, en paralelo, practicar el flujo de "dirigir a Claude Code + revisar lo que produce".

**Entregable:** PostgreSQL corriendo en Docker localmente, con un esquema de Prisma que
modela `User`, `Adventure`, `Mission` y `CheckIn`, migraciones aplicadas, y datos de prueba
visibles con Prisma Studio (y opcionalmente con una consulta SQL directa).

### Sub-tareas

- [x] Diseñar el modelo de datos en papel/diagrama primero: entidades (`User`, `Adventure`,
      `Mission`, `CheckIn`) y sus relaciones (1 usuario → muchas aventuras → muchas
      misiones; 1 usuario → muchos check-ins)
- [x] Levantar PostgreSQL con Docker (un `docker run` simple primero, para entender qué
      hace; luego lo migramos a `docker-compose` en la Fase 10)
- [x] Instalar Prisma en `apps/web`, inicializarlo (`prisma init`)
- [x] Escribir `schema.prisma` con los 4 modelos y sus relaciones
- [x] Primera migración (`prisma migrate dev`) — entender qué es una migración y por qué
      no se edita la DB "a mano"
- [x] Crear un script de "seed" con datos de prueba (algunas aventuras y misiones)
- [x] Explorar los datos con Prisma Studio
- [ ] (Opcional, recomendado) ejecutar 2-3 consultas SQL crudas directamente contra la DB
      para entender qué está haciendo Prisma "por debajo"

**Checkpoint de cierre de Fase 3:** ¿puedes dibujar (aunque sea a mano) el diagrama de
relaciones entre `User`, `Adventure`, `Mission` y `CheckIn`, y explicar qué significa
"1 a muchos"?

---

## Fase 4 — Backend real: CRUD conectado a la DB

**Objetivo de aprendizaje:** Server Actions / Route Handlers de Next.js, queries con
Prisma desde el servidor, validación de datos (zod), manejo de errores.

**Entregable:** el Dashboard y la página de detalle de Aventura ahora muestran datos reales
de PostgreSQL (no mock data), y puedes crear, editar y borrar Aventuras y Misiones desde la
UI.

### Sub-tareas

- [x] Reemplazar el array mock del Dashboard por una consulta real a la DB (leer todas las
      Aventuras)
- [x] Formulario "Crear nueva Aventura" → Server Action que inserta en la DB
- [x] Editar/eliminar una Aventura
- [x] Dentro de una Aventura: crear, editar, marcar como completada y eliminar Misiones
- [x] Validar los datos de entrada con `zod` antes de guardar (entender qué problema
      resuelve la validación)
- [x] Manejo básico de errores (¿qué pasa si el formulario está incompleto?)

**Checkpoint de cierre de Fase 4:** ¿puedes explicar qué pasa, paso a paso, desde que haces
clic en "Guardar" en el formulario hasta que el dato aparece en PostgreSQL?

---

## Fase 5 — Autenticación (login)

**Objetivo de aprendizaje:** conceptos de autenticación (sesiones, cookies, hashing de
contraseñas), Auth.js, rutas protegidas, relacionar datos con el usuario logueado.

**Entregable:** pantallas de registro/login funcionales; las Aventuras y Check-ins
pertenecen a un usuario específico; rutas privadas redirigen a login si no hay sesión.

### Sub-tareas

- [x] Conceptos: ¿qué es una sesión?, ¿qué es un hash de contraseña y por qué nunca se
      guarda en texto plano?
- [x] Agregar el modelo `User` con campos de autenticación (o usar el de Auth.js como
      referencia)
- [x] Configurar Auth.js (proveedor de credenciales email/contraseña, o un proveedor OAuth
      si prefieres empezar por ahí)
- [x] Páginas de registro y login
- [x] Middleware/lógica para proteger rutas privadas
- [x] Asociar Aventuras y Check-ins existentes (y nuevos) al `userId` de la sesión

**Checkpoint de cierre de Fase 5:** ¿puedes explicar qué información se guarda en la cookie
de sesión y qué pasaría si alguien la roba? (no necesitas resolverlo todavía, solo
entenderlo)

---

## Fase 6 — Check-in diario (persistencia real)

**Objetivo de aprendizaje:** modelado de datos "en el tiempo" (un registro por día/usuario),
agregaciones simples, reglas de negocio sencillas.

**Entregable:** el formulario de check-in de la Fase 2 ahora guarda datos reales en
PostgreSQL asociados al usuario y la fecha, y se puede ver un historial de los últimos
check-ins.

### Sub-tareas

- [x] Confirmar/ajustar el modelo `CheckIn` (energía, ánimo, estrés, descanso, fecha,
      `userId`)
- [x] Server Action que guarda el check-in del día
- [x] Regla: solo un check-in por usuario por día (¿qué hacer si ya existe uno? ¿se
      actualiza o se bloquea?) — **superado más adelante:** desde la feature
      `multiple-checkins-per-day` (2026-07-04) esto cambió a "varios check-ins
      independientes por día"; ver la Fase 6 (extra) al final de esta sección.
- [x] Página/sección que muestra los últimos N check-ins del usuario

**Checkpoint de cierre de Fase 6:** ¿cómo decidiste manejar el caso de "el usuario ya
hizo check-in hoy y quiere cambiarlo"? Explica tu decisión.

### Fase 6 (extra) — check-ins múltiples por día (2026-07-04)

La regla original de "un check-in por día" se reemplazó: `POST /api/mobile/checkins` ahora
crea un registro nuevo en vez de pisar el del día. "El check-in de hoy" (dashboard,
recomendador) pasó a significar "el más reciente del día" (`getLatestCheckInToday`), no "el
único". Motivo: Jose quería poder registrar, por ejemplo, mañana y noche por separado.
Implementado vía plan `apps/web/docs/superpowers/plans/2026-07-04-multiple-checkins-per-day.md`,
mergeado a `main` en PR #5.

---

## Fase 7 — Motor de recomendaciones (Python + FastAPI)

**Objetivo de aprendizaje:** Python "real" (no solo sintaxis: tipado con type hints,
estructuras de datos), FastAPI (endpoints, modelos Pydantic, validación), pruebas con
pytest.

**Entregable:** el servicio `apps/recommender` expone un endpoint que recibe el estado de
ánimo/energía del usuario + la lista de misiones pendientes de sus aventuras, y devuelve
una lista priorizada de misiones recomendadas para hoy, con pruebas automatizadas básicas.

### Sub-tareas

- [x] (Si hace falta) repaso rápido de fundamentos de Python: variables, funciones,
      listas, diccionarios, condicionales — con ejercicios cortos antes de meterte al
      proyecto
- [x] Diseñar la "regla de negocio" en lenguaje humano primero: ej. "si energía es baja,
      priorizar misiones de dificultad 1-2; si es alta, permitir dificultad 3+; si estrés
      es alto, limitar a máximo 2 misiones sugeridas"
- [x] Definir modelos Pydantic para el request (estado del usuario + misiones disponibles)
      y el response (misiones recomendadas + por qué)
- [x] Implementar el endpoint `/recommendations` con la lógica de reglas
- [x] Escribir 3-5 tests con pytest que verifiquen distintos escenarios (energía baja,
      alta, estrés alto, sin misiones disponibles, etc.) — 11 tests pasando

**Checkpoint de cierre de Fase 7:** ¿puedes explicar, en una frase, qué hace tu función de
recomendación para cada uno de los 3-5 escenarios que probaste?

---

## Fase 8 — Integración Next.js ↔ Python

**Objetivo de aprendizaje:** comunicación entre servicios vía HTTP, variables de entorno
para URLs, manejo de fallos de un servicio externo.

**Entregable:** el Dashboard de Next.js muestra una sección "Recomendado para hoy" que
obtiene sus datos llamando al servicio Python.

### Sub-tareas

- [x] Desde un Route Handler/Server Action de Next.js, hacer `fetch` al servicio Python
      (usando una variable de entorno para la URL, no hardcodeada)
- [x] Mostrar las recomendaciones en el Dashboard
- [x] Manejar el caso en que el servicio Python no responde (mensaje amigable, no un error
      feo)

**Checkpoint de cierre de Fase 8:** ¿por qué es importante usar una variable de entorno
para la URL del servicio Python en vez de escribirla directamente en el código?

---

## Fase 9 — Visualización de progreso

**Objetivo de aprendizaje:** agregación de datos (calcular porcentajes, promedios, rachas),
gráficas con `recharts`.

**Entregable:** una sección "Mi progreso" que muestra, por cada Aventura, el % de misiones
completadas, y un gráfico de la evolución de energía/ánimo en el tiempo a partir de los
check-ins.

### Sub-tareas

- [x] Calcular el % de misiones completadas por Aventura (consulta o cálculo en el
      servidor)
- [x] Gráfico de barras o de progreso por Aventura
- [x] Gráfico de líneas con energía/ánimo en el tiempo (usando los check-ins históricos)
- [ ] (Opcional) calcular una "racha" de días consecutivos con check-in

**Checkpoint de cierre de Fase 9:** ¿qué decidiste mostrar como "métrica principal" de
progreso, y por qué crees que le importaría a alguien que se siente abrumado por su meta?

---

## Fase 10 — Docker Compose completo

**Objetivo de aprendizaje:** contenedores (Dockerfile), orquestación local con
docker-compose, redes entre contenedores, variables de entorno.

**Entregable:** con un solo comando (`docker compose up`), se levantan PostgreSQL y el
servicio `recommender`, listos para que `apps/web` se conecte a ambos.

### Sub-tareas

- [x] Escribir un `Dockerfile` para `apps/recommender` (explicado línea por línea)
- [x] Escribir `docker-compose.yml` con los servicios `db` (Postgres) y `recommender`
- [x] Configurar variables de entorno y la red interna entre contenedores (¿por qué
      `apps/web` le habla al contenedor por su nombre de servicio y no por `localhost`?)
- [x] Probar el flujo completo: `docker compose up`, y `apps/web` corriendo localmente
      (fuera de Docker por ahora) conectándose a ambos

**Checkpoint de cierre de Fase 10:** ¿qué ventaja tiene poder levantar todo el entorno con
un solo comando, pensando en que en el futuro trabajes en equipo?

---

## Fase 11 — CI con GitHub Actions

**Objetivo de aprendizaje:** qué es un pipeline de CI, cómo correr lint/tests
automáticamente en cada push/PR, branch protection.

**Entregable:** cada vez que abras un Pull Request, GitHub corre automáticamente lint y
tests de `apps/web` y `apps/recommender`, y bloquea el merge si algo falla.

### Sub-tareas

- [x] Conceptos: ¿qué problema resuelve la integración continua? (ejemplo: "funciona en mi
      máquina" vs "funciona siempre")
- [x] Workflow de GitHub Actions para `apps/web` (instalar dependencias, lint, build)
- [x] Workflow para `apps/recommender` (instalar dependencias, lint, `pytest`)
- [ ] Configurar branch protection en `main` para requerir que el CI pase antes de mergear

**Checkpoint de cierre de Fase 11:** rompe algo a propósito (ej: un error de sintaxis), abre
un PR, y observa cómo el CI lo detecta. ¿Qué viste en los logs?

---

## Fase 12 — Deploy a producción

**Objetivo de aprendizaje:** despliegue real, bases de datos administradas, variables de
entorno en producción, despliegue continuo (CD).

**Entregable:** la app completa funcionando en internet, con una URL pública, base de datos
en la nube, y cada push a `main` desplegando automáticamente.

### Sub-tareas

- [x] Crear una base de datos PostgreSQL administrada (ej: Neon o Railway) y correr las
      migraciones de Prisma contra ella
- [x] Desplegar `apps/recommender` (Railway, `projectapp-production-164a.up.railway.app`)
- [x] Desplegar `apps/web` en Vercel (`projectapp-6wqde3z63-josepicado95s-projects.vercel.app`),
      configurando todas las variables de entorno
- [x] Confirmar que el deploy se dispara automáticamente con cada push a `main` (CD) —
      comportamiento por defecto de la integración de Vercel con GitHub
- [ ] Probar el flujo completo en producción explícitamente con Jose presente (registrarte,
      crear una aventura, hacer un check-in, ver una recomendación) — no hay evidencia
      registrada de una pasada de principio a fin en producción, solo que cada pieza
      individual se desplegó y las URLs responden

**Checkpoint de cierre de Fase 12:** ¡felicidades, tienes una app full-stack en producción!
Escribe (para ti, no para Claude) un resumen de 5-10 líneas de todo lo que construiste y
qué tecnología cubrió cada parte — te va a servir para hablar de esto en entrevistas.

---

## Fase 13 — Pulir / iterar (continuo)

Ideas para después del MVP (no es obligatorio hacerlas todas, ni en este orden):

- [ ] Notificaciones/recordatorios para hacer el check-in diario
- [ ] Distintos "tonos" de mensajes según el estado de ánimo (más empático en días bajos)
- [ ] Exportar progreso (PDF o imagen para compartir)
- [ ] Tests automatizados de UI (Playwright)
- [ ] Mejorar el motor de recomendaciones (ej: aprender de patrones del usuario en el
      tiempo, no solo reglas fijas)
- [ ] Modo oscuro / accesibilidad
- [ ] Internacionalización (ES/EN)

---

## Fase 14 — Fondo cinematográfico animado ✅ Completa

**Objetivo:** convertir el paisaje de fondo en una experiencia visual viva que acompaña
al usuario mientras avanza en sus aventuras — sin tocar la UI (tarjetas, header, botones),
que permanece estática y flotando sobre las escenas.

> **Nota:** el plan original de esta fase (más abajo, en "Concepto original descartado")
> proponía escenas SVG/CSS con scroll horizontal. Lo que realmente se construyó, en su
> lugar, fue un motor Three.js/WebGL con 4 "momentos del día" (dawn/noon/dusk/night) que
> hacen crossfade entre sí — más simple de mantener y más alineado con el resto de la app
> (que ya organiza el tema visual por momento del día, no por "escena"). Se deja documentado
> el concepto original solo como referencia histórica.

**Entregable (lo que existe hoy):** `apps/web/lib/sky-engine.ts` — motor Three.js vanilla
(ES module, sin React Three Fiber) que dibuja un cielo con gradiente animado, cuerpo celeste
(sol/luna), nubes, montañas/colinas en silueta, agua o suelo según el momento, aurora
boreal (de noche), estrellas, nieve, pradera con flores/mariposas (de día), y transiciones
suaves entre los 4 momentos vía `setMoment()`. Envuelto en
`apps/web/components/background/SkyCanvas.tsx`, que lo integra con React (montaje único,
limpieza al desmontar, cambio de momento sin recrear el motor).

### Sub-tareas

- [x] Motor base con cámara ortográfica + shader de gradiente para el cielo
- [x] Los 4 momentos del día (dawn/noon/dusk/night), cada uno con su propia configuración
      de colores, elementos y densidad de partículas
- [x] Transición con crossfade (`setMoment()`) en vez de corte abrupto entre momentos
- [x] Clima/elementos animados: nubes, viento compartido (`windAt`), nieve, aurora GLSL,
      pradera con flores y mariposas, risco paramétrico con mar animado
- [x] Limpieza de recursos (`destroy()`: cancela el loop, quita el listener de resize,
      libera el contexto WebGL) para no dejar fugas de memoria al desmontar
- [x] Revisión profunda Modo B (explicación línea por línea + ejercicio de revisión activa
      + checkpoint) — completada 2026-07-05, ver Registro de avance

**Checkpoint de cierre de Fase 14 (superado 2026-07-05):** Jose explicó correctamente por
qué el fix de una race de montaje/desmontaje en `SkyCanvas.tsx` no era necesario (el flag
`destroyed` + el modelo de "run-to-completion" de JS ya lo cubre), y distinguió (con una
corrección de por medio) entre aislamiento de fallas (`try/catch` por-updater) y
frecuencia/costo de un `resize` sin debounce — dos preguntas de revisión activa distintas.

<details>
<summary>Concepto original descartado (solo referencia histórica)</summary>

**Entregable original:** el fondo se desplaza suavemente hacia la izquierda mostrando una
secuencia de escenas con clima animado. La sensación es de "caminar hacia algo", en
sintonía con el concepto de aventuras y progreso.

**Escenas propuestas (de izquierda a derecha):**
1. Montañas verdes — viento suave entre hierbas
2. Cerezos — hojas cayendo en espiral
3. Mirador con ciudad al fondo — nubes lentas
4. Playa — olas que suben y bajan
5. Montaña nevada — nieve ligera cayendo

</details>

---

## Fase 15 — App móvil (Expo/React Native)

**Objetivo:** un segundo cliente para la misma app, esta vez nativo (Android/iOS vía Expo
Go), consumiendo la misma base de datos a través de una API REST propia (en vez de los
Server Actions que usa `apps/web`). Se trabaja como una serie de sub-proyectos
independientes, cada uno con su propio spec + plan en `apps/web/docs/superpowers/` (backend)
o `apps/mobile/docs/superpowers/` (cliente), ejecutados en un worktree y mergeados por PR.

### Sub-proyecto 1 — Capa de API móvil (backend) ✅ Completo (2026-07-02, PR #2)

Expone `/api/mobile/*` en `apps/web` con autenticación por JWT + refresh token (en vez de
las cookies de sesión que usa la versión web), para que un cliente que no es un navegador
(Expo) pueda autenticarse y operar sobre los mismos datos.

- [x] Modelo `RefreshToken` + migración de Prisma
- [x] Helpers de JWT + refresh token, errores de servicio tipados
- [x] Endpoints de auth: registro, login, refresh, logout, `me`
- [x] Endpoints de adventures, missions, check-ins, recommendations — cada uno extraído a
      un "service" compartido con la lógica de `apps/web` (mismo comportamiento, sin
      duplicar reglas de negocio)
- [x] Fix de una IDOR (Insecure Direct Object Reference) cross-user detectado en missions
      durante la extracción a service
- [x] Fix de una race condition en la rotación de refresh tokens

**Spec/plan:** `apps/web/docs/superpowers/specs/2026-07-01-mobile-api-design.md`,
`apps/web/docs/superpowers/plans/2026-07-01-mobile-api.md`

### Sub-proyecto 2 — Scaffold Expo + login ✅ Completo (2026-07-05, PR #6)

Proyecto Expo independiente en `apps/mobile` (Expo Router, NativeWind, TypeScript) con el
ciclo completo de login → sesión → logout contra la API del Sub-proyecto 1, verificado en
un celular físico vía Expo Go.

- [x] Scaffold Expo Router + NativeWind + TypeScript
- [x] Almacenamiento seguro de tokens (`expo-secure-store`)
- [x] Cliente de API con refresh automático en `401 token_expired`
- [x] Contexto de auth (`useAuth`: user, isLoading, login, logout)
- [x] Redirect protegido entre `/login` y `(tabs)` en el layout raíz
- [x] Pantalla de login + shell de tabs (Home/Profile)
- [x] Verificación manual end-to-end en celular físico (5/5 pasos del checklist)
- [x] Revisión final de todo el branch (sin hallazgos Críticos) + limpieza de código muerto
      del scaffold

**Spec/plan:** `apps/mobile/docs/superpowers/specs/2026-07-05-mobile-scaffold-design.md`,
`apps/mobile/docs/superpowers/plans/2026-07-05-mobile-scaffold.md`

**Deuda técnica heredada, resuelta antes del Sub-proyecto 3** (2026-07-06, PR #8):
`tryRefresh()` en `apps/mobile/src/lib/api.ts` no tenía "single-flight" — era invisible
porque solo había una llamada autenticada, pero rompería con llamadas paralelas. Se agregó
una promesa compartida a nivel de módulo para que llamadas concurrentes compartan el mismo
intento de refresh en vez de que cada una dispare el suyo con un refresh token ya rotado.

### Sub-proyecto 3 — Dashboard / misiones móvil ⏳ En progreso

Pantallas de dashboard, detalle de aventura, check-in y progreso en `apps/mobile`,
reutilizando los endpoints ya construidos en el Sub-proyecto 1. Jose decidió trocearlo en
rondas más chicas en vez de una sola spec gigante:

- [x] Resolver el single-flight de `tryRefresh()` (PR #8, 2026-07-06)
- [x] Brainstorming: decisión de trocear en rondas (A, A.5, B, C) — ver spec de la Ronda A
- [x] **Ronda A** — Dashboard de solo lectura (aventuras + racha + recomendaciones) + toggle
      de misión + Adventure Detail, fondo plano por momento del día (sin motor 3D). Implementada
      y verificada en celular (2026-07-06) — ver registro de avance.
- [ ] Ronda A.5 — port de `sky-engine.ts` a React Native (`expo-gl`/Three.js) — sin spec aún;
      riesgo técnico ya identificado: las texturas usan Canvas 2D del DOM, inexistente en RN
- [x] **Ronda B** — flujo de check-in (wizard de 4 métricas + franja de 7 días + resumen).
      Implementada y verificada en celular (2026-07-06) — ver registro de avance.
- [x] Brainstorming: Ronda C decomposta en C1 (Progress) y C2 (CRUD) — piezas independientes
      (una es solo-lectura/visual, la otra son formularios e interacciones de escritura)
- [x] **Ronda C1** — pantalla de Progress (tarjetas de métrica con tendencia de 14 días,
      franja de 7 días, racha, tarjetas de aventura con % completado). Implementada y
      verificada en celular (2026-07-06) — ver registro de avance.
- [x] Brainstorming: Ronda C2 decompuesta en C2a (CRUD de aventuras) y C2b (CRUD de
      misiones) — piezas independientes por pantalla
- [x] **Ronda C2a** — CRUD de aventuras (crear con título+paisaje, editar, borrar con
      confirmación nativa). Implementada y verificada en celular (2026-07-07) — ver
      registro de avance.
- [ ] Ronda C2b — CRUD de misiones (crear/editar/borrar) — sin spec aún

**Spec/plan Ronda A:** `apps/mobile/docs/superpowers/specs/2026-07-06-mobile-dashboard-design.md`,
`apps/mobile/docs/superpowers/plans/2026-07-06-mobile-dashboard.md`

**Spec/plan Ronda C2a:** `apps/mobile/docs/superpowers/specs/2026-07-06-mobile-adventure-crud-design.md`,
`apps/mobile/docs/superpowers/plans/2026-07-06-mobile-adventure-crud.md`

**Spec/plan Ronda B:** `apps/mobile/docs/superpowers/specs/2026-07-06-mobile-checkin-design.md`,
`apps/mobile/docs/superpowers/plans/2026-07-06-mobile-checkin.md`

**Spec/plan Ronda C1:** `apps/mobile/docs/superpowers/specs/2026-07-06-mobile-progress-design.md`,
`apps/mobile/docs/superpowers/plans/2026-07-06-mobile-progress.md`

**Spec/plan Ronda B:** `apps/mobile/docs/superpowers/specs/2026-07-06-mobile-checkin-design.md`,
`apps/mobile/docs/superpowers/plans/2026-07-06-mobile-checkin.md`

---

## Registro de avance

(Claude Code: agrega aquí una línea breve al final de cada sesión, formato:
`AAAA-MM-DD — Fase X.Y — qué se hizo — qué quedó pendiente`)

- 2026-06-17 — Fase 3 completa — PostgreSQL en Docker, Prisma 7 instalado, schema con 4 modelos, migración aplicada, seed con datos de prueba, Prisma Studio funcional — SQL crudo (3.8) omitido intencionalmente
- 2026-06-18 — Fase 4 en progreso — spec y plan escritos, Task 1 (fix updateAdventure + link AdventureCard) y Task 2 (Server Actions de misiones) completos — pendiente Tasks 3-6 (página de detalle + componentes de misiones)
- 2026-06-18 — Fase 4 completa — Tasks 3-6 implementados: página /adventures/[id], NewMissionForm, MissionItem, MissionList — CRUD completo de misiones funcional
- 2026-06-18 — Fase 5 completa — Auth.js v5 con Credentials, bcryptjs, login/registro, middleware de protección, userId real en todas las acciones
- 2026-06-18 — Fase 6 completa — página /checkin con sliders, upsert de un check-in por día, historial de últimos 7 días con colores, enlace desde Dashboard
- 2026-06-18 — Fase 7 completa — FastAPI en apps/recommender, modelos Pydantic, lógica de recomendación con reglas (energía/estrés/dificultad), 11 tests pytest pasando, endpoint POST /recommendations funcional
- 2026-06-18 — Fase 8 completa — lib/recommender.ts, fetch desde Dashboard a servicio Python, sección "Recomendado para hoy" con 3 estados, RECOMMENDER_URL en variable de entorno
- 2026-06-18 — Fase 9 completa — página /progress con barras de progreso por aventura y gráfica nivo de check-ins últimos 14 días, fix de timezone en labels del eje X
- 2026-06-18 — Fase 10 completa — Dockerfile (python:3.11-slim, caché de capas), docker-compose.yml con db y recommender, volumen persistente, `docker compose up` reemplaza docker run manual
- 2026-06-18 — Fase 11 completa — GitHub Actions CI: web (tsc, Node 24) y recommender (pytest), filtro paths para monorepo, postinstall Prisma, ambos workflows verdes
- 2026-06-28 — Fase 14 completa — Sistema de fondos Three.js/R3F: MorningScene, AfternoonScene, SunsetScene, ForestScene (noche). ForestScene reemplaza NightScene. Bug fixes: useMemo deps, computeVertexNormals removido de SunsetScene, Math.random sacado del loop en MorningScene. AuthCard unificado (login+register). CheckInBody y ProgressBody migrados a componentes cliente. Todas las páginas usan ThreeBackground con la escena correcta por momento del día. ProgressBody migrado de fondo CSS a ThreeBackground.
- 2026-06-28 — Fase 14 (extra) — ForestScene: GroundMist + GroundPools (shaders GLSL, niebla y charcos bioluminiscentes teal), fog más azul-teal, luces ambiente/hemisferio más brillantes.
- 2026-06-30 — Fase 14 (extra) — Reemplazo de las 4 escenas R3F por `lib/sky-engine.ts`: motor Three.js vanilla (ES module) con 4 momentos (dawn/noon/dusk/night), crossfade vía `setMoment()`, envuelto en `SkyCanvas.tsx`. v2: viento compartido (`windAt`), aurora GLSL, nieve, pradera con flores/mariposas, risco paramétrico con mar animado. Overhaul final: tipos extraídos (`MomentDef`, `AuroraBand`, etc.), código muerto eliminado, `build()` reorganizado. **Pendiente:** este código todavía no pasó por el ciclo de revisión de Modo B (explicación línea por línea + revisión activa + checkpoint) — queda para la sesión de revisión profunda.
- 2026-07-02 — Fase 15, Sub-proyecto 1 completo (mobile-api) — plan `apps/web/docs/superpowers/plans/2026-07-01-mobile-api.md` — capa `/api/mobile/*` con auth JWT + refresh token (modelo `RefreshToken`, helpers, errores tipados), endpoints de auth/adventures/missions/checkins/recommendations, cada uno extraído a un service compartido con `apps/web` (mismo comportamiento, sin duplicar reglas). Se detectaron y corrigieron en el camino: una IDOR cross-user en missions y una race condition en la rotación de refresh tokens. Mergeado a `main` vía PR #2.
- 2026-07-03 — Migración web-api-migration-adventures completa (rama worktree, plan `apps/web/docs/superpowers/plans/2026-07-03-web-api-migration-adventures.md`) — Tasks 1-4: `/` (dashboard) y `/adventures/[id]` migrados de Server Actions a fetch contra `/api/mobile/...`, Server Actions viejos de adventures/missions y componentes muertos (`NewAdventureForm.tsx`, `AdventureCard.tsx`) borrados. Revisión final del branch encontró y se corrigió una condición de carrera real en `refresh()`/`load()` (respuestas viejas podían pisar datos nuevos); el primer intento de arreglo no satisfizo el lint `react-hooks/set-state-in-effect` y se rediseñó correctamente separando la función pura de fetch de la lógica que toca estado. `tsc` y `eslint` limpios, confirmado en navegador. Mergeado a `main` vía PR #4.
- 2026-07-04 — Fase 6 (extra) completa — check-ins múltiples por día: `saveCheckIn` pasó de actualizar a crear un registro nuevo cada vez, `getLatestCheckInToday` reemplaza el concepto de "el único check-in del día" por "el más reciente", week-strip del progreso colapsado a una entrada por día cuando hay varios. Deuda preexistente pagada de una vez (`<a href="/">` → `next/link`, decisión de Jose para no acumularla justo en una migración de comportamiento). `tsc`/`eslint` limpios, verificado con `curl` y en navegador. Mergeado a `main` vía PR #5.
- 2026-07-05 — Fase 15, Sub-proyecto 2 completo (mobile scaffold + login) — specs/plan en `apps/mobile/docs/superpowers/`, ejecutado vía `subagent-driven-development` (implementador + revisor por tarea + revisión final del branch en `opus`). 9 tareas: scaffold Expo Router + NativeWind, secure-store, cliente API con refresh-on-401, auth context, redirect protegido, login, tabs Home/Profile, verificación manual en celular (5/5). Revisión final sin hallazgos Críticos; 2 Important corregidos el mismo día (código muerto del scaffold, flash de un frame antes del redirect de auth). Mergeado a `main` vía PR #6, worktree y ramas limpiados.
- 2026-07-05 — Fase 14, checkpoint de revisión Modo B completo — `sky-engine.ts` + `SkyCanvas.tsx` (pendiente desde el 2026-06-30) explicados línea por línea / por arquitectura, con 3 preguntas de revisión activa resueltas junto con Jose (ver detalle en la sección de Fase 14 y en `CLAUDE.md`). Sin cambios de código — puramente explicativo. Con esto, `apps/web` queda sin pendientes de revisión Modo B abiertos.
- 2026-07-05 — Documentación (`ROADMAP.md`, `CLAUDE.md`) puesta al día en un solo pase: casillas de las Fases 4-12 corregidas (estaban `[ ]` aunque ya completas), Fase 14 reescrita para reflejar el motor Three.js real (el plan original de escenas SVG con scroll horizontal se archivó como referencia histórica), y se agregó la Fase 15 (App móvil) con sus 3 sub-proyectos. Próximo pendiente: Sub-proyecto 3 (dashboard/misiones móvil), empezando por resolver el single-flight de `tryRefresh()`.
- 2026-07-06 — Fix del single-flight de `tryRefresh()` completo — `apps/mobile/src/lib/api.ts` ganó una promesa compartida a nivel de módulo (`refreshPromise`) para que llamadas concurrentes compartan el mismo intento de refresh en vez de que cada una dispare el suyo con un refresh token que el servidor ya rotó. Explicado a fondo con Jose antes de generar el código (concepto de condición de carrera/"single-flight"); revisión independiente confirmó que el check-y-asignación es atómico (sin `await` entre medio) y que el manejo de errores queda idéntico al original. `tsc` limpio. Mergeado a `main` vía PR #8, worktree y ramas limpiados. Con esto, el Sub-proyecto 3 (dashboard/misiones móvil) ya no tiene bloqueantes — solo falta su spec/plan.
- 2026-07-06 — Brainstorming + spec + plan de la Ronda A del Sub-proyecto 3 (dashboard móvil) completos. Jose decidió trocear el sub-proyecto en rondas más chicas (A: dashboard solo lectura + adventure detail; A.5: port del cielo animado; B: check-in; C: CRUD + progress) en vez de una spec gigante. Se identificó un riesgo técnico real durante el brainstorming: las funciones de textura de `sky-engine.ts` usan `document.createElement('canvas')`/Canvas 2D del DOM, que no existen en React Native — por eso el port del cielo se separó en su propia ronda (A.5), para no bloquear el dashboard con un problema de gráficos sin resolver. Ronda A: Dashboard (aventuras + racha + recomendaciones, sin mostrar misiones) + Adventure Detail (dueña exclusiva de la lista de misiones y el toggle de completado) + `mobile-theme.ts` (colores planos por momento del día, reusando los valores exactos de `sky-engine.ts`/`theme.ts` de la web). Plan de 5 tareas, con Adventure Detail deliberadamente antes que Dashboard para evitar un hueco transitorio de typed-routes. Spec y plan commiteados y aprobados por Jose; implementación queda para la próxima sesión.
- 2026-07-06 — Ronda A del Sub-proyecto 3 (dashboard móvil) implementada y verificada — worktree `mobile-dashboard-round-a`, ciclo Modo B tarea por tarea (explicación + revisión activa + checkpoint por cada una, sin subagentes paralelos). Tasks 1-4: `types.ts`/`mobile-theme.ts`, hook `useDashboardData` (fetch paralelo con `Promise.all`, todo-o-nada en error), pantalla Adventure Detail (`adventures/[id].tsx`, optimistic update con revert por `id` de misión), Dashboard real reemplazando el placeholder de Home (racha calculada con `Set` de días + `toISOString`, ventana de 60 días). `tsc` limpio en las 4. Verificación manual en celular (Task 5): pasos 1-6 confirmados; paso 7 (servidor caído) confirmó manejo de error sin crash en Adventure Detail, y de paso se topó en vivo con la deuda ya conocida de `fetch` sin timeout (pantalla en blanco indefinida al hacer Reload con el servidor apagado durante la validación de sesión en `auth-context.tsx` — no es regresión de esta ronda, confirma una deuda preexistente). Mergeado a `main` vía PR #9.
- 2026-07-06 — Ronda B del Sub-proyecto 3 (check-in móvil) completa de punta a punta en una sola sesión: brainstorming, spec, plan y ejecución vía `subagent-driven-development` (implementador + revisor por tarea, modelos económicos para transcripción de código ya escrito en el plan, `sonnet` para revisión, `opus` para la revisión final del branch) en worktree `mobile-checkin-round-b`. Task 1: pantalla `checkin.tsx` (wizard de 6 pasos, franja de 7 días, salto directo a resumen si ya hay check-in hoy) — la primera revisión encontró un bug real (franja no deduplicaba check-ins del mismo día, la app permite varios por día); corregido con `toDailyLatest()` local y re-revisado limpio. Task 2: botón "Hacer check-in" + `useFocusEffect` en el Dashboard para refrescar la racha al volver. Revisión final del branch: `Ready to merge: Yes`, sin hallazgos Críticos/Importantes, 5 Menores anotados como deuda técnica (franja no se refresca tras "Hacer otro check-in", `values` guarda campos de más pero inofensivo, campos `low`/`high` muertos, `theme` sin memoizar en `checkin.tsx`, doble fetch al montar el Dashboard). Verificación manual en celular: wizard completo, revisita salta a resumen, racha se actualiza al volver sin recargar, reset con "Hacer otro check-in" — todos confirmados. El error de servidor caído no se pudo aislar limpiamente de la misma deuda de timeout de `fetch` ya documentada (reproducida de nuevo, en dos rondas distintas — confirma que es real y consistente, no es específico de esta ronda). Mergeado a `main` vía PR #10.
- 2026-07-06 — Brainstorming + Ronda C1 (Progress móvil) completa de punta a punta en la misma sesión. La Ronda C original (CRUD + Progress) se decompuso en C1 (Progress, solo lectura) y C2 (CRUD, formularios de escritura) por ser piezas independientes de naturaleza distinta. Spec/plan/ejecución vía `subagent-driven-development` en worktree `mobile-progress-round-c1`. Task 1: pantalla `progress.tsx` — 4 tarjetas de métrica con tendencia de 14 días (barras planas en vez de sparklines SVG, sin dependencia nueva), `trendArrow` portado verbatim de `trendInfo()` de `apps/web` (incluida la inversión de `stress`), franja de 7 días, racha, hasta 5 tarjetas de aventura con % de completado (sin listar misiones individuales, a diferencia de web — decisión explícita de límite de pantalla). Task 2: botón "Ver mi progreso" en el Dashboard. Revisión final del branch: `Ready to merge: Yes`, sin hallazgos Críticos/Importantes, 3 Menores (móvil deduplica check-ins del mismo día para las tarjetas de métrica y web no — divergencia intencional, Jose decidió dejar móvil como está por ser el comportamiento más correcto; import `ApiError` sin usar; color de track reutilizado). Verificación manual en celular: navegación, cruce de números contra Dashboard/Adventure Detail, todo confirmado; el caso de servidor caído volvió a topar con la misma deuda de timeout de `fetch` (tercera vez, tres rondas distintas). Mergeado a `main` vía PR #11.
- 2026-07-07 — Brainstorming + Ronda C2a (CRUD de aventuras móvil) completa de punta a punta. La Ronda C2 (CRUD de aventuras + misiones) se decompuso en C2a (aventuras) y C2b (misiones, futura) por tocar pantallas distintas. Decisión de alcance: crear una aventura en móvil es solo título+paisaje (sin misiones iniciales en vivo como web, para no manejar una lista de borradores en el formulario — las misiones se agregan después desde Adventure Detail en C2b). Spec/plan/ejecución vía `subagent-driven-development` en worktree `mobile-adventure-crud-round-c2a`. Task 1: `adventures/new.tsx` (crear, `router.replace` al detalle recién creado). Task 2: `adventures/[id]/edit.tsx` (editar + borrar con `Alert.alert` de confirmación nativa antes del DELETE; `status`/`description` se reenvían sin cambios, tomados de la aventura ya cargada, nunca de un campo editable — evita que el `PATCH` falle por mandar `null` donde el backend espera `string` u omitido). Task 3: botón "Editar" + `useFocusEffect` en Adventure Detail. Task 4: botón "+ Nueva aventura" en el Dashboard. Detalle técnico documentado explícitamente en el plan: el array de paisajes debe tiparse como tuplas fijas (`[string, string, string][]`), no `string[][]`, porque `LinearGradient` exige un mínimo de 2 colores garantizados en tiempo de compilación. Revisión final del branch: `Ready to merge: Yes`, sin hallazgos Críticos/Importantes, 1 Menor de gramática en español corregido en el momento, resto deuda ya conocida (sin `KeyboardAvoidingView`, doble fetch al montar). Verificación manual en celular: flujo crear→editar→borrar de punta a punta confirmado; servidor caído volvió a topar con la misma deuda de timeout de `fetch` (cuarta vez, cuatro rondas distintas). Mergeado a `main` vía PR #12.
- 2026-07-05 — Migración de consistencia de tema completa (bug reportado por Jose: Check-in/Progress siempre mostraban cielo de noche) — spec/plan en `apps/web/docs/superpowers/`, ejecutado vía `subagent-driven-development`. Causa raíz: `ForestBackground.tsx` tenía `moment="noche"` fijo; además solo `DashboardBody.tsx` estaba 100% adaptado al momento del día (cielo + paneles), el resto solo tenía el cielo (o ni eso). Jose eligió el alcance completo (Opción C): Check-in, Progress, Adventure Detail y Login/Registro (sumado a mitad de camino al descubrir que `AuthCard.tsx` era el segundo consumidor de `ForestBackground.tsx`) migrados al mismo patrón `theme.*` de Dashboard. Se agregó `glassBgStrong` a `MomentTheme` para preservar la jerarquía visual de dos niveles (decisión de Jose, no quería perder el efecto glassmorphism). Se extrajo `getRequestMoment()`, eliminando la lógica de zona horaria duplicada. `ForestBackground.tsx` borrado. 5 tareas + 3 fixes post-revisión (track inconsistente en Adventure Detail, `colorScheme` fijo detectado por el propio Jose en su ejercicio de revisión, sombras de tarjeta sin tematizar). Revisión final del branch (`opus`) sin hallazgos Críticos. Mergeado a `main` vía PR #7, worktree y ramas limpiados.
