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
