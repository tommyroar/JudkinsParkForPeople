#!/usr/bin/env node
/**
 * One-time script to snapshot SDOT collision data as a static GeoJSON file.
 * Run: node app/scripts/fetch-collisions.mjs
 */
import { writeFileSync } from 'node:fs'

const PAGE = 500
const base = 'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/SDOT_Collisions_All_Years/FeatureServer/0/query'

const params = new URLSearchParams({
  where: "INCDTTM >= '2015-01-01' AND (INJURIES > 0 OR FATALITIES > 0)",
  geometry: JSON.stringify({ xmin: -122.318, ymin: 47.582, xmax: -122.289, ymax: 47.611 }),
  geometryType: 'esriGeometryEnvelope',
  inSR: '4326',
  spatialRel: 'esriSpatialRelIntersects',
  outFields: 'INJURIES,SERIOUSINJURIES,FATALITIES,PEDCOUNT',
  returnGeometry: 'true',
  outSR: '4326',
  f: 'geojson',
  resultRecordCount: String(PAGE),
})

const features = []
let offset = 0
while (true) {
  params.set('resultOffset', String(offset))
  const res = await fetch(`${base}?${params}`)
  const json = await res.json()
  const page = json.features ?? []
  features.push(...page)
  console.log(`Fetched ${features.length} features...`)
  if (page.length < PAGE) break
  offset += PAGE
}

const out = new URL('../chapters/02-data/collisions.geojson', import.meta.url)
writeFileSync(out, JSON.stringify({ type: 'FeatureCollection', features }))
console.log(`Wrote ${features.length} features to ${out.pathname}`)
