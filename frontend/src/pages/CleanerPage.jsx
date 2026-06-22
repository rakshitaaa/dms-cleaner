import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5055";

const cleaningRules = [
  { value: "none", label: "Trim only" },
  { value: "uppercase", label: "Uppercase" },
  { value: "lowercase", label: "Lowercase" },
  { value: "titlecase", label: "Title Case" },
  { value: "date", label: "Date Format" },
  { value: "number", label: "Number" },
  { value: "integer", label: "Integer" },
];

const blankField = {
  outputField: "",
  sourceColumn: "",
  cleaningRule: "none",
  defaultValue: "",
  required: false,
  aliases: [],
};

function CleanerPage() {
  const [file, setFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("custom");
  const [fields, setFields] = useState([{ ...blankField }]);
  const [cleanResult, setCleanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTemplates = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/templates`);
      const backendTemplates = res.data.templates || [];

      setTemplates([
        {
          id: "custom",
          name: "Custom Blank Template",
          description: "Create your own output format manually.",
          fields: [{ ...blankField }],
        },
        ...backendTemplates,
      ]);
    } catch (error) {
      console.error(error);
      alert("Failed to load templates.");
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const applyTemplate = async (templateId, fileName = uploadedFileName) => {
    setSelectedTemplateId(templateId);
    setCleanResult(null);

    if (templateId === "custom") {
      setFields([{ ...blankField }]);
      return;
    }

    const selectedTemplate = templates.find(
      (template) => template.id === templateId
    );

    if (!selectedTemplate) return;

    if (!fileName) {
      setFields(selectedTemplate.fields.map((field) => ({ ...field })));
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/api/templates/${templateId}/map`, {
        params: { fileName },
      });

      setFields(res.data.template.fields || []);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Failed to apply template.");
    }
  };

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

      if (selectedTemplateId !== "custom") {
        await applyTemplate(selectedTemplateId, res.data.fileName);
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (index, key, value) => {
    setFields((prev) =>
      prev.map((field, i) =>
        i === index ? { ...field, [key]: value } : field
      )
    );
  };

  const addField = () => {
    setFields((prev) => [...prev, { ...blankField }]);
  };

  const removeField = (index) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClean = async () => {
    if (!uploadedFileName) {
      alert("Please upload a file first.");
      return;
    }

    const validFields = fields.filter((field) => field.outputField.trim());

    if (validFields.length === 0) {
      alert("Please add at least one output field.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_BASE}/api/cleaner/clean`, {
        fileName: uploadedFileName,
        fields: validFields,
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
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1>DMS Cleaner ⚡</h1>
        <p>Upload messy reports. Map columns. Automate clean output.</p>
      </header>

      <section style={cardStyle}>
        <h2>1. Choose Template</h2>

        <select
          value={selectedTemplateId}
          onChange={(e) => applyTemplate(e.target.value)}
          style={selectStyle}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>

        <p style={{ color: "#6b7280" }}>
          {
            templates.find((template) => template.id === selectedTemplateId)
              ?.description
          }
        </p>
      </section>

      <section style={cardStyle}>
        <h2>2. Upload Report</h2>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button onClick={handleUpload} disabled={loading} style={buttonStyle}>
          {loading ? "Processing..." : "Upload"}
        </button>
      </section>

      {headers.length > 0 && (
        <>
          <section style={cardStyle}>
            <h2>3. Output Format & Mapping</h2>

            <p>
              Select a template above to prefill fields, then check the source
              column mapping.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th>Output Field Name</th>
                    <th>Source Column</th>
                    <th>Cleaning Rule</th>
                    <th>Default Value</th>
                    <th>Required</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {fields.map((field, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          placeholder="e.g. customerName"
                          value={field.outputField}
                          onChange={(e) =>
                            updateField(index, "outputField", e.target.value)
                          }
                          style={inputStyle}
                        />
                      </td>

                      <td>
                        <select
                          value={field.sourceColumn}
                          onChange={(e) =>
                            updateField(index, "sourceColumn", e.target.value)
                          }
                          style={selectStyle}
                        >
                          <option value="">-- Select Column --</option>

                          {headers.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <select
                          value={field.cleaningRule}
                          onChange={(e) =>
                            updateField(index, "cleaningRule", e.target.value)
                          }
                          style={selectStyle}
                        >
                          {cleaningRules.map((rule) => (
                            <option key={rule.value} value={rule.value}>
                              {rule.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <input
                          placeholder="optional"
                          value={field.defaultValue}
                          onChange={(e) =>
                            updateField(index, "defaultValue", e.target.value)
                          }
                          style={inputStyle}
                        />
                      </td>

                      <td>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateField(index, "required", e.target.checked)
                          }
                        />
                      </td>

                      <td>
                        <button
                          onClick={() => removeField(index)}
                          disabled={fields.length === 1}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={addField} style={secondaryButtonStyle}>
              + Add Field
            </button>

            <button onClick={handleClean} disabled={loading} style={buttonStyle}>
              {loading ? "Cleaning..." : "Clean & Download Output"}
            </button>
          </section>

          <section style={{ ...cardStyle, overflowX: "auto" }}>
            <h2>Uploaded Sheet Preview</h2>

            <table border="1" cellPadding="6" style={previewTableStyle}>
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
          </section>
        </>
      )}

      {cleanResult && (
        <section style={cardStyle}>
          <h2>4. Cleaned Output</h2>

          <div style={statsStyle}>
            <div>Total Rows: {cleanResult.totalRows}</div>
            <div>Valid Rows: {cleanResult.validRows}</div>
            <div>Invalid Rows: {cleanResult.invalidRows}</div>
          </div>

          <a
            href={`${API_BASE}${cleanResult.downloadUrl}`}
            target="_blank"
            rel="noreferrer"
            style={downloadStyle}
          >
            Download Cleaned Excel
          </a>

          <h3>Cleaned Preview</h3>

          <div style={{ overflowX: "auto" }}>
            <table border="1" cellPadding="6" style={previewTableStyle}>
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
              <pre style={errorBoxStyle}>
                {JSON.stringify(cleanResult.errors, null, 2)}
              </pre>
            </>
          )}
        </section>
      )}
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: 24,
  fontFamily: "Arial, sans-serif",
  background: "#f6f7fb",
  color: "#111827",
};

const headerStyle = {
  padding: 24,
  borderRadius: 16,
  background: "linear-gradient(135deg, #111827, #374151)",
  color: "white",
  marginBottom: 20,
};

const cardStyle = {
  background: "white",
  border: "1px solid #e5e7eb",
  padding: 20,
  borderRadius: 14,
  marginTop: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
};

const buttonStyle = {
  marginLeft: 12,
  padding: "9px 14px",
  borderRadius: 8,
  border: "none",
  background: "#111827",
  color: "white",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  marginTop: 16,
  marginRight: 12,
  padding: "9px 14px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "white",
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const previewTableStyle = {
  borderCollapse: "collapse",
  background: "white",
  fontSize: 13,
};

const statsStyle = {
  display: "flex",
  gap: 16,
  marginBottom: 16,
  fontWeight: "bold",
};

const downloadStyle = {
  display: "inline-block",
  marginBottom: 20,
  padding: "10px 14px",
  background: "#16a34a",
  color: "white",
  borderRadius: 8,
  textDecoration: "none",
};

const errorBoxStyle = {
  maxHeight: 300,
  overflow: "auto",
  background: "#111827",
  color: "#f9fafb",
  padding: 12,
  borderRadius: 8,
};

const inputStyle = {
  padding: 7,
  borderRadius: 6,
  border: "1px solid #d1d5db",
};

const selectStyle = {
  padding: 7,
  borderRadius: 6,
  border: "1px solid #d1d5db",
};

export default CleanerPage;