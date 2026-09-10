import requests
import json
import os
import sys
import time
from dataclasses import dataclass, field

GEOCODE_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search?"
FORECAST_BASE_URL = "https://api.open-meteo.com/v1/forecast"

CITIES = {
    'FR': ['Paris', 'Nice', 'Lyon', 'Bordeaux', 'Marseille', 'Strasbourg', 'Lille',
           'Toulouse', 'Nantes', 'Montpellier', 'Biarritz', 'La Rochelle', 'Rennes',
           'Annecy', 'Grenoble', 'Avignon', 'Cannes', 'Saint-Tropez', 'Dijon',
           'Reims', 'Rouen', 'Nancy', 'Nimes', 'Arles', 'Metz', 'Carcassonne',
           'Versailles', 'Tours', 'Amiens', 'Aix-en-Provence'],
    'BE': ['Bruxelles', 'Bruges', 'Gand', 'Anvers', 'Liège', 'Namur'],
    'CH': ['Genève', 'Lausanne', 'Berne', 'Bâle', 'Zurich', 'Lucerne', 'Lugano'],
    'IT': ['Milan', 'Turin', 'Gênes', 'Aoste', 'Côme', 'Vérone', 'Venise'],
    'ES': ['Barcelone', 'Saint-Sébastien', 'Pampelune', 'Bilbao', 'Gérone'],
    'DE': ['Munich', 'Fribourg-en-Brisgau', 'Stuttgart', 'Francfort', 'Cologne'],
}

OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'public', 'data.json'
)

COORDS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'coords.json')

# Open-Meteo throttles CI runner IPs, so pace the requests rather than sprinting.
DELAY_BETWEEN_CITIES = 0.3


@dataclass
class DailyForecast:
    date: str
    weather_code: int
    temperature: float


@dataclass
class Semaine:
    semaine: int
    daily: list


@dataclass
class CityData:
    name: str
    country: str
    lat: float
    long: float
    temperature_moyenne: float
    forecast: list = field(default_factory=list)


def get_json(url, params, attempts=6):
    # Open-Meteo silently drops connections from CI runner IP ranges: the TLS
    # handshake gets no answer at all, so without a timeout requests waits
    # forever. Bound every call, then retry with backoff to ride out the drop.
    # Run #159 lost 6 cities with 4 attempts, hence the more patient schedule.
    delay = 5
    for attempt in range(1, attempts + 1):
        try:
            response = requests.get(url, params=params, timeout=(10, 30))
            response.raise_for_status()
            return json.loads(response.text)
        except requests.RequestException as exc:
            if attempt == attempts:
                raise
            print(f"  tentative {attempt}/{attempts} echouee ({type(exc).__name__}), retry dans {delay}s")
            time.sleep(delay)
            delay *= 2


def load_known_coords():
    """Read coordinates from coords.json, which this script never rewrites.

    Coordinates never change, so looking them up keeps the geocoding API — the
    host that actually fails in CI — off the steady-state path, and halves the
    number of requests per run.

    Deliberately NOT sourced from data.json: a run that drops a city would drop
    it from the cache too, sending the next run back to the failing geocoder and
    making the loss permanent.
    """
    try:
        with open(COORDS_PATH, encoding='utf-8') as f:
            cached = json.load(f)
    except (OSError, ValueError):
        print(f"ATTENTION: {COORDS_PATH} illisible, géocodage complet nécessaire.")
        return {}

    return {name: (lat, long) for name, (lat, long) in cached.items()}


def get_city_coords(city_name, known_coords):
    if city_name in known_coords:
        return known_coords[city_name]

    params = {
        "name": city_name,
        "count": 1,
        "language": "fr",
        "format": "json"
    }
    data = get_json(GEOCODE_BASE_URL, params)
    if "results" in data and len(data["results"]) > 0:
        result = data["results"][0]
        return result["latitude"], result["longitude"]
    return None, None


def get_forecasts():
    all_cities = []
    known_coords = load_known_coords()
    print(f"{len(known_coords)} villes avec coordonnées en cache (pas de géocodage).")

    first = True
    for country_code, city_list in CITIES.items():
        for city_name in city_list:
            if not first:
                time.sleep(DELAY_BETWEEN_CITIES)
            first = False

            try:
                city = fetch_city(city_name, country_code, known_coords)
            except requests.RequestException as exc:
                # One unreachable city must not throw away every other result.
                print(f"ECHEC reseau pour {city_name}: {type(exc).__name__}")
                continue

            if city is None:
                continue

            all_cities.append(city)
            print(f"OK: {city_name} ({country_code})")

    return all_cities


def fetch_city(city_name, country_code, known_coords):
    lat, long = get_city_coords(city_name, known_coords)
    if lat is None:
        print(f"Ville {city_name} non trouvée.")
        return None

    params = {
        "latitude": lat,
        "longitude": long,
        "daily": "weathercode,temperature_2m_max",
        "timezone": "Europe/London",
        "forecast_days": 14
    }

    data = get_json(FORECAST_BASE_URL, params)

    if not ("daily" in data and "time" in data["daily"] and "temperature_2m_max" in data["daily"]):
        print(f"Pas de données météo pour {city_name}.")
        return None

    days = data["daily"]["time"]
    weather_codes = data["daily"]["weathercode"]
    temps = data["daily"]["temperature_2m_max"]

    temp_moy = 0
    weeks = []
    current_week = None

    for i in range(len(days)):
        day = DailyForecast(
            date=days[i],
            weather_code=weather_codes[i],
            temperature=temps[i]
        )
        temp_moy += temps[i]

        week_number = i // 7 + 1
        if current_week is None or current_week.semaine != week_number:
            current_week = Semaine(semaine=week_number, daily=[])
            weeks.append(current_week)

        current_week.daily.append(day)

    return CityData(
        name=city_name,
        country=country_code,
        lat=lat,
        long=long,
        temperature_moyenne=round(temp_moy / len(days), 1),
        forecast=weeks
    )


def obj_dict(obj):
    if hasattr(obj, "__dict__"):
        return obj.__dict__
    else:
        return str(obj)


if __name__ == "__main__":
    print("Récupération des données météo...")
    weather_data = get_forecasts()

    expected = sum(len(city_list) for city_list in CITIES.values())
    print(f"\n{len(weather_data)}/{expected} villes récupérées.")

    # Per-city tolerance means a bad run can still finish. Publishing a short
    # file would silently shrink the app's city list, and yesterday's complete
    # data beats today's incomplete data — so this is all or nothing.
    if len(weather_data) < expected:
        got = {city.name for city in weather_data}
        lost = [n for lst in CITIES.values() for n in lst if n not in got]
        print(f"ABANDON: villes manquantes {lost}, data.json laissé intact.")
        sys.exit(1)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(weather_data, f, default=obj_dict, indent=4, ensure_ascii=False)

    print(f"Données écrites dans : {OUTPUT_PATH}")
