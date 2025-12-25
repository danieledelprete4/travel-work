"""
Google Sheets Database Helper
Sostituisce MongoDB con Google Sheets come database
"""

import gspread
from google.oauth2.service_account import Credentials
from typing import List, Dict, Optional, Any
import os
from datetime import datetime

# Google Sheets configuration
SPREADSHEET_ID = "1oUun7urYjJZeLz8G8Lnbo3g9Eyptt34yGEAhNdZFBeA"
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), "service_account.json")

# Setup Google Sheets client
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

def get_sheets_client():
    """Initialize and return gspread client"""
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    client = gspread.authorize(creds)
    return client

def get_spreadsheet():
    """Get the main spreadsheet"""
    client = get_sheets_client()
    return client.open_by_key(SPREADSHEET_ID)


# ==================== USERS ====================

def get_all_users() -> List[Dict[str, Any]]:
    """Get all users from 'users' sheet"""
    try:
        sheet = get_spreadsheet().worksheet("users")
        records = sheet.get_all_records()
        # Convert 'blocked' string to boolean
        for record in records:
            if 'blocked' in record:
                record['blocked'] = str(record['blocked']).lower() == 'true'
        return records
    except gspread.exceptions.WorksheetNotFound:
        return []

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Find user by ID"""
    users = get_all_users()
    for user in users:
        if user.get('id') == user_id:
            return user
    return None

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Find user by email"""
    users = get_all_users()
    for user in users:
        if user.get('email') == email:
            return user
    return None

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Find user by username"""
    users = get_all_users()
    for user in users:
        if user.get('username') == username:
            return user
    return None

def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create new user"""
    sheet = get_spreadsheet().worksheet("users")
    
    # Append as new row
    row = [
        user_data.get('id', ''),
        user_data.get('username', ''),
        user_data.get('email', ''),
        user_data.get('password_hash', ''),
        user_data.get('role', 'user'),
        str(user_data.get('blocked', False)),
        user_data.get('created_at', datetime.now().isoformat())
    ]
    sheet.append_row(row)
    return user_data

def update_user(user_id: str, update_data: Dict[str, Any]) -> bool:
    """Update user by ID"""
    sheet = get_spreadsheet().worksheet("users")
    records = sheet.get_all_records()
    
    for idx, record in enumerate(records, start=2):  # Start from row 2 (row 1 is header)
        if record.get('id') == user_id:
            # Update only specified fields
            for key, value in update_data.items():
                if key in record:
                    col_idx = list(record.keys()).index(key) + 1
                    if key == 'blocked':
                        value = str(value)
                    sheet.update_cell(idx, col_idx, value)
            return True
    return False

def delete_user(user_id: str) -> bool:
    """Delete user by ID"""
    sheet = get_spreadsheet().worksheet("users")
    records = sheet.get_all_records()
    
    for idx, record in enumerate(records, start=2):
        if record.get('id') == user_id:
            sheet.delete_rows(idx)
            return True
    return False


# ==================== CITIES ====================

def get_all_cities() -> List[Dict[str, Any]]:
    """Get all cities from 'cities' sheet"""
    try:
        sheet = get_spreadsheet().worksheet("cities")
        records = sheet.get_all_records()
        return records
    except gspread.exceptions.WorksheetNotFound:
        return []

def get_city_by_id(city_id: str) -> Optional[Dict[str, Any]]:
    """Find city by ID"""
    cities = get_all_cities()
    for city in cities:
        if city.get('id') == city_id:
            return city
    return None

def create_city(city_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create new city"""
    sheet = get_spreadsheet().worksheet("cities")
    
    row = [
        city_data.get('id', ''),
        city_data.get('name', ''),
        city_data.get('travel_minutes', 0),
        city_data.get('created_at', datetime.now().isoformat())
    ]
    sheet.append_row(row)
    return city_data

def update_city(city_id: str, update_data: Dict[str, Any]) -> bool:
    """Update city by ID"""
    sheet = get_spreadsheet().worksheet("cities")
    records = sheet.get_all_records()
    
    for idx, record in enumerate(records, start=2):
        if record.get('id') == city_id:
            for key, value in update_data.items():
                if key in record:
                    col_idx = list(record.keys()).index(key) + 1
                    sheet.update_cell(idx, col_idx, value)
            return True
    return False

def delete_city(city_id: str) -> bool:
    """Delete city by ID"""
    sheet = get_spreadsheet().worksheet("cities")
    records = sheet.get_all_records()
    
    for idx, record in enumerate(records, start=2):
        if record.get('id') == city_id:
            sheet.delete_rows(idx)
            return True
    return False


# ==================== WORKDAYS ====================

def get_all_workdays(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all workdays, optionally filtered by user_id"""
    try:
        sheet = get_spreadsheet().worksheet("workdays")
        records = sheet.get_all_records()
        
        if user_id:
            records = [r for r in records if r.get('user_id') == user_id]
        
        # Convert boolean strings
        for record in records:
            if 'is_custom_city' in record:
                record['is_custom_city'] = str(record['is_custom_city']).lower() == 'true'
        
        return records
    except gspread.exceptions.WorksheetNotFound:
        return []

def get_workday_by_date(user_id: str, date: str) -> Optional[Dict[str, Any]]:
    """Find workday by user_id and date"""
    workdays = get_all_workdays(user_id)
    for wd in workdays:
        if wd.get('date') == date:
            return wd
    return None

def create_workday(workday_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create new workday"""
    sheet = get_spreadsheet().worksheet("workdays")
    
    row = [
        workday_data.get('id', ''),
        workday_data.get('user_id', ''),
        workday_data.get('date', ''),
        workday_data.get('city', ''),
        str(workday_data.get('is_custom_city', False)),
        workday_data.get('custom_city_name', ''),
        workday_data.get('custom_distance_km', ''),
        workday_data.get('custom_travel_minutes', ''),
        workday_data.get('travel_minutes_outbound', 0),
        workday_data.get('travel_minutes_return', 0),
        workday_data.get('work_minutes', 0),
        workday_data.get('arrival_time', ''),
        workday_data.get('departure_home', ''),
        workday_data.get('exit_time', ''),
        workday_data.get('return_home', ''),
        workday_data.get('actual_arrival_at_store', ''),
        workday_data.get('actual_exit_from_store', ''),
        workday_data.get('actual_return_home', ''),
        workday_data.get('status', ''),
        workday_data.get('created_at', datetime.now().isoformat())
    ]
    sheet.append_row(row)
    return workday_data

def create_workdays_batch(workdays: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create multiple workdays in batch (optimized for CSV import)"""
    if not workdays:
        return []
    
    sheet = get_spreadsheet().worksheet("workdays")
    
    rows = []
    for wd in workdays:
        row = [
            wd.get('id', ''),
            wd.get('user_id', ''),
            wd.get('date', ''),
            wd.get('city', ''),
            str(wd.get('is_custom_city', False)),
            wd.get('custom_city_name', ''),
            wd.get('custom_distance_km', ''),
            wd.get('custom_travel_minutes', ''),
            wd.get('travel_minutes_outbound', 0),
            wd.get('travel_minutes_return', 0),
            wd.get('work_minutes', 0),
            wd.get('arrival_time', ''),
            wd.get('departure_home', ''),
            wd.get('exit_time', ''),
            wd.get('return_home', ''),
            wd.get('actual_arrival_at_store', ''),
            wd.get('actual_exit_from_store', ''),
            wd.get('actual_return_home', ''),
            wd.get('status', ''),
            wd.get('created_at', datetime.now().isoformat())
        ]
        rows.append(row)
    
    # Batch append (single API call)
    sheet.append_rows(rows)
    return workdays

def update_workday(user_id: str, date: str, update_data: Dict[str, Any]) -> bool:
    """Update workday by user_id and date"""
    sheet = get_spreadsheet().worksheet("workdays")
    records = sheet.get_all_records()
    
    for idx, record in enumerate(records, start=2):
        if record.get('user_id') == user_id and record.get('date') == date:
            for key, value in update_data.items():
                if key in record:
                    col_idx = list(record.keys()).index(key) + 1
                    if key == 'is_custom_city':
                        value = str(value)
                    sheet.update_cell(idx, col_idx, value if value is not None else '')
            return True
    return False

def delete_workday(user_id: str, date: str) -> bool:
    """Delete workday by user_id and date"""
    sheet = get_spreadsheet().worksheet("workdays")
    records = sheet.get_all_records()
    
    for idx, record in enumerate(records, start=2):
        if record.get('user_id') == user_id and record.get('date') == date:
            sheet.delete_rows(idx)
            return True
    return False


# ==================== ROLES ====================

def get_all_roles() -> List[Dict[str, Any]]:
    """Get all roles from 'roles' sheet"""
    try:
        sheet = get_spreadsheet().worksheet("roles")
        records = sheet.get_all_records()
        
        # Convert custom string to boolean
        for record in records:
            if 'custom' in record:
                record['custom'] = str(record['custom']).lower() == 'true'
            # Parse permissions from comma-separated string
            if 'permissions' in record and isinstance(record['permissions'], str):
                record['permissions'] = [p.strip() for p in record['permissions'].split(',') if p.strip()]
        
        return records
    except gspread.exceptions.WorksheetNotFound:
        return []

def create_role(role_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create new role"""
    sheet = get_spreadsheet().worksheet("roles")
    
    # Convert permissions list to comma-separated string
    permissions_str = ','.join(role_data.get('permissions', []))
    
    row = [
        role_data.get('id', ''),
        role_data.get('name', ''),
        permissions_str,
        str(role_data.get('custom', False)),
        role_data.get('created_at', datetime.now().isoformat())
    ]
    sheet.append_row(row)
    return role_data


# ==================== INITIALIZATION ====================

def initialize_sheets():
    """Initialize all sheets with headers if they don't exist"""
    spreadsheet = get_spreadsheet()
    
    # Define sheet structures
    sheets_config = {
        "users": ["id", "username", "email", "password_hash", "role", "blocked", "created_at"],
        "cities": ["id", "name", "travel_minutes", "created_at"],
        "workdays": [
            "id", "user_id", "date", "city", "is_custom_city", 
            "custom_city_name", "custom_distance_km", "custom_travel_minutes",
            "travel_minutes_outbound", "travel_minutes_return", "work_minutes",
            "arrival_time", "departure_home", "exit_time", "return_home",
            "actual_arrival_at_store", "actual_exit_from_store", "actual_return_home",
            "status", "created_at"
        ],
        "roles": ["id", "name", "permissions", "custom", "created_at"]
    }
    
    for sheet_name, headers in sheets_config.items():
        try:
            sheet = spreadsheet.worksheet(sheet_name)
            # Check if headers exist
            existing_headers = sheet.row_values(1)
            if not existing_headers:
                sheet.append_row(headers)
        except gspread.exceptions.WorksheetNotFound:
            # Create new sheet
            sheet = spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=len(headers))
            sheet.append_row(headers)
    
    print("✅ Google Sheets initialized successfully!")


if __name__ == "__main__":
    # Test initialization
    initialize_sheets()
    print("Database sheets ready!")
