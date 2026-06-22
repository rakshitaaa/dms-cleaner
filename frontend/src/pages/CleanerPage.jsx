import { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5055";

const standardFields = [
  { key: "holderType", label: "Holder Type" },
  { key: "holderCode", label: "Holder Code *" },
  { key: "holderName", label: "Holder Name *" },
  { key: "holderStatus", label: "Holder Status" },

  { key: "sellerType", label: "Seller Type" },
  { key: "sellerCode", label: "Seller Code" },
  { key: "sellerName", label: "Seller Name" },
  { key: "sellerStatus", label: "Seller Status" },

  { key: "brand", label: "Brand" },
  { key: "productCategory", label: "Product Category" },
  { key: "productSubCategory", label: "Product Sub Category" },
  { key: "productSegment", label: "Product Segment" },
  { key: "modelCode", label: "Model Code" },
  { key: "productCode", label: "Product Code *" },
  { key: "productName", label: "Product Name" },

  { key: "imeiOrSerialNo", label: "IMEI / Serial No *" },
  { key: "stockType", label: "Stock Type" },
  { key: "tertiaryDate", label: "Tertiary Date" },
  { key: "agingDays", label: "Aging Days" },
];

function CleanerPage() {
  const [file, setFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [cleanResult, setCleanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_BASE}/api/cleaner/upload`, formData);

      setUploadedFileName(res.data.fileName);
      setHeaders(res.data.headers || []);
      setPreviewRows(res.data.previewRows || []);
      setCleanResult(null);
      setMapping({});
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (fieldKey, sheetColumn) => {
    setMapping((prev) => ({
      ...prev,
      [fieldKey]: sheetColumn,
    }));
  };

  const handleClean = async () => {
    if (!uploadedFileName) {
      alert("Please upload a file first.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_BASE}/api/cleaner/clean`, {
        fileName: uploadedFileName,
        mapping,
      });

      setCleanResult(res.data);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Cleaning failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>DMS Cleaner</h1>
      <p>Upload sheet, map columns, and generate cleaned output.</p>

      <div style={cardStyle}>
        <h2>1. Upload Sheet</h2>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          style={{ marginLeft: 12 }}
        >
          {loading ? "Processing..." : "Upload"}
        </button>
      </div>

      {headers.length > 0 && (
        <>
          <div style={cardStyle}>
            <h2>2. Map Columns</h2>

            <p>
              Required fields: <b>Holder Code, Holder Name, Product Code, IMEI / Serial No</b>
            </p>

            <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Our Field</th>
                  <th align="left">Sheet Column</th>
                </tr>
              </thead>

              <tbody>
                {standardFields.map((field) => (
                  <tr key={field.key}>
                    <td>{field.label}</td>
                    <td>
                      <select
                        value={mapping[field.key] || ""}
                        onChange={(e) =>
                          handleMappingChange(field.key, e.target.value)
                        }
                      >
                        <option value="">-- Not Mapped --</option>

                        {headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={handleClean}
              disabled={loading}
              style={{ marginTop: 16 }}
            >
              {loading ? "Cleaning..." : "Clean & Generate Output"}
            </button>
          </div>

          <div style={{ ...cardStyle, overflowX: "auto" }}>
            <h2>Sheet Preview</h2>

            <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {previewRows.map((row, index) => (
                  <tr key={index}>
                    {headers.map((header) => (
                      <td key={header}>{row[header]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {cleanResult && (
        <div style={cardStyle}>
          <h2>3. Cleaned Output</h2>

          <p>Total Rows: {cleanResult.totalRows}</p>
          <p>Valid Rows: {cleanResult.validRows}</p>
          <p>Invalid Rows: {cleanResult.invalidRows}</p>

          <a
            href={`${API_BASE}${cleanResult.downloadUrl}`}
            target="_blank"
            rel="noreferrer"
          >
            Download Cleaned Excel
          </a>

          <h3>Cleaned Preview</h3>

          <div style={{ overflowX: "auto" }}>
            <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {cleanResult.previewRows?.[0] &&
                    Object.keys(cleanResult.previewRows[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                </tr>
              </thead>

              <tbody>
                {cleanResult.previewRows?.map((row, index) => (
                  <tr key={index}>
                    {Object.keys(row).map((key) => (
                      <td key={key}>{row[key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cleanResult.errors?.length > 0 && (
            <>
              <h3>Errors</h3>
              <pre style={{ maxHeight: 300, overflow: "auto" }}>
                {JSON.stringify(cleanResult.errors, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  border: "1px solid #ddd",
  padding: 16,
  borderRadius: 8,
  marginTop: 20,
};

export default CleanerPage;