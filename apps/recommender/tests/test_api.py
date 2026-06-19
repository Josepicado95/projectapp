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
