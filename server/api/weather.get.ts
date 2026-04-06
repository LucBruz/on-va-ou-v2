import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineEventHandler(() => {
  // Read the static data.json from the public directory
  const filePath = resolve(process.cwd(), 'public', 'data.json')
  const raw = readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
})
