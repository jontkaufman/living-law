import { render, screen } from '@testing-library/react'
import TourTooltip from '../TourTooltip'

describe('TourTooltip', () => {
  const mockProps = {
    continuous: true,
    index: 0,
    step: {
      title: 'Test Title',
      content: 'Test content',
    },
    backProps: {},
    closeProps: {},
    primaryProps: {},
    skipProps: {},
    tooltipProps: {},
    isLastStep: false,
    size: 5,
  }

  it('should render title and content', () => {
    render(<TourTooltip {...mockProps} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should show Previous button when index > 0', () => {
    render(<TourTooltip {...mockProps} index={1} />)
    expect(screen.getByText('Previous')).toBeInTheDocument()
  })

  it('should not show Previous button on first step', () => {
    render(<TourTooltip {...mockProps} index={0} />)
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
  })

  it('should show Next button when not last step', () => {
    render(<TourTooltip {...mockProps} />)
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('should show Done button on last step', () => {
    render(<TourTooltip {...mockProps} isLastStep={true} />)
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('should show Skip Tour button when not last step', () => {
    render(<TourTooltip {...mockProps} />)
    expect(screen.getByText('Skip Tour')).toBeInTheDocument()
  })

  it('should display step counter', () => {
    render(<TourTooltip {...mockProps} index={2} />)
    expect(screen.getByText('3/5')).toBeInTheDocument()
  })
})
