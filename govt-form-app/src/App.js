import { useState, useEffect } from "react";
import "./App.css";
import forms from "./data/forms";
import StartScreen from "./components/StartScreen";
import FormSelector from "./components/FormSelector";
import Checklist from "./components/Checklist";
import DocumentUpload from "./components/DocumentUpload";
import SuccessScreen from "./components/SuccessScreen";
import FilledForm from "./components/FilledForm";


function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-card">
        <div className="sidebar-card-head">
          <span className="s-icon">📋</span>
          <span>How It Works</span>
        </div>
        <div className="sidebar-card-body">
          <div className="help-steps">
            {[
              { n: "1", title: "Select Your Form", desc: "Choose the official government form you need to apply for." },
              { n: "2", title: "Upload Documents", desc: "Upload scanned copies or photos of required identity proofs." },
              { n: "3", title: "Submit & Download", desc: "Review and download your submission summary." },
            ].map((s) => (
              <div className="help-step" key={s.n}>
                <div className="help-step-num">{s.n}</div>
                <div className="help-step-text">
                  <h5>{s.title}</h5>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-card">
        <div className="sidebar-card-head">
          <span className="s-icon">⚠️</span>
          <span>Important Notices</span>
        </div>
        <div className="sidebar-card-body">
          <div className="notice-list">
            {[
              { icon: "📄", text: "Documents must be clear and legible. Blurred images will be rejected." },
              { icon: "🔒", text: "All uploads are encrypted and stored securely per IT Act 2000." },
              { icon: "✅", text: "Accepted formats: JPG, PNG, PDF. Max size: 10 MB per file." },
              { icon: "🕐", text: "Processing takes 5–7 working days after submission." },
            ].map((n, i) => (
              <div className="notice-item" key={i}>
                <span className="notice-icon">{n.icon}</span>
                <p className="notice-text">{n.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-card">
        <div className="sidebar-card-head">
          <span className="s-icon">📞</span>
          <span>Help & Support</span>
        </div>
        <div className="sidebar-card-body">
          <div className="contact-list">
            {[
              { icon: "📞", label: "Helpline", value: "1800-111-555" },
              { icon: "📧", label: "Email", value: "support@gov.in" },
              { icon: "🕐", label: "Working Hours", value: "Mon–Fri, 9AM–6PM" },
            ].map((c, i) => (
              <div className="contact-row" key={i}>
                <div className="contact-icon">{c.icon}</div>
                <div className="contact-info">
                  <div className="c-label">{c.label}</div>
                  <div className="c-value">{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Loading overlay (indeterminate — shown while API is processing) ──────────
function LoadingOverlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, flexDirection: "column", gap: "1.5rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "2.5rem 3rem",
        maxWidth: "420px", width: "90%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⏳</div>
        <h3 style={{ margin: "0 0 0.5rem", color: "#1a3a5c", fontSize: "1.2rem" }}>
          Extracting Document Information
        </h3>
        <p style={{ margin: "0 0 1.5rem", color: "#555", fontSize: "0.9rem" }}>
          Our AI is reading your documents. This can take 1–2 minutes — please keep this tab open.
        </p>
        <div style={{
          background: "#e8edf2", borderRadius: "999px", height: "10px",
          overflow: "hidden", marginBottom: "0.75rem",
        }}>
          <div style={{
            background: "linear-gradient(90deg, #1565c0, #42a5f5)",
            height: "100%", borderRadius: "999px",
            animation: "indeterminate 1.8s ease-in-out infinite",
          }} />
        </div>
        <p style={{ margin: 0, color: "#888", fontSize: "0.8rem" }}>
          Do not close or refresh this page
        </p>
      </div>
      <style>{`
        @keyframes indeterminate {
          0%   { transform: translateX(-100%); width: 40%; }
          50%  { width: 60%; }
          100% { transform: translateX(300%); width: 40%; }
        }
      `}</style>
    </div>
  );
}

// ─── Extraction loading overlay (used for per-doc Claude extraction) ──────────
function ExtractionOverlay({ progress, total, currentDoc }) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, flexDirection: "column", gap: "1.5rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "2.5rem 3rem",
        maxWidth: "420px", width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</div>
        <h3 style={{ margin: "0 0 0.5rem", color: "#1a3a5c", fontSize: "1.2rem" }}>
          Extracting Document Information
        </h3>
        <p style={{ margin: "0 0 1.5rem", color: "#555", fontSize: "0.9rem" }}>
          Reading: <strong>{currentDoc}</strong>
        </p>
        <div style={{
          background: "#e8edf2", borderRadius: "999px", height: "10px",
          overflow: "hidden", marginBottom: "0.75rem",
        }}>
          <div style={{
            background: "linear-gradient(90deg, #1565c0, #42a5f5)",
            width: `${pct}%`, height: "100%",
            borderRadius: "999px", transition: "width 0.4s ease",
          }} />
        </div>
        <p style={{ margin: 0, color: "#888", fontSize: "0.85rem" }}>
          {progress} of {total} documents processed ({pct}%)
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("start");
  const [selectedForm, setSelectedForm] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [activeDoc, setActiveDoc] = useState(null);
  const [time, setTime] = useState(new Date());
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractCurrentDoc, setExtractCurrentDoc] = useState("");
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);   // ← new

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleFormSelect = (form) => {
    setSelectedForm(form);
    setUploadedDocs({});
    setStep("checklist");
  };

  const handleDocClick = (doc) => { setActiveDoc(doc); setStep("upload"); };

  const handleUpload = (docId, file) => {
    setUploadedDocs((prev) => ({ ...prev, [docId]: file }));
    setStep("checklist");
  };

  const handleProceed = async () => {
    const formTypeMap = {
      aadhaar:  "aadhaar_form",
      passport: "passport_form",
      voter:    "voter_id_form",
    };

    const docFieldMap = {
      aadhaar:  "aadhaarFile",
      passport: "passportFile",
      dl:       "dlFile",
      pan:      "panFile",
    };

    try {
      setIsLoading(true);

      const formType = formTypeMap[selectedForm.id];
      const formData = new FormData();
      formData.append("formType", formType);

      Object.entries(uploadedDocs).forEach(([docId, file]) => {
        formData.append(docFieldMap[docId] ?? `${docId}File`, file);
      });

      const response = await fetch("http://127.0.0.1:5000/extract-multiple", {
        method: "POST",
        body: formData,
      });

      // if (!response.ok) throw new Error(`API error: ${response.status}`);
      if (!response.ok) {
        const errBody = await response.text();
        console.error("Response status:", response.status, "Body:", errBody);
        throw new Error(`API error: ${response.status} — ${errBody}`);
      }

      const data = await response.json();
      setApiResponse(data);
      setStep("filled");

    } catch (error) {
      console.error("Error calling API:", error);
      alert("Failed to submit documents. Is the Flask server running on port 5000?");
    } finally {
      setIsLoading(false);
    }
  };

  const allUploaded = selectedForm && selectedForm.documents.every((d) => uploadedDocs[d.id]);

  const stepContent = () => {
    if (step === "start") return <StartScreen onStart={() => setStep("select")} />;
    if (step === "select") return <FormSelector forms={forms} onSelect={handleFormSelect} />;
    if (step === "checklist") return (
      <Checklist form={selectedForm} uploadedDocs={uploadedDocs}
        onDocClick={handleDocClick} onProceed={handleProceed} allUploaded={allUploaded} />
    );
    if (step === "upload") return (
      <DocumentUpload doc={activeDoc} onUpload={handleUpload} onBack={() => setStep("checklist")} />
    );
    //if (step === "filled") return <FilledForm formType={selectedForm?.id} apiData={apiResponse} />;
    if (step === "filled") return <FilledForm formType={selectedForm?.id} apiData={apiResponse} onEndSession={() => setStep("start")} />;

    if (step === "success") return <SuccessScreen />;
  };

  const heroTitles = {
    start:     { h: "Digital Document Submission Portal",   p: "Apply for official government forms online. Fast, secure, and paperless." },
    select:    { h: "Select Your Application Form",         p: "Choose the appropriate form from the list of available government schemes." },
    checklist: { h: selectedForm?.name || "Document Checklist", p: "Upload all required identity documents to proceed with your application." },
    upload:    { h: `Upload: ${activeDoc?.label || "Document"}`, p: "Please ensure the document is clearly visible and within the file size limit." },
    success:   { h: "Application Submitted",                p: "Your documents have been successfully received by our system." },
    filled: { h: "Your Form is Ready", p: "Review the extracted information below." },
  };

  const hero = heroTitles[step] || heroTitles.start;

  return (
    <div className="portal">

      {/* Indeterminate loading overlay — shown while Flask API is processing */}
      {isLoading && <LoadingOverlay />}

      {/* Per-doc extraction overlay — shown during Claude extraction if used */}
      {extracting && (
        <ExtractionOverlay
          progress={extractProgress}
          total={Object.keys(uploadedDocs).length}
          currentDoc={extractCurrentDoc}
        />
      )}

      <div className="top-strip">
        Government of India
      </div>

      <header className="site-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-emblem">🏛️</div>
            <div className="header-text">
              <h1>VANI Assist Portal</h1>
              <div className="tagline">Secure · Paperless · Official Government Document Gateway</div>
            </div>
          </div>
          <div className="header-right">
            <div className="header-badges">
              <div className="hbadge"><span className="dot"></span> System Online</div>
              <div className="hbadge">🔒 SSL Secured</div>
            </div>
            <div className="header-time">
              {time.toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
              &nbsp;&nbsp;{time.toLocaleTimeString("en-IN")}
            </div>
          </div>
        </div>
      </header>

      <nav className="site-nav">
        <div className="nav-inner">
          <span className="nav-help">📞 Helpline: 1800-111-555</span>
        </div>
      </nav>

      <div className="hero-band">
        <div className="hero-inner">
          <h2>{hero.h}</h2>
          <p>{hero.p}</p>
        </div>
      </div>

      <main className="main-layout">
        <div className="layout-inner">
          <div className="content-panel">
            {stepContent()}
          </div>
          <Sidebar />
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-bottom">
            <span className="copy">© {new Date().getFullYear()} Government of India</span>
          </div>
        </div>
      </footer>

    </div>
  );
}