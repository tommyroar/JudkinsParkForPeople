# JudkinsParkForPeople

Pedestrian safety & traffic calming advocacy for the 20th Ave S corridor near Judkins Park Light Rail Station (opened March 2026).

**Live site:** https://judkinsparkforpeople.org
**Staging:** https://judkinsparkforpeople.org/staging/

---

## Collision Data

**Source:** [SDOT Collisions All Years](https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::sdot-collisions-all-years) — City of Seattle Open Data Portal
**Service URL:** `https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/SDOT_Collisions_All_Years/FeatureServer/0/query`

### Query Parameters

| Parameter | Value |
|---|---|
| `where` | `INCDTTM >= '2015-01-01' AND (INJURIES > 0 OR FATALITIES > 0)` |
| `geometry` | `xmin: -122.318, ymin: 47.582, xmax: -122.289, ymax: 47.611` (1-mile corridor bbox) |
| `geometryType` | `esriGeometryEnvelope` |
| `spatialRel` | `esriSpatialRelIntersects` |
| `outFields` | `INJURIES, SERIOUSINJURIES, FATALITIES, PEDCOUNT` |
| `outSR` | `4326` |
| `f` | `geojson` |

**Note:** The `where` clause includes both `INJURIES > 0` and `FATALITIES > 0` to ensure fatal-only crashes (where `INJURIES = 0`) are not excluded. These are separate fields in the SDOT schema — a fatality does not increment the `INJURIES` count.

### Field Definitions

| Field | Description |
|---|---|
| `INJURIES` | Count of non-fatal injuries in the crash |
| `SERIOUSINJURIES` | Count of serious (incapacitating) injuries |
| `FATALITIES` | Count of deaths in the crash |
| `PEDCOUNT` | Count of pedestrians involved in the crash |

### Narrative Statistics (Chapter 2 — "A Decade of Harm", 2015–2025)

All figures are derived from the query above applied to the 1-mile corridor bounding box.

| Statistic | Value | Filter |
|---|---|---|
| Total collisions | **8,794** | All records returned |
| Total killed | **17** | Sum of `FATALITIES` |
| Seriously injured | **247** | Sum of `SERIOUSINJURIES` |
| Pedestrian crashes | **264** | Records where `PEDCOUNT > 0` |
| Pedestrians killed | **10** | Records where `PEDCOUNT > 0 AND FATALITIES > 0` |
| Pedestrians seriously injured | **40** | Records where `PEDCOUNT > 0 AND SERIOUSINJURIES > 0` |

### Map Layer Filters

| Layer | Mapbox Filter | Color / Icon |
|---|---|---|
| All injury crashes (circles) | `FATALITIES == 0` | Yellow (`PEDCOUNT > 0`), Orange (`SERIOUSINJURIES > 0`), Blue (other) |
| Pedestrian fatalities (icons) | `FATALITIES > 0 AND PEDCOUNT > 0` | Custom `ped-fatality` symbol |
