import AadhaarFormPage from "./forms/AadhaarFormPage";
import PassportFormPage from "./forms/PassportFormPage";
import VoterIdFormPage from "./forms/VoterIdFormPage";

export default function FilledForm({ formType, apiData, onEndSession }) {
  if (formType === "aadhaar")  return <AadhaarFormPage  apiData={apiData} onEndSession={onEndSession} />;
  if (formType === "passport") return <PassportFormPage apiData={apiData} onEndSession={onEndSession} />;
  if (formType === "voter")    return <VoterIdFormPage  apiData={apiData} onEndSession={onEndSession} />;

  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "#c0392b" }}>
      <h3>Unknown form type: "{formType}"</h3>
      <p>Please go back and select a valid form.</p>
    </div>
  );
}