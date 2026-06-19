from models import RecommendationRequest, RecommendedMission, RecommendationResponse


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
