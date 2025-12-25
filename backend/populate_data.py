"""
Populate initial data in Google Sheets
Super Admin + Sales User + Cities
"""

from db_sheets import create_user, create_city, get_user_by_username, get_user_by_email
from passlib.context import CryptContext
import uuid
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def populate_initial_data():
    """Create initial users and cities"""
    
    print("🔧 Populating initial data...")
    
    # 1. Create Super Admin
    admin_exists = get_user_by_username("adminamma")
    if not admin_exists:
        admin_data = {
            "id": str(uuid.uuid4()),
            "username": "adminamma",
            "email": "admin@mediaworld.it",
            "password_hash": pwd_context.hash("farfallaamma20"),
            "role": "super_admin",
            "blocked": False,
            "created_at": datetime.now().isoformat()
        }
        create_user(admin_data)
        print("✅ Super Admin created: adminamma / farfallaamma20")
    else:
        print("ℹ️  Super Admin already exists")
    
    # 2. Create Sales User
    sales_exists = get_user_by_email("mario.rossi@mediaworld.it")
    if not sales_exists:
        sales_data = {
            "id": str(uuid.uuid4()),
            "username": "",  # Sales users don't have username
            "email": "mario.rossi@mediaworld.it",
            "password_hash": pwd_context.hash("amma1234"),
            "role": "user",
            "blocked": False,
            "created_at": datetime.now().isoformat()
        }
        create_user(sales_data)
        print("✅ Sales User created: mario.rossi@mediaworld.it / amma1234")
    else:
        print("ℹ️  Sales User already exists")
    
    # 3. Create Cities (from CSV)
    cities_to_create = [
        {"name": "Verona", "travel_minutes": 0},
        {"name": "Padova/Vicenza", "travel_minutes": 0},
        {"name": "Mantova", "travel_minutes": 30},
        {"name": "Modena", "travel_minutes": 70},
        {"name": "Reggio Emilia", "travel_minutes": 80},
        {"name": "Parma", "travel_minutes": 90},
        {"name": "Piacenza", "travel_minutes": 100}
    ]
    
    from db_sheets import get_all_cities
    existing_cities = get_all_cities()
    existing_names = [c.get('name') for c in existing_cities]
    
    for city in cities_to_create:
        if city['name'] not in existing_names:
            city_data = {
                "id": str(uuid.uuid4()),
                "name": city['name'],
                "travel_minutes": city['travel_minutes'],
                "created_at": datetime.now().isoformat()
            }
            create_city(city_data)
            print(f"✅ City created: {city['name']} ({city['travel_minutes']} min)")
    
    print("\n🎉 Initial data population complete!")
    print("\n📋 Login Credentials:")
    print("  Super Admin: adminamma / farfallaamma20")
    print("  Sales User: mario.rossi@mediaworld.it / amma1234")


if __name__ == "__main__":
    populate_initial_data()
