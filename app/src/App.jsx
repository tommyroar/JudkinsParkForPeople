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

// Fetches all injury collision points (2015–present) within the 1-mile corridor bbox
async function fetchCollisionPoints() {
  const base = 'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/SDOT_Collisions_All_Years/FeatureServer/0/query'
  const PAGE = 500
  const params = new URLSearchParams({
    where: "INCDTTM >= '2015-01-01' AND INJURIES > 0",
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
  { label: 'HAWK Signal', color: '#16a34a', icon: AlertTriangle },
  { label: 'Roundabout', color: '#1e3a8a', icon: RotateCcw },
  { label: 'Light Rail', color: '#7c3aed', icon: Train },
]

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
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-5 py-3 rounded-full shadow-xl font-semibold text-sm text-white tracking-wide"
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
    if (!map) return
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, w, h)
      const d = imageData.data
      const bgR = d[0], bgG = d[1], bgB = d[2]
      const TOL = 40
      const visited = new Uint8Array(w * h)
      const queue = [0, w - 1, (h - 1) * w, (h - 1) * w + w - 1]
      let qi = 0
      while (qi < queue.length) {
        const idx = queue[qi++]
        if (visited[idx]) continue
        visited[idx] = 1
        const pi = idx * 4
        if (Math.abs(d[pi] - bgR) + Math.abs(d[pi + 1] - bgG) + Math.abs(d[pi + 2] - bgB) > TOL) continue
        d[pi + 3] = 0
        const x = idx % w, y = Math.floor(idx / w)
        if (x > 0) queue.push(idx - 1)
        if (x < w - 1) queue.push(idx + 1)
        if (y > 0) queue.push(idx - w)
        if (y < h - 1) queue.push(idx + w)
      }
      if (!map.hasImage('ped-fatality')) map.addImage('ped-fatality', imageData)
    }
    img.src = '/icons/ped-fatality.png'
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
      mapRef.current.flyTo({
        center: [chapter.mapState.longitude, chapter.mapState.latitude],
        zoom: chapter.mapState.zoom,
        pitch: chapter.mapState.pitch,
        bearing: chapter.mapState.bearing,
        duration: 1800,
        essential: true,
      })
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
                filter={['>', ['get', 'FATALITIES'], 0]}
                layout={{
                  'icon-image': 'ped-fatality',
                  'icon-size': 0.03,
                  'icon-allow-overlap': true,
                  'icon-anchor': 'bottom',
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
      <ReturnToStartButton visible={showReturnButton} onReturn={handleReturn} />

      {/* Scrollytelling story track */}
      <div className="relative z-10">
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
