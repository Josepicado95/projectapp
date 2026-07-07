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

- **Fase/Sesión actual:** sesión muy larga, 5 hilos cerrados + 1 en curso (detalle completo
  en `git log` y en el "Registro de avance" de `ROADMAP.md`, este resumen es solo lo
  esencial para retomar):
  1. Mobile scaffold + login completo y mergeado (PR #6).
  2. Revisión profunda de `sky-engine.ts`/`SkyCanvas.tsx` cerrada (sin cambios de código).
  3. Migración de consistencia de tema (bug del cielo de noche fijo en Check-in/Progress)
     mergeada (PR #7) — las 5 pantallas de `apps/web` ya son consistentes con el momento
     del día real; `ForestBackground.tsx` borrado.
  4. Fix del single-flight de `tryRefresh()` en `apps/mobile` mergeado (PR #8).
  5. **Sub-proyecto 3 de `apps/mobile` (dashboard/misiones), Ronda A:** brainstorming
     completo con Jose (decidió trocear el sub-proyecto en rondas más chicas, y separar el
     port del cielo animado a React Native en su propia ronda futura — A.5 — por la
     complejidad técnica real de que las texturas de `sky-engine.ts` usan Canvas 2D del DOM,
     inexistente en React Native). Spec y plan de la Ronda A (Dashboard de solo lectura +
     toggle de misión, Adventure Detail, fondo plano por momento del día sin motor 3D)
     escritos y aprobados por Jose.
  6. **Ronda A implementada y verificada** (worktree `mobile-dashboard-round-a`, ciclo Modo B
     tarea por tarea, sin subagentes paralelos): `types.ts`/`mobile-theme.ts`, hook
     `useDashboardData` (fetch paralelo, todo-o-nada en error), pantalla Adventure Detail
     (optimistic update con revert por `id` de misión), Dashboard real reemplazando el
     placeholder de Home (racha vía `Set` de días). `tsc` limpio en las 4 tareas de código.
     Verificación manual en celular: pasos 1-6 del checklist confirmados por Jose; el paso 7
     (servidor caído) confirmó manejo de error sin crash, y de paso reprodujo en vivo la
     deuda ya conocida de `fetch` sin timeout (pantalla en blanco indefinida al hacer Reload
     con el servidor apagado, porque `restoreSession()` en `auth-context.tsx` nunca resuelve
     su `finally` — no es regresión de esta ronda). Mergeado a `main` vía PR #9.
  7. **Ronda B (check-in) completa de punta a punta en una sola sesión**, vía
     `subagent-driven-development` en worktree `mobile-checkin-round-b` (brainstorming → spec
     → plan → implementador/revisor por tarea → revisión final del branch en `opus`).
     Pantalla `checkin.tsx` (wizard de 4 métricas, franja de 7 días, salto a resumen si ya
     hay check-in hoy) + botón "Hacer check-in" y `useFocusEffect` en el Dashboard. La
     primera revisión encontró un bug real (franja sin deduplicar check-ins del mismo día),
     corregido con `toDailyLatest()` y re-revisado limpio. Revisión final: `Ready to merge`,
     0 Críticos/Importantes, 5 Menores anotados como deuda (ver abajo). Verificado en
     celular: wizard, revisita-salta-a-resumen, refresco de racha al volver, reset con
     "Hacer otro check-in" — todos confirmados; el caso de servidor caído volvió a topar con
     la misma deuda del timeout de `fetch` (segunda vez, confirma que es real). Mergeado a
     `main` vía PR #10.
  8. **Ronda C decompuesta en C1 (Progress) y C2 (CRUD)** al empezar el brainstorming —
     piezas independientes (una de solo lectura/visual, la otra de formularios/escritura).
     **Ronda C1 completa de punta a punta**, mismo flujo `subagent-driven-development` en
     worktree `mobile-progress-round-c1`. Pantalla `progress.tsx` (4 tarjetas de métrica con
     tendencia de 14 días vía barras planas — sin `react-native-svg` —, `trendArrow` portado
     verbatim de `trendInfo()` de web incluida la inversión de `stress`, franja de 7 días,
     racha, hasta 5 tarjetas de aventura con % completado sin listar misiones individuales) +
     botón "Ver mi progreso" en el Dashboard. Revisión final: `Ready to merge`, 0
     Críticos/Importantes, 3 Menores (ver abajo). Verificado en celular: navegación y
     cruce de números contra Dashboard/Adventure Detail confirmados; servidor caído volvió a
     topar con la misma deuda de timeout de `fetch` (tercera vez). Mergeado a `main` vía
     PR #11.
  9. **Ronda C2 decompuesta en C2a (aventuras) y C2b (misiones)** al empezar el
     brainstorming — piezas independientes por pantalla. **Ronda C2a completa de punta a
     punta**, mismo flujo `subagent-driven-development` en worktree
     `mobile-adventure-crud-round-c2a`. Pantallas `adventures/new.tsx` (crear: solo
     título+paisaje, sin misiones iniciales en vivo como web — decisión de Jose para
     simplificar el formulario) y `adventures/[id]/edit.tsx` (editar + borrar con
     `Alert.alert` de confirmación nativa; `status`/`description` se reenvían sin cambios,
     tomados de la aventura ya cargada, nunca de un campo editable) + botón "Editar" y
     `useFocusEffect` en Adventure Detail + botón "+ Nueva aventura" en el Dashboard.
     Detalle técnico clave: el array de paisajes se tipa como tuplas fijas
     (`[string, string, string][]`), no `string[][]`, porque `LinearGradient` exige un
     mínimo de 2 colores garantizados en tiempo de compilación. Revisión final: `Ready to
     merge`, 0 Críticos/Importantes, 1 Menor de gramática corregido en el momento, resto
     deuda ya conocida. Verificado en celular: flujo crear→editar→borrar de punta a punta
     confirmado; servidor caído volvió a topar con la misma deuda de timeout de `fetch`
     (cuarta vez). Mergeado a `main` vía PR #12. **Pendiente: Ronda C2b (CRUD de misiones),
     sin spec todavía.**
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
  - `apps/mobile`: colores hardcodeados en hex por pantalla (`login.tsx`, `(tabs)/*.tsx`) en
    vez de tokens centralizados en `tailwind.config.js` — candidato a limpieza cuando haya
    más de 3-4 pantallas.
  - `apps/mobile`: sin workflow de CI en `.github/workflows/` (web y recommender sí tienen).
  - `apps/mobile`: los `fetch` de `lib/api.ts` no tienen timeout (`AbortController`) — un
    Wi-Fi que falla "en silencio" deja el botón de login pegado en "Entrando...". Confirmado
    en vivo el 2026-07-06 durante la verificación de la Ronda A: con el servidor apagado, un
    "Reload" de la app deja la pantalla en blanco indefinidamente porque `restoreSession()`
    en `auth-context.tsx` nunca resuelve su `finally` (la promesa de `fetch` cuelga en vez de
    rechazar).
  - `apps/mobile`: falta el mensaje "Tu sesión expiró, inicia sesión de nuevo" del spec —
    no alcanzable hoy (nadie hace una llamada a mitad de sesión), se volverá relevante con
    el dashboard móvil.
  - `apps/mobile` (Ronda B, check-in, 2026-07-06): 5 hallazgos Menores de la revisión final,
    ninguno bloqueante (`Ready to merge: Yes`) — anotados en vez de arreglados:
    - `checkin.tsx`: la franja de 7 días no se refresca al tocar "Hacer otro check-in" en la
      misma sesión (queda con datos previos hasta recargar la pantalla).
    - `checkin.tsx`: `values` guarda de más (`id`/`date`) al inicializar desde el check-in de
      hoy — inofensivo, confirmado que `CheckInSchema` (sin `.strict()`) los ignora al guardar.
    - `checkin.tsx`: los campos `low`/`high` de `METRICS` están declarados pero nunca se leen.
    - `checkin.tsx`: `theme` no está memoizado con `useMemo` (sí lo está en el Dashboard) —
      inconsistencia menor, sin impacto real (la función es pura y barata).
    - `(tabs)/index.tsx`: doble fetch al montar el Dashboard (`useFocusEffect` se dispara
      también en el primer montaje, además del `useEffect` propio de `useDashboardData`) —
      inofensivo por ser `GET`s idempotentes.
  - `apps/mobile` (Ronda C1, Progress, 2026-07-06): 3 hallazgos Menores de la revisión final,
    ninguno bloqueante (`Ready to merge: Yes`):
    - `progress.tsx`: deduplica los check-ins del mismo día para las tarjetas de métrica;
      `apps/web`'s `ProgressBody.tsx` solo deduplica para su franja de 7 días, no para las
      tarjetas — divergencia **intencional** confirmada con Jose (móvil es el más correcto de
      los dos); si algún día se quiere paridad numérica exacta, el cambio iría del lado de
      `apps/web`, no al revés.
    - `progress.tsx`: import `ApiError` sin usar (el `catch` no distingue tipos de error,
      a diferencia de `checkin.tsx`) — cosmético, no falla `tsc` porque `noUnusedLocals` no
      está activado en este proyecto.
    - `progress.tsx`: la barra de progreso por aventura reutiliza `theme.gradientFrom` como
      color de track — mismo patrón de reutilización ya usado en check-in.
  - `apps/mobile` (Ronda C2a, CRUD de aventuras, 2026-07-07): sin `KeyboardAvoidingView` en
    `adventures/new.tsx`/`adventures/[id]/edit.tsx` — el input de título podría quedar tapado
    por el teclado en pantallas chicas; cosmético, no bloqueante.
  - `apps/web`: el track de nivel sin completar en la mini-tarjeta de resumen de
    `CheckInBody.tsx` (los "puntitos" de energía/ánimo/estrés/sueño) sigue con un tinte
    crema fijo en vez de `theme.trackBg` — casi invisible en los momentos de día claro.
  - `apps/web`: el color del pulgar del scrollbar en `ProgressBody.tsx` sigue fijo
    (`rgba(236,230,216,.18)`) — bajo contraste en momentos de día claro. Cosmético, no
    urgente.
- **Credenciales de prueba:** jose@aventuras.com / aventuras123
- **Pendiente para la próxima sesión:**
  1. Siguiente foco: empezar la Ronda A.5 (port de `sky-engine.ts` a React Native) o la
     Ronda C2b (CRUD de misiones), a decidir con Jose — ambas sin spec todavía, empezar por
     `superpowers:brainstorming`.
  2. Deuda menor ya documentada, sin fecha fija: colores hardcodeados en `apps/mobile`, CI
     para `apps/mobile`, timeout de `fetch` (confirmado en vivo cuatro veces — Rondas A, B,
     C1 y C2a, ver deuda técnica arriba), mensaje de "sesión expiró", `AppShell` compartido
     en `apps/web`, `handleDelete` sin revisar `res.ok`, los dos detalles cosméticos de la
     migración de tema (track de Check-in, scrollbar de Progress), los 5 Menores de la
     Ronda B, los 3 Menores de la Ronda C1, y el `KeyboardAvoidingView` faltante de la
     Ronda C2a (todos arriba, en deuda técnica).
