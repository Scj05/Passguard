import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function App() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("passguard-history")) || [];
    setHistory(savedHistory);
  }, []);

  const saveToHistory = (data) => {
    const newEntry = {
      masked_password: data.masked_password,
      strength_percent: data.strength_percent,
      strength_label: data.strength_label,
      breach_count: data.breach_count,
      date: new Date().toLocaleString(),
    };

    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem("passguard-history", JSON.stringify(updatedHistory));
  };

  const analyzePassword = async (value) => {
    setPassword(value);

    if (!value) {
      setAnalysis(null);
      return;
    }

    const response = await fetch("/api/check-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: value }),
    });

    const data = await response.json();
    setAnalysis(data);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("passguard-history");
  };

  const barColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-emerald-400",
  ];

  const activeBarColor = analysis ? barColors[analysis.score] : "bg-slate-700";
  const patternSafety = analysis ? 100 - analysis.pattern_risk : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
        >
           <h1 className="text-4xl font-bold mb-2">PassGuard</h1>

<p className="text-slate-400 mb-8">
  Password Security & Breach Analysis Tool
</p>

          <p className="text-slate-400 mb-8">
            Full-stack password analyzer with FastAPI, breach detection, attack
            simulation, and pattern-risk scoring.
          </p>

          <label className="block text-sm text-slate-300 mb-2">
            Enter a password
          </label>

          <div className="relative">
            <input
  type={showPassword ? "text" : "password"}
  value={password}
  onChange={(e) => analyzePassword(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && analysis) {
      saveToHistory(analysis);
    }
  }}
  placeholder="Type password here..."
  className="w-full p-4 pr-16 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
/>
          

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="mt-6">
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${activeBarColor} transition-all duration-300`}
                style={{ width: `${analysis ? analysis.strength_percent : 0}%` }}
              />
            </div>

            <p className="mt-3 text-xl font-semibold">
              Strength:{" "}
              {analysis
                ? `${analysis.strength_label} (${analysis.strength_percent}%)`
                : "Waiting..."}
            </p>

            {analysis && (
              <p className="text-slate-400 mt-2">
                Estimated crack time: {analysis.estimated_crack_time}
              </p>
            )}
          </div>

          {analysis && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Pattern Risk Score</h2>
                <span className="text-sm text-slate-400">
                  {analysis.pattern_risk}% risk
                </span>
              </div>

              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${patternSafety}%` }}
                />
              </div>

              <p className="text-slate-400 text-sm mt-3">
                Checks length, character variety, repeated characters, common
                words, and date patterns.
              </p>
            </div>
          )}

          {analysis && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <h2 className="text-xl font-semibold mb-2">Breach Detection</h2>

              {analysis.breach_count === -1 ? (
                <p className="text-yellow-300">
                  Breach check unavailable right now.
                </p>
              ) : analysis.breach_count > 0 ? (
                <p className="text-red-300">
                  This password appeared in breaches{" "}
                  <strong>{analysis.breach_count.toLocaleString()}</strong>{" "}
                  times. Do not use it.
                </p>
              ) : (
                <p className="text-emerald-300">
                  No known breach match found.
                </p>
              )}
            </div>
          )}

          {analysis && analysis.warning && (
            <div className="mt-6 p-4 rounded-xl bg-red-950 border border-red-800">
              <h2 className="font-semibold text-red-300">Warning</h2>
              <p className="text-red-100 mt-1">{analysis.warning}</p>
            </div>
          )}

          {analysis && analysis.suggestions.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h2 className="font-semibold mb-2">Suggestions</h2>
              {analysis.suggestions.map((suggestion, index) => (
                <p key={index} className="text-slate-300">
                  • {suggestion}
                </p>
              ))}
            </div>
          )}

          {analysis && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">
                Attack Simulation
              </h2>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <h3 className="font-semibold mb-2">Dictionary Attack</h3>
                  <p className="text-blue-400 text-sm mb-2">
                    {analysis.attack_simulation.dictionary_attack}
                  </p>
                  <p className="text-slate-400 text-sm">
                    Uses leaked passwords and common wordlists.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <h3 className="font-semibold mb-2">Slow Hash Attack</h3>
                  <p className="text-blue-400 text-sm mb-2">
                    {analysis.attack_simulation.slow_hash_attack}
                  </p>
                  <p className="text-slate-400 text-sm">
                    Simulates a better-protected password storage system.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <h3 className="font-semibold mb-2">Online Guessing</h3>
                  <p className="text-blue-400 text-sm mb-2">
                    {analysis.attack_simulation.online_attack}
                  </p>
                  <p className="text-slate-400 text-sm">
                    Simulates slower login attempts against a live system.
                  </p>
                </div>
              </div>
            </div>
          )}

          {analysis && (
            <button
              onClick={() => saveToHistory(analysis)}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-500 transition p-4 rounded-xl font-semibold"
            >
              Save Result to History
            </button>
          )}
        </motion.section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold">History</h2>

            <button
              onClick={clearHistory}
              className="text-sm text-red-300 hover:text-red-200"
            >
              Clear
            </button>
          </div>

          <p className="text-slate-400 text-sm mb-5">
            Saved history does not store the real password, only a masked
            version.
          </p>

          <div className="grid gap-4">
            {history.length === 0 && (
              <p className="text-slate-500">No saved results yet.</p>
            )}

            {history.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800"
              >
                <p className="font-semibold">{item.masked_password}</p>
                <p className="text-slate-300 text-sm">
                  Strength: {item.strength_label} ({item.strength_percent}%)
                </p>
                <p className="text-slate-300 text-sm">
                  Breaches:{" "}
                  {item.breach_count === -1
                    ? "Unavailable"
                    : item.breach_count.toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs mt-2">{item.date}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;