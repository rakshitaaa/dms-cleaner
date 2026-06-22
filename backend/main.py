from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import os
import uuid
from datetime import datetime
import json

app = FastAPI(title="DMS Cleaner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
TEMPLATE_FILE = "templates/reportTemplates.json"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")


class OutputField(BaseModel):
    outputField: str
    sourceColumn: Optional[str] = ""
    cleaningRule: Optional[str] = "none"
    defaultValue: Optional[str] = ""
    required: Optional[bool] = False


class CleanRequest(BaseModel):
    fileName: str
    fields: List[OutputField]


def read_sheet(file_path):
    if file_path.endswith(".csv"):
        return pd.read_csv(file_path, dtype=str).fillna("")
    return pd.read_excel(file_path, dtype=str).fillna("")


def clean_text(value):
    if pd.isna(value):
        return ""
    return str(value).strip()


def apply_cleaning_rule(value, rule):
    value = clean_text(value)

    if rule == "uppercase":
        return value.upper()

    if rule == "lowercase":
        return value.lower()

    if rule == "titlecase":
        return value.title()

    if rule == "number":
        try:
            return float(value)
        except Exception:
            return ""

    if rule == "integer":
        try:
            return int(float(value))
        except Exception:
            return ""

    if rule == "date":
        if not value:
            return ""

        # Handles format like 20260605
        if value.isdigit() and len(value) == 8:
            return f"{value[0:4]}-{value[4:6]}-{value[6:8]}"

        try:
            return pd.to_datetime(value).strftime("%Y-%m-%d")
        except Exception:
            return value

    # default: trim only
    return value


def load_templates():
    if not os.path.exists(TEMPLATE_FILE):
        return []

    with open(TEMPLATE_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def normalize_for_match(value):
    return str(value or "").lower().replace(" ", "").replace("_", "").replace("-", "").replace("/", "").replace("(", "").replace(")", "")


def auto_map_template_fields(fields, headers):
    normalized_headers = [
        {
            "original": header,
            "normalized": normalize_for_match(header)
        }
        for header in headers
    ]

    mapped_fields = []

    for field in fields:
        field_copy = dict(field)
        aliases = field_copy.get("aliases", [])
        possible_names = [field_copy.get("outputField", "")] + aliases

        normalized_aliases = [normalize_for_match(name) for name in possible_names]

        matched_header = ""

        for header in normalized_headers:
            if header["normalized"] in normalized_aliases:
                matched_header = header["original"]
                break

        field_copy["sourceColumn"] = matched_header
        mapped_fields.append(field_copy)

    return mapped_fields


@app.get("/")
def root():
    return {"message": "DMS Cleaner API is running"}


@app.post("/api/cleaner/upload")
async def upload_sheet(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in [".xlsx", ".xls", ".csv"]:
        raise HTTPException(
            status_code=400,
            detail="Only Excel or CSV files are allowed."
        )

    safe_name = file.filename.replace(" ", "_")
    file_name = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        df = read_sheet(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read file: {str(e)}"
        )

    return {
        "success": True,
        "message": "File uploaded successfully.",
        "fileName": file_name,
        "originalName": file.filename,
        "headers": list(df.columns),
        "totalRows": len(df),
        "previewRows": df.head(5).to_dict(orient="records"),
    }


@app.post("/api/cleaner/clean")
async def clean_sheet(payload: CleanRequest):
    file_path = os.path.join(UPLOAD_DIR, payload.fileName)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Uploaded file not found.")

    df = read_sheet(file_path)

    cleaned_rows = []
    errors = []

    for index, row in df.iterrows():
        row_dict = row.to_dict()
        row_number = index + 2

        cleaned_row = {}
        row_errors = []

        for field in payload.fields:
            output_field = clean_text(field.outputField)

            if not output_field:
                continue

            raw_value = ""

            if field.sourceColumn:
                raw_value = row_dict.get(field.sourceColumn, "")

            if not clean_text(raw_value) and field.defaultValue:
                raw_value = field.defaultValue

            final_value = apply_cleaning_rule(raw_value, field.cleaningRule)

            if field.required and not clean_text(final_value):
                row_errors.append(f"Missing required field: {output_field}")

            cleaned_row[output_field] = final_value

        if row_errors:
            errors.append({
                "rowNumber": row_number,
                "reasons": row_errors,
                "rawRow": row_dict,
            })
            continue

        cleaned_rows.append(cleaned_row)

    cleaned_df = pd.DataFrame(cleaned_rows)

    output_file_name = f"cleaned_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    output_path = os.path.join(OUTPUT_DIR, output_file_name)

    cleaned_df.to_excel(output_path, index=False)

    return {
        "success": True,
        "message": "Report cleaned successfully.",
        "totalRows": len(df),
        "validRows": len(cleaned_rows),
        "invalidRows": len(errors),
        "errors": errors[:50],
        "previewRows": cleaned_rows[:20],
        "outputFileName": output_file_name,
        "downloadUrl": f"/outputs/{output_file_name}",
    }

@app.get("/api/templates")
def get_templates():
    templates = load_templates()

    return {
        "success": True,
        "templates": templates
    }


@app.get("/api/templates/{template_id}/map")
def get_template_with_auto_mapping(template_id: str, fileName: str):
    file_path = os.path.join(UPLOAD_DIR, fileName)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Uploaded file not found.")

    df = read_sheet(file_path)
    headers = list(df.columns)

    templates = load_templates()
    selected_template = next(
        (template for template in templates if template.get("id") == template_id),
        None
    )

    if not selected_template:
        raise HTTPException(status_code=404, detail="Template not found.")

    mapped_fields = auto_map_template_fields(
        selected_template.get("fields", []),
        headers
    )

    return {
        "success": True,
        "template": {
            **selected_template,
            "fields": mapped_fields
        },
        "headers": headers
    }