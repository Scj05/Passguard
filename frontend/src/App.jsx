import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function App() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedHistory =
      JSON.parse(localStorage.getItem("passguard-history")) || [];
    setHistory(savedHistory);
  }, []);

  const getStrengthLabel = (score) => {
    const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
    return labels[score] || "Unknown";
  };

  const getPatternRisk = (score) => {
    if (score === 0) return 95;
    if (score === 1) return 75;
    if (score === 2) return 50;
    if (score === 3) return 25;
    if (score === 4) return 10;
    return 0;
  };

  const maskPassword = (value) => {
    if (!value) return "";
    if (value.length <= 2) return "*".repeat(value.length);
    return value[0] + "*".repeat(value.length - 2) + value[value.length - 1];
  };

  const saveToHistory = (data) => {
    if (!data) return;

    const newEntry = {
      masked_password: maskPassword(password),
      strength_percent: data.strength_percent || 0,
      strength_label: getStrengthLabel(data.score),
      breach_count: "Not checked",
      date: new Date().toLocaleString(),
    };

    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem("passguard-history", JSON.stringify(updatedHistory));
  };

  const analyzePassword = async (value) => {
    setPassword(value);
    setError("");

    if (!value) {
      setAnalysis(null);
      return;
    }

    try {
      const response = await fetch("/api/check-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: value }),
      });

      if (!response.ok) {
        throw new Error("Password check failed");
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
      setAnalysis(null);
      setError("Password analysis is unavailable right now.");
    }
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

  const activeBarColor =
    analysis && typeof analysis.score === "number"
      ? barColors[analysis.score]
      : "bg-slate-700";

  const strengthPercent = analysis?.strength_percent || 0;
  const strengthLabel = analysis ? getStrengthLabel(analysis.score) : "Waiting...";
  const crackTime = analysis?.crack_time || "Unavailable";
  const patternRisk = analysis ? getPatternRisk(analysis.score) : 0;
  const patternSafety = 100 - patternRisk;
  const suggestions = analysis?.suggestions || [];
  const warning = analysis?.warning || "";

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
            Password Security & Strength Analysis Tool
          </p>

          <p className="text-slate-400 mb-8">
            Full-stack password analyzer with FastAPI, attack simulation, and
            password strength scoring.
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

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-950 border border-red-800">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          <div className="mt-6">
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${activeBarColor} transition-all duration-300`}
                style={{ width: `${strengthPercent}%` }}
              />
            </div>

            <p className="mt-3 text-xl font-semibold">
              Strength:{" "}
              {analysis
                ? `${strengthLabel} (${strengthPercent}%)`
                : "Waiting..."}
            </p>

            {analysis && (
              <p className="text-slate-400 mt-2">
                Estimated crack time: {crackTime}
              </p>
            )}
          </div>

          {analysis && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Pattern Risk Score</h2>
                <span className="text-sm text-slate-400">
                  {patternRisk}% risk
                </span>
              </div>

              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${patternSafety}%` }}
                />
              </div>

              <p className="text-slate-400 text-sm mt-3">
                Estimates how predictable the password may be based on common
                password patterns and the zxcvbn score.
              </p>
            </div>
          )}

          {analysis && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <h2 className="text-xl font-semibold mb-2">Breach Detection</h2>

              <p className="text-yellow-300">
                Breach checking is not enabled in this deployed version.
              </p>

              <p className="text-slate-400 text-sm mt-2">
                This version focuses on password strength analysis and attack
                simulation.
              </p>
            </div>
          )}

          {analysis && warning && (
            <div className="mt-6 p-4 rounded-xl bg-red-950 border border-red-800">
              <h2 className="font-semibold text-red-300">Warning</h2>
              <p className="text-red-100 mt-1">{warning}</p>
            </div>
          )}

          {analysis && suggestions.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h2 className="font-semibold mb-2">Suggestions</h2>
              {suggestions.map((suggestion, index) => (
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
                    {analysis?.attack_methods?.dictionary_attack?.risk ||
                      "Unknown"}{" "}
                    Risk
                  </p>
                  <p className="text-slate-400 text-sm">
                    {analysis?.attack_methods?.dictionary_attack?.description ||
                      "Checks whether the password contains common words, names, or predictable patterns."}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <h3 className="font-semibold mb-2">Brute Force Attack</h3>
                  <p className="text-blue-400 text-sm mb-2">
                    {analysis?.attack_methods?.brute_force?.risk || "Unknown"}{" "}
                    Risk
                  </p>
                  <p className="text-slate-400 text-sm">
                    {analysis?.attack_methods?.brute_force?.description ||
                      "Estimates how difficult the password is to guess by trying many possible combinations."}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <h3 className="font-semibold mb-2">Pattern Matching</h3>
                  <p className="text-blue-400 text-sm mb-2">
                    {analysis?.attack_methods?.pattern_matching?.risk ||
                      "Unknown"}{" "}
                    Risk
                  </p>
                  <p className="text-slate-400 text-sm">
                    {analysis?.attack_methods?.pattern_matching?.description ||
                      "Looks for predictable structures like repeated characters, keyboard patterns, or simple substitutions."}
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
                  Breaches: {item.breach_count}
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