from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, time, timedelta
import csv
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import cm


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    google_id: str
    role: str = "user"  # "user" (support sales) o "hr" (risorse umane)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Location(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    city_name: str
    distance_km: float  # Distanza da Verona in KM
    travel_time_minutes: int  # Tempo di viaggio in minuti (senza traffico)
    address: str = ""
    default_arrival_time: str = "10:00"  # Orario arrivo standard (HH:MM)


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fuel_price_per_liter: float  # Prezzo benzina €/litro
    car_consumption_per_100km: float  # Consumo L/100km
    monthly_allowance: float = 250.0  # Rimborso mensile forfettario
    car_model: str = "Hyundai IONIQ 1.6 Hybrid 2017"  # Modello auto
    extra_tolerance_minutes: int = 15  # Tolleranza extra in minuti (0-60)
    google_maps_api_key: Optional[str] = None  # API key Google Maps (opzionale)
    google_oauth_client_id: Optional[str] = None  # Google OAuth Client ID per login


class WorkDay(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None  # ID dell'utente (per multi-utente)
    date: str  # Formato DD/MM/YYYY
    city: Optional[str] = None  # Nome città o None per riposo
    status: Optional[str] = None  # "Riposo", "Festivo", "Compleanno", "Riunione", etc.
    
    # Minuti
    travel_minutes_outbound: int = 0  # Minuti andata
    travel_minutes_return: int = 0  # Minuti ritorno
    paid_travel_minutes: int = 0  # Minuti viaggio pagati (esclusi primi 30+30)
    work_minutes_at_store: int = 0  # Minuti lavoro effettivo in negozio
    presence_minutes_with_break: int = 0  # Minuti presenza totale (con pausa)
    
    # Orari teorici (calcolati)
    departure_from_home: Optional[str] = None  # HH:MM
    arrival_at_store: Optional[str] = None  # HH:MM
    exit_from_store: Optional[str] = None  # HH:MM
    return_home: Optional[str] = None  # HH:MM
    
    # Timbrature reali (inserite manualmente)
    actual_arrival_at_store: Optional[str] = None  # HH:MM
    actual_exit_from_store: Optional[str] = None  # HH:MM
    actual_return_home: Optional[str] = None  # HH:MM
    
    # KM e costi
    total_km: float = 0.0
    fuel_liters: float = 0.0
    fuel_cost: float = 0.0


class WorkDayCreate(BaseModel):
    date: str  # DD/MM/YYYY
    city: Optional[str] = None
    status: Optional[str] = None
    actual_arrival_at_store: Optional[str] = None
    actual_exit_from_store: Optional[str] = None
    actual_return_home: Optional[str] = None


class MonthlyStats(BaseModel):
    month: str  # MM/YYYY
    total_km: float
    total_fuel_liters: float
    total_fuel_cost: float
    km_allowance: float  # Rimborso usura KM mensile
    work_days: int
    rest_days: int
    total_time_at_store_minutes: int  # Tempo totale in negozio VIS (minuti)
    total_travel_time_minutes: int  # Tempo totale in auto (minuti)


# ==================== HELPER FUNCTIONS ====================

def calculate_work_day(city_name: str, date_str: str, locations: list, settings: Settings) -> WorkDay:
    """
    Calcola automaticamente tutti gli orari e i costi per una giornata lavorativa
    
    Logica:
    - Giornata totale: 9 ore (8 lavoro + 1 pausa)
    - Tolleranza viaggio: primi 30 min andata + 30 min ritorno NON pagati
    - Viaggio pagato: (tempo_andata - 30) + (tempo_ritorno - 30)
    - Tempo in negozio: 9h - viaggio_pagato + tolleranza_extra (default 15 min)
    - Arrivo negozio: orario personalizzato per città (default 10:00)
    """
    
    # Trova la location
    location = next((loc for loc in locations if loc['city_name'] == city_name), None)
    if not location:
        raise HTTPException(status_code=404, detail=f"Città {city_name} non trovata")
    
    travel_time = location['travel_time_minutes']
    distance_km = location['distance_km']
    
    # Ottieni orario arrivo personalizzato (default 10:00)
    arrival_time_str = location.get('default_arrival_time', '10:00')
    hour, minute = map(int, arrival_time_str.split(':'))
    arrival_time = time(hour, minute)
    
    # Calcolo minuti viaggio pagati
    outbound_paid = max(0, travel_time - 30)
    return_paid = max(0, travel_time - 30)
    total_paid_travel = outbound_paid + return_paid
    
    # Tempo in negozio: 9h (540 min) - viaggio pagato + tolleranza extra
    presence_minutes = (540 - total_paid_travel) + settings.extra_tolerance_minutes
    work_minutes = presence_minutes - 60  # Sottrai 1h pausa
    
    # Calcolo orari
    # Partenza da casa
    departure_dt = datetime.combine(datetime.today(), arrival_time) - timedelta(minutes=travel_time)
    departure_time = departure_dt.time()
    
    # Uscita dal negozio
    exit_dt = datetime.combine(datetime.today(), arrival_time) + timedelta(minutes=presence_minutes)
    exit_time = exit_dt.time()
    
    # Rientro a casa
    return_dt = exit_dt + timedelta(minutes=travel_time)
    return_time = return_dt.time()
    
    # Calcolo KM e costi
    total_km = distance_km * 2  # Andata e ritorno
    fuel_liters = (total_km / 100) * settings.car_consumption_per_100km
    fuel_cost = fuel_liters * settings.fuel_price_per_liter
    
    return WorkDay(
        date=date_str,
        city=city_name,
        status=None,
        travel_minutes_outbound=travel_time,
        travel_minutes_return=travel_time,
        paid_travel_minutes=total_paid_travel,
        work_minutes_at_store=work_minutes,
        presence_minutes_with_break=presence_minutes,
        departure_from_home=departure_time.strftime("%H:%M"),
        arrival_at_store=arrival_time.strftime("%H:%M"),
        exit_from_store=exit_time.strftime("%H:%M"),
        return_home=return_time.strftime("%H:%M"),
        total_km=round(total_km, 1),
        fuel_liters=round(fuel_liters, 2),
        fuel_cost=round(fuel_cost, 2)
    )


def calculate_rest_day(date_str: str, status: str) -> WorkDay:
    """Crea una giornata di riposo/festivo"""
    return WorkDay(
        date=date_str,
        city=None,
        status=status
    )


# ==================== API ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "Work Travel Manager API"}


# ========== USERS & AUTH ==========

@api_router.get("/users", response_model=List[User])
async def get_users():
    """Ottieni tutti gli utenti (per HR)"""
    users = await db.users.find({}, {"_id": 0}).to_list(100)
    return [User(**user) for user in users]


@api_router.post("/users", response_model=User)
async def create_user(user: User):
    """Crea un nuovo utente"""
    # Verifica se esiste già
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Utente già esistente")
    
    doc = user.model_dump()
    await db.users.insert_one(doc)
    return user


@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Ottieni un utente specifico"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    return User(**user)


@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str):
    """Aggiorna il ruolo di un utente"""
    if role not in ["user", "hr"]:
        raise HTTPException(status_code=400, detail="Ruolo non valido. Usa 'user' o 'hr'")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    return {"message": f"Ruolo aggiornato a {role}"}


# ========== LOCATIONS ==========

@api_router.get("/locations", response_model=List[Location])
async def get_locations():
    """Ottieni tutte le locations"""
    locations = await db.locations.find({}, {"_id": 0}).to_list(100)
    return locations


@api_router.post("/locations", response_model=Location)
async def create_location(location: Location):
    """Crea una nuova location"""
    # Verifica se esiste già
    existing = await db.locations.find_one({"city_name": location.city_name})
    if existing:
        raise HTTPException(status_code=400, detail="Città già esistente")
    
    doc = location.model_dump()
    await db.locations.insert_one(doc)
    return location


@api_router.put("/locations/{city_name}", response_model=Location)
async def update_location(city_name: str, location: Location):
    """Aggiorna una location esistente"""
    doc = location.model_dump()
    result = await db.locations.replace_one({"city_name": city_name}, doc)
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Città non trovata")
    
    return location


@api_router.delete("/locations/{city_name}")
async def delete_location(city_name: str):
    """Elimina una location"""
    # Verifica che non ci siano workdays associati
    workdays_count = await db.workdays.count_documents({"city": city_name})
    if workdays_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Impossibile eliminare: esistono {workdays_count} giornate associate a questa città"
        )
    
    result = await db.locations.delete_one({"city_name": city_name})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Città non trovata")
    
    return {"message": "Città eliminata con successo"}


@api_router.post("/locations/initialize")
async def initialize_locations():
    """Inizializza le 5 locations MediaWorld"""
    
    # Verifica se già esistono
    count = await db.locations.count_documents({})
    if count > 0:
        return {"message": "Locations già inizializzate", "count": count}
    
    locations = [
        {
            "id": str(uuid.uuid4()),
            "city_name": "Verona",
            "distance_km": 0,
            "travel_time_minutes": 0,
            "address": "Via Mantovana 129, 37137 Verona"
        },
        {
            "id": str(uuid.uuid4()),
            "city_name": "Modena",
            "distance_km": 103,
            "travel_time_minutes": 70,
            "address": "MediaWorld Modena - Grandemilia"
        },
        {
            "id": str(uuid.uuid4()),
            "city_name": "Reggio Emilia",
            "distance_km": 95,
            "travel_time_minutes": 80,
            "address": "MediaWorld Reggio Emilia"
        },
        {
            "id": str(uuid.uuid4()),
            "city_name": "Parma",
            "distance_km": 125,
            "travel_time_minutes": 90,
            "address": "MediaWorld Parma"
        },
        {
            "id": str(uuid.uuid4()),
            "city_name": "Mantova",
            "distance_km": 55,
            "travel_time_minutes": 45,
            "address": "MediaWorld Mantova"
        },
        {
            "id": str(uuid.uuid4()),
            "city_name": "Brescia",
            "distance_km": 78,
            "travel_time_minutes": 55,
            "address": "MediaWorld Brescia"
        }
    ]
    
    await db.locations.insert_many(locations)
    return {"message": "Locations inizializzate con successo", "count": len(locations)}


# ========== SETTINGS ==========

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    """Ottieni le impostazioni"""
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        # Crea settings di default
        default_settings = Settings(
            fuel_price_per_liter=1.75,
            car_consumption_per_100km=4.5,
            monthly_allowance=250.0,
            car_model="Hyundai IONIQ 1.6 Hybrid 2017",
            extra_tolerance_minutes=15,
            google_maps_api_key=None,
            google_oauth_client_id=None
        )
        await db.settings.insert_one(default_settings.model_dump())
        return default_settings
    return Settings(**settings)


@api_router.put("/settings", response_model=Settings)
async def update_settings(settings: Settings):
    """Aggiorna le impostazioni"""
    await db.settings.delete_many({})
    await db.settings.insert_one(settings.model_dump())
    return settings


# ========== WORKDAYS ==========

@api_router.post("/workdays", response_model=WorkDay)
async def create_workday(input: WorkDayCreate):
    """Crea una nuova giornata lavorativa"""
    
    # Verifica se esiste già
    existing = await db.workdays.find_one({"date": input.date})
    if existing:
        raise HTTPException(status_code=400, detail="Giornata già esistente")
    
    if input.status:
        # Giorno di riposo/festivo
        workday = calculate_rest_day(input.date, input.status)
    elif input.city:
        # Giorno lavorativo
        locations = await db.locations.find({}, {"_id": 0}).to_list(100)
        settings = await get_settings()
        workday = calculate_work_day(input.city, input.date, locations, settings)
        
        # Aggiungi timbrature reali se fornite
        if input.actual_arrival_at_store:
            workday.actual_arrival_at_store = input.actual_arrival_at_store
        if input.actual_exit_from_store:
            workday.actual_exit_from_store = input.actual_exit_from_store
        if input.actual_return_home:
            workday.actual_return_home = input.actual_return_home
    else:
        raise HTTPException(status_code=400, detail="Specifica città o status")
    
    doc = workday.model_dump()
    await db.workdays.insert_one(doc)
    return workday


@api_router.get("/workdays", response_model=List[WorkDay])
async def get_workdays(month: Optional[str] = None, year: Optional[str] = None):
    """Ottieni tutte le giornate (opzionalmente filtrate per mese/anno)"""
    query = {}
    
    if month and year:
        # Filtra per mese (formato date: DD/MM/YYYY)
        # Trova tutte le date che terminano con /MM/YYYY
        month_year_suffix = f"/{month.zfill(2)}/{year}"
        workdays = await db.workdays.find({}, {"_id": 0}).to_list(1000)
        filtered = [wd for wd in workdays if wd['date'].endswith(month_year_suffix)]
        # Ordina per data (giorno del mese)
        filtered.sort(key=lambda x: int(x['date'].split('/')[0]))
        return [WorkDay(**wd) for wd in filtered]
    
    workdays = await db.workdays.find({}, {"_id": 0}).to_list(1000)
    # Ordina per data completa
    workdays.sort(key=lambda x: datetime.strptime(x['date'], "%d/%m/%Y"))
    return [WorkDay(**wd) for wd in workdays]


@api_router.get("/workdays/{date}", response_model=WorkDay)
async def get_workday(date: str):
    """Ottieni una giornata specifica"""
    workday = await db.workdays.find_one({"date": date}, {"_id": 0})
    if not workday:
        raise HTTPException(status_code=404, detail="Giornata non trovata")
    return WorkDay(**workday)


@api_router.put("/workdays/{date}", response_model=WorkDay)
async def update_workday(date: str, input: WorkDayCreate):
    """Aggiorna una giornata esistente"""
    
    if input.status:
        workday = calculate_rest_day(input.date, input.status)
    elif input.city:
        locations = await db.locations.find({}, {"_id": 0}).to_list(100)
        settings = await get_settings()
        workday = calculate_work_day(input.city, input.date, locations, settings)
        
        # Aggiungi timbrature reali se fornite
        if input.actual_arrival_at_store:
            workday.actual_arrival_at_store = input.actual_arrival_at_store
        if input.actual_exit_from_store:
            workday.actual_exit_from_store = input.actual_exit_from_store
        if input.actual_return_home:
            workday.actual_return_home = input.actual_return_home
    else:
        raise HTTPException(status_code=400, detail="Specifica città o status")
    
    doc = workday.model_dump()
    result = await db.workdays.replace_one({"date": date}, doc)
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Giornata non trovata")
    
    return workday


@api_router.delete("/workdays")
async def delete_workday(date: str):
    """Elimina una giornata"""
    result = await db.workdays.delete_one({"date": date})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Giornata non trovata")
    return {"message": "Giornata eliminata"}


# ========== STATISTICS ==========

@api_router.get("/stats/monthly", response_model=MonthlyStats)
async def get_monthly_stats(month: str, year: str, user_id: Optional[str] = None):
    """Ottieni statistiche mensili"""
    
    # Filtra workdays per mese e user_id
    month_year_suffix = f"/{month.zfill(2)}/{year}"
    
    query = {}
    if user_id:
        query["user_id"] = user_id
    
    workdays = await db.workdays.find(query, {"_id": 0}).to_list(1000)
    filtered = [WorkDay(**wd) for wd in workdays if wd['date'].endswith(month_year_suffix)]
    
    total_km = sum(wd.total_km for wd in filtered)
    total_fuel = sum(wd.fuel_liters for wd in filtered)
    total_cost = sum(wd.fuel_cost for wd in filtered)
    
    work_days = len([wd for wd in filtered if wd.city])
    rest_days = len([wd for wd in filtered if wd.status])
    
    # Calcola tempi totali
    total_time_at_store = sum(wd.presence_minutes_with_break for wd in filtered if wd.city)
    total_travel_time = sum((wd.travel_minutes_outbound + wd.travel_minutes_return) for wd in filtered if wd.city)
    
    settings = await get_settings()
    
    return MonthlyStats(
        month=f"{month.zfill(2)}/{year}",
        total_km=round(total_km, 1),
        total_fuel_liters=round(total_fuel, 2),
        total_fuel_cost=round(total_cost, 2),
        km_allowance=settings.monthly_allowance,
        work_days=work_days,
        rest_days=rest_days,
        total_time_at_store_minutes=total_time_at_store,
        total_travel_time_minutes=total_travel_time
    )


# ========== IMPORT CSV ==========

@api_router.post("/import/csv")
async def import_csv_data(file: UploadFile = File(...)):
    """Importa dati da file CSV"""
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File deve essere un CSV")
    
    content = await file.read()
    decoded = content.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(decoded))
    
    locations = await db.locations.find({}, {"_id": 0}).to_list(100)
    settings = await get_settings()
    
    imported = 0
    skipped = 0
    
    for row in csv_reader:
        date = row.get('Giorno', '').strip()
        city = row.get('Città', '').strip()
        status = row.get('Stato Giornata', '').strip()
        
        if not date:
            continue
        
        # Verifica se esiste già
        existing = await db.workdays.find_one({"date": date})
        if existing:
            skipped += 1
            continue
        
        try:
            if status and status != "":
                # Giorno di riposo/festivo
                status_clean = status.replace("-", "").strip()
                workday = calculate_rest_day(date, status_clean)
            elif city and city != "" and city.lower() != "riposo":
                # Giorno lavorativo
                # Normalizza il nome città
                city_normalized = city.upper().strip()
                if city_normalized == "REGGIO EMILIA":
                    city_normalized = "Reggio Emilia"
                elif city_normalized == "MODENA":
                    city_normalized = "Modena"
                elif city_normalized == "PARMA":
                    city_normalized = "Parma"
                elif city_normalized == "BRESCIA":
                    city_normalized = "Brescia"
                elif city_normalized == "VERONA":
                    city_normalized = "Verona"
                
                workday = calculate_work_day(city_normalized, date, locations, settings)
            else:
                # Skip righe vuote o incomplete
                continue
            
            doc = workday.model_dump()
            await db.workdays.insert_one(doc)
            imported += 1
            
        except Exception as e:
            print(f"Errore importazione riga {date}: {e}")
            continue
    
    return {
        "message": "Import completato",
        "imported": imported,
        "skipped": skipped
    }


# ========== EXPORT PDF ==========

@api_router.get("/export/pdf")
async def export_monthly_pdf(month: str, year: str, user_id: Optional[str] = None):
    """Esporta report mensile in PDF"""
    
    # Ottieni dati del mese
    month_year_suffix = f"/{month.zfill(2)}/{year}"
    
    # Filtra per user_id se specificato
    query = {}
    if user_id:
        query["user_id"] = user_id
    
    workdays = await db.workdays.find(query, {"_id": 0}).to_list(1000)
    filtered = [WorkDay(**wd) for wd in workdays if wd['date'].endswith(month_year_suffix)]
    
    # Ottieni info utente per il report
    user_name = "Tutti gli utenti"
    if user_id:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user:
            user_name = user.get('name', user.get('email', 'Utente'))
    
    # Ordina per data
    filtered.sort(key=lambda x: datetime.strptime(x.date, "%d/%m/%Y"))
    
    # Statistiche (passa user_id per filtrare)
    stats = await get_monthly_stats(month, year, user_id)
    
    # Crea PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=1  # Center
    )
    
    # Sottotitolo per nome utente
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#475569'),
        spaceAfter=20,
        alignment=1  # Center
    )
    
    # Titolo
    title = Paragraph(f"Report Mensile - {month.zfill(2)}/{year}", title_style)
    elements.append(title)
    
    # Sottotitolo con nome utente
    subtitle = Paragraph(f"Dipendente: {user_name}", subtitle_style)
    elements.append(subtitle)
    elements.append(Spacer(1, 0.5*cm))
    
    # Riepilogo
    summary_data = [
        ["Statistiche Mensili", ""],
        ["Giorni lavorativi", str(stats.work_days)],
        ["Giorni riposo", str(stats.rest_days)],
        ["KM totali", f"{stats.total_km} km"],
        ["", ""],
        ["Tempi", ""],
        ["Tempo in negozio VIS", f"{stats.total_time_at_store_minutes // 60}h {stats.total_time_at_store_minutes % 60}min"],
        ["Tempo in auto (senza traffico)", f"{stats.total_travel_time_minutes // 60}h {stats.total_travel_time_minutes % 60}min"],
        ["", ""],
        ["Rimborsi", ""],
        ["Rimborso usura KM", f"€ {stats.km_allowance}"],
        ["Benzina consumata", f"{stats.total_fuel_liters} L (coperta da azienda)"],
        ["Pedaggio", "Coperto da Telepass aziendale"]
    ]
    
    summary_table = Table(summary_data, colWidths=[10*cm, 6*cm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 1*cm))
    
    # Dettaglio giornate
    detail_title = Paragraph("Dettaglio Giornaliero", styles['Heading2'])
    elements.append(detail_title)
    elements.append(Spacer(1, 0.3*cm))
    
    detail_data = [["Data", "Città", "Partenza", "Arrivo", "Uscita", "Rientro", "KM"]]
    
    for wd in filtered:
        if wd.status:
            detail_data.append([
                wd.date,
                wd.status or "Riposo",
                "-", "-", "-", "-", "-"
            ])
        else:
            detail_data.append([
                wd.date,
                wd.city or "",
                wd.departure_from_home or "",
                wd.arrival_at_store or "",
                wd.exit_from_store or "",
                wd.return_home or "",
                f"{wd.total_km}"
            ])
    
    detail_table = Table(detail_data, colWidths=[2.5*cm, 3*cm, 2*cm, 2*cm, 2*cm, 2*cm, 2*cm])
    detail_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    
    elements.append(detail_table)
    
    # Genera PDF
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=report_{month}_{year}.pdf"
        }
    )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
