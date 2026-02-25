import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
  })

  it('shows the intro title', () => {
    render(<App />)
    expect(screen.getByText('Judkins Park For People')).toBeInTheDocument()
  })

  it('shows the opening date in the intro', () => {
    render(<App />)
    expect(screen.getByText(/March 28, 2026/)).toBeInTheDocument()
  })
})
