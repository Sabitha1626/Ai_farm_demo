"""
Farm Sensor Integration Template for Cattle Breeding Management System
======================================================================

This Python template provides examples for integrating IoT sensors with the
farm management system via REST APIs.

Endpoints:
- Sensor Data: POST /functions/v1/sensor-data
- Heat Detection: POST /functions/v1/heat-detection
- Health Records: POST /functions/v1/health-records-api
- Breeding Events: POST /functions/v1/breeding-events-api

Requirements:
    pip install requests python-dotenv
"""

import requests
import json
import random
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://oikuhafxfclvfkjbapwl.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa3VoYWZ4ZmNsdmZramJhcHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDMxODcsImV4cCI6MjA4MjA3OTE4N30.K-sXjUeHvXwD25Vb0caGZmnh8oJ6VSvolZmiJ7aHqY8")

# Headers for API requests
HEADERS = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
}


class FarmSensorAPI:
    """API client for farm sensor data integration."""
    
    def __init__(self, base_url: str = SUPABASE_URL, headers: dict = HEADERS):
        self.base_url = base_url
        self.headers = headers
    
    def _make_request(self, endpoint: str, data: dict) -> Dict[str, Any]:
        """Make a POST request to the API."""
        url = f"{self.base_url}/functions/v1/{endpoint}"
        try:
            response = requests.post(url, json=data, headers=self.headers, timeout=30)
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e)}
    
    # ==================== SENSOR DATA ====================
    
    def send_milk_production(
        self,
        cow_id: str,
        user_id: str,
        quantity_liters: float,
        fat_percentage: Optional[float] = None,
        protein_percentage: Optional[float] = None,
        quality_grade: Optional[str] = None,
        sensor_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send milk production data from automated milking sensor.
        
        Args:
            cow_id: UUID of the cow
            user_id: UUID of the farm owner
            quantity_liters: Amount of milk in liters
            fat_percentage: Fat content percentage (optional)
            protein_percentage: Protein content percentage (optional)
            quality_grade: Quality grade A/B/C (optional)
            sensor_id: ID of the milking sensor (optional)
        """
        data = {
            "type": "milk_production",
            "cow_id": cow_id,
            "user_id": user_id,
            "quantity_liters": quantity_liters,
            "is_automatic": True,
            "sensor_id": sensor_id
        }
        
        if fat_percentage is not None:
            data["fat_percentage"] = fat_percentage
        if protein_percentage is not None:
            data["protein_percentage"] = protein_percentage
        if quality_grade:
            data["quality_grade"] = quality_grade
            
        return self._make_request("sensor-data", data)
    
    def send_weight_reading(
        self,
        cow_id: str,
        user_id: str,
        weight_kg: float,
        sensor_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send weight reading from weighing scale sensor.
        
        Args:
            cow_id: UUID of the cow
            user_id: UUID of the farm owner
            weight_kg: Weight in kilograms
            sensor_id: ID of the weighing scale (optional)
        """
        data = {
            "type": "weight",
            "cow_id": cow_id,
            "user_id": user_id,
            "weight_kg": weight_kg,
            "is_automatic": True,
            "sensor_id": sensor_id
        }
        
        return self._make_request("sensor-data", data)
    
    def send_biometric_attendance(
        self,
        staff_id: str,
        user_id: str,
        action: str,  # "check_in" or "check_out"
        biometric_id: str,
        biometric_type: str = "fingerprint",  # fingerprint, face, rfid
        location: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send biometric attendance data for staff.
        
        Args:
            staff_id: UUID of the staff member
            user_id: UUID of the farm owner
            action: "check_in" or "check_out"
            biometric_id: Unique biometric identifier
            biometric_type: Type of biometric (fingerprint, face, rfid)
            location: Location of the biometric device (optional)
        """
        data = {
            "type": "biometric_attendance",
            "staff_id": staff_id,
            "user_id": user_id,
            "action": action,
            "biometric_id": biometric_id,
            "biometric_type": biometric_type,
            "location": location
        }
        
        return self._make_request("sensor-data", data)
    
    # ==================== HEAT DETECTION ====================
    
    def send_heat_detection(
        self,
        cow_id: str,
        user_id: str,
        sensor_reading: float,
        sensor_type: str,  # activity, temperature, mounting, rumination
        intensity: str = "medium",
        symptoms: Optional[list] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send heat detection data from various sensors.
        
        Args:
            cow_id: UUID of the cow
            user_id: UUID of the farm owner
            sensor_reading: Numeric sensor value
            sensor_type: Type of sensor (activity, temperature, mounting, rumination)
            intensity: Heat intensity (low, medium, high)
            symptoms: List of observed symptoms (optional)
            notes: Additional notes (optional)
        """
        data = {
            "cow_id": cow_id,
            "user_id": user_id,
            "sensor_reading": sensor_reading,
            "sensor_type": sensor_type,
            "intensity": intensity
        }
        
        if symptoms:
            data["symptoms"] = symptoms
        if notes:
            data["notes"] = notes
            
        return self._make_request("heat-detection", data)
    
    # ==================== HEALTH RECORDS ====================
    
    def create_health_record(
        self,
        cow_id: str,
        user_id: str,
        record_type: str,  # vaccination, treatment, checkup, surgery
        diagnosis: Optional[str] = None,
        treatment: Optional[str] = None,
        medications: Optional[str] = None,
        veterinarian: Optional[str] = None,
        cost: Optional[float] = None,
        follow_up_date: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a health record for a cow.
        
        Args:
            cow_id: UUID of the cow
            user_id: UUID of the farm owner
            record_type: Type of record (vaccination, treatment, checkup, surgery)
            diagnosis: Diagnosis description (optional)
            treatment: Treatment given (optional)
            medications: Medications prescribed (optional)
            veterinarian: Name of veterinarian (optional)
            cost: Cost of treatment (optional)
            follow_up_date: Follow-up date in ISO format (optional)
            notes: Additional notes (optional)
        """
        data = {
            "action": "create",
            "cow_id": cow_id,
            "user_id": user_id,
            "record_type": record_type
        }
        
        if diagnosis:
            data["diagnosis"] = diagnosis
        if treatment:
            data["treatment"] = treatment
        if medications:
            data["medications"] = medications
        if veterinarian:
            data["veterinarian"] = veterinarian
        if cost is not None:
            data["cost"] = cost
        if follow_up_date:
            data["follow_up_date"] = follow_up_date
        if notes:
            data["notes"] = notes
            
        return self._make_request("health-records-api", data)
    
    # ==================== BREEDING EVENTS ====================
    
    def create_breeding_event(
        self,
        cow_id: str,
        user_id: str,
        title: str,
        event_type: str,  # insemination, pregnancy_check, calving, heat_observed
        event_date: str,  # ISO format date
        description: Optional[str] = None,
        notes: Optional[str] = None,
        reminder_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a breeding event for a cow.
        
        Args:
            cow_id: UUID of the cow
            user_id: UUID of the farm owner
            title: Event title
            event_type: Type of event (insemination, pregnancy_check, calving, heat_observed)
            event_date: Event date in ISO format
            description: Event description (optional)
            notes: Additional notes (optional)
            reminder_date: Reminder date in ISO format (optional)
        """
        data = {
            "action": "create",
            "cow_id": cow_id,
            "user_id": user_id,
            "title": title,
            "event_type": event_type,
            "event_date": event_date
        }
        
        if description:
            data["description"] = description
        if notes:
            data["notes"] = notes
        if reminder_date:
            data["reminder_date"] = reminder_date
            
        return self._make_request("breeding-events-api", data)


# ==================== SIMULATION EXAMPLES ====================

def simulate_milk_sensor(api: FarmSensorAPI, cow_id: str, user_id: str):
    """Simulate milk production sensor readings."""
    print("\n🥛 Simulating milk production sensor...")
    
    result = api.send_milk_production(
        cow_id=cow_id,
        user_id=user_id,
        quantity_liters=round(random.uniform(15, 35), 2),
        fat_percentage=round(random.uniform(3.0, 4.5), 2),
        protein_percentage=round(random.uniform(2.8, 3.5), 2),
        quality_grade=random.choice(["A", "A", "B"]),
        sensor_id="MILK-SENSOR-001"
    )
    
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def simulate_weight_sensor(api: FarmSensorAPI, cow_id: str, user_id: str):
    """Simulate weight scale sensor readings."""
    print("\n⚖️ Simulating weight sensor...")
    
    result = api.send_weight_reading(
        cow_id=cow_id,
        user_id=user_id,
        weight_kg=round(random.uniform(400, 700), 1),
        sensor_id="SCALE-001"
    )
    
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def simulate_heat_detection(api: FarmSensorAPI, cow_id: str, user_id: str):
    """Simulate heat detection sensor readings."""
    print("\n🌡️ Simulating heat detection sensor...")
    
    sensor_types = [
        ("activity", random.uniform(150, 300)),  # Activity count
        ("temperature", random.uniform(38.5, 40.0)),  # Body temp in Celsius
        ("mounting", random.uniform(0, 10)),  # Mounting events
        ("rumination", random.uniform(200, 500))  # Rumination minutes
    ]
    
    sensor_type, reading = random.choice(sensor_types)
    
    result = api.send_heat_detection(
        cow_id=cow_id,
        user_id=user_id,
        sensor_reading=round(reading, 2),
        sensor_type=sensor_type,
        intensity=random.choice(["low", "medium", "high"]),
        symptoms=["restlessness", "mounting behavior", "clear mucus discharge"],
        notes=f"Automated detection from {sensor_type} sensor"
    )
    
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def simulate_biometric_attendance(api: FarmSensorAPI, staff_id: str, user_id: str):
    """Simulate biometric attendance."""
    print("\n👤 Simulating biometric attendance...")
    
    result = api.send_biometric_attendance(
        staff_id=staff_id,
        user_id=user_id,
        action="check_in",
        biometric_id=f"BIO-{random.randint(1000, 9999)}",
        biometric_type=random.choice(["fingerprint", "face", "rfid"]),
        location="Main Gate"
    )
    
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def main():
    """Main function demonstrating API usage."""
    print("=" * 60)
    print("🐄 Farm Sensor Integration Template")
    print("=" * 60)
    
    # Initialize API client
    api = FarmSensorAPI()
    
    # IMPORTANT: Replace these with actual UUIDs from your database
    # You can get these from the Supabase dashboard or API
    SAMPLE_COW_ID = "your-cow-uuid-here"
    SAMPLE_USER_ID = "your-user-uuid-here"
    SAMPLE_STAFF_ID = "your-staff-uuid-here"
    
    print("\n⚠️  IMPORTANT: Update the UUID values above with real IDs from your database!")
    print("\nTo get UUIDs:")
    print("1. Log into your farm management app")
    print("2. Add cows and staff members")
    print("3. Query the database for their IDs")
    print("\nExample query to get cow IDs:")
    print("  SELECT id, name, tag_number FROM cows LIMIT 10;")
    
    # Uncomment below to run simulations with real UUIDs
    # simulate_milk_sensor(api, SAMPLE_COW_ID, SAMPLE_USER_ID)
    # simulate_weight_sensor(api, SAMPLE_COW_ID, SAMPLE_USER_ID)
    # simulate_heat_detection(api, SAMPLE_COW_ID, SAMPLE_USER_ID)
    # simulate_biometric_attendance(api, SAMPLE_STAFF_ID, SAMPLE_USER_ID)
    
    print("\n" + "=" * 60)
    print("📡 Available Endpoints:")
    print("=" * 60)
    print(f"  Sensor Data:     {SUPABASE_URL}/functions/v1/sensor-data")
    print(f"  Heat Detection:  {SUPABASE_URL}/functions/v1/heat-detection")
    print(f"  Health Records:  {SUPABASE_URL}/functions/v1/health-records-api")
    print(f"  Breeding Events: {SUPABASE_URL}/functions/v1/breeding-events-api")
    print("=" * 60)


if __name__ == "__main__":
    main()
