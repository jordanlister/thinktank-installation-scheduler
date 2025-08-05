import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import Loading from './Loading'

describe('Loading Component', () => {
  it('renders loading component with default props', () => {
    renderWithProviders(<Loading />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    const customMessage = 'Processing data...'
    renderWithProviders(<Loading message={customMessage} />)
    
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    renderWithProviders(<Loading size="lg" />)
    
    const loadingElement = screen.getByRole('status')
    expect(loadingElement).toHaveClass('text-4xl') // Assuming lg size adds this class
  })

  it('has proper accessibility attributes', () => {
    renderWithProviders(<Loading />)
    
    const loadingElement = screen.getByRole('status')
    expect(loadingElement).toHaveAttribute('aria-live', 'polite')
  })

  it('applies custom className when provided', () => {
    const customClass = 'custom-loading'
    renderWithProviders(<Loading className={customClass} />)
    
    const loadingElement = screen.getByRole('status')
    expect(loadingElement).toHaveClass(customClass)
  })
})