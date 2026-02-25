// src/setupTests.js
import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', 'pk.test-token-from-vitest-stub')

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    }
  }

// Mock mapbox-gl to prevent DOM errors during tests
vi.mock('mapbox-gl', () => {
  const mapboxgl = {
    Map: vi.fn(function () {
      return {
        remove: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        addControl: vi.fn(),
        flyTo: vi.fn(),
        setCenter: vi.fn(),
        setZoom: vi.fn(),
        getSource: vi.fn(),
        addSource: vi.fn(),
        addLayer: vi.fn(),
        getStyle: vi.fn(() => ({ layers: [] })),
        setLayoutProperty: vi.fn(),
      }
    }),
    NavigationControl: vi.fn(),
    Marker: vi.fn(function () {
      return {
        setLngLat: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
      }
    }),
    supported: vi.fn(() => true),
    accessToken: 'pk.test-token',
  }
  return { __esModule: true, default: mapboxgl, ...mapboxgl }
})

// Mock react-map-gl/mapbox (v8 entry point for Mapbox GL)
vi.mock('react-map-gl/mapbox', () => ({
  default: vi.fn(() => null),
  Map: vi.fn(() => null),
  Marker: vi.fn(() => null),
  Source: vi.fn(() => null),
  Layer: vi.fn(() => null),
  NavigationControl: vi.fn(() => null),
}))

// Mock react-scrollama
vi.mock('react-scrollama', () => ({
  Scrollama: vi.fn(({ children }) => children),
  Step: vi.fn(({ children }) => children),
}))
