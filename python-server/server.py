import os
import logging
import bcrypt
from io import BytesIO
from uuid import uuid4
from fastapi import FastAPI, HTTPException, Header, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from supabase import create_client, Client
from typing import Optional, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
    logger.info("Connection to Supabase successful!")
except Exception as e:
    logger.error(f"Error connecting to Supabase: {e}")

app = FastAPI(title="SafeWatch API")

cors_origins = os.environ["CORS_ORIGINS"].split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


# --- Pydantic V2 Models ---

class UserRegistration(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username must be 3-50 characters")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    model_config = ConfigDict(from_attributes=True)

class AdminLogin(BaseModel):
    username: str
    password: str

class EmergencyReport(BaseModel):
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    reporter_type: str
    security_availability: str
    crime_type: str
    evidence_url: Optional[str] = None
    latitude: float
    longitude: float
    description: str

class NormalReport(BaseModel):
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    time_of_incident: str
    address: str
    location_type: str
    reporter_type: str
    security_availability: str
    crime_type: str
    num_suspects: Optional[int] = None
    suspect_description: Optional[str] = None
    vehicle_info: Optional[str] = None
    witness_info: Optional[str] = None
    evidence_files: Optional[List[str]] = None
    latitude: float
    longitude: float
    incident_description: str
    reported_to_police: bool
    medical_attention_required: bool
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None
    reporter_phone: Optional[str] = None

class PoliceDetails(BaseModel):
    report_id: str
    police_station: str
    officer_name: str
    contact_number: str

class Coordinate(BaseModel):
    latitude: float
    longitude: float


# --- Helper Functions ---

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(stored_password: str, provided_password: str) -> bool:
    try:
        # Fallback for old unhashed / poorly hashed passwords during migration
        if not stored_password.startswith('$2b$'):
            import hashlib
            legacy_hash = hashlib.sha256(provided_password.encode()).hexdigest()
            return legacy_hash == stored_password
        
        return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def build_public_storage_url(bucket: str, object_path: str) -> str:
    return f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{bucket}/{object_path}"


# --- Routes ---

@app.get("/")
async def root_route():
    return {"message": "SafeWatch API Server running", "status": "ok"}


@app.post("/api/admin-signin")
async def admin_signin(data: AdminLogin):
    expected_username = os.getenv("ADMIN_USERNAME", "admin")
    expected_password = os.getenv("ADMIN_PASSWORD", "admin123")
    
    if data.username == expected_username and data.password == expected_password:
        return {"message": "Admin access granted", "token": "admin-auth-active"}
    
    raise HTTPException(status_code=401, detail="Invalid administrator credentials")


@app.post("/api/signup")
async def register_client(user_data: UserRegistration):
    try:
        logger.info(f"Received signup data for: {user_data.username}")
        existing_user = supabase.table('users').select('username').eq('username', user_data.username).execute()
        
        if existing_user.data:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        hashed_password = hash_password(user_data.password)
        response = supabase.table('users').insert({
            'username': user_data.username,
            'password': hashed_password
        }).execute()
    
        if response.data:
            return {
                "message": "User registered successfully",
                "user_id": response.data[0].get('id'),
                "username": user_data.username
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to register user")
            
    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    

@app.post("/api/signin")
async def login_user(user_data: UserRegistration):
    try:
        user_response = supabase.table('users').select('*').eq('username', user_data.username).execute()
        
        if not user_response.data:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        user = user_response.data[0]
        if verify_password(user['password'], user_data.password):
            return {
                "message": "Login successful",
                "user_id": user.get('id'),
                "username": user['username']
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid username or password")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/emergency-report")
async def create_emergency_report(report: EmergencyReport):
    try:
        logger.info(f"Received emergency payload: {report.model_dump()}")
        
        insert_data = report.model_dump()
        # Ensure status is set by default
        insert_data['status'] = 'Pending'
        
        response = supabase.table('emergency_reports').insert(insert_data).execute()

        if response.data:
            return {
                "message": "Emergency report submitted successfully",
                "report_id": response.data[0].get('id'),
                "user_id": report.user_id,
                "user_name": report.user_name
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to submit emergency report")
            
    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error submitting emergency report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/upload-evidence")
async def upload_evidence(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files were provided")

    uploaded_paths: List[str] = []
    uploaded_files = []

    try:
        for file in files:
            if file.content_type and not file.content_type.startswith(("image/", "video/")):
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {file.content_type}",
                )

            content = await file.read()
            if not content:
                raise HTTPException(
                    status_code=400,
                    detail=f"Uploaded file is empty: {file.filename or 'unknown'}",
                )

            safe_name = os.path.basename(file.filename or "evidence").replace(" ", "_")
            object_path = f"{uuid4().hex}_{safe_name}"

            supabase.storage.from_("evidence").upload(
                object_path,
                content,
                file_options={"content-type": file.content_type or "application/octet-stream"},
            )

            uploaded_paths.append(object_path)
            uploaded_files.append(
                {
                    "name": file.filename,
                    "path": object_path,
                    "url": build_public_storage_url("evidence", object_path),
                }
            )

        return {"message": "Evidence uploaded successfully", "files": uploaded_files}
    except HTTPException:
        if uploaded_paths:
            try:
                supabase.storage.from_("evidence").remove(uploaded_paths)
            except Exception as cleanup_error:
                logger.warning(f"Evidence cleanup failed: {cleanup_error}")
        raise
    except Exception as e:
        logger.error(f"Error uploading evidence: {e}")
        if uploaded_paths:
            try:
                supabase.storage.from_("evidence").remove(uploaded_paths)
            except Exception as cleanup_error:
                logger.warning(f"Evidence cleanup failed: {cleanup_error}")
        raise HTTPException(status_code=500, detail="Failed to upload evidence")


@app.post("/api/normal-report")
async def create_normal_report(report: NormalReport, auth_token: str = Header(None)):
    try:
        logger.info(f"Received normal payload: {report.model_dump()}")
        
        insert_data = report.model_dump()
        insert_data['status'] = 'Pending'
        
        response = supabase.table('crime_reports').insert(insert_data).execute()

        if response.data:
            return {
                "message": "Report submitted successfully",
                "report_id": response.data[0].get('id'),
                "user_id": report.user_id,
                "user_name": report.user_name
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to submit report")

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error submitting report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/heatmap/coordinates", response_model=List[Coordinate])
async def get_heatmap_coordinates():
    try:
        # Fetch from both normal and emergency tables for heatmap
        normal_res = supabase.table('crime_reports').select('latitude, longitude').execute()
        emergency_res = supabase.table('emergency_reports').select('latitude, longitude').execute()
        
        all_data = []
        if normal_res.data:
            all_data.extend(normal_res.data)
        if emergency_res.data:
            all_data.extend(emergency_res.data)
            
        return [
            {"latitude": row["latitude"], "longitude": row["longitude"]}
            for row in all_data if row.get("latitude") is not None and row.get("longitude") is not None
        ]
    except Exception as e:
        logger.error(f"Error fetching heatmap coords: {e}")
        raise HTTPException(status_code=500, detail=str(e))