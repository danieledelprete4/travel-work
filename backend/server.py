from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt
import os
import uuid
import io
import csv
from dotenv import load_dotenv

# Import Google Sheets database functions
import db_sheets as db

load_dotenv()

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="Work Travel Manager API - Google Sheets Edition")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: Optional[str] = None
    role: str = "user"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    blocked: Optional[bool] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class CityCreate(BaseModel):
    name: str
    travel_minutes: int = 0

class RoleCreate(BaseModel):
    name: str
    permissions: List[str] = []

class WorkdayCreate(BaseModel):
    date: str
    city: Optional[str] = None
    is_custom_city: Optional[bool] = False
    custom_city_name: Optional[str] = None
    custom_distance_km: Optional[float] = None
    custom_travel_minutes: Optional[int] = None
    travel_minutes_outbound: int = 0
    travel_minutes_return: int = 0
    work_minutes: int = 0
    actual_arrival_at_store: Optional[str] = None
    actual_exit_from_store: Optional[str] = None
    actual_return_home: Optional[str] = None
    status: Optional[str] = None

# Auth helpers
def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = db.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] not in ["super_admin", "admin", "hr"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Routes
@app.get("/api/")
async def root():
    return {"message": "Work Travel Manager API - Google Sheets Backend", "status": "running"}

@app.post("/api/auth/login")
async def login(data: LoginRequest):
    # Check if it's admin login (username) or user login (email)
    if "@" in data.username:
        user = db.get_user_by_email(data.username)
    else:
        # Admin login with username
        user = db.get_user_by_username(data.username)
    
    if not user:
        raise HTTPException(status_code=400, detail="Credenziali non valide")
    
    # Verify password
    if not pwd_context.verify(data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Credenziali non valide")
    
    if user.get("blocked", False):
        raise HTTPException(status_code=403, detail="Account bloccato")
    
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user.get("username"),
            "email": user.get("email"),
            "role": user["role"],
            "created_at": user.get("created_at")
        },
        "role": user["role"]
    }

@app.get("/api/users")
async def get_users(user: dict = Depends(require_admin)):
    users = db.get_all_users()
    # Remove password_hash from response
    for u in users:
        u.pop("password_hash", None)
    return users

@app.post("/api/users")
async def create_user(data: UserCreate, user: dict = Depends(require_admin)):
    # Check if user exists
    existing = db.get_user_by_email(data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email già esistente")
    
    user_id = str(uuid.uuid4())
    password_hash = pwd_context.hash(data.password) if data.password else pwd_context.hash("amma1234")
    
    new_user = {
        "id": user_id,
        "username": "",  # Sales users don't have username
        "email": data.email,
        "name": data.name,
        "password_hash": password_hash,
        "role": data.role,
        "blocked": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.create_user(new_user)
    new_user.pop("password_hash")
    return new_user

@app.patch("/api/users/{user_id}")
async def update_user(user_id: str, data: UserUpdate, user: dict = Depends(require_admin)):
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    success = db.update_user(user_id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = db.get_user_by_id(user_id)
    updated_user.pop("password_hash", None)
    return updated_user

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_admin)):
    success = db.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

@app.get("/api/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    user.pop("password_hash", None)
    return user

@app.patch("/api/profile")
async def update_profile(data: dict, user: dict = Depends(get_current_user)):
    # Allow users to update their own email and name
    allowed_fields = ["email", "name"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if "email" in update_data:
        # Check if email already exists
        existing = db.get_user_by_email(update_data["email"])
        if existing and existing["id"] != user["id"]:
            raise HTTPException(status_code=400, detail="Email già in uso")
    
    if update_data:
        db.update_user(user["id"], update_data)
    
    updated_user = db.get_user_by_id(user["id"])
    updated_user.pop("password_hash", None)
    return updated_user

@app.get("/api/cities")
async def get_cities(user: dict = Depends(get_current_user)):
    cities = db.get_all_cities()
    return cities

@app.post("/api/cities")
async def create_city(data: CityCreate, user: dict = Depends(get_current_user)):
    # Allow sales and admin roles to create cities
    if user["role"] not in ["super_admin", "admin", "hr", "user"]:
        raise HTTPException(status_code=403, detail="Non hai i permessi per aggiungere città")
    
    city_id = str(uuid.uuid4())
    new_city = {
        "id": city_id,
        "name": data.name,
        "travel_minutes": data.travel_minutes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.create_city(new_city)
    return new_city

@app.patch("/api/cities/{city_id}")
async def update_city(city_id: str, data: CityCreate, user: dict = Depends(get_current_user)):
    # Allow sales and admin to update
    if user["role"] not in ["super_admin", "admin", "hr", "user"]:
        raise HTTPException(status_code=403, detail="Non hai i permessi per modificare città")
    
    success = db.update_city(city_id, data.dict())
    if not success:
        raise HTTPException(status_code=404, detail="City not found")
    
    updated_city = db.get_city_by_id(city_id)
    return updated_city

@app.delete("/api/cities/{city_id}")
async def delete_city(city_id: str, user: dict = Depends(require_admin)):
    success = db.delete_city(city_id)
    if not success:
        raise HTTPException(status_code=404, detail="City not found")
    return {"message": "City deleted"}

@app.get("/api/roles")
async def get_roles(user: dict = Depends(get_current_user)):
    roles = db.get_all_roles()
    # Add default roles if none exist
    if not roles:
        default_roles = [
            {"id": "1", "name": "super_admin", "permissions": ["all"], "custom": False},
            {"id": "2", "name": "admin", "permissions": ["manage_users", "manage_cities"], "custom": False},
            {"id": "3", "name": "hr", "permissions": ["view_users", "manage_cities"], "custom": False},
            {"id": "4", "name": "user", "permissions": ["view_own_data"], "custom": False}
        ]
        return default_roles
    return roles

@app.post("/api/roles")
async def create_role(data: RoleCreate, user: dict = Depends(require_admin)):
    if user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Solo Super Admin può creare ruoli personalizzati")
    
    role_id = str(uuid.uuid4())
    new_role = {
        "id": role_id,
        "name": data.name,
        "permissions": data.permissions,
        "custom": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.create_role(new_role)
    return new_role

@app.get("/api/workdays")
async def get_workdays(user: dict = Depends(get_current_user), month: Optional[str] = None, year: Optional[str] = None):
    # Users see only their own workdays
    if user["role"] in ["super_admin", "admin", "hr"]:
        workdays = db.get_all_workdays()
    else:
        workdays = db.get_all_workdays(user["id"])
    
    # Filter by month/year if provided
    if month and year:
        filtered = []
        for wd in workdays:
            date_str = wd.get('date', '')
            if date_str:
                # Date format: YYYY-MM-DD or DD/MM/YYYY
                if '-' in date_str:
                    year_wd, month_wd, _ = date_str.split('-')
                elif '/' in date_str:
                    day, month_wd, year_wd = date_str.split('/')
                else:
                    continue
                
                if str(month_wd).lstrip('0') == str(month).lstrip('0') and str(year_wd) == str(year):
                    filtered.append(wd)
        workdays = filtered
    
    return workdays

@app.post("/api/workdays")
async def create_workday(data: WorkdayCreate, user: dict = Depends(get_current_user)):
    """Create new workday"""
    workday_id = str(uuid.uuid4())
    
    # Convert date DD/MM/YYYY -> YYYY-MM-DD for consistency
    date_str = data.date
    if '/' in date_str:
        day, month, year = date_str.split('/')
        date_iso = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    else:
        date_iso = date_str
    
    # Check if workday already exists for this date
    existing = db.get_workday_by_date(user["id"], date_iso)
    if existing:
        # Update instead of create
        update_data = {
            "city": data.city,
            "is_custom_city": data.is_custom_city,
            "custom_city_name": data.custom_city_name,
            "custom_distance_km": data.custom_distance_km,
            "custom_travel_minutes": data.custom_travel_minutes,
            "actual_arrival_at_store": data.actual_arrival_at_store,
            "actual_exit_from_store": data.actual_exit_from_store,
            "actual_return_home": data.actual_return_home,
            "status": data.status
        }
        db.update_workday(user["id"], date_iso, update_data)
        return db.get_workday_by_date(user["id"], date_iso)
    
    workday_data = {
        "id": workday_id,
        "user_id": user["id"],
        "date": date_iso,
        "city": data.city,
        "is_custom_city": data.is_custom_city,
        "custom_city_name": data.custom_city_name,
        "custom_distance_km": data.custom_distance_km,
        "custom_travel_minutes": data.custom_travel_minutes,
        "travel_minutes_outbound": data.travel_minutes_outbound,
        "travel_minutes_return": data.travel_minutes_return,
        "work_minutes": data.work_minutes,
        "arrival_time": "",
        "departure_home": "",
        "exit_time": "",
        "return_home": "",
        "actual_arrival_at_store": data.actual_arrival_at_store,
        "actual_exit_from_store": data.actual_exit_from_store,
        "actual_return_home": data.actual_return_home,
        "status": data.status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.create_workday(workday_data)
    return workday_data

@app.put("/api/workdays/{date}")
async def update_workday(date: str, data: WorkdayCreate, user: dict = Depends(get_current_user)):
    """Update existing workday"""
    # Convert date format if needed
    date_str = date
    if '/' in date_str:
        day, month, year = date_str.split('/')
        date_iso = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    else:
        date_iso = date_str
    
    update_data = {
        "city": data.city,
        "is_custom_city": data.is_custom_city,
        "custom_city_name": data.custom_city_name,
        "custom_distance_km": data.custom_distance_km,
        "custom_travel_minutes": data.custom_travel_minutes,
        "actual_arrival_at_store": data.actual_arrival_at_store,
        "actual_exit_from_store": data.actual_exit_from_store,
        "actual_return_home": data.actual_return_home,
        "status": data.status
    }
    
    success = db.update_workday(user["id"], date_iso, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Workday not found")
    
    return db.get_workday_by_date(user["id"], date_iso)

@app.delete("/api/workdays")
async def delete_workday(date: str, user: dict = Depends(get_current_user)):
    """Delete workday by date (query param)"""
    # Convert date format if needed
    date_str = date
    if '/' in date_str:
        day, month, year = date_str.split('/')
        date_iso = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    else:
        date_iso = date_str
    
    success = db.delete_workday(user["id"], date_iso)
    if not success:
        raise HTTPException(status_code=404, detail="Workday not found")
    
    return {"message": "Workday deleted"}

@app.post("/api/workdays/import-csv")
async def import_csv(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Import workdays from CSV file (optimized batch)"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File deve essere CSV")
    
    content = await file.read()
    # Remove BOM if present
    text = content.decode('utf-8-sig')
    
    # Detect delimiter
    delimiter = ';' if ';' in text.split('\n')[0] else ','
    
    # Parse CSV
    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    
    rows_read = 0
    workdays_to_create = []
    errors = []
    
    # Get existing workdays once
    existing_workdays = db.get_all_workdays(user["id"])
    existing_dates = {wd.get('date') for wd in existing_workdays}
    
    for row in reader:
        rows_read += 1
        try:
            # Clean and validate row
            date_str = row.get('Giorno', '').strip()
            city = row.get('Città', '').strip()
            
            if not date_str:
                continue
            
            # Parse date (format: DD/MM/YYYY)
            day, month, year = date_str.split('/')
            date_iso = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            
            # Skip if already exists
            if date_iso in existing_dates:
                continue
            
            # Skip special status days without times
            status = row.get('Stato Giornata', '').strip()
            
            # Check for special statuses in city field
            if city and any(keyword in city for keyword in ['Riposo', 'Festivo', 'Compleanno', 'Riunione', 'Ferie', 'Malattia']):
                status = city
                city = ''
            
            workday_data = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "date": date_iso,
                "city": city,
                "is_custom_city": False,
                "custom_city_name": "",
                "custom_distance_km": "",
                "custom_travel_minutes": "",
                "travel_minutes_outbound": int(row.get('Minuti andata', 0) or 0),
                "travel_minutes_return": int(row.get('Minuti ritorno', 0) or 0),
                "work_minutes": int(row.get('Minuti lavoro in VIS', 0) or 0),
                "arrival_time": row.get('Arrivo VIS', '').strip(),
                "departure_home": row.get('Partenza da casa', '').strip(),
                "exit_time": row.get('Uscita VIS', '').strip(),
                "return_home": row.get('Rientro a casa', '').strip(),
                "actual_arrival_at_store": "",
                "actual_exit_from_store": "",
                "actual_return_home": "",
                "status": status,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            workdays_to_create.append(workday_data)
            
        except Exception as e:
            errors.append(f"Riga {rows_read}: {str(e)}")
    
    # Batch insert (single API call)
    rows_saved = 0
    if workdays_to_create:
        try:
            db.create_workdays_batch(workdays_to_create)
            rows_saved = len(workdays_to_create)
        except Exception as e:
            errors.append(f"Errore batch insert: {str(e)}")
    
    return {
        "message": "Import completato",
        "rows_read": rows_read,
        "rows_saved": rows_saved,
        "errors": errors[:10]  # Limit to first 10 errors
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
