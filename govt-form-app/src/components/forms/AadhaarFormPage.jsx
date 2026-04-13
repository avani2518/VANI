import { useState, useEffect } from "react";
import FormFrame from "./FormFrame";

export default function AadhaarFormPage({ apiData }) {
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");

  useEffect(() => {
    fetch("/form-templates/aadhaar-form.html").then(r => r.text()).then(setHtml);
    fetch("/form-templates/form-base.css").then(r => r.text()).then(setCss);
  }, []);

  if (!html || !css) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading form...</div>;
  return <FormFrame htmlTemplate={html} apiData={apiData} formBaseCss={css} />;
}