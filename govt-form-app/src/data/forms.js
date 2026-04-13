const forms = [
  {
    id: "passport_application",
    name: "Passport Application (Form SP-1)",
    description: "Apply for a fresh Indian passport",
    documents: [
      { id: "aadhaar", label: "Aadhaar Card" },
      { id: "pan", label: "PAN Card" },
      { id: "license", label: "Driving License" },
      { id: "passport_old", label: "Existing Passport" },
    ],
  },
  {
    id: "pan_application",
    name: "PAN Card Application (Form 49A)",
    description: "Apply for a new PAN card",
    documents: [
      { id: "aadhaar", label: "Aadhaar Card" },
      { id: "pan", label: "Existing PAN (if correction)" },
      { id: "license", label: "Driving License" },
      { id: "passport", label: "Passport" },
    ],
  },
  {
    id: "voter_id",
    name: "Voter ID Application (Form 6)",
    description: "Register as a new voter",
    documents: [
      { id: "aadhaar", label: "Aadhaar Card" },
      { id: "pan", label: "PAN Card" },
      { id: "license", label: "Driving License" },
      { id: "passport", label: "Passport" },
    ],
  },
];

export default forms;