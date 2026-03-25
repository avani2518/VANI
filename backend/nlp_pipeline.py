# nlp_pipeline.py

import re
from datetime import datetime

def clean_text(text):
    text = text.lower()
    text = re.sub(r'\n+', ' ', text)
    text = re.sub(r'[^a-zA-Z0-9/ ]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_date(text):
    patterns = [
        r'\d{2}/\d{2}/\d{4}',
        r'\d{2}-\d{2}-\d{4}',
        r'\d{4}-\d{2}-\d{2}'
    ]
    for pattern in patterns:
        match = re.findall(pattern, text)
        if match:
            return match[0]
    return None


def normalize_name(text):
    return " ".join([w.capitalize() for w in text.split()])


def process_aadhaar(text):
    text = clean_text(text)

    data = {}

    # Aadhaar Number
    aadhaar = re.findall(r'\b\d{4}\s?\d{4}\s?\d{4}\b', text)
    if aadhaar:
        data["aadhaar_number"] = aadhaar[0].replace(" ", "")

    # DOB
    dob = extract_date(text)
    if dob:
        data["dob"] = dob

    # Gender
    if "male" in text:
        data["gender"] = "Male"
    elif "female" in text:
        data["gender"] = "Female"

    # Name (heuristic: first capitalized words before dob)
    name_match = re.search(r'([a-z]+ [a-z]+)', text)
    if name_match:
        data["name"] = normalize_name(name_match.group())

    return data


def process_pan(text):
    text = clean_text(text)

    data = {}

    # PAN Number
    pan = re.findall(r'[A-Z]{5}[0-9]{4}[A-Z]', text.upper())
    if pan:
        data["pan_number"] = pan[0]

    # Name
    name_match = re.search(r'name\s([a-z ]+)', text)
    if name_match:
        data["name"] = normalize_name(name_match.group(1))

    # Father's Name
    father_match = re.search(r'father\sname\s([a-z ]+)', text)
    if father_match:
        data["father_name"] = normalize_name(father_match.group(1))

    # DOB
    dob = extract_date(text)
    if dob:
        data["dob"] = dob

    return data


def process_driving_license(text):
    text = clean_text(text)

    data = {}

    # DL Number (generic pattern)
    dl = re.findall(r'[A-Z]{2}\d{2}\s?\d{11}', text.upper())
    if dl:
        data["dl_number"] = dl[0]

    # Name
    name_match = re.search(r'name\s([a-z ]+)', text)
    if name_match:
        data["name"] = normalize_name(name_match.group(1))

    # DOB
    dob = extract_date(text)
    if dob:
        data["dob"] = dob

    # Validity
    validity = re.findall(r'\d{2}/\d{2}/\d{4}', text)
    if len(validity) >= 2:
        data["valid_from"] = validity[0]
        data["valid_to"] = validity[1]

    return data


def process_passport(text):
    text = clean_text(text)

    data = {}

    # Passport Number
    passport = re.findall(r'[A-Z][0-9]{7}', text.upper())
    if passport:
        data["passport_number"] = passport[0]

    # Name
    name_match = re.search(r'name\s([a-z ]+)', text)
    if name_match:
        data["name"] = normalize_name(name_match.group(1))

    # Nationality
    if "india" in text:
        data["nationality"] = "Indian"

    # DOB
    dob = extract_date(text)
    if dob:
        data["dob"] = dob

    # Expiry
    dates = re.findall(r'\d{2}/\d{2}/\d{4}', text)
    if len(dates) >= 2:
        data["expiry_date"] = dates[-1]

    return data


def detect_document(text):
    text = text.lower()

    if "aadhaar" in text or "uidai" in text:
        return "aadhaar"
    elif "income tax department" in text:
        return "pan"
    elif "driving licence" in text:
        return "dl"
    elif "passport" in text:
        return "passport"
    else:
        return "unknown"
    

def process_document(text):
    doc_type = detect_document(text)

    if doc_type == "aadhaar":
        data = process_aadhaar(text)
    elif doc_type == "pan":
        data = process_pan(text)
    elif doc_type == "dl":
        data = process_driving_license(text)
    elif doc_type == "passport":
        data = process_passport(text)
    else:
        data = {"raw_text": text}

    return {
        "document_type": doc_type,
        "structured_data": data
    }