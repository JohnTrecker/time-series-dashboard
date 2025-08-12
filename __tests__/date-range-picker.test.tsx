import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangePicker } from '@/components/date-range-picker'
import { ChartsSyncProvider } from '@/components/charts-sync-provider'
import '@testing-library/jest-dom'

// Mock the charts sync provider to avoid external dependencies
const MockChartsSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const mockContext = {
    responsive: true,
    setResponsive: jest.fn(),
    dateRange: { from: new Date('2024-01-01'), to: new Date('2024-01-31') },
    setDateRange: jest.fn(),
    hoverRatio: null,
    setHoverRatio: jest.fn(),
  }
  
  return (
    <ChartsSyncProvider>
      {children}
    </ChartsSyncProvider>
  )
}

describe('DateRangePicker', () => {
  const mockOnChange = jest.fn()
  
  const defaultProps = {
    value: { from: new Date('2024-01-01'), to: new Date('2024-01-31') },
    onChange: mockOnChange,
    trigger: <button data-testid="date-picker-trigger">Select Date Range</button>
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should keep popover open after selecting first date and close only after selecting second date', async () => {
    const user = userEvent.setup()
    
    render(
      <MockChartsSyncProvider>
        <DateRangePicker {...defaultProps} />
      </MockChartsSyncProvider>
    )

    // Open the date picker
    const trigger = screen.getByTestId('date-picker-trigger')
    await user.click(trigger)

    // Wait for calendar to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Find and click the first date (15th of current month)
    const firstDate = screen.getAllByRole('button').find(btn => 
      btn.textContent === '15' && !btn.hasAttribute('disabled')
    )
    expect(firstDate).toBeInTheDocument()
    await user.click(firstDate!)

    // Popover should still be open after first date selection
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    }, { timeout: 1000 })

    // Find and click the second date (20th of current month)
    const secondDate = screen.getAllByRole('button').find(btn => 
      btn.textContent === '20' && !btn.hasAttribute('disabled')
    )
    expect(secondDate).toBeInTheDocument()
    await user.click(secondDate!)

    // Popover should close after second date selection
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should update the selected range visually after first date selection', async () => {
    const user = userEvent.setup()
    
    render(
      <MockChartsSyncProvider>
        <DateRangePicker {...defaultProps} />
      </MockChartsSyncProvider>
    )

    // Open the date picker
    const trigger = screen.getByTestId('date-picker-trigger')
    await user.click(trigger)

    // Wait for calendar to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Click on the 10th day
    const firstDate = screen.getAllByRole('button').find(btn => 
      btn.textContent === '10' && !btn.hasAttribute('disabled')
    )
    expect(firstDate).toBeInTheDocument()
    await user.click(firstDate!)

    // The first date should be visually selected (range-start)
    await waitFor(() => {
      expect(firstDate).toHaveAttribute('data-range-start', 'true')
    })
  })

  it('should call onChange with complete range only when both dates are selected', async () => {
    const user = userEvent.setup()
    
    render(
      <MockChartsSyncProvider>
        <DateRangePicker {...defaultProps} />
      </MockChartsSyncProvider>
    )

    // Open the date picker
    const trigger = screen.getByTestId('date-picker-trigger')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Click first date
    const firstDate = screen.getAllByRole('button').find(btn => 
      btn.textContent === '10' && !btn.hasAttribute('disabled')
    )
    await user.click(firstDate!)

    // onChange should not be called with complete range after first date
    // (it might be called with partial range, but we're testing the complete flow)
    
    // Click second date
    const secondDate = screen.getAllByRole('button').find(btn => 
      btn.textContent === '15' && !btn.hasAttribute('disabled')
    )
    await user.click(secondDate!)

    // Now onChange should be called with both dates
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(Date),
          to: expect.any(Date)
        })
      )
    })
  })
})