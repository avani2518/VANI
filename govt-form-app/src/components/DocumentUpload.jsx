import { useState, useRef } from "react";

export default function DocumentUpload({ doc, onUpload, onBack }) {
  const [file, setFile] = useState(null);
  const inputRef = useRef();

  return (
    <>
      <div className="panel-header">
        <div className="step-pill">Step 3 of 3</div>
        <h3>Upload Document</h3>
        <p>You are uploading: <strong style={{ color: "rgba(255,255,255,0.85)" }}>{doc.label}</strong>. Ensure the file is legible and belongs to the applicant.</p>
      </div>

      <div className="panel-body">

        {/* Guidelines */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[
            { icon: "🔍", text: "Document must be clearly visible" },
            { icon: "📐", text: "All four corners must be included" },
            { icon: "💡", text: "Good lighting, no shadows" },
            { icon: "📏", text: "Max file size: 10 MB" },
          ].map((g) => (
            <div key={g.text} style={{
              display: "flex", gap: "8px", alignItems: "center",
              background: "var(--surface)", borderRadius: "8px",
              padding: "10px 12px", border: "1px solid var(--border-lt)"
            }}>
              <span style={{ fontSize: "14px" }}>{g.icon}</span>
              <span style={{ fontSize: "12px", color: "var(--text-mid)" }}>{g.text}</span>
            </div>
          ))}
        </div>

        {/* Upload zone */}
        <div
          className={`upload-zone ${file ? "has-file" : ""}`}
          onClick={() => inputRef.current.click()}
        >
          <div className="upload-icon-wrap">
            {file ? "✅" : "📎"}
          </div>
          {file ? (
            <>
              <p className="up-title">File Selected</p>
              <p className="up-file">{file.name}</p>
              <p className="up-sub">Click here to change the file</p>
            </>
          ) : (
            <>
              <p className="up-title">Click to Upload {doc.label}</p>
              <p className="up-sub">JPG, PNG, or PDF &nbsp;·&nbsp; Max 10 MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            className="file-input-hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        {/* Security note */}
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: "10px", padding: "12px 16px",
          display: "flex", gap: "10px", alignItems: "flex-start"
        }}>
          <span style={{ fontSize: "14px" }}>🔒</span>
          <p style={{ fontSize: "12px", color: "#166534", lineHeight: "1.6" }}>
            Your document is encrypted before upload using 256-bit SSL. It will only be used for verification purposes as per the IT Act, 2000.
          </p>
        </div>

        {/* Buttons */}
        <div className="btn-row">
          <button className="btn-ghost" onClick={onBack}>← Back</button>
          <button
            className="btn-primary"
            onClick={() => file && onUpload(doc.id, file)}
            disabled={!file}
          >
            Confirm & Upload
          </button>
        </div>
      </div>
    </>
  );
}