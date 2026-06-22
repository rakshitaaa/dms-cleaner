from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict
import pandas as pd
import os
import uuid
from datetime import datetime

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

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")


class CleanRequest(BaseModel):
    fileName: str
    mapping: Dict[str, str]


def clean_text(value):
    if pd.isna(value):
        return ""
    return str(value).strip()


def normalize_code(value):
    return clean_text(value).upper()


def normalize_name(value):
    return clean_text(value).upper()


def parse_date(value):
    raw = clean_text(value)

    if not raw:
        return ""

    # Handles 20260605
    if raw.isdigit() and len(raw) == 8:
        return f"{raw[0:4]}-{raw[4:6]}-{raw[6:8]}"

    try:
        return pd.to_datetime(raw).strftime("%Y-%m-%d")
    except Exception:
        return raw


def aging_bucket(days):
    try:
        value = int(float(days))
    except Exception:
        value = 0

    if value <= 15:
        return "0-15"
    if value <= 30:
        return "16-30"
    if value <= 60:
        return "31-60"
    if value <= 90:
        return "61-90"
    return "90+"


def read_sheet(file_path):
    if file_path.endswith(".csv"):
        return pd.read_csv(file_path, dtype=str).fillna("")
    return pd.read_excel(file_path, dtype=str).fillna("")


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

    headers = list(df.columns)
    preview_rows = df.head(5).to_dict(orient="records")

    return {
        "success": True,
        "message": "File uploaded successfully.",
        "fileName": file_name,
        "originalName": file.filename,
        "headers": headers,
        "totalRows": len(df),
        "previewRows": preview_rows,
    }


@app.post("/api/cleaner/clean")
async def clean_sheet(payload: CleanRequest):
    file_path = os.path.join(UPLOAD_DIR, payload.fileName)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Uploaded file not found.")

    df = read_sheet(file_path)
    mapping = payload.mapping

    cleaned_rows = []
    errors = []

    def get_value(row, db_field):
        sheet_column = mapping.get(db_field)
        if not sheet_column:
            return ""
        return row.get(sheet_column, "")

    for index, row in df.iterrows():
        row_dict = row.to_dict()
        row_number = index + 2

        holder_code = normalize_code(get_value(row_dict, "holderCode"))
        holder_name = normalize_name(get_value(row_dict, "holderName"))
        product_code = normalize_code(get_value(row_dict, "productCode"))
        imei_or_serial = clean_text(get_value(row_dict, "imeiOrSerialNo"))

        if not holder_code or not holder_name or not product_code or not imei_or_serial:
            errors.append({
                "rowNumber": row_number,
                "reason": "Missing required field: holderCode, holderName, productCode, or imeiOrSerialNo",
                "rawRow": row_dict,
            })
            continue

        aging_days_raw = clean_text(get_value(row_dict, "agingDays"))

        try:
            aging_days = int(float(aging_days_raw)) if aging_days_raw else 0
        except Exception:
            aging_days = 0

        cleaned_rows.append({
            "holderType": normalize_code(get_value(row_dict, "holderType")),
            "holderCode": holder_code,
            "holderName": holder_name,
            "holderStatus": normalize_code(get_value(row_dict, "holderStatus")),

            "sellerType": normalize_code(get_value(row_dict, "sellerType")),
            "sellerCode": normalize_code(get_value(row_dict, "sellerCode")),
            "sellerName": normalize_name(get_value(row_dict, "sellerName")),
            "sellerStatus": normalize_code(get_value(row_dict, "sellerStatus")),

            "brand": clean_text(get_value(row_dict, "brand")) or "samsung",

            "productCategory": normalize_code(get_value(row_dict, "productCategory")),
            "productSubCategory": normalize_code(get_value(row_dict, "productSubCategory")),
            "productSegment": normalize_code(get_value(row_dict, "productSegment")),
            "modelCode": normalize_code(get_value(row_dict, "modelCode")),
            "productCode": product_code,
            "productName": clean_text(get_value(row_dict, "productName")),

            "imeiOrSerialNo": imei_or_serial,
            "stockType": clean_text(get_value(row_dict, "stockType")),
            "tertiaryDate": parse_date(get_value(row_dict, "tertiaryDate")),
            "agingDays": aging_days,
            "agingBucket": aging_bucket(aging_days),
        })

    cleaned_df = pd.DataFrame(cleaned_rows)

    output_file_name = f"cleaned_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    output_path = os.path.join(OUTPUT_DIR, output_file_name)

    cleaned_df.to_excel(output_path, index=False)

    return {
        "success": True,
        "message": "Sheet cleaned successfully.",
        "totalRows": len(df),
        "validRows": len(cleaned_rows),
        "invalidRows": len(errors),
        "errors": errors[:50],
        "previewRows": cleaned_rows[:20],
        "outputFileName": output_file_name,
        "downloadUrl": f"/outputs/{output_file_name}",
    }