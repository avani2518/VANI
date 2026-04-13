export default function StartScreen({ onStart }) {
  return (
    <>
      <div className="panel-header">
        <div className="step-pill">Welcome</div>
        <h3>Government Document Submission Portal</h3>
        <p>Submit your identity documents digitally for official government form applications. Secure, paperless, and free of charge.</p>
      </div>
      <div className="panel-body">

        {/* Feature grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { icon: "🔒", title: "256-bit Encrypted", desc: "All data is encrypted end-to-end" },
            { icon: "⚡", title: "Instant Processing", desc: "Documents verified in real-time" },
            { icon: "📱", title: "Mobile Friendly", desc: "Works on all devices" },
            { icon: "🆓", title: "Completely Free", desc: "No charges for citizens" },
          ].map((f) => (
            <div key={f.title} style={{
              padding: "16px", borderRadius: "10px",
              border: "1.5px solid var(--border-lt)",
              background: "var(--off-white)"
            }}>
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>{f.icon}</div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-dark)", marginBottom: "3px" }}>{f.title}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="divider" />

        {/* Alert */}
        <div style={{
          background: "#fffbeb", border: "1px solid #f5d76e",
          borderRadius: "10px", padding: "14px 16px",
          display: "flex", gap: "10px", alignItems: "flex-start"
        }}>
          <span style={{ fontSize: "16px" }}>ℹ️</span>
          <p style={{ fontSize: "12px", color: "#7a5c10", lineHeight: "1.6" }}>
            Keep your original documents ready for scanning. Ensure all documents are valid, not expired, and belong to the applicant.
          </p>
        </div>

        <button className="btn-primary" onClick={onStart} style={{ fontSize: "16px", padding: "16px" }}>
          Begin Application →
        </button>
      </div>
    </>
  );
}