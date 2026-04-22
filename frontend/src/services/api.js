import axios from "axios";

const VALIDATION_HISTORY_KEY = "healthchain-validation-history";
const TAMPER_COUNT_KEY = "healthchain-tamper-count";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 3000,
});

function appendValidationHistory(status) {
  const current = JSON.parse(localStorage.getItem(VALIDATION_HISTORY_KEY) || "[]");
  const next = [{ status, timestamp: new Date().toLocaleString() }, ...current].slice(0, 8);
  localStorage.setItem(VALIDATION_HISTORY_KEY, JSON.stringify(next));
}

function incrementTamperCount() {
  const current = Number(localStorage.getItem(TAMPER_COUNT_KEY) || "0");
  localStorage.setItem(TAMPER_COUNT_KEY, String(current + 1));
}

function normalizeValidation(result) {
  const corruptedIndex =
    typeof result?.corrupted_index === "number" ? result.corrupted_index : null;
  const rawIssues = result?.issues_by_index;
  const issuesByIndex =
    rawIssues && typeof rawIssues === "object"
      ? rawIssues
      : corruptedIndex === null
        ? {}
        : { [corruptedIndex]: { invalid: true } };

  return {
    isValid: Boolean(result?.is_valid),
    corruptedIndex,
    issuesByIndex,
  };
}

const api = {
  async getBlockchain() {
    const response = await http.get("/blockchain");
    return { chain: Array.isArray(response.data) ? response.data : response.data.chain };
  },

  async getIntegrity() {
    const response = await http.get("/validate");
    return normalizeValidation(response.data);
  },

  async addBlock(payload) {
    const response = await http.post("/block", payload);
    return { block: response.data };
  },

  async updatePatientRecord(patientId, payload) {
    const response = await http.put(`/records/${encodeURIComponent(patientId)}`, payload);
    return response.data;
  },

  async validateChain() {
    const response = await http.get("/validate");
    const normalized = normalizeValidation(response.data);
    appendValidationHistory(
      normalized.isValid
        ? "Valid: Blockchain is Secure and Untampered"
        : `Compromised: Block ${normalized.corruptedIndex} failed validation`
    );
    return normalized;
  },

  async tamperBlock(index, patientData) {
    const response = await http.put(`/tamper/${index}`, patientData);
    if (response.data.success) {
      incrementTamperCount();
    }
    return response.data;
  },

  async exportLedger() {
    const response = await http.get("/ledger/export", { responseType: "blob" });
    const blob = new Blob([response.data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "healthchain-ledger.json";
    link.click();
    URL.revokeObjectURL(url);
  },

  async importLedger(chain) {
    const response = await http.post("/ledger/import", chain);
    return response.data;
  },

  getReports(chain) {
    const grouped = chain.reduce((accumulator, block) => {
      const date = new Date(block.timestamp);
      const label = Number.isNaN(date.getTime())
        ? "Unknown"
        : date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
      accumulator[label] = (accumulator[label] || 0) + 1;
      return accumulator;
    }, {});

    return {
      blocksOverTime: Object.entries(grouped).map(([label, count]) => ({ label, count })),
      validationHistory: JSON.parse(localStorage.getItem(VALIDATION_HISTORY_KEY) || "[]"),
      tamperingAttempts: Number(localStorage.getItem(TAMPER_COUNT_KEY) || "0"),
    };
  },
};

export default api;
