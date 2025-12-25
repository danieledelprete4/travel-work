#!/usr/bin/env python3
"""
Script per inizializzare il database con Super Admin e dati di esempio
"""
import asyncio
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "work_travel_db")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def init_database():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print(f"🔄 Connessione a MongoDB: {MONGO_URL}")
    print(f"🗄️  Database: {DB_NAME}")
    print()
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"username": "adminamma"})
    if existing_admin:
        print("⚠️  Super Admin 'adminamma' già esistente!")
        print(f"   Email: {existing_admin.get('email')}")
        print()
    else:
        # Create Super Admin
        admin_id = str(uuid.uuid4())
        admin_password = pwd_context.hash("farfallaamma20")
        
        admin_user = {
            "id": admin_id,
            "username": "adminamma",
            "email": "admin@worktravelmanager.com",
            "password_hash": admin_password,
            "role": "super_admin",
            "blocked": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(admin_user)
        print("✅ Super Admin creato!")
        print(f"   Username: adminamma")
        print(f"   Password: farfallaamma20")
        print(f"   Email: admin@worktravelmanager.com")
        print()
    
    # Create test user (Sales)
    existing_user = await db.users.find_one({"email": "mario.rossi@mediaworld.it"})
    if not existing_user:
        user_id = str(uuid.uuid4())
        user_password = pwd_context.hash("amma1234")
        
        test_user = {
            "id": user_id,
            "email": "mario.rossi@mediaworld.it",
            "name": "Mario Rossi",
            "password_hash": user_password,
            "role": "user",
            "blocked": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(test_user)
        print("✅ Utente test creato!")
        print(f"   Email: mario.rossi@mediaworld.it")
        print(f"   Password: amma1234")
        print(f"   Ruolo: user (Support Sales)")
        print()
    
    # Create sample cities
    cities_data = [
        {"name": "Verona", "travel_minutes": 0},
        {"name": "Modena", "travel_minutes": 70},
        {"name": "Reggio Emilia", "travel_minutes": 80},
        {"name": "Parma", "travel_minutes": 90},
        {"name": "Piacenza", "travel_minutes": 100},
        {"name": "Mantova", "travel_minutes": 30},
    ]
    
    cities_count = await db.cities.count_documents({})
    if cities_count == 0:
        for city_data in cities_data:
            city = {
                "id": str(uuid.uuid4()),
                **city_data,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.cities.insert_one(city)
        print(f"✅ {len(cities_data)} città di esempio create!")
        print()
    
    client.close()
    print("🎉 Database inizializzato con successo!")
    print()
    print("📝 Credenziali per il login:")
    print("   Super Admin: adminamma / farfallaamma20")
    print("   Utente test: mario.rossi@mediaworld.it / amma1234")
    print()

if __name__ == "__main__":
    asyncio.run(init_database())
