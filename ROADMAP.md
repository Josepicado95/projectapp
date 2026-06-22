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

- [ ] Reemplazar el array mock del Dashboard por una consulta real a la DB (leer todas las
      Aventuras)
- [ ] Formulario "Crear nueva Aventura" → Server Action que inserta en la DB
- [ ] Editar/eliminar una Aventura
- [ ] Dentro de una Aventura: crear, editar, marcar como completada y eliminar Misiones
- [ ] Validar los datos de entrada con `zod` antes de guardar (entender qué problema
      resuelve la validación)
- [ ] Manejo básico de errores (¿qué pasa si el formulario está incompleto?)

**Checkpoint de cierre de Fase 4:** ¿puedes explicar qué pasa, paso a paso, desde que haces
clic en "Guardar" en el formulario hasta que el dato aparece en PostgreSQL?

---

## Fase 5 — Autenticación (login)

**Objetivo de aprendizaje:** conceptos de autenticación (sesiones, cookies, hashing de
contraseñas), Auth.js, rutas protegidas, relacionar datos con el usuario logueado.

**Entregable:** pantallas de registro/login funcionales; las Aventuras y Check-ins
pertenecen a un usuario específico; rutas privadas redirigen a login si no hay sesión.

### Sub-tareas

- [ ] Conceptos: ¿qué es una sesión?, ¿qué es un hash de contraseña y por qué nunca se
      guarda en texto plano?
- [ ] Agregar el modelo `User` con campos de autenticación (o usar el de Auth.js como
      referencia)
- [ ] Configurar Auth.js (proveedor de credenciales email/contraseña, o un proveedor OAuth
      si prefieres empezar por ahí)
- [ ] Páginas de registro y login
- [ ] Middleware/lógica para proteger rutas privadas
- [ ] Asociar Aventuras y Check-ins existentes (y nuevos) al `userId` de la sesión

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

- [ ] Confirmar/ajustar el modelo `CheckIn` (energía, ánimo, estrés, descanso, fecha,
      `userId`)
- [ ] Server Action que guarda el check-in del día
- [ ] Regla: solo un check-in por usuario por día (¿qué hacer si ya existe uno? ¿se
      actualiza o se bloquea?)
- [ ] Página/sección que muestra los últimos N check-ins del usuario

**Checkpoint de cierre de Fase 6:** ¿cómo decidiste manejar el caso de "el usuario ya
hizo check-in hoy y quiere cambiarlo"? Explica tu decisión.

---

## Fase 7 — Motor de recomendaciones (Python + FastAPI)

**Objetivo de aprendizaje:** Python "real" (no solo sintaxis: tipado con type hints,
estructuras de datos), FastAPI (endpoints, modelos Pydantic, validación), pruebas con
pytest.

**Entregable:** el servicio `apps/recommender` expone un endpoint que recibe el estado de
ánimo/energía del usuario + la lista de misiones pendientes de sus aventuras, y devuelve
una lista priorizada de misiones recomendadas para hoy, con pruebas automatizadas básicas.

### Sub-tareas

- [ ] (Si hace falta) repaso rápido de fundamentos de Python: variables, funciones,
      listas, diccionarios, condicionales — con ejercicios cortos antes de meterte al
      proyecto
- [ ] Diseñar la "regla de negocio" en lenguaje humano primero: ej. "si energía es baja,
      priorizar misiones de dificultad 1-2; si es alta, permitir dificultad 3+; si estrés
      es alto, limitar a máximo 2 misiones sugeridas"
- [ ] Definir modelos Pydantic para el request (estado del usuario + misiones disponibles)
      y el response (misiones recomendadas + por qué)
- [ ] Implementar el endpoint `/recommendations` con la lógica de reglas
- [ ] Escribir 3-5 tests con pytest que verifiquen distintos escenarios (energía baja,
      alta, estrés alto, sin misiones disponibles, etc.)

**Checkpoint de cierre de Fase 7:** ¿puedes explicar, en una frase, qué hace tu función de
recomendación para cada uno de los 3-5 escenarios que probaste?

---

## Fase 8 — Integración Next.js ↔ Python

**Objetivo de aprendizaje:** comunicación entre servicios vía HTTP, variables de entorno
para URLs, manejo de fallos de un servicio externo.

**Entregable:** el Dashboard de Next.js muestra una sección "Recomendado para hoy" que
obtiene sus datos llamando al servicio Python.

### Sub-tareas

- [ ] Desde un Route Handler/Server Action de Next.js, hacer `fetch` al servicio Python
      (usando una variable de entorno para la URL, no hardcodeada)
- [ ] Mostrar las recomendaciones en el Dashboard
- [ ] Manejar el caso en que el servicio Python no responde (mensaje amigable, no un error
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

- [ ] Calcular el % de misiones completadas por Aventura (consulta o cálculo en el
      servidor)
- [ ] Gráfico de barras o de progreso por Aventura
- [ ] Gráfico de líneas con energía/ánimo en el tiempo (usando los check-ins históricos)
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

- [ ] Escribir un `Dockerfile` para `apps/recommender` (explicado línea por línea)
- [ ] Escribir `docker-compose.yml` con los servicios `db` (Postgres) y `recommender`
- [ ] Configurar variables de entorno y la red interna entre contenedores (¿por qué
      `apps/web` le habla al contenedor por su nombre de servicio y no por `localhost`?)
- [ ] Probar el flujo completo: `docker compose up`, y `apps/web` corriendo localmente
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

- [ ] Conceptos: ¿qué problema resuelve la integración continua? (ejemplo: "funciona en mi
      máquina" vs "funciona siempre")
- [ ] Workflow de GitHub Actions para `apps/web` (instalar dependencias, lint, build)
- [ ] Workflow para `apps/recommender` (instalar dependencias, lint, `pytest`)
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

- [ ] Crear una base de datos PostgreSQL administrada (ej: Neon o Railway) y correr las
      migraciones de Prisma contra ella
- [ ] Desplegar `apps/recommender` (Railway o Render, usando el Dockerfile de la Fase 10)
- [ ] Desplegar `apps/web` en Vercel, configurando todas las variables de entorno
      (conexión a DB, secretos de Auth.js, URL del servicio recommender)
- [ ] Confirmar que el deploy se dispara automáticamente con cada push a `main` (CD)
- [ ] Probar el flujo completo en producción: registrarte, crear una aventura, hacer un
      check-in, ver una recomendación

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

## Fase 14 — Fondo cinematográfico con escenas animadas

**Objetivo:** convertir el paisaje de fondo en una experiencia visual viva que acompaña
al usuario mientras avanza en sus aventuras — sin tocar la UI (tarjetas, header, botones),
que permanece estática y flotando sobre las escenas.

**Entregable:** el fondo se desplaza suavemente hacia la izquierda mostrando una secuencia
de escenas con clima animado. La sensación es de "caminar hacia algo", en sintonía con el
concepto de aventuras y progreso.

### Escenas propuestas (de izquierda a derecha)

1. Montañas verdes — viento suave entre hierbas
2. Cerezos — hojas cayendo en espiral
3. Mirador con ciudad al fondo — nubes lentas
4. Playa — olas que suben y bajan
5. Montaña nevada — nieve ligera cayendo

### Sub-tareas (a definir cuando llegue el momento)

- [ ] Diseñar cada escena como una capa SVG/CSS independiente, con sus proporciones
      para que encajen en el scroll horizontal (cada escena ≈ 100vw)
- [ ] Animación de desplazamiento horizontal: CSS `@keyframes` o JS scroll (decidir
      si el avance es automático/lento, o responde a algún evento — ej. nuevas misiones
      completadas)
- [ ] Clima animado por escena: hojas (SVG + keyframes), olas (clip-path animado),
      nieve (partículas CSS o canvas ligero)
- [ ] Transición entre escenas: crossfade por opacidad de capas, o parallax por velocidad
      diferente entre elementos del fondo y primer plano
- [ ] Asegurarse de que `backdrop-filter` en las tarjetas siga funcionando con el fondo
      en movimiento (puede haber issues de performance en mobile)
- [ ] Test de rendimiento: la animación no debe bajar de 60fps en hardware normal

**Nota técnica a considerar:** el fondo en movimiento + `backdrop-filter` en las tarjetas
es costoso para el GPU. Evaluar si vale la práctica reducir el blur durante la transición
y recuperarlo cuando la escena está quieta.

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
