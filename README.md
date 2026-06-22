# ⚡ DMS Cleaner — Report Automation Software

> **Turn messy Excel and CSV reports into clean, structured, ready-to-use data in seconds.**

DMS Cleaner is a flexible **report automation platform** designed for businesses that deal with repetitive Excel cleaning, column mapping, validation, and formatted output generation.

It helps users upload raw reports, map columns to their desired output format, clean the data, validate important fields, and download a polished final file — without rewriting scripts every time.

---

## 🚀 The Idea

Every business has reports.

And every report has problems:

* Different column names
* Extra spaces
* Wrong date formats
* Missing values
* Repeated manual formatting
* Messy Excel dumps
* Different formats from different teams or systems

DMS Cleaner solves this with a simple workflow:

```txt
Upload Report
     ↓
Map Columns
     ↓
Clean Data
     ↓
Validate Rows
     ↓
Download Final Output
```

---

## ✨ What DMS Cleaner Does

### 📤 Upload Any Report

Upload Excel or CSV files from a simple web interface.

Supported formats:

```txt
.xlsx
.xls
.csv
```

---

### 🧩 Map Columns Your Way

Every report is different.

DMS Cleaner allows users to map incoming sheet columns to their own standard output fields.

Example:

| Uploaded Sheet Column | Your Output Field |
| --------------------- | ----------------- |
| Customer Name         | clientName        |
| Mobile Number         | phone             |
| Item Code             | productCode       |
| Report Date           | date              |
| Sales Amount          | amount            |

This means the system is not locked to one business, one industry, or one report type.

---

### 🧼 Clean Data Automatically

DMS Cleaner can standardize messy data by applying cleaning rules such as:

* Remove extra spaces
* Normalize text casing
* Format dates
* Clean numeric values
* Replace blanks
* Detect missing required fields
* Remove or flag invalid rows
* Generate clean output columns

---

### ✅ Validate Before Export

The system can detect issues before generating the final file.

Examples:

```txt
Missing required field
Invalid date
Blank identifier
Duplicate rows
Wrong number format
Unmapped column
```

This helps reduce reporting mistakes and manual checking.

---

### 📥 Download Clean Output

After processing, users can download a clean Excel file that is ready for:

* Database import
* Dashboard upload
* MIS reporting
* Internal review
* Client delivery
* Business analysis
* Team operations

---

## 🧠 Why It Matters

Most teams waste hours every week cleaning the same type of reports.

DMS Cleaner is built around one simple promise:

> **Map once. Automate forever.**

Once a report format is mapped, the same cleaning process can be reused again and again.

---

## 🖥️ Tech Stack

### Frontend

```txt
React
Vite
Axios
```

### Backend

```txt
Python
FastAPI
Pandas
OpenPyXL
```

Python powers the data-cleaning engine, making the platform ideal for handling Excel, CSV, validation, transformations, and future analytics.

---

## 📁 Project Structure

```txt
dms-cleaner/
│
├── backend/
│   ├── main.py
│   ├── uploads/
│   ├── outputs/
│   └── venv/
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   └── CleanerPage.jsx
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## ⚙️ Backend Setup

Go to the backend folder:

```bash
cd backend
```

Create virtual environment:

```bash
python3 -m venv venv
```

Activate virtual environment:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install fastapi uvicorn pandas openpyxl python-multipart
```

Run backend:

```bash
uvicorn main:app --reload --port 5055
```

Backend runs at:

```txt
http://localhost:5055
```

API docs:

```txt
http://localhost:5055/docs
```

---

## 🎨 Frontend Setup

Go to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Frontend runs at:

```txt
http://localhost:5173
```

---

## 🧪 Current Workflow

### 1. Upload File

Upload any Excel or CSV report.

### 2. Preview Columns

The system reads the uploaded file and displays available columns.

### 3. Map Fields

Select which uploaded column should become which output field.

### 4. Clean Report

The backend processes the report using Python.

### 5. Export Output

Download the cleaned Excel file.

---

## 🧱 Core Modules

### Upload Engine

Handles report uploads and reads file metadata.

### Column Mapping Engine

Allows users to map raw report columns to final output fields.

### Cleaning Engine

Applies standard cleaning rules to the uploaded data.

### Validation Engine

Flags missing, invalid, or duplicate data.

### Export Engine

Generates clean Excel output for download.

---

## 🔮 Upcoming Features

### 🧠 Saved Templates

Users will be able to save mapping templates for repeated report formats.

Example:

```txt
Monthly Sales Report
Inventory Report
Finance Report
Attendance Report
Client Data Import
Custom MIS Report
```

Then future reports can be processed with one click.

---

### 👤 User Profiles

Each user can create a workspace, save templates, and manage report history.

---

### ⚙️ Custom Cleaning Rules

Users will be able to define rules like:

```txt
Convert this column to uppercase
Remove duplicates using this field
Format this column as date
Replace blank values with 0
Split full name into first and last name
Merge two columns into one
```

---

### 📊 Report Analysis

Future versions may include automatic summaries, charts, and insights from uploaded reports.

Possible analytics:

* Total rows processed
* Error percentage
* Duplicate count
* Category-wise summary
* Date-wise trends
* Amount/value summaries
* Custom business insights

---

### 🔗 API Integrations

Cleaned data can later be pushed directly into:

```txt
ERP systems
CRM platforms
DMS platforms
Dashboards
Internal business tools
Custom APIs
```

---

## 💡 Product Vision

DMS Cleaner is not just a file converter.

It is a **workflow automation platform for business reports**.

The goal is to help teams stop repeating the same Excel cleaning work every day and move toward reusable, automated report workflows.

---

## 🏷️ Use Cases

```txt
Excel Report Cleaning
CSV Data Formatting
MIS Automation
Sales Report Processing
Inventory Report Formatting
Finance Report Standardization
Attendance Report Cleaning
Client Data Import Preparation
Business Data Validation
Dashboard Upload Preparation
```

---

## 📌 Status

```txt
Version: 0.1.0
Status: In Development
Focus: Universal Report Cleaning + Automation
```

---

## 🧡 Built For

Teams that are tired of:

```txt
Renaming columns manually
Cleaning the same Excel files repeatedly
Fixing formats before every upload
Checking missing data row by row
Creating the same reports again and again
```

DMS Cleaner helps them save time, reduce errors, and create repeatable reporting workflows.

---

## ⭐ Tagline

```txt
Upload messy reports. Automate clean output.
```
