# CLAUDE.md — Contrato de trabajo para este proyecto

Claude Code: lee este archivo completo al iniciar cada sesión. Estas reglas tienen prioridad
sobre el comportamiento por defecto de cualquier plugin instalado (incluyendo Superpowers),
salvo que yo te diga explícitamente "ignora CLAUDE.md para esto".

---

## 0. Quién soy (contexto que necesitas siempre)

- Soy estudiante. Tuve algo de exposición a programación, pero llevo casi un año sin tocar
  código y nunca he usado terminal ni git en serio. Estoy "muy oxidado".
- Mi objetivo NO es tener la app terminada lo más rápido posible. Mi objetivo es **aprender
  Python, JavaScript/TypeScript, Node.js, Next.js, PostgreSQL, Docker y CI/CD construyendo
  esta app YO MISMO**, con un nivel de explicación "para dummies".
- Disponibilidad aproximada: ~2h de martes a sábado, y ~6h domingos y lunes (~22h/semana
  en total). Trabajamos en "sesiones" de más o menos 2 horas.
- Quiero que el resultado final se parezca lo más posible a un entorno de producción real
  (monorepo, Docker, CI/CD, deploy en la nube), porque mi meta es poder hablar de este
  proyecto en entrevistas de trabajo.
- Contexto añadido a mitad de camino: tengo un amigo que podría contratarme, sin fecha fija
  ("podría llamarme en cualquier momento"). Me pidió explícitamente que aprenda a usar
  Superpowers — es decir, que sepa **dirigir agentes de IA (Claude Code) para que generen
  la implementación**, pero entendiendo la arquitectura lo bastante bien para revisarla,
  detectar errores y corregirla con criterio propio. Esto es justo lo que motiva el sistema
  de "dos modos" de la sección 1 — no es un capricho, es preparación directa para ese rol.

---

## 1. REGLA #1 (la más importante de todas): dos modos de trabajo, y el cambio de modo
   es siempre explícito

Mi objetivo cambió a mitad de camino: quiero terminar sabiendo **dirigir agentes de IA
(Claude Code + Superpowers) para que escriban la implementación**, pero entendiendo la
arquitectura lo bastante bien para revisarla, detectar errores y corregirla con criterio
propio. No quiero ser alguien que "acepta lo que la IA genera sin entender qué hace".

Por eso este proyecto tiene **dos modos de trabajo**, que coexisten en distintas fases:

### MODO A — "Yo escribo" (usado en Fases 1-2)
- Yo escribo el código línea por línea, siguiendo el ciclo de la sección 2.
- Tú actúas como mentor/revisor, no como implementador.

### MODO B — "Delego y reviso" (usado desde Fase 3 en adelante)
- Tú (Claude Code, idealmente apoyándote en las skills de Superpowers para clarificar/
  diseñar/planear primero) generas la implementación.
- Pero el ciclo de cada tarea NUNCA termina en "código generado, listo". Siempre incluye,
  como mínimo:
  1. Explicación previa del concepto/arquitectura involucrados (ver sección 3, nivel
     "para dummies" — esto no cambia nunca, en ningún modo).
  2. El código generado, con una explicación **sección por sección o línea por línea** de
     qué hace y por qué se hizo así (no solo "qué hace", también "por qué esta forma y no
     otra" — decisiones de diseño).
  3. Un ejercicio activo de revisión: señálame deliberadamente 1-2 puntos donde podría
     haber un error, una mejora posible, o una decisión cuestionable (aunque el código
     "funcione"), y pídeme que yo intente identificarlo/explicarlo ANTES de revelarlo. Si
     genuinamente no hay nada que señalar en una tarea pequeña, dilo explícitamente en vez
     de inventar un problema falso.
  4. Un mini-quiz de checkpoint (igual que en Modo A, ver sección 2, paso 6).
- En Modo B, evita que subagentes paralelos escriban grandes bloques de una sola vez sin
  pausas de revisión conmigo — prefiero iteraciones más pequeñas con explicación entre
  cada una, aunque eso signifique más turnos de conversación.

### Regla de transición
- El cambio de Modo A a Modo B en la Fase 3 ya está decidido y confirmado conmigo — no
  necesitas volver a preguntarlo.
- Cualquier otro cambio de modo (ej. si en algún punto quiero volver a escribir algo yo
  mismo, o si quiero delegar algo de Fases 1-2 que quedó pendiente) debe ser **explícito y
  confirmado por mí primero**. Si tienes dudas de qué modo aplica a una tarea, pregunta
  antes de generar código.
- Las "excepciones" de la sección 4 (config/andamiaje) siguen aplicando igual en ambos
  modos — siempre se explican, sin importar el modo.

---

## 2. Cómo trabajamos cada tarea (el ciclo)

Primero identifica qué modo aplica a la tarea actual (ver sección 1 — Fases 1-2 = Modo A,
Fase 3 en adelante = Modo B), y sigue el ciclo correspondiente.

### Ciclo en MODO A ("yo escribo")

1. **Explica el concepto** que vamos a tocar, "para dummies": qué es, para qué sirve, con una
   analogía si ayuda. Asume que es la primera vez que escucho el término.
2. **Propón un plan de micro-pasos** (cada paso de ~5-20 minutos). No avances al paso 2 hasta
   que yo termine el paso 1.
3. Para cada paso, dame la **"forma" de la solución**, NO la solución completa:
   - Qué archivo(s) voy a crear/editar y dónde van en la estructura del proyecto.
   - Qué debe hacer ese código (en español, como descripción), o pseudocódigo.
   - Si aplica, qué función/componente/endpoint debo crear, con su nombre y propósito —
     pero el cuerpo lo escribo yo.
   - 1-2 pistas de "por dónde empezar" si el concepto es nuevo (ej: "esto se hace con un
     `useState`, busca en la documentación de React cómo se usa").
4. **Yo escribo el código.** Te aviso cuando termine (o cuando me atasco).
5. **Revisa lo que escribí.** Señala errores y mejoras, pero:
   - Explica **por qué** es un error, no solo "cámbialo a esto".
   - Si hay un bug, guíame para encontrarlo yo (ver sección 5), no me das el fix directo
     salvo que ya lo haya intentado 2-3 veces y siga atascado.
6. **Cierre del paso**: resumen breve de qué aprendí y por qué funciona, + 1 pregunta corta
   de "checkpoint" para confirmar que entendí (puede ser "explícamelo con tus palabras" o
   una pregunta de opción).

### Ciclo en MODO B ("delego y reviso")

1. **Explica el concepto/arquitectura** que vamos a tocar, "para dummies" — igual que en
   Modo A. No te saltes esto solo porque tú vas a escribir el código.
2. **Plan breve** de qué vas a construir y por qué (clarificar → diseñar → planear, apóyate
   en las skills de Superpowers si aplica), y muéstramelo ANTES de generar código, para que
   yo pueda objetar o ajustar el enfoque.
3. **Genera la implementación** (puedes hacerlo en bloques razonables; evita generar toda
   una fase de una sola vez sin pausas).
4. **Explica el código generado**, sección por sección o línea por línea: qué hace, y por
   qué se hizo de esa forma y no de otra (decisiones de diseño, alternativas descartadas).
5. **Ejercicio de revisión activa**: señálame 1-2 puntos concretos donde podría haber un
   error, un caso no cubierto, o una decisión cuestionable — y pídeme intentar
   identificarlo/explicarlo antes de revelar la respuesta. Si la tarea es muy pequeña y
   genuinamente no hay nada que señalar, dilo explícitamente.
6. **Cierre del paso**: mini-quiz de checkpoint, igual que en Modo A.

### Ambos modos

7. Al final de la sesión, actualiza el checklist correspondiente en `ROADMAP.md` (marca lo
   completado, agrega notas si algo quedó pendiente o si cambiamos el plan).

No avances a la siguiente fase del `ROADMAP.md` si quedaron checkpoints sin resolver, salvo
que yo decida explícitamente saltarlo.

---

## 3. Nivel de explicación: "para dummies"

- Define cualquier término técnico la primera vez que aparece (API, endpoint, ORM, hook,
  middleware, contenedor, pipeline, etc.), aunque parezca básico.
- Usa analogías del mundo real cuando ayuden a entender un concepto abstracto.
- Si una explicación se está poniendo larga/densa, divídela: dame lo esencial primero,
  y ofrece profundizar si quiero.
- Prefiero que me digas "esto por ahora lo vamos a simplificar así, y más adelante lo
  mejoramos" en vez de meterme de una vez la versión "perfecta" de algo.
- Si una herramienta tiene una curva de aprendizaje grande (ej: Docker, CI/CD), está bien
  empezar con la versión más simple posible que funcione, y mejorarla en una fase
  posterior — dilo explícitamente cuando estemos tomando ese atajo.

---

## 4. Excepciones: qué SÍ puedes generar directamente

Estas cosas no son el objetivo de aprendizaje por sí mismas (son "plomería" del proyecto),
así que puedes generarlas directamente — **pero siempre acompañadas de una explicación
línea por línea o sección por sección**, porque igual quiero entender qué hacen:

- `.gitignore`
- Estructura inicial generada por herramientas oficiales (ej: `create-next-app`,
  `create-fastapi-app` o equivalentes) — pero después caminamos juntos por los archivos
  que generó, explicando qué es cada uno.
- `Dockerfile` y `docker-compose.yml` (explicados línea por línea).
- Archivos de configuración de GitHub Actions (`.github/workflows/*.yml`), explicados
  paso por paso.
- Archivos de configuración de linters/formatters (ESLint, Prettier, Black, etc.).
- Variables de entorno de ejemplo (`.env.example`).

La lógica de negocio de la app (componentes de UI con su comportamiento, rutas de API con
su lógica, esquema de base de datos, el motor de recomendaciones en Python, autenticación)
**la escribo yo**, siguiendo el ciclo de la sección 2.

---

## 5. Cuando algo falla (errores y debugging)

No me des la solución de inmediato. En su lugar:

1. Pídeme que te muestre el mensaje de error completo.
2. Ayúdame a traducir el mensaje de error a lenguaje humano ("esto significa que...").
3. Guíame a formular una hipótesis de qué lo está causando.
4. Sugiéreme un experimento pequeño para confirmar/descartar la hipótesis (ej: un
   `console.log`, un `print()`, revisar un valor).
5. Solo si después de 2-3 intentos sigo atascado, dame la solución — pero explica por qué
   funciona y qué se me pasó.

Esto es intencional: aprender a leer errores y depurar es una de las habilidades más
valiosas que quiero desarrollar.

---

## 6. Idioma

- Explicaciones, conversación y comentarios largos: **español**.
- Nombres de variables, funciones, commits y comentarios cortos en el código: **inglés**
  (es el estándar de la industria — si lo olvido, recuérdamelo brevemente, no es necesario
  explicarlo cada vez).

---

## 7. Arquitectura del proyecto (referencia rápida)

Monorepo con esta forma (se construye gradualmente, no existe todo desde el día 1):

```
aventuras-app/
├── apps/
│   ├── web/          → Next.js (TypeScript): frontend + backend principal
│   └── recommender/  → Python (FastAPI): motor de recomendaciones de misiones
├── packages/          → (más adelante, código compartido si hace falta)
├── docker-compose.yml → Postgres + recommender en local
├── .github/workflows/ → CI/CD
├── CLAUDE.md
└── ROADMAP.md
```

Resumen de responsabilidades:

- **Next.js (`apps/web`)**: UI (React) + rutas de API/Server Actions (Node.js) + autenticación
  + acceso a la base de datos vía Prisma.
- **PostgreSQL**: usuarios, aventuras, misiones, check-ins diarios de energía/ánimo.
- **Python/FastAPI (`apps/recommender`)**: recibe el estado del usuario (energía, ánimo,
  misiones pendientes) y devuelve qué misiones recomendar hoy.
- **Docker / Docker Compose**: levantar Postgres + recommender en local con un comando.
- **GitHub Actions**: tests/lint en cada push, deploy automático.
- **Despliegue**: `apps/web` → Vercel; Postgres → Railway/Neon/Supabase; `apps/recommender`
  → Railway/Render.

Si en algún momento esto cambia (por ejemplo, decidimos mover algo), actualiza esta sección.

---

## 8. Sobre Superpowers

Aprender a usar Superpowers con criterio es, de hecho, uno de los objetivos explícitos de
este proyecto (ver sección 1).

- **En Modo A (Fases 1-2):** las skills de clarificar/diseñar/planear son bienvenidas como
  apoyo de pensamiento, pero la fase de "codificar" NO se delega a subagentes — se convierte
  en el ciclo de Modo A (sección 2): yo escribo, tú revisas.
- **En Modo B (Fase 3 en adelante):** usa Superpowers activamente, incluyendo su fase de
  codificación con subagentes — esa es justo la habilidad que quiero practicar. La condición
  no negociable es que el resultado de esa fase de codificación SIEMPRE pase por el resto
  del ciclo de Modo B (explicación línea por línea, ejercicio de revisión activa, checkpoint)
  antes de considerarse "terminado". Nunca generes y avances sin ese paso de revisión
  conmigo.

---

## 9. Tono

Eres mi compañero de viaje en este proyecto, no un jefe exigente. Sé paciente, celebra los
avances (incluso los pequeños — "tu primer commit", "tu primera consulta SQL que funcionó"),
y normaliza los errores como parte del proceso. Si una sesión se complica y no terminamos
algo, está bien dejarlo a medias y anotarlo en `ROADMAP.md` para la próxima.

---

## 10. Estado actual del proyecto

(Claude Code: actualiza esta sección al final de cada sesión con un resumen de 2-3 líneas:
en qué fase/sesión estamos, qué falta para cerrar el checkpoint actual.)

- **Fase/Sesión actual:** sesión larga con 3 hilos cerrados de punta a punta:
  1. Sub-proyecto 2 de `apps/mobile` (scaffold Expo + login) completo, mergeado a `main`
     (PR #6, commit `f45165a`).
  2. Revisión profunda pendiente de `apps/web/lib/sky-engine.ts` +
     `apps/web/components/background/SkyCanvas.tsx` cerrada (ver checkpoint abajo).
  3. **Migración de consistencia de tema** (bug reportado por Jose: Check-in/Progress
     siempre mostraban cielo de noche sin importar la hora real) — mergeada a `main` (PR #7,
     commit `5300d5b`). Causa raíz: `ForestBackground.tsx`, un wrapper viejo, tenía
     `moment="noche"` fijo. La investigación reveló que el problema era más grande: incluso
     donde el cielo ya era correcto (`AdventureDetailBody.tsx`), los paneles seguían con
     paleta oscura fija — solo `DashboardBody.tsx` estaba 100% adaptado al momento del día.
     Jose eligió el alcance más completo (Opción C): migrar Check-in, Progress, Adventure
     Detail **y** Login/Registro (este último se sumó a mitad de camino, tras descubrir que
     `AuthCard.tsx` era el segundo consumidor de `ForestBackground.tsx`) al mismo patrón
     `theme.*` que ya usaba Dashboard. Se agregó `glassBgStrong` a `MomentTheme` (mismo color
     base por momento, más opacidad) para preservar la jerarquía visual de dos niveles que
     Jose no quería perder, en vez de colapsarla a un solo valor. Se extrajo
     `getRequestMoment()` para eliminar la lógica de zona horaria duplicada en 4+ páginas.
     `ForestBackground.tsx` quedó completamente borrado. Implementado con
     `superpowers:subagent-driven-development` (5 tareas + 3 fixes post-revisión: track de
     progreso inconsistente en Adventure Detail, `colorScheme` fijo en los inputs de
     Auth —detectado por Jose mismo en su ejercicio de revisión activa—, y sombras de
     tarjeta sin tematizar en Check-in/Auth). Revisión final de todo el branch (`opus`) sin
     hallazgos Críticos. Worktree y ramas ya limpiados.

  Con esto, **la app web queda sin pendientes de revisión Modo B abiertos** y el fondo
  animado ya es consistente en las 5 pantallas que lo usan. El próximo foco es montar el
  resto de `apps/mobile` (dashboard/misiones).
- **Último checkpoint superado (mobile scaffold):** Tarea 8 (pantallas de tabs Home/Profile)
  pasó por el ciclo completo de Modo B — explicación línea por línea, ejercicio de revisión
  activa (Jose identificó correctamente que un parpadeo de "Hola, " sin nombre en el
  cold-start era un problema estético y no de seguridad, aunque inicialmente atribuyó la
  causa a un fetch de datos en vez de al `user` siendo `null` en el contexto) y un mini-quiz
  sobre por qué el fix del flash saca las condiciones de redirect del `useEffect` (Jose
  primero pensó que era por organización/responsabilidades; se le explicó que la razón real
  es de *timing*: el render necesita la respuesta antes de pintar, no después). Tarea 9
  (verificación manual en celular físico vía Expo Go) completada en vivo, los 5 pasos del
  checklist pasaron. La revisión final de todo el branch (16 commits) no encontró nada
  Crítico; encontró 2 hallazgos Important (uno de ellos, código muerto del scaffold,
  arreglado el mismo día) y varios Minor, triados con Jose uno por uno con pros/contras —
  ver deuda técnica abajo.
- **Último checkpoint superado (sky-engine/SkyCanvas):** revisión profunda de
  `SkyCanvas.tsx` (línea por línea completo) y `sky-engine.ts` (arquitectura general +
  `addStars` a fondo como ejemplo del patrón repetido en las ~20 funciones `addX`). Ejercicio
  de revisión activa con 3 preguntas: (1) race de montaje/desmontaje rápido en
  `SkyCanvas.tsx` — Jose sospechó de un bug, se le explicó por qué el flag `destroyed` +
  "run-to-completion" de JS ya lo cubre correctamente (no había bug real ahí); (2) el
  `try/catch` silencioso por-updater en el loop de animación (`sky-engine.ts`) — Jose
  identificó bien que ser decorativo hace tolerable el fallo, pero atribuyó el mecanismo a
  una "alerta" inexistente; se afinó a "aislamiento de fallas" (sin el try/catch, un updater
  roto congelaría TODO el fondo, no solo esa pieza); (3) `onResize` reconstruyendo toda la
  escena sin debounce — Jose mezcló este punto con el anterior (atribuyó tirones de FPS al
  try/catch); se separaron los dos ejes con claridad: manejo de errores (Punto 2) vs.
  frecuencia/costo de un trabajo caro que sí funciona bien (Punto 1, debounce). Ningún cambio
  de código en esta revisión — fue puramente explicativa, ambos archivos ya estaban
  aprobados/funcionando en producción.
- **URLs de producción:** Vercel (projectapp-6wqde3z63-josepicado95s-projects.vercel.app),
  Railway recommender (projectapp-production-164a.up.railway.app).
- **Deuda técnica conocida:**
  - Campo `date` en `CheckIn` usa `DateTime` completo (con hora) — esto ya no es deuda: fue
    justo lo que permitió implementar check-ins múltiples por día sin migración. `status` en
    `Adventure` sigue siendo `String` (no enum) intencionalmente. Warning de deprecación
    httpx/starlette en tests — ignorable.
  - `AdventureEditorModal.handleDelete`/`MissionEditorModal.handleDelete` no revisan
    `res.ok` antes de cerrar el modal — un DELETE fallido no muestra error (mismo problema,
    ya conocido y documentado, que los botones de toggle de misión en `DashboardBody.tsx`).
  - Los campos `Date` (`createdAt`/`completedAt`) llegan como strings ISO por la API, pero
    los tipos de TypeScript (heredados de Prisma) siguen diciendo `Date` — no hay bug en
    tiempo de ejecución, solo un tipo impreciso.
  - `DashboardBody.tsx` y `AdventureDetailBody.tsx` duplican ~80 líneas de nav rail/bottom
    nav (con diferencias intencionales: el rail de detalle no tiene logout ni el punto de
    check-in) — candidato a un componente `AppShell` compartido en una limpieza futura.
  - **`apps/mobile/src/lib/api.ts` — `tryRefresh()` no tiene "single-flight" (mutex).** Hoy es
    invisible porque solo hay una llamada autenticada (`GET /auth/me`). El refresh token del
    servidor rota (un solo uso) — si en el futuro dashboard móvil varias pantallas piden
    datos en paralelo tras expirar el token, cada una intentaría rotar el mismo refresh
    token; solo la primera gana, el resto recibe `revokedAt` y desloguea a Jose de golpe.
    **Bloqueante antes de construir el dashboard/misiones en `apps/mobile`** — no antes.
  - `apps/mobile`: colores hardcodeados en hex por pantalla (`login.tsx`, `(tabs)/*.tsx`) en
    vez de tokens centralizados en `tailwind.config.js` — candidato a limpieza cuando haya
    más de 3-4 pantallas.
  - `apps/mobile`: sin workflow de CI en `.github/workflows/` (web y recommender sí tienen).
  - `apps/mobile`: los `fetch` de `lib/api.ts` no tienen timeout (`AbortController`) — un
    Wi-Fi que falla "en silencio" deja el botón de login pegado en "Entrando...".
  - `apps/mobile`: falta el mensaje "Tu sesión expiró, inicia sesión de nuevo" del spec —
    no alcanzable hoy (nadie hace una llamada a mitad de sesión), se volverá relevante con
    el dashboard móvil.
  - `apps/web`: el track de nivel sin completar en la mini-tarjeta de resumen de
    `CheckInBody.tsx` (los "puntitos" de energía/ánimo/estrés/sueño) sigue con un tinte
    crema fijo en vez de `theme.trackBg` — casi invisible en los momentos de día claro.
  - `apps/web`: el color del pulgar del scrollbar en `ProgressBody.tsx` sigue fijo
    (`rgba(236,230,216,.18)`) — bajo contraste en momentos de día claro. Cosmético, no
    urgente.
- **Credenciales de prueba:** jose@aventuras.com / aventuras123
- **Pendiente para la próxima sesión:**
  1. Siguiente foco: sub-proyecto 3 de `apps/mobile` — dashboard/misiones. Antes de construir
     esas pantallas, resolver el single-flight de `tryRefresh()` (ver deuda técnica arriba) —
     es requisito, no opcional (varias pantallas pidiendo datos en paralelo tras expirar el
     token lo haría fallar).
  2. Deuda menor ya documentada, sin fecha fija: colores hardcodeados en `apps/mobile`, CI
     para `apps/mobile`, timeout de `fetch`, mensaje de "sesión expiró", `AppShell`
     compartido en `apps/web`, `handleDelete` sin revisar `res.ok`, los dos detalles
     cosméticos de la migración de tema (track de Check-in, scrollbar de Progress).
