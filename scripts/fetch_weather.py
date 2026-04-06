import requests
import json
import os
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


def get_json(url, params):
    response = requests.get(url, params=params)
    response.raise_for_status()
    return json.loads(response.text)


def get_city_coords(city_name):
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

    for country_code, city_list in CITIES.items():
        for city_name in city_list:
            lat, long = get_city_coords(city_name)
            if lat is None:
                print(f"Ville {city_name} non trouvée.")
                continue

            city = CityData(
                name=city_name,
                country=country_code,
                lat=lat,
                long=long,
                temperature_moyenne=0,
                forecast=[]
            )

            params = {
                "latitude": lat,
                "longitude": long,
                "daily": "weathercode,temperature_2m_max",
                "timezone": "Europe/London",
                "forecast_days": 14
            }

            data = get_json(FORECAST_BASE_URL, params)

            if "daily" in data and "time" in data["daily"] and "temperature_2m_max" in data["daily"]:
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

                city.forecast = weeks
                city.temperature_moyenne = round(temp_moy / len(days), 1)
                all_cities.append(city)
                print(f"OK: {city_name} ({country_code})")
            else:
                print(f"Pas de données météo pour {city_name}.")

    return all_cities


def obj_dict(obj):
    if hasattr(obj, "__dict__"):
        return obj.__dict__
    else:
        return str(obj)


if __name__ == "__main__":
    print("Récupération des données météo...")
    weather_data = get_forecasts()
    print(f"\n{len(weather_data)} villes récupérées.")

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(weather_data, f, default=obj_dict, indent=4, ensure_ascii=False)

    print(f"Données écrites dans : {OUTPUT_PATH}")
