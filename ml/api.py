from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from predict import predict_match

### FastAPI app and request model
### py -m uvicorn api:app --reload to run the server
app = FastAPI()

class MatchRequest(BaseModel):
    homeTeam: str
    awayTeam: str
    b365H: float
    b365D: float
    b365A: float

@app.get('/health')
def health():
    return {'status': 'ok'}

@app.post('/predict')
def predict(request: MatchRequest):
    try:
        result = predict_match(request.homeTeam, request.awayTeam, request.b365H, request.b365D, request.b365A)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
