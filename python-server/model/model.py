import os
import logging
import requests
from io import BytesIO
from PIL import Image
import torch
from transformers import AutoProcessor, AutoModelForCausalLM
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# === Supabase Connection ===
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
    logger.info("Connection to Supabase successful!")
except Exception as e:
    logger.error(f"Error connecting to Supabase in model pipeline: {e}")

# === Florence-2 Model Setup ===
# Using florence-2-base because the user has a 4GB GPU
MODEL_ID = "microsoft/Florence-2-base"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Loading Florence-2 model on {DEVICE}...")

TORCH_DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

try:
    processor = AutoProcessor.from_pretrained(MODEL_ID, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID, trust_remote_code=True, torch_dtype=TORCH_DTYPE
    ).to(DEVICE)
    model.eval()
    logger.info("Florence-2 loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load Florence-2: {e}")
    processor, model = None, None

def run_florence_task(task_prompt: str, image: Image.Image):
    if not model or not processor:
        return "Model not initialized"

    try:
        inputs = processor(text=task_prompt, images=image, return_tensors="pt").to(DEVICE, TORCH_DTYPE)

        with torch.no_grad():
            generated_ids = model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=1024,
                early_stopping=False,
                do_sample=False,
                num_beams=3,
            )

        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
        parsed_answer = processor.post_process_generation(
            generated_text,
            task=task_prompt,
            image_size=(image.width, image.height),
        )
        return parsed_answer[task_prompt]
    except Exception as e:
        logger.error(f"Error running Florence-2 task {task_prompt}: {e}")
        return str(e)

# === Fetch Image ===
def fetch_image_from_url(url: str) -> Image.Image:
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    # Convert to RGB as Florence expects RGB images
    return Image.open(BytesIO(response.content)).convert("RGB")

# === Main Pipeline ===
def run_pipeline(report_id=None, category="Normal"):
    """
    Fetches the report, extracts the first image, and runs Florence-2 analysis.
    category should be "Normal" or "Emergency".
    """
    if not report_id:
        return {"error": "report_id is required"}

    table = "crime_reports" if category == "Normal" else "emergency_reports"
    
    # Fetch report
    response = supabase.table(table).select("*").eq("id", report_id).execute()
    reports = response.data
    
    if not reports:
        return {"error": "Report not found"}

    report = reports[0]
    
    # Extract image URL
    image_url = None
    if category == "Normal" and report.get("evidence_files") and len(report["evidence_files"]) > 0:
        image_url = report["evidence_files"][0]
    elif category == "Emergency" and report.get("evidence_url"):
        image_url = report["evidence_url"]
        
    if not image_url:
        return {"error": "No visual evidence attached to this report"}

    try:
        logger.info(f"Fetching image for report {report_id}...")
        image = fetch_image_from_url(image_url)
        
        logger.info(f"Running Florence-2 analysis on report {report_id}...")
        
        # Run specific prompts
        caption = run_florence_task("<CAPTION>", image)
        detailed_caption = run_florence_task("<DETAILED_CAPTION>", image)
        ocr = run_florence_task("<OCR>", image)
        od = run_florence_task("<OD>", image) # Object Detection
        
        analysis_result = {
            "caption": caption,
            "detailed_analysis": detailed_caption,
            "ocr_text": ocr,
            "detected_objects": od,
        }
        
        # Save analysis back to the database
        logger.info("Saving analysis to database...")
        supabase.table(table).update({
            "ai_analysis": analysis_result
        }).eq("id", report_id).execute()
        
        return {
            "report_id": report_id,
            "analysis": analysis_result,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Pipeline error for report {report_id}: {e}")
        return {"error": str(e)}

def analyze_direct_image(image_url: str):
    """Utility to analyze a direct image URL without a database record"""
    try:
        image = fetch_image_from_url(image_url)
        caption = run_florence_task("<CAPTION>", image)
        detailed_caption = run_florence_task("<DETAILED_CAPTION>", image)
        ocr = run_florence_task("<OCR>", image)
        
        return {
            "caption": caption,
            "detailed_analysis": detailed_caption,
            "ocr_text": ocr,
            "status": "success"
        }
    except Exception as e:
        return {"error": str(e)}
