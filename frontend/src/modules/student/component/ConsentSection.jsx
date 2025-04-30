import { FaShieldAlt, FaLock, FaUserCheck } from "react-icons/fa";

const PrivacyConsentSection = () => {
  return (
    <div className="privacy-consent-container bg-light p-4 rounded shadow-sm">
      <div className="d-flex align-items-center mb-4">
        <FaShieldAlt className="text-primary me-3" size={28} />
        <h2 className="mb-0">Privacy & Consent</h2>
      </div>

      <div className="privacy-content">
        <div className="privacy-item mb-4">
          <div className="d-flex align-items-start mb-2">
            <FaLock className="text-muted mt-1 me-2" />
            <h4>Data Protection</h4>
          </div>
          <p>
            Your personal information and health data are encrypted and stored
            securely. We adhere to HIPAA and GDPR compliance standards to ensure
            your privacy is protected at all times.
          </p>
        </div>

        <div className="privacy-item mb-4">
          <div className="d-flex align-items-start mb-2">
            <FaUserCheck className="text-muted mt-1 me-2" />
            <h4>Informed Consent</h4>
          </div>
          By using our services, you consent to:
          <ul className="mt-2">
            <li>Anonymous data collection for service improvement</li>
            <li>Secure sharing with your designated healthcare providers</li>
            <li>Emergency intervention if risk of harm is detected</li>
          </ul>
        </div>

        <div className="privacy-item">
          <h4 className="mb-2">Your Rights</h4>
          <div className="row">
            <div className="col-md-6">
              <div className="d-flex mb-3">
                <div className="me-3 text-primary">✓</div>
                <span>Right to access your data</span>
              </div>
              <div className="d-flex mb-3">
                <div className="me-3 text-primary">✓</div>
                <span>Right to request corrections</span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex mb-3">
                <div className="me-3 text-primary">✓</div>
                <span>Right to download your records</span>
              </div>
              <div className="d-flex">
                <div className="me-3 text-primary">✓</div>
                <span>Right to delete your account</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-top">
          <button className="btn btn-outline-primary me-2">
            Download Full Policy
          </button>
          <button className="btn btn-primary">Give Explicit Consent</button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentSection;
