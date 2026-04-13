export default function Checklist({ form, uploadedDocs, onDocClick, onProceed, allUploaded }) {
  const uploaded = form.documents.filter((d) => uploadedDocs[d.id]).length;
  const total = form.documents.length;
  const percent = Math.round((uploaded / total) * 100);

  return (
    <>
      <div className="panel-header">
        <div className="step-pill">Step 2 of 3</div>
        <h3>Document Checklist</h3>
        <p>{form.name} — Click each document item below to upload the corresponding file.</p>
      </div>

      <div className="panel-body">

        {/* Progress */}
        <div className="progress-block">
          <div className="progress-row">
            <span className="progress-label">{uploaded} of {total} documents uploaded</span>
            <span className="progress-pct">{percent}% Complete</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>

        {/* Status banner */}
        {allUploaded ? (
          <div style={{
            background: "var(--success-bg)", border: "1px solid #86efac",
            borderRadius: "10px", padding: "12px 16px",
            display: "flex", gap: "10px", alignItems: "center"
          }}>
            <span style={{ fontSize: "18px" }}>✅</span>
            <span style={{ fontSize: "13px", color: "var(--success)", fontWeight: "600" }}>
              All documents uploaded! You may now proceed to submit.
            </span>
          </div>
        ) : (
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: "10px", padding: "12px 16px",
            display: "flex", gap: "10px", alignItems: "center"
          }}>
            <span style={{ fontSize: "16px" }}>📎</span>
            <span style={{ fontSize: "12px", color: "#1e40af" }}>
              Click on any pending document below to upload it. All documents are mandatory.
            </span>
          </div>
        )}

        <div className="divider" />

        <ul className="checklist">
          {form.documents.map((doc) => {
            const isDone = !!uploadedDocs[doc.id];
            return (
              <li key={doc.id} className={`check-item ${isDone ? "done" : ""}`} onClick={() => onDocClick(doc)}>
                <div className="check-box">{isDone ? "✓" : ""}</div>
                <span className="check-label">{doc.label}</span>
                <span className={`check-status ${isDone ? "done" : "pending"}`}>
                  {isDone ? uploadedDocs[doc.id].name : "Upload →"}
                </span>
              </li>
            );
          })}
        </ul>

        {allUploaded && (
          <button className="btn-primary" onClick={onProceed}>
            Submit Application & Download Summary →
          </button>
        )}
      </div>
    </>
  );
}