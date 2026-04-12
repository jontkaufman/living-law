import './TourTooltip.css'
import { X } from 'lucide-react'

function TourTooltip({
  continuous,
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}) {
  return (
    <div {...tooltipProps} className="tour-tooltip">
      {!isLastStep && continuous && (
        <button {...skipProps} className="tour-btn tour-btn-close" title="Skip Tour">
          <X size={16} />
        </button>
      )}

      {step.title && <h3 className="tour-title">{step.title}</h3>}
      <div className="tour-content">{step.content}</div>

      <div className="tour-footer">
        <div className="tour-btn-left">
          {index > 0 && (
            <button {...backProps} className="tour-btn tour-btn-back">
              Previous
            </button>
          )}
        </div>
        <div className="tour-progress">
          {index + 1}/{size}
        </div>
        <div className="tour-btn-right">
          <button {...primaryProps} className="tour-btn tour-btn-primary">
            {isLastStep ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TourTooltip
