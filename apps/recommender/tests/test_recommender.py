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
