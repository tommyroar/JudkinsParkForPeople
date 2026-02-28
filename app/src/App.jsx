import { useState, useCallback, useRef, useEffect } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox'
import { Scrollama, Step } from 'react-scrollama'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Train, AlertTriangle, RotateCcw, ArrowUp } from 'lucide-react'
import { CHAPTERS } from './chapters.js'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

// 20th Ave S corridor — S Jackson to S Grand
const CORRIDOR_GEOJSON = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [-122.3067, 47.6037], // S Jackson St
      [-122.3058, 47.6012], // S Weller St
      [-122.3050, 47.5991], // S Dearborn St
      [-122.3044, 47.5965], // S Charles St
      [-122.3040, 47.5945], // S Grand St
    ],
  },
}

// Fetches all injury and fatality collision points (2015–present) within the 1-mile corridor bbox
async function fetchCollisionPoints() {
  const base = 'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/SDOT_Collisions_All_Years/FeatureServer/0/query'
  const PAGE = 500
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
  let done = false
  while (!done) {
    params.set('resultOffset', String(offset))
    const res = await fetch(`${base}?${params}`)
    const json = await res.json()
    const page = json.features ?? []
    features.push(...page)
    if (page.length < PAGE) done = true
    else offset += PAGE
  }
  return { type: 'FeatureCollection', features }
}

const LEGEND = [
  { label: 'RRFB', color: '#16a34a', icon: AlertTriangle },
  { label: 'Roundabout', color: '#1e3a8a', icon: RotateCcw },
  { label: 'Light Rail', color: '#7c3aed', icon: Train },
]

// Skull-in-circle SVG icon for pedestrian fatality map markers and legend
const SKULL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="19" fill="#dc2626" stroke="white" stroke-width="2"/>
  <ellipse cx="20" cy="17" rx="10" ry="11" fill="white"/>
  <ellipse cx="16" cy="17" rx="2.8" ry="3.2" fill="#dc2626"/>
  <ellipse cx="24" cy="17" rx="2.8" ry="3.2" fill="#dc2626"/>
  <ellipse cx="20" cy="21.5" rx="1.8" ry="2" fill="#dc2626"/>
  <rect x="12" y="24" width="16" height="6" rx="2" fill="white"/>
  <rect x="14" y="24" width="2.5" height="5" fill="#dc2626"/>
  <rect x="18.75" y="24" width="2.5" height="5" fill="#dc2626"/>
  <rect x="23.5" y="24" width="2.5" height="5" fill="#dc2626"/>
</svg>`

const MD_COMPONENTS = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
      {children}
    </a>
  ),
}

function IntroCard({ chapter }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/60 max-w-md w-full"
    >
      <h1 className="text-3xl font-bold mb-4" style={{ color: '#1e3a8a' }}>
        {chapter.title}
      </h1>
      <div className="text-gray-700 leading-relaxed prose max-w-none">
        <ReactMarkdown components={MD_COMPONENTS}>{chapter.content}</ReactMarkdown>
      </div>
      <p className="mt-5 text-xs text-gray-400 font-medium tracking-wide">Scroll to explore the proposal ↓</p>
    </motion.div>
  )
}

function ChapterCard({ chapter, progress = 1 }) {
  const Icon = chapter.icon
  const bgOpacity = chapter.showCollisionPoints ? progress * 0.65 : 0.85
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ backgroundColor: `rgba(255,255,255,${bgOpacity})` }}
      className="backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/60 max-w-sm w-full"
    >
      {!chapter.showCollisionPoints && (
        <>
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full mb-3 shadow-sm"
            style={{ backgroundColor: chapter.color }}
          >
            <Icon size={20} color="white" strokeWidth={2} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: chapter.color }}>
            {chapter.subtitle}
          </p>
        </>
      )}
      <h2 className="text-xl font-bold text-gray-900 mb-3">{chapter.title}</h2>
      <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
        <ReactMarkdown components={MD_COMPONENTS}>{chapter.content}</ReactMarkdown>
      </div>
    </motion.div>
  )
}

function Legend() {
  return (
    <div className="fixed bottom-6 right-6 z-20 bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-3 border border-white/60">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Proposals</p>
      {LEGEND.map(({ label, color, icon: Icon }) => (
        <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          >
            <Icon size={12} color="white" strokeWidth={2.5} />
          </div>
          <span className="text-xs text-gray-700 font-medium">{label}</span>
        </div>
      ))}
    </div>
  )
}

function CollisionLegend() {
  const ITEMS = [
    { label: 'Pedestrian fatality', isSkull: true },
    { label: 'Pedestrian crash', color: '#eab308' },
    { label: 'Serious injury', color: '#ea580c' },
    { label: 'Other injury', color: '#3b82f6' },
  ]
  return (
    <div className="fixed bottom-6 right-6 z-20 bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-3 border border-white/60">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Collisions 2015–2025</p>
      {ITEMS.map(({ label, isSkull, color }) => (
        <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
          {isSkull ? (
            <svg width="20" height="20" viewBox="0 0 40 40" className="flex-shrink-0" aria-hidden="true">
              <circle cx="20" cy="20" r="19" fill="#dc2626" stroke="white" strokeWidth="2"/>
              <ellipse cx="20" cy="17" rx="10" ry="11" fill="white"/>
              <ellipse cx="16" cy="17" rx="2.8" ry="3.2" fill="#dc2626"/>
              <ellipse cx="24" cy="17" rx="2.8" ry="3.2" fill="#dc2626"/>
              <ellipse cx="20" cy="21.5" rx="1.8" ry="2" fill="#dc2626"/>
              <rect x="12" y="24" width="16" height="6" rx="2" fill="white"/>
              <rect x="14" y="24" width="2.5" height="5" fill="#dc2626"/>
              <rect x="18.75" y="24" width="2.5" height="5" fill="#dc2626"/>
              <rect x="23.5" y="24" width="2.5" height="5" fill="#dc2626"/>
            </svg>
          ) : (
            <div
              className="w-5 h-5 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
          )}
          <span className="text-xs text-gray-700 font-medium">{label}</span>
        </div>
      ))}
    </div>
  )
}

function ReturnToStartButton({ visible, onReturn }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="return-to-start"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onClick={onReturn}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-3 rounded-full shadow-xl font-semibold text-sm text-white tracking-wide"
          style={{ backgroundColor: '#1e3a8a' }}
          aria-label="Return to start"
        >
          <ArrowUp size={16} strokeWidth={2.5} />
          Return to start
        </motion.button>
      )}
    </AnimatePresence>
  )
}

const LAST_CHAPTER_ID = CHAPTERS[CHAPTERS.length - 1].id
const FIRST_CHAPTER_ID = CHAPTERS[0].id

export default function App() {
  const [activeChapterId, setActiveChapterId] = useState(CHAPTERS[0].id)
  const [showReturnButton, setShowReturnButton] = useState(false)
  const [collisionGeoJSON, setCollisionGeoJSON] = useState(null)
  const [dataProgress, setDataProgress] = useState(0)
  const mapRef = useRef(null)
  const isReturningRef = useRef(false)

  useEffect(() => {
    fetchCollisionPoints().then(setCollisionGeoJSON).catch(console.error)
  }, [])

  const handleStepProgress = useCallback(({ data, progress }) => {
    if (data === 'data') setDataProgress(progress)
  }, [])

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map || map.hasImage('ped-fatality')) return
    const img = new Image(80, 80)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 80
      canvas.height = 80
      canvas.getContext('2d').drawImage(img, 0, 0, 80, 80)
      map.addImage('ped-fatality', canvas.getContext('2d').getImageData(0, 0, 80, 80), { pixelRatio: 2 })
    }
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SKULL_SVG)}`
  }, [])

  const handleStepEnter = useCallback(({ data }) => {
    // While scrolling back to start, suppress intermediate card animations.
    // Clear the flag once the intro chapter is reached.
    if (isReturningRef.current) {
      if (data === FIRST_CHAPTER_ID) {
        isReturningRef.current = false
        setActiveChapterId(FIRST_CHAPTER_ID)
      }
      return
    }
    const chapter = CHAPTERS.find(c => c.id === data)
    if (!chapter) return
    setActiveChapterId(chapter.id)
    // Hide button when scrolling back into the last chapter
    if (chapter.id === LAST_CHAPTER_ID) {
      setShowReturnButton(false)
    }
    if (mapRef.current) {
      const states = chapter.mapStates
      if (states?.length >= 2) {
        // Jump to start, then chain slow flyTo through each subsequent waypoint
        const [start, ...waypoints] = states
        const segmentDuration = Math.floor(8000 / waypoints.length)
        mapRef.current.jumpTo({
          center: [start.longitude, start.latitude],
          zoom: start.zoom,
          pitch: start.pitch,
          bearing: start.bearing,
        })
        const flyNext = (idx) => {
          if (idx >= waypoints.length) return
          const s = waypoints[idx]
          mapRef.current?.flyTo({
            center: [s.longitude, s.latitude],
            zoom: s.zoom,
            pitch: s.pitch,
            bearing: s.bearing,
            duration: segmentDuration,
            essential: true,
          })
          if (idx < waypoints.length - 1) {
            mapRef.current?.getMap().once('moveend', () => flyNext(idx + 1))
          }
        }
        setTimeout(() => flyNext(0), 150)
      } else {
        mapRef.current.flyTo({
          center: [chapter.mapState.longitude, chapter.mapState.latitude],
          zoom: chapter.mapState.zoom,
          pitch: chapter.mapState.pitch,
          bearing: chapter.mapState.bearing,
          duration: 1800,
          essential: true,
        })
      }
    }
  }, [])

  const handleStepExit = useCallback(({ data, direction }) => {
    // Show button when the last chapter scrolls off the top (user scrolled past it)
    if (data === LAST_CHAPTER_ID && direction === 'down') {
      setShowReturnButton(true)
    }
    // Hide button if the user scrolls back up into the last chapter
    if (data === LAST_CHAPTER_ID && direction === 'up') {
      setShowReturnButton(false)
    }
  }, [])

  const handleReturn = useCallback(() => {
    isReturningRef.current = true
    setShowReturnButton(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const activeChapter = CHAPTERS.find(c => c.id === activeChapterId) ?? CHAPTERS[0]
  const activeChapterIdx = CHAPTERS.findIndex(c => c.id === activeChapterId)
  const showCorridor = activeChapter?.showCorridor ?? false
  const showCollisionPoints = activeChapter?.showCollisionPoints ?? false
  const showProposals = activeChapterIdx >= 2

  return (
    <div className="relative">
      {/* Fixed full-screen map */}
      <div className="fixed inset-0 z-0">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={CHAPTERS[0].mapState}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
        >
          {showCollisionPoints && collisionGeoJSON && (
            <Source id="collisions" type="geojson" data={collisionGeoJSON}>
              {/* All non-fatal collisions: circles */}
              <Layer
                id="collision-circles"
                type="circle"
                filter={['==', ['get', 'FATALITIES'], 0]}
                paint={{
                  'circle-radius': 5,
                  'circle-color': [
                    'case',
                    ['>', ['get', 'PEDCOUNT'], 0], '#eab308',
                    ['>', ['get', 'SERIOUSINJURIES'], 0], '#ea580c',
                    '#3b82f6',
                  ],
                  'circle-opacity': 0.8,
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#ffffff',
                  'circle-stroke-opacity': 0.6,
                }}
              />
              {/* Pedestrian fatalities: custom icon, rendered on top */}
              <Layer
                id="collision-ped-fatality"
                type="symbol"
                filter={['all', ['>', ['get', 'FATALITIES'], 0], ['>', ['get', 'PEDCOUNT'], 0]]}
                layout={{
                  'icon-image': 'ped-fatality',
                  'icon-size': 1,
                  'icon-allow-overlap': true,
                  'icon-anchor': 'center',
                }}
              />
            </Source>
          )}

          {showCorridor && (
            <Source id="corridor" type="geojson" data={CORRIDOR_GEOJSON}>
              <Layer
                id="corridor-line"
                type="line"
                paint={{
                  'line-color': '#1e3a8a',
                  'line-width': 5,
                  'line-opacity': 0.85,
                }}
              />
            </Source>
          )}

          {CHAPTERS.filter(c => c.marker && (c.icon === Train || showProposals)).map(chapter => {
            const Icon = chapter.icon
            const isActive = activeChapterId === chapter.id
            return (
              <Marker
                key={chapter.id}
                longitude={chapter.marker.longitude}
                latitude={chapter.marker.latitude}
                anchor="center"
              >
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-full shadow-lg"
                  style={{
                    backgroundColor: chapter.color,
                    transform: isActive ? 'scale(1.3)' : 'scale(1)',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  <Icon size={17} color="white" strokeWidth={2.5} />
                </div>
              </Marker>
            )
          })}
        </Map>
      </div>

      {showProposals && !showCollisionPoints && <Legend />}
      {showCollisionPoints && <CollisionLegend />}
      <ReturnToStartButton visible={showReturnButton} onReturn={handleReturn} />

      {/* Scrollytelling story track */}
      <div className="relative z-30">
        <Scrollama onStepEnter={handleStepEnter} onStepExit={handleStepExit} onStepProgress={handleStepProgress} offset={0.5}>
          {CHAPTERS.map((chapter) => (
            <Step data={chapter.id} key={chapter.id}>
              <section className="min-h-screen flex items-center py-16 px-6 md:px-12">
                <AnimatePresence>
                  {activeChapter.id === chapter.id &&
                    (chapter.type === 'intro' ? (
                      <IntroCard key={chapter.id} chapter={chapter} />
                    ) : (
                      <ChapterCard key={chapter.id} chapter={chapter} progress={chapter.id === 'data' ? dataProgress : 1} />
                    ))}
                </AnimatePresence>
              </section>
            </Step>
          ))}
        </Scrollama>
        <div className="min-h-screen" />
      </div>
    </div>
  )
}
