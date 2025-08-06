import { afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'

// Global test setup for Think Tank Technologies Installation Scheduler

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock environment variables
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock window.scrollTo
  Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
    writable: true
  })

  // Mock Leaflet (for map components)
  vi.mock('leaflet', () => ({
    map: vi.fn(),
    tileLayer: vi.fn(),
    marker: vi.fn(),
    icon: vi.fn(),
    divIcon: vi.fn(),
    latLng: vi.fn(),
    latLngBounds: vi.fn(),
  }))

  // Mock React Leaflet
  vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: () => <div data-testid="marker" />,
    Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
    useMap: () => ({
      setView: vi.fn(),
      fitBounds: vi.fn(),
    }),
  }))

  // Mock Chart.js
  vi.mock('chart.js', () => ({
    Chart: {
      register: vi.fn(),
    },
    CategoryScale: vi.fn(),
    LinearScale: vi.fn(),
    BarElement: vi.fn(),
    Title: vi.fn(),
    Tooltip: vi.fn(),
    Legend: vi.fn(),
  }))

  // Mock react-chartjs-2
  vi.mock('react-chartjs-2', () => ({
    Bar: () => <div data-testid="bar-chart" />,
    Line: () => <div data-testid="line-chart" />,
    Pie: () => <div data-testid="pie-chart" />,
  }))

  // Mock file-saver
  vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
  }))

  // Mock ExcelJS
  vi.mock('exceljs', () => ({
    default: {
      Workbook: vi.fn().mockImplementation(() => ({
        xlsx: {
          load: vi.fn(),
          writeBuffer: vi.fn(),
        },
        worksheets: [
          {
            eachRow: vi.fn(),
          }
        ],
        addWorksheet: vi.fn().mockReturnValue({
          addRow: vi.fn(),
          getRow: vi.fn().mockReturnValue({
            font: {},
            fill: {},
          }),
        }),
      })),
    },
  }))

  // Mock csv-parser
  vi.mock('csv-parser', () => vi.fn())

  // Mock Supabase
  vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
        update: vi.fn(() => Promise.resolve({ data: [], error: null })),
        delete: vi.fn(() => Promise.resolve({ data: [], error: null })),
        upsert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        signIn: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(),
      },
    })),
  }))

  // Mock PDF generation libraries
  vi.mock('jspdf', () => ({
    default: vi.fn().mockImplementation(() => ({
      text: vi.fn(),
      save: vi.fn(),
      addPage: vi.fn(),
      setFontSize: vi.fn(),
    })),
  }))

  vi.mock('html2canvas', () => ({
    default: vi.fn(() => Promise.resolve({
      toDataURL: vi.fn(() => 'data:image/png;base64,test'),
    })),
  }))

  // Mock date-fns
  vi.mock('date-fns', () => ({
    format: vi.fn((date) => date.toISOString()),
    isValid: vi.fn(() => true),
    parseISO: vi.fn((str) => new Date(str)),
    startOfDay: vi.fn((date) => date),
    endOfDay: vi.fn((date) => date),
    addDays: vi.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
    subDays: vi.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  }))

  // Mock window.location
  delete (window as any).location
  window.location = {
    ...window.location,
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    href: 'http://localhost:3000',
  }

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  global.localStorage = localStorageMock

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  global.sessionStorage = sessionStorageMock

  // Mock fetch
  global.fetch = vi.fn(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      status: 200,
      statusText: 'OK',
    })
  ) as any

  // Console error suppression for known warnings
  const originalError = console.error
  console.error = (...args: any[]) => {
    const message = args[0]
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render is no longer supported') ||
       message.includes('Warning: componentWillReceiveProps has been renamed') ||
       message.includes('act(...) is not supported in production builds'))
    ) {
      return
    }
    originalError.apply(console, args)
  }
})

// Global test utilities
export const createMockFile = (name: string, content: string, type: string = 'text/plain') => {
  return new File([content], name, { type })
}

export const createMockEvent = (type: string, properties: Record<string, any> = {}) => {
  return {
    type,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: {
      value: '',
      ...properties.target,
    },
    ...properties,
  }
}

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

export const mockConsoleError = () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  return spy
}

export const mockConsoleWarn = () => {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  return spy
}