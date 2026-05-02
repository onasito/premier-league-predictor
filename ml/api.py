from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from predict import predict_match

app = FastAPI()

class MatchRequest(BaseModel):
    homeTeam: str
    awayTeam: str

@app.post('/predict')
def predict(request: MatchRequest):
    try:
        result = predict_match(request.homeTeam, request.awayTeam)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
