from flask import Flask, request, jsonify
import cv2
import numpy as np
from PIL import Image
import io
import os
import json

from dotenv import load_dotenv
from openai import OpenAI
from utils.prompt_loader import load_prompt
from utils.prompt_loader import build_form_filling_prompt

import os
from rapidocr_onnxruntime import RapidOCR

# Load env
load_dotenv()

app = Flask(__name__)

ocr = RapidOCR()

# Load API Key
API_KEY = os.getenv("NVIDIA_API_KEY")

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=API_KEY
)

PROMPT_PATH = "modelPrompts/extraction_prompt.txt"


def preprocess_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    except Exception as e:
        raise Exception("Invalid image file") from e

    img = np.array(image)

    if img is None or img.size == 0:
        raise Exception("Image conversion failed")

    img = cv2.convertScaleAbs(img, alpha=1.2, beta=10)

    return img


def extract_text(image):
    try:
        result, _ = ocr(image)
    except Exception as e:
        print("OCR Error:", e)
        return ""

    print("RAW OCR RESULT:", result)

    texts = []

    if not result:
        return ""

    for line in result:
        try:
            # RapidOCR format:
            # [ [box], text, confidence ]
            if len(line) < 2:
                continue

            text = line[1]

            # confidence optional
            conf = line[2] if len(line) > 2 else 1.0

            if conf > 0.4:
                clean = text.replace(";", " ").replace("_", " ")
                texts.append(clean)

        except Exception as e:
            print("Skipping:", line, "| Error:", e)
            continue

    final_text = " ".join(texts)
    final_text = final_text.replace("\n", " ").replace("|", " ")
    final_text = " ".join(final_text.split())

    print("\n--- CLEAN OCR TEXT ---\n", final_text, "\n")

    return final_text


def call_model(ocr_text, doc_type):

    # Load prompt with variables
    prompt = load_prompt(PROMPT_PATH, ocr_text, doc_type)

    completion = client.chat.completions.create(
        model="deepseek-ai/deepseek-v3.1-terminus",  # model
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,  # reduce hallucination
        top_p=0.7,
        max_tokens=1024, 
        extra_body={"chat_template_kwargs": {"thinking": False}},
        stream=True
    )

    output = ""

    for chunk in completion:
        if not getattr(chunk, "choices", None):
            continue

        delta = chunk.choices[0].delta

        if delta and delta.content:
            output += delta.content

    output = output.strip()

    # 
    output = output.replace("```json", "").replace("```", "").strip()

    # Parse JSON
    try:
        parsed = json.loads(output)
        return parsed
    except Exception as e:
        print("\n--- RAW MODEL OUTPUT ---\n", output, "\n")

        return {
            "error": "JSON parse failed",
            "raw_output": output
        }


def process_file(file, doc_type):
    try:
        image_bytes = file.read()

        if not image_bytes:
            raise Exception("Empty file received")

        processed_img = preprocess_image(image_bytes)

        # print("Image shape:", processed_img.shape)

        raw_text = extract_text(processed_img)

        raw_text = clean_ocr_for_model(raw_text)

        model_output = call_model(raw_text, doc_type)

        return {
            "document_type": doc_type,
            # "ocr_text": raw_text,
            **model_output
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e


def clean_ocr_for_model(text):
    text = text.replace(";", " ")
    text = text.replace("_", " ")
    text = text.replace(":", " ")
    text = text.replace(",", " ")
    text = " ".join(text.split())
    return text


def fill_form(extracted_data, form_type):
    
    # Load form structure 
    with open(f"formStructures/{form_type}.json", "r") as f:
        form_structure = json.load(f)

    prompt = build_form_filling_prompt(form_structure, extracted_data)

    completion = client.chat.completions.create(
        model="deepseek-ai/deepseek-v3.1-terminus",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
        max_tokens=4096,
        extra_body={"chat_template_kwargs": {"thinking": False}},
        stream=True
    )

    output = ""

    for chunk in completion:
        if not getattr(chunk, "choices", None):
            continue

        delta = chunk.choices[0].delta
        if delta and delta.content:
            output += delta.content

    output = output.strip()
    output = output.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(output)
    except:
        return {
            "error": "JSON parse failed",
            "raw_output": output
        }


# Routes
@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "OCR → Model API (Production Ready)"})


@app.route('/extract-multiple', methods=['POST'])
def extract_multiple():

    if not request.files:
        return jsonify({"error": "No files uploaded"}), 400

    response = {}

    file_mapping = {
        "aadhaarFile": "aadhaar",
        "panFile": "pan",
        "dlFile": "driving_license",
        "passportFile": "passport"
    }

    try:
        for key, doc_name in file_mapping.items():
            if key in request.files:
                result = process_file(request.files[key], doc_name)
                response[doc_name] = result

        if not response:
            return jsonify({"error": "No valid document keys provided"}), 400

        # return jsonify({
        #     "status": "success",
        #     "documents": response
        # })

        # Call form filling
        form_type = "aadhaar_form"  # or get dynamically from frontend later

        filled_form = fill_form(
            {
                "documents": response,
                "status": "success"
            },
            form_type
        )

        return jsonify({
            "status": "success",
            "documents": response,
            "filled_form": filled_form
        })

    # except Exception as e:
    #     return jsonify({"error": str(e)}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()   # 🔥 ADD THIS
        return jsonify({"error": str(e)}), 500


# Run
if __name__ == '__main__':
    app.run(debug=True)