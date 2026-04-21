import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";

function Tamper() {
  const { chain, refreshChain, pushToast } = useAppContext();
  const navigate = useNavigate();
  const editableBlocks = chain.filter((block) => block.index !== 0);
  const [selectedIndex, setSelectedIndex] = useState("");
  const [form, setForm] = useState({
    patient_id: "",
    name: "",
    diagnosis: "",
    treatment: "",
    doctor_name: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editableBlocks.length) {
      return;
    }

    const target =
      editableBlocks.find((block) => String(block.index) === String(selectedIndex)) || editableBlocks[0];
    setSelectedIndex(String(target.index));
    setForm({
      patient_id: target.patient_data.patient_id || "",
      name: target.patient_data.name || "",
      diagnosis: target.patient_data.diagnosis || "",
      treatment: target.patient_data.treatment || "",
      doctor_name: target.patient_data.doctor_name || "",
    });
  }, [chain]);

  const handleBlockSelect = (event) => {
    const nextIndex = event.target.value;
    setSelectedIndex(nextIndex);
    const target = editableBlocks.find((block) => String(block.index) === nextIndex);
    if (!target) {
      return;
    }

    setForm({
      patient_id: target.patient_data.patient_id || "",
      name: target.patient_data.name || "",
      diagnosis: target.patient_data.diagnosis || "",
      treatment: target.patient_data.treatment || "",
      doctor_name: target.patient_data.doctor_name || "",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleTamper = async (event) => {
    event.preventDefault();
    if (!selectedIndex) {
      return;
    }

    setSaving(true);
    try {
      await api.tamperBlock(Number(selectedIndex), form);
      await refreshChain();
      pushToast({
        tone: "warning",
        message: "Tampering saved without rehashing. Redirecting to validation...",
      });
      navigate("/validate");
    } catch {
      pushToast({ tone: "error", message: "Unable to tamper selected block." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="page-card p-6">
        <h1 className="section-title">Tamper Simulation</h1>
        <p className="section-copy">
          Edit patient data only. The system intentionally does not update the stored hash so the chain
          integrity breaks.
        </p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Tampering will break the blockchain integrity.
        </div>

        <div className="mt-6 space-y-3">
          {editableBlocks.map((block) => (
            <button
              key={block.index}
              type="button"
              onClick={() => handleBlockSelect({ target: { value: String(block.index) } })}
              className={[
                "w-full rounded-2xl border px-4 py-4 text-left transition",
                String(block.index) === selectedIndex
                  ? "border-brand bg-blue-50"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              <p className="text-sm font-semibold text-slate-900">Block {block.index}</p>
              <p className="mt-1 text-sm text-slate-500">{block.patient_data.name}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="page-card p-6">
        <h2 className="section-title">Edit Patient Data</h2>
        <p className="section-copy">
          Save changes below to simulate an attack that alters clinical data but leaves blockchain hashes
          untouched.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleTamper}>
          <select className="input-field" value={selectedIndex} onChange={handleBlockSelect}>
            {editableBlocks.map((block) => (
              <option key={block.index} value={block.index}>
                Block {block.index} - {block.patient_data.patient_id}
              </option>
            ))}
          </select>
          <input className="input-field" name="patient_id" value={form.patient_id} onChange={handleChange} />
          <input className="input-field" name="name" value={form.name} onChange={handleChange} />
          <input className="input-field" name="diagnosis" value={form.diagnosis} onChange={handleChange} />
          <textarea className="input-field min-h-[120px]" name="treatment" value={form.treatment} onChange={handleChange} />
          <input className="input-field" name="doctor_name" value={form.doctor_name} onChange={handleChange} />
          <button type="submit" className="primary-button bg-red-600 hover:bg-red-700" disabled={saving}>
            {saving ? "Tampering Block..." : "Save Tampered Data"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default Tamper;
