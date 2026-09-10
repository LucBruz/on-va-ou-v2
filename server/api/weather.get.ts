// data.json est importe au build : en production le serveur Nitro tourne
// depuis .output/ et n'a pas acces au dossier public/ du depot, donc une
// lecture disque via process.cwd() echoue (500).
import data from '../../public/data.json'

export default defineEventHandler(() => data)
