import os
import bcrypt
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Error connecting to Supabase: {e}")
    exit(1)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_admin():
    print("--- Create Initial Admin ---")
    username = input("Enter admin username: ")
    password = input("Enter admin password: ")
    
    hashed_password = hash_password(password)
    
    try:
        response = supabase.table('admins').insert({
            'username': username,
            'password': hashed_password
        }).execute()
        
        if response.data:
            print("Admin created successfully!")
        else:
            print("Failed to create admin.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_admin()
