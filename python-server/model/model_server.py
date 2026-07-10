import os
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from model import run_pipeline, analyze_direct_image
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="SafeWatch Vision API")

cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DirectImageRequest(BaseModel):
    image_url: str

@app.get("/api/crime_report/{report_id}/analysis")
def get_report_analysis(report_id: UUID, category: str = "Normal"):
    """
    Runs Florence-2 analysis on a specific report's evidence.
    Category should be 'Normal' or 'Emergency'.
    """
    analysis_result = run_pipeline(report_id=str(report_id), category=category)
    if "error" in analysis_result:
        raise HTTPException(status_code=404, detail=analysis_result["error"])
    return analysis_result

@app.post("/api/analyze-image")
def analyze_image_direct(request: DirectImageRequest):
    """
    Analyzes any image URL directly using Florence-2.
    """
    result = analyze_direct_image(request.image_url)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

if __name__ == "__main__":
    uvicorn.run("model_server:app", host="0.0.0.0", port=8080, reload=True)
