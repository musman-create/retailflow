import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

describe('RetailFlow Dashboard', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders the RetailFlow dashboard successfully', async () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'RetailFlow' })
    ).toBeInTheDocument()

    expect(
      await screen.findByRole('heading', {
        name: /welcome to retailflow/i,
      })
    ).toBeInTheDocument()
  })

  it('navigates from Dashboard to Products', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Products' }))

    expect(
      await screen.findByRole('heading', { name: 'All products' })
    ).toBeInTheDocument()
  })

})
