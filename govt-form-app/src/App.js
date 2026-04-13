import { useState, useEffect } from "react";
import "./App.css";
import forms from "./data/forms";
import StartScreen from "./components/StartScreen";
import FormSelector from "./components/FormSelector";
import Checklist from "./components/Checklist";
import DocumentUpload from "./components/DocumentUpload";
import SuccessScreen from "./components/SuccessScreen";
import JSZip from "jszip";
import FilledForm from "./components/FilledForm";
import { saveAs } from "file-saver";


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

// ─── Helper: convert File to base64 ───────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ─── Helper: extract document info via Claude API ─────────────────────────────
async function extractDocumentInfo(documentId, file) {
  const base64Data = await fileToBase64(file);

  // Determine media type
  let mediaType = file.type;
  if (!["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"].includes(mediaType)) {
    mediaType = "image/jpeg"; // fallback
  }

  const isPdf = mediaType === "application/pdf";

  const contentBlock = isPdf
    ? {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64Data },
      }
    : {
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64Data },
      };

  const prompt = `You are a government document OCR system. Extract ALL important information from this ${documentId} document.

Return ONLY a valid JSON object (no markdown, no backticks, no explanation) with every field you can read from the document. 

Examples of fields to extract depending on document type:
- Aadhaar: name, date_of_birth, gender, aadhaar_number, address, vid (if visible)
- PAN: name, father_name, date_of_birth, pan_number
- Driving License: name, date_of_birth, license_number, valid_from, valid_until, vehicle_classes, address, blood_group, issuing_authority
- Passport: surname, given_names, nationality, date_of_birth, sex, place_of_birth, date_of_issue, date_of_expiry, passport_number, place_of_issue, mrz_line1, mrz_line2
- For any other document: extract every field you can find

Extract ALL readable text fields. Do not skip any. If a field is partially visible, include what you can read with a note.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Strip markdown fences if present
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // If JSON parse fails, return the raw text under a key
    return { raw_extracted_text: cleaned };
  }
}

// ─── Extraction loading overlay ───────────────────────────────────────────────
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

        {/* Progress bar */}
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
  try {
    const zip = new JSZip();

    Object.entries(uploadedDocs).forEach(([docType, file]) => {
      zip.file(`${docType}_${file.name}`, file);
    });

    const content = await zip.generateAsync({ type: "blob" });

    saveAs(content, "uploaded_documents.zip");

    // ✅ ADD DELAY
    setTimeout(() => {
      setStep("filled");
    }, 500);

  } catch (error) {
    console.error("Error saving files:", error);
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
    if (step === "filled") return <FilledForm />;
    if (step === "success") return <SuccessScreen />;
  };

  const heroTitles = {
    start: { h: "Digital Document Submission Portal", p: "Apply for official government forms online. Fast, secure, and paperless." },
    select: { h: "Select Your Application Form", p: "Choose the appropriate form from the list of available government schemes." },
    checklist: { h: selectedForm?.name || "Document Checklist", p: "Upload all required identity documents to proceed with your application." },
    upload: { h: `Upload: ${activeDoc?.label || "Document"}`, p: "Please ensure the document is clearly visible and within the file size limit." },
    success: { h: "Application Submitted", p: "Your documents have been successfully received by our system." },
  };

  const hero = heroTitles[step] || heroTitles.start;

  return (
    <div className="portal">

      {/* Extraction overlay */}
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