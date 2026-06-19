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
