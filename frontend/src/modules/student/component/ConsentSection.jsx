import { FaShieldAlt, FaCheckCircle } from "react-icons/fa";
import { CONSENT_TEXT } from "../../../data/consentText";
import "../styles/ConsentSection.css";

const PrivacyConsentSection = () => {
  return (
    <div className="privacy-consent-container bg-light p-4 rounded shadow-sm">
      <div className="d-flex align-items-center mb-4">
        <FaShieldAlt className="text-primary me-3" size={28} />
        <h2 className="mb-0">Privacy & Consent Agreement</h2>
      </div>

      <div className="consent-status-banner bg-success text-white p-3 rounded mb-4">
        <div className="d-flex align-items-center">
          <FaCheckCircle className="me-2" size={20} />
          <span className="fw-semibold">
            Consent Status: Active - You have agreed to the following terms during registration
          </span>
        </div>
      </div>

      <div className="consent-full-text">
        <div className="consent-text-display bg-white p-4 rounded border">
          <pre className="consent-content-text">{CONSENT_TEXT}</pre>
        </div>
      </div>

      <div className="consent-info-footer mt-4 pt-3 border-top">
        <div className="row">
          <div className="col-md-6">
            <small className="text-muted">
              <strong>Consent Date:</strong> {new Date().toLocaleDateString()}
            </small>
          </div>
          <div className="col-md-6 text-end">
            <small className="text-muted">
              For questions about your consent or to withdraw consent, contact: privacy@kumustaka.com
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentSection;
