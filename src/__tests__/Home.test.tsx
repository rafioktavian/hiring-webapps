import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)

    const heading = screen.getByRole('heading', {
      name: /HiringFlow/i,
    })

    expect(heading).toBeInTheDocument()
  })

  it('renders all three login cards', () => {
    render(<Home />)

    const adminCard = screen.getByRole('heading', { name: /Admin Portal/i })
    const superAdminCard = screen.getByRole('heading', { name: /Super Admin/i })
    const candidateCard = screen.getByRole('heading', { name: /For Candidates/i })

    expect(adminCard).toBeInTheDocument()
    expect(superAdminCard).toBeInTheDocument()
    expect(candidateCard).toBeInTheDocument()
  })
})
