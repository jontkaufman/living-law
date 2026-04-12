import './HelpModal.css'
import { X } from 'lucide-react'

function HelpModal({ isOpen, onClose, lightMode }) {
  if (!isOpen) return null

  return (
    <div className="help-overlay" onClick={onClose}>
      <div
        className="help-modal"
        onClick={(e) => e.stopPropagation()}
        data-theme={lightMode ? 'light' : 'dark'}
      >
        <button className="help-close" onClick={onClose} title="Close">
          <X size={16} />
        </button>

        <h2 className="help-title">Welcome to Torah Laws</h2>

        <div className="help-content">
          <section className="help-section">
            <h3>What is this?</h3>
            <p>
              Explore the laws in the Torah and how they relate to us today. These laws are organized under
              the two greatest commands - Love YHWH and Love Your Neighbor. The 10 commandments fall under
              these two, and all other laws are categorized accordingly.
            </p>
          </section>

          <section className="help-section">
            <h3>How to Navigate</h3>
            <ul>
              <li><strong>Network View:</strong> Click glowing nodes to explore categories. Click small circles (laws) to view details.</li>
              <li><strong>List View:</strong> Browse laws organized by categories. Click to expand and view details.</li>
              <li><strong>Split View:</strong> See both network and list side-by-side.</li>
              <li><strong>Dashboard:</strong> View statistics and insights about the laws.</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>Reading Laws</h3>
            <p>
              Click any law to open the side panel with full text and references. Click scripture references
              (like "Exodus 20:8-11") to read the original verse in context.
            </p>
          </section>

          <section className="help-section">
            <h3>Feedback & Questions</h3>
            <p>
              Have feedback or found an issue? We'd love to hear from you! Contact us to submit
              feedback, report issues, or ask questions about the Torah Laws.
            </p>
          </section>
        </div>

        <div className="help-footer">
          <button className="help-btn-close" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}

export default HelpModal
