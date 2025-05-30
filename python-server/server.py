import os
import hashlib
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client
import uuid
from uuid import UUID

SUPABASE_URL = "https://pibltfngauqztjsfqzcv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpYmx0Zm5nYXVxenRqc2ZxemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODE0NjcsImV4cCI6MjA2Mzg1NzQ2N30.8Kug8-huMJnA0aB8x2oyrSl6B3Nv257PrHFtaHTC9-s"

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    response = supabase.table('users').select('*').execute()
    print("Connection successful!")
    print(f"Data: {response.data}")
except Exception as e:
    print(f"Error connecting to Supabase: {e}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials = True,
    allow_methods=['*'],
    allow_headers=['*'],
)


# This is a pydantic model (similar to dataclass)
# all models inherit from BaseModel

class UserRegistration(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username must be 3-50 characters")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class EmergencyReport(BaseModel):
    user_id: str | None = None  # Optional field for unauthenticated users
    user_name: str | None = None  # Optional field for username
    reporter_type: str
    security_availability: str
    crime_type: str
    evidence_url: str | None = None  # Optional field
    latitude: float
    longitude: float
    description: str

class NormalReport(BaseModel):
    user_id: str | None = None  # Optional field for unauthenticated users
    user_name: str | None = None
    time_of_incident: str
    address: str
    location_type: str
    reporter_type: str
    security_availability: str
    crime_type: str
    num_suspects: int | None = None
    suspect_description: str | None = None
    vehicle_info: str | None = None
    witness_info: str | None = None
    evidence_files: list[str] | None = None  # Optional field
    latitude: float
    longitude: float
    incident_description: str
    reported_to_police: bool
    medical_attention_required: bool
    reporter_name: str | None = None
    reporter_email: str | None = None
    reporter_phone: str | None = None

class PoliceDetails(BaseModel):
    report_id: uuid.UUID  # Changed from uuid to str
    police_station: str
    officer_name: str
    contact_number: str

def hash_password(password: str) -> str:
    # salt = os.urandom(32)
    # pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 10000)
    # return salt.hex() + pwdhash.hex()
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(stored_password: str, provided_password: str) -> bool:
    # salt = bytes.fromhex(stored_password[:64])  # First 64 chars are salt
    # stored_hash = stored_password[64:]  # Rest is the hash
    # pwdhash = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt, 100000)
    # return pwdhash.hex() == stored_hash
    hashed_input = hashlib.sha256(provided_password.encode()).hexdigest()
    return hashed_input == stored_password

@app.get("/")
async def root_route():
    return {"message": "Server running", "status": "ok"}

@app.post("/api/signup")
async def register_client(user_data: UserRegistration):
    try:
        print("Received signup data:", user_data.dict())  # Debugging

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
        print(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
@app.post("/api/signin")
async def login_user(user_data: UserRegistration):
    try:
        # Find user by username
        user_response = supabase.table('users').select('*').eq('username', user_data.username).execute()
        
        if not user_response.data:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        user = user_response.data[0]
        # Verify password (you'll need to implement this based on your hashing method)
        #                  user['password']
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
        print(f"Error during login: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/emergency-report")
async def create_emergency_report(report: EmergencyReport):
    try:
        # Debugging: Log the received payload
        print("Debugging: Received payload:", report.dict())  # Debugging

        # Insert report into the database
        response = supabase.table('crime_emergency_report').insert({
            'user_id': report.user_id,  # Can be NULL for unauthenticated users
            'user_name': report.user_name,  # Include username if provided
            'reporter_type': report.reporter_type,
            'security_availability': report.security_availability,
            'crime_type': report.crime_type,
            'evidence_url': report.evidence_url,
            'latitude': report.latitude,
            'longitude': report.longitude,
            'description': report.description,
        }).execute()

        # Debugging: Log the database response
        print("Debugging: Database response:", response.data)  # Debugging

        if response.data:
            return {
                "message": "Emergency report submitted successfully",
                "report_id": response.data[0].get('id'),
                "user_id": report.user_id,
                "user_name": report.user_name  # Include user_name in the response if available
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to submit emergency report")

    except HTTPException as http_error:
        raise http_error

    except Exception as e:
        print(f"Error submitting emergency report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/normal-report")
async def create_normal_report(report: NormalReport, auth_token: str = Header(None)):
    try:
        # Debugging: Log the received payload
        print("Debugging: Received payload:", report.dict())  # Debugging

        # Insert report into the database
        response = supabase.table('crime_report').insert({
            'user_id': report.user_id,  # Can be NULL for unauthenticated users
            'user_name': report.user_name,  # Include username if available
            'time_of_incident': report.time_of_incident,
            'address': report.address,
            'location_type': report.location_type,
            'reporter_type': report.reporter_type,
            'security_availability': report.security_availability,
            'crime_type': report.crime_type,
            'num_suspects': report.num_suspects,
            'suspect_description': report.suspect_description,
            'vehicle_info': report.vehicle_info,
            'witness_info': report.witness_info,
            'evidence_files': report.evidence_files,
            'latitude': report.latitude,
            'longitude': report.longitude,
            'incident_description': report.incident_description,
            'reported_to_police': report.reported_to_police,
            'medical_attention_required': report.medical_attention_required,
            'reporter_name': report.reporter_name,
            'reporter_email': report.reporter_email,
            'reporter_phone': report.reporter_phone,
        }).execute()

        print("Debugging: Database response:", response.data)
        
        if response.data:
            return {
                "message": "Report submitted successfully",
                "report_id": response.data[0].get('id'),
                "user_id": report.user_id,
                "user_name": report.user_name  # Include user_name in the response if available
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to submit report")

    except HTTPException as http_error:
        raise http_error

    except Exception as e:
        print(f"Error submitting report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/assign-police-details")
async def assign_police_details(details: PoliceDetails):
    try:
        print("Debugging: Received police details:", details.dict())  # Debugging

        response = supabase.table('police_details').insert({
            'id': details.report_id,  # Changed from 'report_id' to 'id'
            'police_station': details.police_station,
            'officer_name': details.officer_name,
            'contact_number': details.contact_number,
        }).execute()

        print("Debugging: Supabase insert response:", response.data)  # Debugging

        if response.data:
            return {
                "message": "Police details assigned successfully",
                "details_id": response.data[0].get('id'),
                "report_id": details.report_id
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to assign police details")

    except HTTPException as http_error:
        raise http_error

    except Exception as e:
        print(f"Error assigning police details: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/report/{report_id}/police-details")
async def get_police_details(report_id: uuid.UUID):
    try:
        print(f"Debugging: Received report_id: {report_id}")  # Debugging
        print(f"Debugging: Fetching police details for report_id: {report_id}")  # Debugging
        response = supabase.table('police_details').select('*').eq('report_id', report_id).execute()

        print(f"Debugging: Supabase fetch response: {response.data}")  # Debugging

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=404, detail="Police details not found for this report")

    except ValueError:
        print(f"Error: Invalid UUID format for report_id: {report_id}")
        raise HTTPException(status_code=400, detail="Invalid report_id format")

    except HTTPException as http_error:
        raise http_error

    except Exception as e:
        print(f"Error fetching police details: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")