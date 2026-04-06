export type CityTag = 'balneaire' | 'randonnee' | 'tourisme' | 'montagne'

export interface CityMeta {
  name: string
  country: string
  tags: CityTag[]
}

export const CITIES_META: CityMeta[] = [
  // France
  { name: 'Paris', country: 'FR', tags: ['tourisme'] },
  { name: 'Nice', country: 'FR', tags: ['balneaire', 'tourisme'] },
  { name: 'Lyon', country: 'FR', tags: ['tourisme'] },
  { name: 'Bordeaux', country: 'FR', tags: ['tourisme'] },
  { name: 'Marseille', country: 'FR', tags: ['balneaire'] },
  { name: 'Strasbourg', country: 'FR', tags: ['tourisme'] },
  { name: 'Lille', country: 'FR', tags: ['tourisme'] },
  { name: 'Toulouse', country: 'FR', tags: ['tourisme'] },
  { name: 'Nantes', country: 'FR', tags: ['tourisme'] },
  { name: 'Montpellier', country: 'FR', tags: ['balneaire', 'tourisme'] },
  { name: 'Biarritz', country: 'FR', tags: ['balneaire', 'randonnee'] },
  { name: 'La Rochelle', country: 'FR', tags: ['balneaire', 'tourisme'] },
  { name: 'Rennes', country: 'FR', tags: ['tourisme'] },
  { name: 'Annecy', country: 'FR', tags: ['montagne', 'randonnee', 'tourisme'] },
  { name: 'Grenoble', country: 'FR', tags: ['montagne', 'randonnee'] },
  { name: 'Avignon', country: 'FR', tags: ['tourisme'] },
  { name: 'Cannes', country: 'FR', tags: ['balneaire', 'tourisme'] },
  { name: 'Saint-Tropez', country: 'FR', tags: ['balneaire'] },
  { name: 'Dijon', country: 'FR', tags: ['tourisme'] },
  { name: 'Reims', country: 'FR', tags: ['tourisme'] },
  { name: 'Rouen', country: 'FR', tags: ['tourisme'] },
  { name: 'Nancy', country: 'FR', tags: ['tourisme'] },
  { name: 'Nimes', country: 'FR', tags: ['tourisme'] },
  { name: 'Arles', country: 'FR', tags: ['tourisme'] },
  { name: 'Metz', country: 'FR', tags: ['tourisme'] },
  { name: 'Carcassonne', country: 'FR', tags: ['tourisme'] },
  { name: 'Versailles', country: 'FR', tags: ['tourisme'] },
  { name: 'Tours', country: 'FR', tags: ['tourisme'] },
  { name: 'Amiens', country: 'FR', tags: ['tourisme'] },
  { name: 'Aix-en-Provence', country: 'FR', tags: ['tourisme', 'balneaire'] },
  // Belgique
  { name: 'Bruxelles', country: 'BE', tags: ['tourisme'] },
  { name: 'Bruges', country: 'BE', tags: ['tourisme'] },
  { name: 'Gand', country: 'BE', tags: ['tourisme'] },
  { name: 'Anvers', country: 'BE', tags: ['tourisme'] },
  { name: 'Liège', country: 'BE', tags: ['tourisme'] },
  { name: 'Namur', country: 'BE', tags: ['tourisme'] },
  // Suisse
  { name: 'Genève', country: 'CH', tags: ['tourisme', 'montagne'] },
  { name: 'Lausanne', country: 'CH', tags: ['tourisme'] },
  { name: 'Berne', country: 'CH', tags: ['tourisme'] },
  { name: 'Bâle', country: 'CH', tags: ['tourisme'] },
  { name: 'Zurich', country: 'CH', tags: ['tourisme'] },
  { name: 'Lucerne', country: 'CH', tags: ['tourisme', 'randonnee'] },
  { name: 'Lugano', country: 'CH', tags: ['balneaire', 'tourisme'] },
  // Italie
  { name: 'Milan', country: 'IT', tags: ['tourisme'] },
  { name: 'Turin', country: 'IT', tags: ['tourisme', 'montagne'] },
  { name: 'Gênes', country: 'IT', tags: ['balneaire', 'tourisme'] },
  { name: 'Aoste', country: 'IT', tags: ['montagne', 'randonnee'] },
  { name: 'Côme', country: 'IT', tags: ['balneaire', 'tourisme'] },
  { name: 'Vérone', country: 'IT', tags: ['tourisme'] },
  { name: 'Venise', country: 'IT', tags: ['tourisme'] },
  // Espagne
  { name: 'Barcelone', country: 'ES', tags: ['balneaire', 'tourisme'] },
  { name: 'Saint-Sébastien', country: 'ES', tags: ['balneaire', 'tourisme'] },
  { name: 'Pampelune', country: 'ES', tags: ['tourisme', 'randonnee'] },
  { name: 'Bilbao', country: 'ES', tags: ['tourisme'] },
  { name: 'Gérone', country: 'ES', tags: ['tourisme'] },
  // Allemagne
  { name: 'Munich', country: 'DE', tags: ['tourisme', 'montagne'] },
  { name: 'Fribourg-en-Brisgau', country: 'DE', tags: ['tourisme', 'randonnee'] },
  { name: 'Stuttgart', country: 'DE', tags: ['tourisme'] },
  { name: 'Francfort', country: 'DE', tags: ['tourisme'] },
  { name: 'Cologne', country: 'DE', tags: ['tourisme'] },
]
