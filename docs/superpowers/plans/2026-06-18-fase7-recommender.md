# Fase 7 — Recommendation Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un microservicio Python/FastAPI en `apps/recommender` que recibe el estado del usuario (energía, ánimo, estrés, sueño) y su lista de misiones pendientes, y devuelve qué misiones hacer hoy con un mensaje motivacional.

**Architecture:** La lógica de recomendación vive en `recommender.py` como funciones puras (sin dependencias externas), lo que las hace fáciles de testear con pytest. `models.py` define los tipos Pydantic (request y response). `main.py` solo conecta los modelos y la lógica al endpoint FastAPI. Este diseño separa responsabilidades: lógica de negocio vs. transporte HTTP.

**Tech Stack:** Python 3.11, FastAPI, Pydantic v2, pytest, httpx (para tests de endpoint).

## Global Constraints

- Python 3.11.9 instalado — usar `python` (no `python3`) en los comandos.
- Todo se ejecuta desde dentro de `apps/recommender/` con el venv activado.
- Activar venv en Bash: `source venv/Scripts/activate`; en PowerShell: `.\venv\Scripts\Activate.ps1`.
- Nombres de variables y funciones en inglés (snake_case, estándar Python); mensajes de la API en español.
- `venv/` NO se commitea — va en `.gitignore`.
- Reglas de negocio: energy ≤2 → solo dificultad 1; energy=3 → dificultad ≤2; energy ≥4 → todas las dificultades. stress ≥4 → máximo 2 misiones; stress ≤2 → máximo 5; stress=3 → máximo 3. Solo recomendar misiones con `completed: false`.

---

## File Map

| Acción | Archivo |
|---|---|
| Crear | `apps/recommender/.gitignore` |
| Crear | `apps/recommender/requirements.txt` |
| Crear | `apps/recommender/models.py` |
| Crear | `apps/recommender/recommender.py` |
| Modificar | `apps/recommender/main.py` |
| Crear | `apps/recommender/tests/__init__.py` |
| Crear | `apps/recommender/tests/test_recommender.py` |
| Crear | `apps/recommender/tests/test_api.py` |

---

## Task 1: Setup — venv, dependencias, .gitignore

**Files:**
- Create: `apps/recommender/.gitignore`
- Create: `apps/recommender/requirements.txt`

**Interfaces:**
- Produces: entorno Python aislado con FastAPI, pytest y httpx instalados
- Produces: comando `pytest tests/ -v` ejecutable desde `apps/recommender/`

- [ ] **Step 1: Crear el venv**

```bash
cd apps/recommender
python -m venv venv
```

Esperado: carpeta `venv/` creada dentro de `apps/recommender/`.

- [ ] **Step 2: Activar el venv e instalar dependencias**

```bash
source venv/Scripts/activate
pip install fastapi uvicorn pydantic pytest httpx
```

Esperado: instalación sin errores. El prompt del terminal mostrará `(venv)` al inicio.

- [ ] **Step 3: Generar `requirements.txt`**

```bash
pip freeze > requirements.txt
```

Esperado: archivo `requirements.txt` con las versiones exactas instaladas.

- [ ] **Step 4: Crear `apps/recommender/.gitignore`**

```
venv/
__pycache__/
*.pyc
.pytest_cache/
```

- [ ] **Step 5: Crear directorio de tests con `__init__.py` vacío**

```bash
mkdir -p tests && touch tests/__init__.py
```

- [ ] **Step 6: Verificar que pytest funciona**

```bash
pytest tests/ -v
```

Esperado: `no tests ran` (sin error, solo 0 tests encontrados).

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/recommender/.gitignore apps/recommender/requirements.txt apps/recommender/tests/__init__.py
git commit -m "feat: setup Python venv and dependencies for recommender service"
```

---

## Task 2: Modelos Pydantic + lógica de recomendación (TDD)

**Files:**
- Create: `apps/recommender/models.py`
- Create: `apps/recommender/recommender.py`
- Create: `apps/recommender/tests/test_recommender.py`

**Interfaces:**
- Produces: `MissionInput(id, title, difficulty, completed)`
- Produces: `RecommendationRequest(energy, mood, stress, sleep, missions)`
- Produces: `RecommendedMission(id, title, difficulty, reason)`
- Produces: `RecommendationResponse(recommendations, message)`
- Produces: `recommend(request: RecommendationRequest) -> RecommendationResponse`

- [ ] **Step 1: Crear `apps/recommender/models.py`**

```python
from pydantic import BaseModel, Field


class MissionInput(BaseModel):
    id: int
    title: str
    difficulty: int
    completed: bool


class RecommendationRequest(BaseModel):
    energy: int = Field(ge=1, le=5)
    mood: int = Field(ge=1, le=5)
    stress: int = Field(ge=1, le=5)
    sleep: int = Field(ge=1, le=5)
    missions: list[MissionInput]


class RecommendedMission(BaseModel):
    id: int
    title: str
    difficulty: int
    reason: str


class RecommendationResponse(BaseModel):
    recommendations: list[RecommendedMission]
    message: str
```

- [ ] **Step 2: Escribir los tests ANTES de la implementación**

Crear `apps/recommender/tests/test_recommender.py`:

```python
import pytest
from models import MissionInput, RecommendationRequest
from recommender import recommend


def make_missions(specs: list[tuple[int, bool]]) -> list[MissionInput]:
    return [
        MissionInput(id=i + 1, title=f"Mission {i + 1}", difficulty=d, completed=c)
        for i, (d, c) in enumerate(specs)
    ]


def make_request(energy: int, stress: int, missions: list[MissionInput]) -> RecommendationRequest:
    return RecommendationRequest(energy=energy, mood=3, stress=stress, sleep=3, missions=missions)


def test_low_energy_only_suggests_difficulty_1():
    missions = make_missions([(1, False), (2, False), (3, False)])
    result = recommend(make_request(energy=2, stress=3, missions=missions))
    assert all(r.difficulty == 1 for r in result.recommendations)


def test_medium_energy_allows_up_to_difficulty_2():
    missions = make_missions([(1, False), (2, False), (3, False)])
    result = recommend(make_request(energy=3, stress=3, missions=missions))
    assert all(r.difficulty <= 2 for r in result.recommendations)


def test_high_energy_allows_all_difficulties():
    missions = make_missions([(1, False), (2, False), (3, False)])
    result = recommend(make_request(energy=5, stress=2, missions=missions))
    difficulties = {r.difficulty for r in result.recommendations}
    assert 3 in difficulties


def test_high_stress_limits_to_2_recommendations():
    missions = make_missions([(1, False), (1, False), (1, False), (1, False)])
    result = recommend(make_request(energy=4, stress=4, missions=missions))
    assert len(result.recommendations) <= 2


def test_completed_missions_are_not_recommended():
    missions = make_missions([(1, True), (1, True), (2, False)])
    result = recommend(make_request(energy=5, stress=1, missions=missions))
    assert len(result.recommendations) == 1
    assert result.recommendations[0].id == 3


def test_no_missions_returns_empty_list():
    result = recommend(make_request(energy=3, stress=3, missions=[]))
    assert result.recommendations == []


def test_response_always_has_message():
    result = recommend(make_request(energy=1, stress=5, missions=[]))
    assert isinstance(result.message, str)
    assert len(result.message) > 0
```

- [ ] **Step 3: Correr los tests — deben FALLAR**

```bash
cd apps/recommender
source venv/Scripts/activate
pytest tests/test_recommender.py -v
```

Esperado: `ModuleNotFoundError: No module named 'recommender'` — correcto, aún no existe.

- [ ] **Step 4: Crear `apps/recommender/recommender.py`**

```python
from models import MissionInput, RecommendationRequest, RecommendedMission, RecommendationResponse


def _get_max_difficulty(energy: int) -> int:
    if energy <= 2:
        return 1
    elif energy == 3:
        return 2
    else:
        return 3


def _get_max_recommendations(stress: int) -> int:
    if stress >= 4:
        return 2
    elif stress <= 2:
        return 5
    else:
        return 3


def _get_reason(difficulty: int) -> str:
    if difficulty == 1:
        return "Perfecta para conservar energía"
    elif difficulty == 2:
        return "Un reto manejable para hoy"
    else:
        return "¡Tienes energía para este desafío!"


def _get_message(energy: int, stress: int) -> str:
    if stress >= 4:
        return "Con el estrés alto, menos es más. Dos misiones es suficiente para hoy."
    elif energy <= 2:
        return "Hoy es un día de cuidarte. Los pasos pequeños también cuentan."
    elif energy >= 4:
        return "¡Tienes energía! Es un buen momento para avanzar."
    else:
        return "Energía moderada — enfócate en lo esencial."


def recommend(request: RecommendationRequest) -> RecommendationResponse:
    pending = [m for m in request.missions if not m.completed]
    max_difficulty = _get_max_difficulty(request.energy)
    max_count = _get_max_recommendations(request.stress)

    eligible = [m for m in pending if m.difficulty <= max_difficulty]
    eligible.sort(key=lambda m: m.difficulty)

    selected = eligible[:max_count]

    recommendations = [
        RecommendedMission(
            id=m.id,
            title=m.title,
            difficulty=m.difficulty,
            reason=_get_reason(m.difficulty),
        )
        for m in selected
    ]

    return RecommendationResponse(
        recommendations=recommendations,
        message=_get_message(request.energy, request.stress),
    )
```

- [ ] **Step 5: Correr los tests — deben PASAR**

```bash
pytest tests/test_recommender.py -v
```

Esperado:
```
tests/test_recommender.py::test_low_energy_only_suggests_difficulty_1 PASSED
tests/test_recommender.py::test_medium_energy_allows_up_to_difficulty_2 PASSED
tests/test_recommender.py::test_high_energy_allows_all_difficulties PASSED
tests/test_recommender.py::test_high_stress_limits_to_2_recommendations PASSED
tests/test_recommender.py::test_completed_missions_are_not_recommended PASSED
tests/test_recommender.py::test_no_missions_returns_empty_list PASSED
tests/test_recommender.py::test_response_always_has_message PASSED

7 passed in 0.XXs
```

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/recommender/models.py apps/recommender/recommender.py apps/recommender/tests/test_recommender.py
git commit -m "feat: add Pydantic models and recommendation logic with pytest"
```

---

## Task 3: Endpoint FastAPI + tests de integración

**Files:**
- Modify: `apps/recommender/main.py`
- Create: `apps/recommender/tests/test_api.py`

**Interfaces:**
- Consumes: `recommend` de `recommender`
- Consumes: `RecommendationRequest`, `RecommendationResponse` de `models`
- Produces: `POST /recommendations` → `RecommendationResponse`
- Produces: `GET /` → `{"service": "recommender", "status": "ok"}`

- [ ] **Step 1: Escribir tests de integración ANTES de implementar el endpoint**

Crear `apps/recommender/tests/test_api.py`:

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_returns_ok():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_recommendations_endpoint_returns_200():
    response = client.post("/recommendations", json={
        "energy": 3,
        "mood": 3,
        "stress": 3,
        "sleep": 3,
        "missions": [
            {"id": 1, "title": "Misión de prueba", "difficulty": 1, "completed": False}
        ],
    })
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert "message" in data


def test_recommendations_endpoint_filters_completed():
    response = client.post("/recommendations", json={
        "energy": 5,
        "mood": 5,
        "stress": 1,
        "sleep": 5,
        "missions": [
            {"id": 1, "title": "Ya hecha", "difficulty": 1, "completed": True},
            {"id": 2, "title": "Pendiente", "difficulty": 2, "completed": False},
        ],
    })
    assert response.status_code == 200
    recs = response.json()["recommendations"]
    assert len(recs) == 1
    assert recs[0]["id"] == 2


def test_invalid_energy_returns_422():
    response = client.post("/recommendations", json={
        "energy": 10,
        "mood": 3,
        "stress": 3,
        "sleep": 3,
        "missions": [],
    })
    assert response.status_code == 422
```

- [ ] **Step 2: Correr tests — deben FALLAR**

```bash
cd apps/recommender
source venv/Scripts/activate
pytest tests/test_api.py -v
```

Esperado: `test_recommendations_endpoint_returns_200 FAILED` — el endpoint no existe aún.

- [ ] **Step 3: Actualizar `apps/recommender/main.py`**

```python
from fastapi import FastAPI
from models import RecommendationRequest, RecommendationResponse
from recommender import recommend

app = FastAPI()


@app.get("/")
def read_root():
    return {"service": "recommender", "status": "ok"}


@app.post("/recommendations", response_model=RecommendationResponse)
def get_recommendations(request: RecommendationRequest) -> RecommendationResponse:
    return recommend(request)
```

- [ ] **Step 4: Correr TODOS los tests — deben pasar**

```bash
pytest tests/ -v
```

Esperado:
```
tests/test_api.py::test_root_returns_ok PASSED
tests/test_api.py::test_recommendations_endpoint_returns_200 PASSED
tests/test_api.py::test_recommendations_endpoint_filters_completed PASSED
tests/test_api.py::test_invalid_energy_returns_422 PASSED
tests/test_recommender.py::test_low_energy_only_suggests_difficulty_1 PASSED
tests/test_recommender.py::test_medium_energy_allows_up_to_difficulty_2 PASSED
tests/test_recommender.py::test_high_energy_allows_all_difficulties PASSED
tests/test_recommender.py::test_high_stress_limits_to_2_recommendations PASSED
tests/test_recommender.py::test_completed_missions_are_not_recommended PASSED
tests/test_recommender.py::test_no_missions_returns_empty_list PASSED
tests/test_recommender.py::test_response_always_has_message PASSED

11 passed in 0.XXs
```

- [ ] **Step 5: Probar manualmente con uvicorn**

```bash
uvicorn main:app --reload --port 8000
```

Abrir `http://localhost:8000/docs` — FastAPI genera documentación interactiva automáticamente. Probar el endpoint `POST /recommendations` desde el navegador con estos valores:

```json
{
  "energy": 2,
  "mood": 2,
  "stress": 4,
  "sleep": 3,
  "missions": [
    {"id": 1, "title": "Meditar 5 minutos", "difficulty": 1, "completed": false},
    {"id": 2, "title": "Salir a caminar", "difficulty": 2, "completed": false},
    {"id": 3, "title": "Correr 5km", "difficulty": 3, "completed": false}
  ]
}
```

Esperado: solo recomienda la misión de dificultad 1 (energía baja), máximo 2 (estrés alto), con mensaje de cuidado.

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/recommender/main.py apps/recommender/tests/test_api.py
git commit -m "feat: add /recommendations endpoint to FastAPI service"
```

---

## Checklist de cierre de Fase 7

- [ ] `pytest tests/ -v` → 11 tests pasan
- [ ] `uvicorn main:app --reload` levanta sin errores
- [ ] `GET /` responde `{"service": "recommender", "status": "ok"}`
- [ ] `POST /recommendations` con energía baja → solo misiones dificultad 1
- [ ] `POST /recommendations` con estrés alto → máximo 2 misiones
- [ ] `POST /recommendations` con misiones completadas → no las incluye
- [ ] `POST /recommendations` con energía=10 → responde 422 (validación Pydantic)
- [ ] Documentación interactiva visible en `http://localhost:8000/docs`
- [ ] Actualizar ROADMAP.md marcando Fase 7 como completa
