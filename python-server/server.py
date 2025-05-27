import os
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client

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
            raise HTTPException(status_code=500, detail="Failed to register user")        # Re-raise HTTP exceptions
    
    except HTTPException:
        raise

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