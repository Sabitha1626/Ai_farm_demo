# Farm Sensor Integration Template

Python template for integrating IoT sensors with the Cattle Breeding Management System.

## Features

- Milk production sensor data
- Weight scale readings
- Heat detection sensors (activity, temperature, mounting, rumination)
- Biometric staff attendance
- Health record management
- Breeding event tracking

## Installation

```bash
pip install -r requirements.txt
```

## Configuration

Create a `.env` file:

```env
SUPABASE_URL=https://oikuhafxfclvfkjbapwl.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

## Usage

```python
from farm_sensor_integration import FarmSensorAPI

api = FarmSensorAPI()

# Send milk production data
api.send_milk_production(
    cow_id="cow-uuid",
    user_id="user-uuid",
    quantity_liters=25.5,
    fat_percentage=3.8
)

# Send heat detection
api.send_heat_detection(
    cow_id="cow-uuid",
    user_id="user-uuid",
    sensor_reading=250,
    sensor_type="activity",
    intensity="high"
)
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/functions/v1/sensor-data` | Milk, weight, biometric data |
| `/functions/v1/heat-detection` | Heat detection sensor data |
| `/functions/v1/health-records-api` | Health record management |
| `/functions/v1/breeding-events-api` | Breeding event management |

## Sensor Types

### Heat Detection
- `activity` - Activity counter sensors
- `temperature` - Body temperature sensors
- `mounting` - Mounting detection sensors
- `rumination` - Rumination monitoring

### Biometric
- `fingerprint` - Fingerprint scanner
- `face` - Facial recognition
- `rfid` - RFID card reader
