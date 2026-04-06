import type { CityTag } from '~/data/cities'

export interface DailyForecast {
  date: string
  weather_code: number
  temperature: number
}

export interface WeekForecast {
  semaine: 1 | 2
  daily: DailyForecast[]
}

export interface CityWeather {
  name: string
  country: string  // 'FR' | 'BE' | 'CH' | 'IT' | 'ES' | 'DE'
  type: CityTag[]
  lat: number
  long: number
  temperature_moyenne: number
  forecast: WeekForecast[]
}

export interface CityProposition {
  name: string
  country: string
  type: CityTag[]
  lat: number
  long: number
  temperature_moyenne: number
  semaine1: { temperatures: number[]; codes: number[]; dates: string[] }
  semaine2: { temperatures: number[]; codes: number[]; dates: string[] }
  semaineSelectionnee: 1 | 2
  distance?: number
}
