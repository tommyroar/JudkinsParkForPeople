import { useState, useCallback, useRef } from 'react'
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/mapbox'
import { Scrollama, Step } from 'react-scrollama'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Train, AlertTriangle, RotateCcw, Trees, Navigation, MapPin } from 'lucide-react'

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

const CHAPTERS = [
  {
    id: 'mission',
    type: 'intro',
    title: 'Judkins Park For People',
    content:
      'The **Judkins Park Light Rail Station** opens March 28, 2026 — bringing thousands of daily riders to one of Seattle\'s most vibrant neighborhoods.\n\nBut the streets around it were built for cars. **This is a proposal to change that.**',
    mapState: { longitude: -122.3052, latitude: 47.5988, zoom: 13.5, pitch: 0, bearing: 0 },
  },
  {
    id: 'gateway',
    type: 'chapter',
    title: '20th Ave S Gateway',
    subtitle: 'Entry Point: S Jackson St',
    content:
      'S Jackson Street is the commercial heart of the Central District. Today, 20th Ave S funnels cut-through car traffic at speed through a walkable neighborhood.\n\nProposal: Restrict turn movements, add a **protected crossing**, and widen sidewalks to match the new foot traffic from light rail.',
    icon: Navigation,
    color: '#ea580c',
    mapState: { longitude: -122.3067, latitude: 47.6037, zoom: 16.5, pitch: 50, bearing: 10 },
    marker: { longitude: -122.3067, latitude: 47.6037 },
  },
  {
    id: 'school',
    type: 'chapter',
    title: 'School Safety Zone',
    subtitle: 'HAWK Signal \u2022 20th Ave S & S Weller St',
    content:
      '**Hamlin Robinson School** serves students with dyslexia. Families cross 20th Ave S every day — on foot and by bike — with no protected crossing.\n\nProposal: A **HAWK signal** (High-Intensity Activated Crosswalk) — the same proven technology protecting school zones citywide.',
    icon: AlertTriangle,
    color: '#16a34a',
    mapState: { longitude: -122.3058, latitude: 47.6012, zoom: 17, pitch: 45, bearing: -15 },
    marker: { longitude: -122.3058, latitude: 47.6012 },
  },
  {
    id: 'station',
    type: 'chapter',
    title: 'Station Access',
    subtitle: 'HAWK Signal \u2022 21st Ave S & S Judkins St',
    content:
      'The new **Judkins Park Light Rail Station** sits at the foot of the I-90 lid. The nearest safe crossing is over 200 feet from the platform entrance — an unacceptable gap for a busy transit hub.\n\nProposal: A **HAWK signal** at 21st Ave S creates a direct, protected path from the corridor to the platform.',
    icon: Train,
    color: '#7c3aed',
    mapState: { longitude: -122.3035, latitude: 47.5966, zoom: 16.5, pitch: 55, bearing: -25 },
    marker: { longitude: -122.3035, latitude: 47.5929 },
  },
  {
    id: 'dearborn',
    type: 'chapter',
    title: 'Flow Control',
    subtitle: 'Roundabout \u2022 20th Ave S & S Dearborn St',
    content:
      '20th & Dearborn is a high-speed cut-through for I-90 traffic. This residential block carries thousands of vehicles daily, threatening families walking to Jefferson Park and Garfield High School.\n\nProposal: A **mini-roundabout** to slow speeds, eliminate signal wait times, and free curb space for planted buffers.',
    icon: RotateCcw,
    color: '#1e3a8a',
    mapState: { longitude: -122.3050, latitude: 47.5991, zoom: 17, pitch: 40, bearing: 20 },
    marker: { longitude: -122.3050, latitude: 47.5991 },
  },
  {
    id: 'park',
    type: 'chapter',
    title: 'Park Integration',
    subtitle: 'Roundabout \u2022 20th Ave S & S Charles St',
    content:
      '**Judkins Park** is home to Umoja Fest, community gardens, and one of the city\'s most beloved playgrounds. The park entrance at 20th & Charles is easy to miss at speed.\n\nProposal: A **signature roundabout** with public art and a planted median to calm traffic and celebrate this community anchor.',
    icon: Trees,
    color: '#16a34a',
    mapState: { longitude: -122.3044, latitude: 47.5965, zoom: 17, pitch: 35, bearing: -10 },
    marker: { longitude: -122.3044, latitude: 47.5965 },
  },
  {
    id: 'blueprint',
    type: 'chapter',
    title: 'The Full Blueprint',
    subtitle: 'A Complete Transit Portal',
    content:
      'Five targeted interventions. One coherent vision.\n\n**20th Ave S** becomes a **Transit Portal** — calm, safe, and welcoming — connecting the Central District to the new light rail era.\n\nTwo HAWK signals. Two roundabouts. One redesigned gateway.',
    icon: MapPin,
    color: '#1e3a8a',
    mapState: { longitude: -122.3052, latitude: 47.5988, zoom: 14.5, pitch: 30, bearing: 0 },
    showCorridor: true,
  },
]

const LEGEND = [
  { label: 'HAWK Signal', color: '#16a34a', icon: AlertTriangle },
  { label: 'Roundabout', color: '#1e3a8a', icon: RotateCcw },
  { label: 'Light Rail', color: '#7c3aed', icon: Train },
]

function IntroCard({ chapter }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/60 max-w-md w-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: '#1e3a8a' }} />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Advocacy Initiative</span>
      </div>
      <h1 className="text-3xl font-bold mb-4" style={{ color: '#1e3a8a' }}>
        {chapter.title}
      </h1>
      <div className="text-gray-700 leading-relaxed prose max-w-none">
        <ReactMarkdown>{chapter.content}</ReactMarkdown>
      </div>
      <p className="mt-5 text-xs text-gray-400 font-medium tracking-wide">Scroll to explore the proposal ↓</p>
    </motion.div>
  )
}

function ChapterCard({ chapter }) {
  const Icon = chapter.icon
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white/85 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/60 max-w-sm w-full"
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full mb-3 shadow-sm"
        style={{ backgroundColor: chapter.color }}
      >
        <Icon size={20} color="white" strokeWidth={2} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: chapter.color }}>
        {chapter.subtitle}
      </p>
      <h2 className="text-xl font-bold text-gray-900 mb-3">{chapter.title}</h2>
      <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
        <ReactMarkdown>{chapter.content}</ReactMarkdown>
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

export default function App() {
  const [activeChapterId, setActiveChapterId] = useState(CHAPTERS[0].id)
  const mapRef = useRef(null)

  const handleStepEnter = useCallback(({ data }) => {
    const chapter = CHAPTERS.find(c => c.id === data)
    if (!chapter) return
    setActiveChapterId(chapter.id)
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

  const activeChapter = CHAPTERS.find(c => c.id === activeChapterId) ?? CHAPTERS[0]
  const showCorridor = activeChapter?.showCorridor ?? false

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
        >
          <NavigationControl position="top-right" />

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

          {CHAPTERS.filter(c => c.marker).map(chapter => {
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

      <Legend />

      {/* Scrollytelling story track */}
      <div className="relative z-10">
        <Scrollama onStepEnter={handleStepEnter} offset={0.5}>
          {CHAPTERS.map(chapter => (
            <Step data={chapter.id} key={chapter.id}>
              <section className="min-h-screen flex items-center px-6 md:px-12 py-16">
                <AnimatePresence>
                  {activeChapter.id === chapter.id &&
                    (chapter.type === 'intro' ? (
                      <IntroCard key={chapter.id} chapter={chapter} />
                    ) : (
                      <ChapterCard key={chapter.id} chapter={chapter} />
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
