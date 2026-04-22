import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

const AGE_OPTIONS = Array.from({ length: 83 }, (_, i) => i + 18);

const initialForm = {
  name: "",
  age: "35",
  gender: "male",
  disease: "",
  file: null,
};

function FormRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,120px)_1fr] sm:items-center sm:gap-4">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div>{children}</div>
    </div>
  );
}

function AddRecord() {
  const { refreshChain } = useAppContext();
  const [form, setForm] = useState(initialForm);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [outputMessage, setOutputMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, files } = event.target;
    if (type === "file") {
      setForm((c) => ({ ...c, file: files?.[0] || null }));
      return;
    }
    setForm((c) => ({ ...c, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.disease.trim()) {
      setOutputMessage({
        tone: "error",
        title: "Record not saved.",
        body: "Please enter both the patient name and disease before saving.",
      });
      return;
    }
    setSubmitting(true);
    setOutputMessage(null);
    try {
      const selectedFileName = form.file?.name || "";
      const patient_id = `P-${Date.now().toString(36).toUpperCase().slice(-8)}`;
      const result = await api.addBlock({
        patient_id,
        name: form.name.trim(),
        diagnosis: form.disease.trim(),
        treatment: "-",
        doctor_name: "-",
        age: Number(form.age) || 0,
        gender: form.gender,
        medical_file_name: selectedFileName,
      });
      setForm({ name: "", age: "35", gender: "male", disease: "", file: null });
      setFileInputKey((k) => k + 1);
      await refreshChain({ showLoading: false });
      setOutputMessage({
        tone: "success",
        title: "Patient record added and stored securely.",
        body: selectedFileName
          ? `File "${selectedFileName}" noted.`
          : `New block created at index ${result.block.index}.`,
      });
    } catch {
      setOutputMessage({
        tone: "error",
        title: "Unable to add the record.",
        body: "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="page-card p-5">
        <h1 className="text-base font-semibold text-slate-900">Add New Patient</h1>
        <p className="mt-1 text-xs text-slate-500">
          Submit simulated patient details to create a blockchain block secured with SHA-256 hashing.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <FormRow label="Name">
            <input
              name="name"
              className="input-mockup"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
            />
          </FormRow>
          <FormRow label="Age">
            <select name="age" className="input-mockup" value={form.age} onChange={handleChange}>
              {AGE_OPTIONS.map((a) => (
                <option key={a} value={String(a)}>
                  {a}
                </option>
              ))}
            </select>
          </FormRow>
          <FormRow label="Gender">
            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={form.gender === "male"}
                  onChange={handleChange}
                  className="h-4 w-4 border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                />
                Male
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={form.gender === "female"}
                  onChange={handleChange}
                  className="h-4 w-4 border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                />
                Female
              </label>
            </div>
          </FormRow>
          <FormRow label="Disease">
            <input
              name="disease"
              className="input-mockup"
              type="text"
              value={form.disease}
              onChange={handleChange}
              placeholder="Condition"
            />
          </FormRow>
          <FormRow label="Upload Medical File">
            <label className="flex cursor-pointer flex-wrap items-center gap-2">
              <span className="rounded border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100">
                Choose File
              </span>
              <span className="truncate text-xs text-slate-500">
                {form.file?.name || "No file chosen"}
              </span>
              <input key={fileInputKey} name="file" type="file" className="sr-only" onChange={handleChange} />
            </label>
          </FormRow>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-md bg-[#2563eb] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Add & Store Securely"}
          </button>
        </form>
      </section>

      <section className="page-card p-6">
        <h2 className="section-title">Generated Block Output</h2>
        <p className="section-copy">
          This area will confirm what happened after you save the patient record.
        </p>

        <div className="mt-6">
          {submitting ? (
            <LoadingSpinner label="Hashing and linking new block..." />
          ) : outputMessage ? (
            <div
              className={[
                "rounded-lg border p-5 text-sm",
                outputMessage.tone === "success" && "border-green-200 bg-green-50 text-green-700",
                outputMessage.tone === "error" && "border-red-200 bg-red-50 text-red-700",
              ].join(" ")}
            >
              <p className="font-semibold">{outputMessage.title}</p>
              <p className="mt-2">{outputMessage.body}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">No block has been generated yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default AddRecord;
