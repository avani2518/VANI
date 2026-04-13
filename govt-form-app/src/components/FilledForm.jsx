import React, { useEffect, useState } from "react";
import "./FilledForm.css";

const FilledForm = ({ apiData }) => {

  const data = apiData?.filled_form;

  const getValue = (val) => (val && val !== "$" ? val : "");

  const speak = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    window.speechSynthesis.speak(speech);
  };

  const [form, setForm] = useState({
    full_name: "",
    dob: "",
    gender: "",
    city: "",
    state: "",
    pincode: "",
    street: "",
    landmark: "",
    house_no: "",
    area: "",
    post_office: "",
    district: "",
    mobile: "",
    email: ""
  });

  useEffect(() => {
    if (!data) return;

    setForm({
      full_name: getValue(data.personal_details.full_name),
      dob: getValue(data.personal_details.date_of_birth),
      gender: getValue(data.personal_details.gender),
      city: getValue(data.address_details.village_town_city),
      state: getValue(data.address_details.state),
      pincode: getValue(data.address_details.pincode),
      street: getValue(data.address_details.street_road_lane),
      landmark: getValue(data.address_details.landmark),
      house_no: getValue(data.address_details.house_no_building),
      area: getValue(data.address_details.area_locality_sector),
      post_office: getValue(data.address_details.post_office),
      district: getValue(data.address_details.district),
      mobile: getValue(data.personal_details.mobile_number),
      email: getValue(data.personal_details.email_id)
    });

  }, [apiData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page">

      <h2 className="title">Aadhaar Enrolment / Update Form</h2>

      {/* FULL NAME */}
      <div className="field-row">
        <div className="section">
          <div className="section-label">Full Name</div>
          <input
            id="full_name"
            value={form.full_name}
            onChange={handleChange}
            className={form.full_name ? "auto-filled" : "empty"}
          />
        </div>

        <div className="instr-panel">
          <p>Enter your full name as per Aadhaar</p>
          <button onClick={() => speak("Enter your full name as per Aadhaar")}>🔊</button>
        </div>
      </div>

      {/* GENDER + DOB */}
      <div className="field-row">

        <div className="section">
          <div className="section-label">Gender</div>
          <select id="gender" value={form.gender} onChange={handleChange}>
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Transgender</option>
          </select>
        </div>

        <div className="section">
          <div className="section-label">Date of Birth</div>
          <input
            id="dob"
            value={form.dob}
            onChange={handleChange}
          />
        </div>

        <div className="instr-panel">
          <p>Select gender and enter DOB</p>
          <button onClick={() => speak("Select gender and enter date of birth")}>🔊</button>
        </div>
      </div>

      {/* ADDRESS */}
      <div className="field-row">

        <div className="section">
          <div className="section-label">Address</div>

          <input id="house_no" placeholder="House No" value={form.house_no} onChange={handleChange} />
          <input id="street" placeholder="Street" value={form.street} onChange={handleChange} />
          <input id="landmark" placeholder="Landmark" value={form.landmark} onChange={handleChange} />
          <input id="area" placeholder="Area" value={form.area} onChange={handleChange} />

          <input id="city" placeholder="City" value={form.city} onChange={handleChange} />
          <input id="district" placeholder="District" value={form.district} onChange={handleChange} />
          <input id="state" placeholder="State" value={form.state} onChange={handleChange} />
          <input id="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} />

        </div>

        <div className="instr-panel">
          <p>Enter full address correctly</p>
          <button onClick={() => speak("Enter your full address carefully")}>🔊</button>
        </div>
      </div>

      {/* CONTACT */}
      <div className="field-row">

        <div className="section">
          <div className="section-label">Contact</div>

          <input id="mobile" placeholder="Mobile Number" value={form.mobile} onChange={handleChange} />
          <input id="email" placeholder="Email" value={form.email} onChange={handleChange} />

        </div>

        <div className="instr-panel">
          <p>Enter mobile and email</p>
          <button onClick={() => speak("Enter your mobile number and email address")}>🔊</button>
        </div>
      </div>

      {/* PRINT BUTTON */}
      <div className="print-section">
        <button className="btn-print" onClick={handlePrint}>
          🖨️ Print Form
        </button>
      </div>

    </div>
  );
};

export default FilledForm;