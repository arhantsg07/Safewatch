from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from model import run_pipeline
from uuid import UUID

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/crime_report/{report_id}/ocr_text")
def get_ocr_text(report_id: UUID):
    analysis_result = run_pipeline(report_id=str(report_id))
    if "error" in analysis_result:
        raise HTTPException(status_code=404, detail=analysis_result["error"])
    return analysis_result
