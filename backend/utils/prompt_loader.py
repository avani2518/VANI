import json

def load_prompt(file_path, ocr_text, doc_type):
    with open(file_path, "r", encoding="utf-8") as f:
        prompt = f.read()

    prompt = prompt.replace("{ocr_text}", ocr_text)
    prompt = prompt.replace("{document_type}", doc_type)

    return prompt

def build_form_filling_prompt(form_structure, extracted_data):
    with open("modelPrompts/form_filling_prompt.txt", "r") as f:
        template = f.read()

    prompt = template.replace("{form_structure}", json.dumps(form_structure, indent=2))
    prompt = prompt.replace("{extracted_data}", json.dumps(extracted_data, indent=2))

    return prompt