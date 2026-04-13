export default function SuccessScreen() {
  return (
    <>
      <div className="panel-header">
        <div className="step-pill">✅ Submitted</div>
        <h3>Application Submitted Successfully</h3>
        <p>Your documents have been securely received and are pending verification by the concerned department.</p>
      </div>
      <div className="panel-body">
        <div className="success-wrap">
          <div className="success-ring">✓</div>
          <h3>All Done!</h3>
          <p>
            Your application and documents have been submitted. A summary file has been
            downloaded to your device. Keep it for future reference.
          </p>
        </div>

        <div className="divider" />

        {/* What's next */}
        <div>
          <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-dark)", marginBottom: "12px" }}>What happens next?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { icon: "📨", step: "You will receive an SMS/email confirmation within 24 hours." },
              { icon: "🔍", step: "Documents will be verified by the concerned department in 3–5 days." },
              { icon: "📬", step: "Physical document (if applicable) will be dispatched within 7–10 days." },
            ].map((n) => (
              <div key={n.step} style={{
                display: "flex", gap: "12px", alignItems: "flex-start",
                padding: "12px 14px", borderRadius: "10px",
                background: "var(--surface)", border: "1px solid var(--border-lt)"
              }}>
                <span style={{ fontSize: "18px" }}>{n.icon}</span>
                <span style={{ fontSize: "13px", color: "var(--text-mid)", lineHeight: "1.6" }}>{n.step}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: "#eff6ff", border: "1px solid #bfdbfe",
          borderRadius: "10px", padding: "14px 16px",
          fontSize: "12px", color: "#1e40af", lineHeight: "1.6"
        }}>
          📞 For queries, call <strong>1800-111-555</strong> (Toll-free) or email <strong>support@gov.in</strong>. Reference your downloaded summary file for tracking.
        </div>
      </div>
    </>
  );
}