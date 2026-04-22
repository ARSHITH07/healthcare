import { useEffect, useState } from "react";

const EMPTY_FORM = {
  name: "",
  age: "",
  gender: "",
  diagnosis: "",
  treatment: "",
  doctor_name: "",
  medical_file_name: "",
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function EditRecordModal({ block, onClose, onSave, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!block) return;
    const pd = block.patient_data || {};
    setForm({
      name: pd.name || "",
      age: pd.age != null ? String(pd.age) : "",
      gender: pd.gender || "",
      diagnosis: pd.diagnosis || "",
      treatment: pd.treatment || "",
      doctor_name: pd.doctor_name || "",
      medical_file_name: pd.medical_file_name || "",
    });
  }, [block]);

  if (!block) return null;

  const patientId = block.patient_data?.patient_id || "-";

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSave({
      name: form.name.trim(),
      age: form.age.trim() ? Number(form.age) || 0 : "",
      gender: form.gender.trim(),
      diagnosis: form.diagnosis.trim(),
      treatment: form.treatment.trim(),
      doctor_name: form.doctor_name.trim(),
      medical_file_name: form.medical_file_name.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-record-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="edit-record-title" className="text-lg font-semibold text-slate-900">
              Edit Patient Record
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Update the patient details and keep the blockchain chain consistent.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Patient ID">
            <input
              type="text"
              value={patientId}
              readOnly
              className="input-mockup cursor-not-allowed bg-slate-50 text-slate-600"
            />
          </Field>
          <Field label="Name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              className="input-mockup"
              placeholder="Full name"
            />
          </Field>
          <Field label="Age">
            <input
              type="number"
              min="0"
              value={form.age}
              onChange={(e) => setForm((current) => ({ ...current, age: e.target.value }))}
              className="input-mockup"
              placeholder="Age"
            />
          </Field>
          <Field label="Gender">
            <select
              value={form.gender}
              onChange={(e) => setForm((current) => ({ ...current, gender: e.target.value }))}
              className="input-mockup"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Diagnosis">
            <input
              type="text"
              value={form.diagnosis}
              onChange={(e) => setForm((current) => ({ ...current, diagnosis: e.target.value }))}
              className="input-mockup"
              placeholder="Condition"
            />
          </Field>
          <Field label="Doctor">
            <input
              type="text"
              value={form.doctor_name}
              onChange={(e) => setForm((current) => ({ ...current, doctor_name: e.target.value }))}
              className="input-mockup"
              placeholder="Attending doctor"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Treatment">
              <textarea
                rows="4"
                value={form.treatment}
                onChange={(e) => setForm((current) => ({ ...current, treatment: e.target.value }))}
                className="input-mockup"
                placeholder="Treatment plan"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Medical File Name">
              <input
                type="text"
                value={form.medical_file_name}
                onChange={(e) =>
                  setForm((current) => ({ ...current, medical_file_name: e.target.value }))
                }
                className="input-mockup"
                placeholder="Optional file label"
              />
            </Field>
          </div>

          <div className="sm:col-span-2 mt-2 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="secondary-button">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="primary-button">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditRecordModal;
