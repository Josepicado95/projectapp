# Fase 4 — Mission CRUD Design Spec

**Date:** 2026-06-18  
**Status:** Approved  
**Mode:** Modo B (Claude genera, usuario revisa)

---

## Contexto

La Fase 4 tiene como objetivo conectar el frontend de Next.js a PostgreSQL via Prisma,
reemplazando los datos mock. Al inicio de esta sesión, el CRUD de Aventuras ya estaba
completo (crear, editar, eliminar, listar desde DB real). Lo que falta es:

1. Página de detalle de Aventura (`/adventures/[id]`)
2. CRUD completo de Misiones dentro de esa página

---

## Decisiones de diseño confirmadas

| Decisión | Elección | Razón |
|---|---|---|
| Dónde gestionar misiones | Página de detalle separada `/adventures/[id]` | Patrón estándar de la industria; enseña rutas dinámicas; escala mejor que expandible |
| Dificultad en formularios | Selector Fácil / Media / Difícil (internamente 1 / 2 / 3) | Más amigable visualmente; el número queda en la DB |
| Estilo | Tailwind básico funcional (no diseño final) | Funcionalidad primero; el sprint visual va en sesión dedicada |
| Patrón de datos | Server Actions + Server Components | Consistente con lo existente; es el patrón correcto de Next.js App Router |
| Toggle de misión | Actualiza `completed` y `completedAt` en la misma fila | No elimina registros; `completedAt = null` cuando se desmarca; historial completo es Fase 13 |

---

## Arquitectura

### Archivos nuevos

```
apps/web/
├── app/
│   └── adventures/
│       └── [id]/
│           └── page.tsx          ← Server Component: fetcha aventura + misiones, 404 si no existe
└── app/
    └── actions/
        └── missions.ts           ← Server Actions: createMission, updateMission, toggleMission, deleteMission
components/
├── MissionList.tsx               ← Recibe array de misiones, las agrupa (pendientes / completadas)
├── MissionItem.tsx               ← Una misión: checkbox toggle, editar inline, eliminar
└── NewMissionForm.tsx            ← Formulario crear misión (título, descripción, dificultad)
```

### Archivos modificados

```
components/AdventureCard.tsx      ← Agregar enlace "Ver misiones →" a /adventures/[id]
app/actions/adventures.ts         ← Corregir updateAdventure para retornar errores (hoy falla silenciosamente)
```

---

## Flujo de datos

```
GET /adventures/3
  → page.tsx (Server Component)
  → prisma.adventure.findUnique({ where: { id: 3 }, include: { missions: true } })
  → si no existe → notFound() → Next.js muestra 404
  → si existe → renderiza título + estado + MissionList + NewMissionForm

Crear misión:
  → NewMissionForm → Server Action createMission(formData)
  → zod valida → prisma.mission.create()
  → revalidatePath("/adventures/3") → página refresca

Toggle misión:
  → MissionItem checkbox → Server Action toggleMission(id)
  → prisma.mission.findUnique({ id }) → lee completed actual
  → prisma.mission.update({ completed: !actual, completedAt: !actual ? new Date() : null })
  → revalidatePath("/adventures/3")

Editar misión:
  → MissionItem (modo edición inline) → Server Action updateMission(formData)
  → zod valida → prisma.mission.update()
  → revalidatePath("/adventures/3")

Eliminar misión:
  → MissionItem → Server Action deleteMission(formData)
  → prisma.mission.delete({ where: { id } })
  → revalidatePath("/adventures/3")
```

---

## Server Actions — `app/actions/missions.ts`

### Schemas de validación (zod)

```typescript
// Para crear y editar
MissionSchema = z.object({
  adventureId: z.coerce.number(),   // solo en createMission
  title: z.string().min(3),
  description: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(3),
})
```

### Firmas de las funciones

```typescript
createMission(prevState, formData: FormData): Promise<ActionState>
updateMission(formData: FormData): Promise<void>
toggleMission(formData: FormData): Promise<void>
deleteMission(formData: FormData): Promise<void>
```

`createMission` retorna `ActionState` (con `errors` y `message`) para mostrar errores de
validación inline. Las demás retornan `void` porque los errores de validación ahí son poco
probables (datos controlados por el propio formulario).

---

## Componentes de UI

### `app/adventures/[id]/page.tsx`

```
← Volver al Dashboard

[Título de la Aventura]           Estado: Activa
[Descripción]

──────────────────────────────────
Misiones (2/5 completadas)
──────────────────────────────────
[NewMissionForm]

Pendientes
  [MissionItem] [MissionItem] ...

Completadas
  [MissionItem] [MissionItem] ...   ← apariencia más tenue
```

### `MissionItem.tsx`

Estado normal:
```
☐  Aprender TypeScript            [Media]   [Editar] [Eliminar]
   Completar el curso de TS
```

Estado completado:
```
☑  ~~Aprender TypeScript~~         [Media]   Completada: 18 jun 2026
   ~~Completar el curso de TS~~
```

Estado edición inline:
```
[input: título          ] [selector: Fácil▼] [Guardar] [Cancelar]
[input: descripción     ]
```

### `NewMissionForm.tsx`

```
[input: Título de la misión (requerido)    ]
[input: Descripción (opcional)             ]
[selector: Dificultad ▼ Fácil/Media/Difícil]
[botón: Agregar misión]
```

---

## Manejo de errores

| Situación | Comportamiento |
|---|---|
| Aventura no encontrada | `notFound()` → página 404 de Next.js |
| Título de misión < 3 caracteres | Error inline debajo del campo |
| Dificultad inválida | Error inline (difícil que ocurra con selector) |
| `updateAdventure` con datos inválidos | Retorna errores (corrección de bug existente) |

---

## Deuda técnica conocida / Mejoras futuras

- `userId: 1` hardcodeado en todas las acciones → se reemplaza en Fase 5 con `session.user.id`
- `MissionStatusLog` (historial de cambios de estado) → Fase 13
- Cuestionario de onboarding para calibrar dificultad personalizada → Fase 13
- Lógica del recomendador con techo (anti-burnout) y piso (anti-procrastinación) → Fase 7
- Sprint de diseño visual completo (Tailwind con identidad visual para personas con burnout) → sesión dedicada post-Fase 4
- Confirmación antes de eliminar (`window.confirm` o modal) → mejora de UX futura

---

## Criterio de éxito de Fase 4

El usuario puede:
1. Ver la lista de Aventuras en el Dashboard con datos reales de PostgreSQL ✅ (ya funciona)
2. Crear, editar y eliminar Aventuras ✅ (ya funciona)
3. Navegar a la página de detalle de una Aventura
4. Ver las Misiones de esa Aventura separadas en Pendientes / Completadas
5. Crear una nueva Misión con título, descripción y dificultad
6. Marcar una Misión como completada / desmarcarla
7. Editar el título, descripción y dificultad de una Misión
8. Eliminar una Misión
