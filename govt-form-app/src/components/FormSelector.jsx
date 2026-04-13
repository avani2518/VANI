const ICONS = {
  passport_application: "🛂",
  pan_application:      "🪪",
  voter_id:             "🗳️",
};

const TAGS = {
  passport_application: "MEA",
  pan_application:      "CBDT",
  voter_id:             "ECI",
};

export default function FormSelector({ forms, onSelect }) {
  return (
    <>
      <div className="panel-header">
        <div className="step-pill">Step 1 of 3</div>
        <h3>Select Application Form</h3>
        <p>Choose the government form you wish to apply for. All forms are official and recognized by the Government of India.</p>
      </div>
      <div className="panel-body">

        <div style={{
          background: "var(--surface)", borderRadius: "10px",
          padding: "12px 16px", fontSize: "12px", color: "var(--text-mid)",
          border: "1px solid var(--border-lt)", display: "flex", gap: "8px", alignItems: "center"
        }}>
          <span>🏛️</span>
          <span><strong>{forms.length} forms</strong> available. Click any form to begin the document upload process.</span>
        </div>

        <div className="divider" />

        <div className="form-list">
          {forms.map((form, i) => (
            <div key={form.id} className="form-card" onClick={() => onSelect(form)}
              style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="form-icon-box">{ICONS[form.id] || "📄"}</div>
              <div className="form-text">
                <h4>{form.name}</h4>
                <p>{form.description}</p>
              </div>
              <span className="form-tag">{TAGS[form.id] || "GOI"}</span>
              <span className="form-arrow">›</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}