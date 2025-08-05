import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ReactElement } from 'react'
import { vi } from 'vitest'

// Test utilities for Think Tank Technologies Installation Scheduler

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  route?: string
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    initialEntries = ['/'],
    route = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  // Wrapper component with all necessary providers
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    )
  }

  return {
    ...render(ui, {
      wrapper: Wrapper,
      ...renderOptions,
    }),
  }
}

// Mock data generators
export const mockInstallationData = (overrides: Partial<any> = {}) => ({
  id: '1',
  customer_name: 'Test Customer',
  address: '123 Test St, Test City, TS 12345',
  installation_type: 'Standard',
  scheduled_date: new Date().toISOString(),
  assigned_technician: 'John Doe',
  status: 'scheduled',
  priority: 'medium',
  estimated_duration: 2,
  equipment_needed: ['Router', 'Cables'],
  notes: 'Test installation',
  coordinates: { lat: 40.7128, lng: -74.0060 },
  ...overrides,
})

export const mockTeamMemberData = (overrides: Partial<any> = {}) => ({
  id: '1',
  name: 'John Doe',
  email: 'john.doe@test.com',
  role: 'technician',
  skills: ['networking', 'installation'],
  availability: {
    monday: { start: '09:00', end: '17:00' },
    tuesday: { start: '09:00', end: '17:00' },
    wednesday: { start: '09:00', end: '17:00' },
    thursday: { start: '09:00', end: '17:00' },
    friday: { start: '09:00', end: '17:00' },
  },
  current_assignments: [],
  location: { lat: 40.7128, lng: -74.0060 },
  ...overrides,
})

export const mockScheduleData = (overrides: Partial<any> = {}) => ({
  id: '1',
  date: new Date().toISOString().split('T')[0],
  assignments: [
    {
      id: '1',
      installation_id: '1',
      technician_id: '1',
      start_time: '09:00',
      end_time: '11:00',
      status: 'scheduled',
    },
  ],
  total_hours: 8,
  utilization: 0.75,
  ...overrides,
})

// Mock event handlers
export const mockHandlers = {
  onClick: vi.fn(),
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onSelect: vi.fn(),
  onDelete: vi.fn(),
  onEdit: vi.fn(),
  onSave: vi.fn(),
  onCancel: vi.fn(),
  onUpload: vi.fn(),
  onDownload: vi.fn(),
}

// Mock API responses
export const mockApiResponse = {
  success: (data: any) => ({
    data,
    error: null,
    status: 200,
  }),
  error: (message: string, status: number = 400) => ({
    data: null,
    error: { message },
    status,
  }),
}

// Mock file objects
export const mockFiles = {
  csv: new File(['name,email\nJohn,john@test.com'], 'test.csv', { type: 'text/csv' }),
  excel: new File(['fake excel content'], 'test.xlsx', { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  }),
  pdf: new File(['fake pdf content'], 'test.pdf', { type: 'application/pdf' }),
  image: new File(['fake image content'], 'test.png', { type: 'image/png' }),
}

// Mock form data
export const mockFormData = {
  installation: {
    customer_name: 'Test Customer',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    phone: '555-0123',
    email: 'customer@test.com',
    installation_type: 'standard',
    priority: 'medium',
    notes: 'Test notes',
  },
  teamMember: {
    name: 'John Smith',
    email: 'john.smith@test.com',
    phone: '555-0123',
    role: 'technician',
    skills: ['networking', 'installation'],
    hire_date: '2024-01-01',
  },
}

// Mock store states
export const mockStoreStates = {
  initial: {
    installations: [],
    teamMembers: [],
    schedules: [],
    loading: false,
    error: null,
  },
  loading: {
    installations: [],
    teamMembers: [],
    schedules: [],
    loading: true,
    error: null,
  },
  withData: {
    installations: [mockInstallationData()],
    teamMembers: [mockTeamMemberData()],
    schedules: [mockScheduleData()],
    loading: false,
    error: null,
  },
  withError: {
    installations: [],
    teamMembers: [],
    schedules: [],
    loading: false,
    error: 'Test error message',
  },
}

// Test data factories
export const createMockInstallations = (count: number) => {
  return Array.from({ length: count }, (_, index) => 
    mockInstallationData({ 
      id: `${index + 1}`,
      customer_name: `Customer ${index + 1}`,
    })
  )
}

export const createMockTeamMembers = (count: number) => {
  return Array.from({ length: count }, (_, index) => 
    mockTeamMemberData({ 
      id: `${index + 1}`,
      name: `Team Member ${index + 1}`,
      email: `member${index + 1}@test.com`,
    })
  )
}

// Mock router utilities
export const mockNavigate = vi.fn()
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
}

// Async test utilities
export const waitFor = (condition: () => boolean, timeout = 5000) => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now()
    const check = () => {
      if (condition()) {
        resolve()
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error('Condition not met within timeout'))
      } else {
        setTimeout(check, 100)
      }
    }
    check()
  })
}

// Mock intersection observer for lazy loading tests
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.IntersectionObserver = mockIntersectionObserver
  window.IntersectionObserverEntry = vi.fn()
}

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Custom matchers
export const customMatchers = {
  toBeWithinRange: (received: number, floor: number, ceiling: number) => {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
}

// Re-export testing library utilities
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'