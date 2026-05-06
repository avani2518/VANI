from flask import Flask, request, jsonify
import cv2
import numpy as np
from PIL import Image
import io
import os
import json
import requests
import re

from dotenv import load_dotenv
from openai import OpenAI
from utils.prompt_loader import load_prompt
from utils.prompt_loader import build_form_filling_prompt, build_combined_extraction_prompt

import os
from rapidocr_onnxruntime import RapidOCR
from flask_cors import CORS

# Load env
load_dotenv()

app = Flask(__name__)

CORS(app) 

ocr = RapidOCR()

# Load API Key
API_KEY_OCR = os.getenv("NVIDIA_API_KEY_OCR")
API_KEY_FORM = os.getenv("NVIDIA_API_KEY_FORM")

MODEL = "google/gemma-3n-e4b-it"

client_ocr = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=API_KEY_OCR
)

client_form = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=API_KEY_FORM
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

    completion = client_ocr.chat.completions.create(
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
    print("\n--- FORM FILLING PROMPT ---\n", prompt, "\n")

    invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
    stream = False

    headers = {
        "Authorization": "Bearer " + API_KEY_FORM,
        "Accept": "text/event-stream" if stream else "application/json"
    }

    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1024,
        "temperature": 0.2,
        "top_p": 0.7,
        "stream": stream
    }

    response = requests.post(invoke_url, headers=headers, json=payload)

    output = ""

    if stream:
        for line in response.iter_lines():
            if line:
                decoded = line.decode("utf-8")

                # Skip SSE prefix
                if decoded.startswith("data: "):
                    decoded = decoded[len("data: "):]

                if decoded == "[DONE]":
                    break

                try:
                    data = json.loads(decoded)
                    delta = data["choices"][0]["delta"]

                    if "content" in delta:
                        output += delta["content"]

                except:
                    continue
    else:
        result = response.json()
        output = result["choices"][0]["message"]["content"]

    print(output)
    # Clean output
    output = output.strip()
    output = output.replace("```json", "").replace("```", "").strip()
    output = re.sub(r",\s*}", "}", output)
    output = re.sub(r",\s*]", "]", output)

    try:
        return json.loads(output)
    except:
        return {
            "error": "JSON parse failed",
            "raw_output": output
        }
    

def call_model_combined(ocr_texts_by_type: dict):

    prompt = build_combined_extraction_prompt(ocr_texts_by_type)

    print("\n--- COMBINED EXTRACTION PROMPT ---\n", prompt, "\n")

    invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"

    headers = {
        "Authorization": "Bearer " + API_KEY_FORM,
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,   
        "top_p": 0.7,
        "max_tokens": 1024,
        "stream": False  
    }

    response = requests.post(invoke_url, headers=headers, json=payload)

    if response.status_code != 200:
        return {
            "error": "Model API failed",
            "status": response.status_code,
            "body": response.text
        }

    result = response.json()

    try:
        output = result["choices"][0]["message"]["content"]
    except:
        return {
            "error": "Invalid API response format",
            "raw_response": result
        }

    # 🔧 Clean output
    output = output.strip()
    output = output.replace("```json", "").replace("```", "").strip()

    # 🔥 Fix common JSON issues (VERY IMPORTANT)
    output = re.sub(r",\s*}", "}", output)
    output = re.sub(r",\s*]", "]", output)

    print("finished model call (OCR cleaning), parsing output...")

    try:
        return json.loads(output)
    except Exception as e:
        print("\n--- RAW MODEL OUTPUT ---\n", output, "\n")
        return {
            "error": "JSON parse failed",
            "raw_output": output
        }

# def fill_form(extracted_data, form_type):
    
#     # Load form structure 
#     with open(f"formStructures/{form_type}.json", "r") as f:
#         form_structure = json.load(f)

#     prompt = build_form_filling_prompt(form_structure, extracted_data)
#     print("\n--- FORM FILLING PROMPT ---\n", prompt, "\n")

#     completion = client_form.chat.completions.create(
#         model="deepseek-ai/deepseek-v3.1-terminus",
#         messages=[{"role": "user", "content": prompt}],
#         temperature=0.0,
#         max_tokens=1024,
#         extra_body={"chat_template_kwargs": {"thinking": False}},
#         stream=True
#     )

#     output = ""

#     for chunk in completion:
#         if not getattr(chunk, "choices", None):
#             continue

#         delta = chunk.choices[0].delta
#         if delta and delta.content:
#             output += delta.content

#     output = output.strip()
#     output = output.replace("```json", "").replace("```", "").strip()

#     try:
#         return json.loads(output)
#     except:
#         return {
#             "error": "JSON parse failed",
#             "raw_output": output
#         }


# def call_model_combined(ocr_texts_by_type: dict):
#     prompt = build_combined_extraction_prompt(ocr_texts_by_type)

#     print("\n--- COMBINED EXTRACTION PROMPT ---\n", prompt, "\n")

#     completion = client_ocr.chat.completions.create(
#         model="deepseek-ai/deepseek-v3.1-terminus",
#         messages=[{"role": "user", "content": prompt}],
#         temperature=0.0,
#         top_p=0.7,
#         max_tokens=2048,
#         extra_body={"chat_template_kwargs": {"thinking": False}},
#         stream=True
#     )

#     output = ""
#     for chunk in completion:
#         if not getattr(chunk, "choices", None):
#             continue
#         delta = chunk.choices[0].delta
#         if delta and delta.content:
#             output += delta.content

#     output = output.strip().replace("```json", "").replace("```", "").strip()

#     print("finished model call number 1, parsing output...")

#     try:
#         return json.loads(output)
#     except Exception as e:
#         print("\n--- RAW MODEL OUTPUT ---\n", output, "\n")
#         return {"error": "JSON parse failed", "raw_output": output}
    

def extract_ocr_for_file(file, doc_type):
    image_bytes = file.read()
    if not image_bytes:
        raise Exception(f"Empty file received for {doc_type}")
    processed_img = preprocess_image(image_bytes)
    raw_text = extract_text(processed_img)
    return clean_ocr_for_model(raw_text)


# Routes
@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "OCR → Model API (Production Ready)"})


@app.route('/extract-multiple', methods=['POST'])
def extract_multiple():
    if not request.files:
        return jsonify({"error": "No files uploaded"}), 400

    file_mapping = {
        "aadhaarFile": "aadhaar",
        "panFile": "pan",
        "dlFile": "driving_license",
        "passportFile": "passport"
    }

    try:
        # Step 1: OCR all uploaded files (no model calls yet)
        ocr_texts = {}
        for key, doc_name in file_mapping.items():
            if key in request.files:
                ocr_texts[doc_name] = extract_ocr_for_file(request.files[key], doc_name)

        if not ocr_texts:
            return jsonify({"error": "No valid document keys provided"}), 400
        
        print(ocr_texts)

        # Step 2: Single combined model call
        extracted_documents = call_model_combined(ocr_texts)

        if "error" in extracted_documents:
            return jsonify({"error": extracted_documents}), 500

        # Step 3: Form filling (unchanged)
        form_type = request.form.get("formType")
        filled_form = fill_form(
            {"documents": extracted_documents, "status": "success"},
            form_type
        )

        if "error" in filled_form:
            return jsonify({"error": filled_form}), 500

        # return jsonify({
        #     "status": "success",
        #     "documents": extracted_documents,
        #     "filled_form": filled_form
        # })
        return jsonify({
            "status": "success",
            "filled_form": filled_form
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# @app.route('/extract-multiple', methods=['POST'])
# def extract_multiple():

#     if not request.files:
#         return jsonify({"error": "No files uploaded"}), 400

#     response = {}

#     file_mapping = {
#         "aadhaarFile": "aadhaar",
#         "panFile": "pan",
#         "dlFile": "driving_license",
#         "passportFile": "passport"
#     }

#     try:
#         for key, doc_name in file_mapping.items():
#             if key in request.files:
#                 result = process_file(request.files[key], doc_name)
#                 response[doc_name] = result

#         if not response:
#             return jsonify({"error": "No valid document keys provided"}), 400

#         # return jsonify({
#         #     "status": "success",
#         #     "documents": response
#         # })

#         # Call form filling
#         # form_type = "aadhaar_form"
#         form_type = request.form.get("formType")

#         filled_form = fill_form(
#             {
#                 "documents": response,
#                 "status": "success"
#             },
#             form_type
#         )

#         return jsonify({
#             "status": "success",
#             "documents": response,
#             "filled_form": filled_form
#         })

#     # except Exception as e:
#     #     return jsonify({"error": str(e)}), 500
#     except Exception as e:
#         import traceback
#         traceback.print_exc()   # 🔥 ADD THIS
#         return jsonify({"error": str(e)}), 500


# Run
if __name__ == '__main__':
    app.run(debug=True)