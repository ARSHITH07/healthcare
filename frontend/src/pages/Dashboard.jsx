import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IconCube, IconDocument, IconShieldSolid, IconUsersSolid } from "../components/icons";
import { useAppContext } from "../context/AppContext";

function truncateHash(value, head = 8, tail = 6) {
  if (!value || typeof value !== "string") return "-";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date) {
  return date.toLocaleDateString(undefined, { month: "short" });
}

function Dashboard() {
  const { chain, integrity } = useAppContext();
  const analysis = integrity;

  const patientBlocks = useMemo(() => chain.filter((b) => b.index > 0), [chain]);
  const uniquePatients = useMemo(() => {
    const ids = new Set(patientBlocks.map((b) => b.patient_data?.patient_id).filter(Boolean));
    return ids.size;
  }, [patientBlocks]);
  const totalRecords = patientBlocks.length;
  const totalBlocks = chain.length;

  const latest = chain[chain.length - 1];

  const chartData = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = monthKey(date);
      months.push({
        key,
        month: monthLabel(date),
        patients: 0,
      });
    }

    for (const block of patientBlocks) {
      const date = new Date(block.timestamp);
      if (Number.isNaN(date.getTime())) continue;
      const key = monthKey(date);
      const bucket = months.find((entry) => entry.key === key);
      if (bucket) {
        bucket.patients += 1;
      }
    }

    return months;
  }, [patientBlocks]);

  const recentRows = useMemo(
    () =>
      [...patientBlocks]
        .reverse()
        .slice(0, 6)
        .map((block) => ({
          key: block.index,
          name: block.patient_data?.name || "-",
          disease: block.patient_data?.diagnosis || "-",
          date: formatBlockDate(block.timestamp),
        })),
    [patientBlocks]
  );

  const integrityLabel = analysis.isValid ? "Secure" : "Compromised";
  const integrityClass = analysis.isValid ? "text-green-600" : "text-red-600";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<IconUsersSolid className="h-7 w-7 text-[#2563eb]" />}
          iconBg="bg-blue-50"
          label="Total Patients"
          value={uniquePatients}
        />
        <StatCard
          icon={<IconDocument className="h-7 w-7 text-[#2563eb]" />}
          iconBg="bg-blue-50"
          label="Total Records"
          value={totalRecords}
        />
        <StatCard
          icon={<IconCube className="h-7 w-7 text-[#2563eb]" />}
          iconBg="bg-blue-50"
          label="Blocks Created"
          value={totalBlocks}
        />
        <StatCard
          icon={<IconShieldSolid className="h-7 w-7 text-green-600" />}
          iconBg="bg-green-50"
          label="Data Integrity"
          value={integrityLabel}
          valueClass={integrityClass}
          isText
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">Patient Growth</h2>
          <p className="mt-0.5 text-xs text-slate-500">Admissions trend from the actual blockchain records</p>
          <div className="mt-4 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="patients"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#fillPatients)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#2563eb" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Recent Records</h2>
          <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead>
                <tr className="bg-[#2563eb] text-white">
                  <th className="px-3 py-2.5 font-semibold">Patient Name</th>
                  <th className="px-3 py-2.5 font-semibold">Disease</th>
                  <th className="px-3 py-2.5 font-semibold">Date</th>
                  <th className="px-3 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {recentRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                      No records yet. Add a patient from{" "}
                      <Link to="/add-record" className="font-medium text-[#2563eb] hover:underline">
                        Add Patient
                      </Link>
                      .
                    </td>
                  </tr>
                ) : (
                  recentRows.map((row) => (
                    <tr key={row.key} className="border-t border-slate-100">
                      <td className="px-3 py-2.5 font-medium text-slate-800">{row.name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{row.disease}</td>
                      <td className="px-3 py-2.5 text-slate-600">{row.date}</td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-col gap-1">
                          <Link
                            to="/ledger"
                            className="inline-flex justify-center rounded bg-[#2563eb] px-2 py-1 text-center text-xs font-medium text-white hover:bg-[#1d4ed8]"
                          >
                            View Details
                          </Link>
                          <Link
                            to="/validate"
                            className="inline-flex justify-center rounded bg-[#2563eb] px-2 py-1 text-center text-xs font-medium text-white hover:bg-[#1d4ed8]"
                          >
                            Verify Integrity
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Blockchain Verification</h2>
        <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-slate-500">Block Number</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{latest?.index ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Previous Hash</dt>
              <dd className="mt-0.5 font-mono text-xs tracking-tight text-slate-800">
                {truncateHash(latest?.previous_hash, 8, 6)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Current Hash</dt>
              <dd className="mt-0.5 font-mono text-xs tracking-tight text-slate-800">
                {truncateHash(latest?.current_hash, 8, 6)}
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex items-center gap-2 border-t border-slate-200/80 pt-4">
            {analysis.isValid ? (
              <>
                <svg className="h-5 w-5 shrink-0 text-green-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="font-semibold text-green-600">Valid</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5 shrink-0 text-red-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59 16.59 17 12 14.41z" />
                </svg>
                <span className="font-semibold text-red-600">Invalid</span>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, valueClass = "", isText }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={`mt-1 truncate text-2xl font-bold tracking-tight text-slate-900 ${valueClass}`}>
          {isText ? value : value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function formatBlockDate(timestamp) {
  if (!timestamp) return "-";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit", year: "numeric" });
}

export default Dashboard;
