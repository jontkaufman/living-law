import './TourTooltip.css'

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
      {step.title && <h3 className="tour-title">{step.title}</h3>}
      <div className="tour-content">{step.content}</div>

      <div className="tour-footer">
        <div className="tour-buttons">
          {index > 0 && (
            <button {...backProps} className="tour-btn tour-btn-back">
              Previous
            </button>
          )}
          {!isLastStep && continuous && (
            <button {...skipProps} className="tour-btn tour-btn-skip">
              Skip Tour
            </button>
          )}
          <button {...primaryProps} className="tour-btn tour-btn-primary">
            {isLastStep ? 'Done' : 'Next'}
          </button>
        </div>
        <div className="tour-progress">
          {index + 1}/{size}
        </div>
      </div>
    </div>
  )
}

export default TourTooltip
