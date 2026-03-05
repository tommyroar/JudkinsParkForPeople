import { useState, useCallback, useRef, useEffect } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox'
import { Scrollama, Step } from 'react-scrollama'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Train, AlertTriangle, RotateCcw, ArrowUp, ChevronsLeftRight } from 'lucide-react'
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
      className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 md:p-8 border border-white/60 max-w-md w-full"
    >
      <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4" style={{ color: '#1e3a8a' }}>
        {chapter.title}
      </h1>
      <div className="text-gray-700 text-sm leading-snug md:leading-relaxed prose max-w-none">
        <ReactMarkdown components={MD_COMPONENTS}>{chapter.content}</ReactMarkdown>
      </div>
      <p className="mt-5 text-xs text-gray-400 font-medium tracking-wide">Scroll to explore the proposal ↓</p>
    </motion.div>
  )
}

function PhotoSlider({ photos }) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [pos, setPos] = useState(50)
  const containerRef = useRef(null)
  const dragging = useRef(false)
  const source = photos[0]
  const overlays = photos.slice(1)
  const overlay = overlays[selectedIdx]

  const updatePos = useCallback((clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setPos(Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)))
  }, [])

  useEffect(() => {
    const onMove = (e) => { if (dragging.current) updatePos(e.clientX) }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [updatePos])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onTouchMove = (e) => { if (dragging.current) { e.preventDefault(); updatePos(e.touches[0].clientX) } }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [updatePos])

  const selectOverlay = (i) => { setSelectedIdx(i); setPos(50) }

  return (
    <div className="mt-4">
      <div
        ref={containerRef}
        className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 select-none cursor-ew-resize"
        onMouseDown={(e) => { dragging.current = true; updatePos(e.clientX) }}
        onTouchStart={(e) => { dragging.current = true; updatePos(e.touches[0].clientX) }}
        onTouchEnd={() => { dragging.current = false }}
      >
        {/* Right side: overlay/modification (full frame) */}
        <img src={overlay.src} alt={overlay.alt ?? ''} className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
        {/* Left side: aerial source (clipped to left of handle) */}
        <img src={source.src} alt={source.alt ?? ''} className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
        {/* Divider + handle */}
        <div className="absolute top-0 bottom-0 w-px bg-white/90 shadow-[0_0_6px_rgba(0,0,0,0.5)] pointer-events-none z-10" style={{ left: `${pos}%` }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center">
            <ChevronsLeftRight size={15} strokeWidth={2.5} className="text-gray-600" />
          </div>
        </div>
        {/* Corner labels */}
        <span className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded pointer-events-none">{source.alt}</span>
        <span className="absolute bottom-2 right-2 text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded pointer-events-none">{overlay.alt}</span>
      </div>
      {overlays.length > 1 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {overlays.map((o, i) => (
            <button
              key={i}
              onClick={() => selectOverlay(i)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                i === selectedIdx
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-900 hover:text-blue-900'
              }`}
            >
              {o.alt}
            </button>
          ))}
        </div>
      )}
    </div>
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
      className="backdrop-blur-md rounded-2xl shadow-xl p-3 md:p-6 border border-white/60 max-w-sm w-full"
    >
      {!chapter.showCollisionPoints && (
        <>
          <div
            className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full mb-2 md:mb-3 shadow-sm"
            style={{ backgroundColor: chapter.color }}
          >
            <Icon size={16} color="white" strokeWidth={2} className="md:hidden" />
            <Icon size={20} color="white" strokeWidth={2} className="hidden md:block" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: chapter.color }}>
            {chapter.subtitle}
          </p>
        </>
      )}
      <h2 className="text-base md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{chapter.title}</h2>
      <div className="text-gray-700 text-xs md:text-sm leading-snug md:leading-relaxed prose prose-sm max-w-none">
        <ReactMarkdown components={MD_COMPONENTS}>{chapter.content}</ReactMarkdown>
      </div>
      {chapter.photos?.length > 0 && <PhotoSlider photos={chapter.photos} />}
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
    { label: 'All traffic injuries', color: '#3b82f6' },
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
        // First leg: quick transition in (800ms); subsequent legs: scenic flight (3000ms each)
        const flyNext = (idx) => {
          if (idx >= states.length) return
          const s = states[idx]
          mapRef.current?.flyTo({
            center: [s.longitude, s.latitude],
            zoom: s.zoom,
            pitch: s.pitch,
            bearing: s.bearing,
            duration: idx === 0 ? 800 : 3000,
            essential: true,
          })
          if (idx < states.length - 1) {
            mapRef.current?.getMap().once('moveend', () => flyNext(idx + 1))
          }
        }
        flyNext(0)
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
  const collisionOpacity = showCollisionPoints ? 1 : (activeChapterIdx >= 2 && activeChapterIdx <= 6) ? 0.75 : 0
  const collisionPointsVisible = collisionOpacity > 0
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
          {collisionPointsVisible && collisionGeoJSON && (
            <Source id="collisions" type="geojson" data={collisionGeoJSON}>
              {/* Other (non-ped, non-serious) injuries: rendered beneath */}
              <Layer
                id="collision-circles-other"
                type="circle"
                filter={['all', ['==', ['get', 'FATALITIES'], 0], ['==', ['get', 'PEDCOUNT'], 0], ['==', ['get', 'SERIOUSINJURIES'], 0]]}
                paint={{
                  'circle-radius': 5,
                  'circle-color': '#3b82f6',
                  'circle-opacity': collisionPointsVisible ? 0.5 : 0,
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#ffffff',
                  'circle-stroke-opacity': collisionPointsVisible ? 0.4 : 0,
                }}
              />
              {/* Pedestrian + serious injury collisions: circles */}
              <Layer
                id="collision-circles"
                type="circle"
                filter={['all', ['==', ['get', 'FATALITIES'], 0], ['any', ['>', ['get', 'PEDCOUNT'], 0], ['>', ['get', 'SERIOUSINJURIES'], 0]]]}
                paint={{
                  'circle-radius': 8,
                  'circle-color': [
                    'case',
                    ['>', ['get', 'PEDCOUNT'], 0], '#eab308',
                    '#ea580c',
                  ],
                  'circle-opacity': 0.8 * collisionOpacity,
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#ffffff',
                  'circle-stroke-opacity': 0.6 * collisionOpacity,
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
                paint={{
                  'icon-opacity': collisionOpacity,
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
              <section className="min-h-screen flex items-end md:items-center pb-4 md:py-16 px-3 md:px-12">
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
