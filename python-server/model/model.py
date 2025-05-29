from supabase import create_client
import requests
from PIL import Image
from io import BytesIO
import easyocr
from ultralytics import YOLO

# === Supabase Connection ===
SUPABASE_URL = "https://pibltfngauqztjsfqzcv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpYmx0Zm5nYXVxenRqc2ZxemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODE0NjcsImV4cCI6MjA2Mzg1NzQ2N30.8Kug8-huMJnA0aB8x2oyrSl6B3Nv257PrHFtaHTC9-s"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# === Fetch Report(s) ===
def fetch_crime_reports(user_id=None, report_id=None):
    query = supabase.table("crime_report").select("*")
    
    if user_id:
        query = query.eq("user_id", user_id)
    if report_id:
        query = query.eq("id", report_id)

    response = query.execute()
    return response.data

# === Fetch Image ===
def fetch_image_from_url(url):
    response = requests.get(url)
    return Image.open(BytesIO(response.content))

# === OCR & Image Recognition ===
ocr_reader = easyocr.Reader(['en'])
yolo_model = YOLO("yolov8n.pt")  # Replace with custom-trained model

def analyze_image(image):
    ocr_result = ocr_reader.readtext(image)
    yolo_result = yolo_model(image)
    return {
        "ocr": ocr_result,
        "detections": yolo_result[0].boxes.data.cpu().numpy()
    }

# format the extracted text into readable format
def extract_all_texts(raw_data):
    texts = [entry[1].strip() for entry in raw_data if len(entry) >= 2]
    return ", ".join(texts)


# === Main Pipeline ===
def run_pipeline(user_id=None, report_id=None):
    reports = fetch_crime_reports(user_id=user_id, report_id=report_id)
    
    if not reports:
        print("No reports found.")
        return

    for report in reports:
        image_url=None
        raw_url = report["evidence_files"]
        # if isinstance(image_url, list):
        #     image_url = raw_url[0]
        # else:
        #     image_url = raw_url
        print("🔗 Fetching image from:", raw_url[0])
        image = fetch_image_from_url(raw_url[0])
        result = analyze_image(image)

        print(f"✅ Analysis for report ID {report['id']}:")
        print("📖 OCR Text:", result["ocr"])
        print("🎯 Object Detections:", result["detections"])
        print("📍 Location:", (report.get("latitude"), report.get("longitude")))

        raw_data = result["ocr"]
        format_result = extract_all_texts(raw_data)
        print("📄 Final result: ", format_result)

# Example usages:
run_pipeline(user_id=6)
# run_pipeline(report_id=42)
