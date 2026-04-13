/**
 * FilledForm
 * Router component — picks the correct government form based on
 * the selected form ID and renders it pre-filled with API data.
 *
 * Props:
 *   formType  – the selectedForm.id string from App.js
 *               ("aadhaar" | "passport" | "voter")
 *   apiData   – the full JSON body returned by POST /extract-multiple
 */
import AadhaarFormPage from "./forms/AadhaarFormPage";
import PassportFormPage from "./forms/PassportFormPage";
import VoterIdFormPage from "./forms/VoterIdFormPage";

export default function FilledForm({ formType, apiData }) {
  if (formType === "aadhaar") return <AadhaarFormPage apiData={apiData} />;
  if (formType === "passport") return <PassportFormPage apiData={apiData} />;
  if (formType === "voter") return <VoterIdFormPage apiData={apiData} />;

  // Fallback — should not happen if formTypeMap is correct
  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "#c0392b" }}>
      <h3>Unknown form type: "{formType}"</h3>
      <p>Please go back and select a valid form.</p>
    </div>
  );
}
