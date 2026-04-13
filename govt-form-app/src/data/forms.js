const forms = [
  {
    id: "passport",
    name: "Passport Application",
    description: "Apply for a fresh Indian passport",
    documents: [
      { id: "aadhaar", label: "Aadhaar Card" },
      { id: "pan", label: "PAN Card" },
      { id: "dl", label: "Driving License" },
      { id: "passport", label: "Existing Passport" },
    ],
  },
  {
    id: "aadhaar",
    name: "Aadhaar Update Application",
    description: "Update your existing Aadhaar card",
    documents: [
      { id: "aadhaar", label: "Existing Aadhaar Card" },
      { id: "pan", label: "PAN Card" },
      { id: "dl", label: "Driving License" },
      { id: "passport", label: "Passport" },
    ],
  },
  {
    id: "voter",
    name: "Voter ID Application",
    description: "Register as a new voter",
    documents: [
      { id: "aadhaar", label: "Aadhaar Card" },
      { id: "pan", label: "PAN Card" },
      { id: "dl", label: "Driving License" },
      { id: "passport", label: "Passport" },
    ],
  },
];

export default forms;