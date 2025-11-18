import React, { useState, useEffect } from "react";

export default function App() {
  const [transactions, setTransactions] = useState(() => {
  const saved = localStorage.getItem("transactions");
  return saved ? JSON.parse(saved) : [];
});
  const [amount, setAmount] = useState(0);
  the [type, setType] = useState("inkomst");
  const [category, setCategory] = useState("Loon");
  const [date, setDate] = useState("");

  const categories = ["Loon", "Verzekering", "Winkel", "Dokter", "Telecom", "Divers"];

  const saldo = transactions.reduce(
    (sum, t) => sum + (t.type === "inkomst" ? t.amount : -t.amount),
    0
  );

  function addTransaction() {
    if (!date || !amount) return;

    setTransactions([
      ...transactions,
      {
        date,
        amount: parseFloat(amount),
        type,
        category
      }
    ]);

    setAmount(0);
    setCategory("Loon");
    setType("inkomst");
    setDate("");
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6">📘 Boekhouding App</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold mb-4">Nieuwe Transactie</h2>

          <label className="block mb-2">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-gray-700"
          />

          <label className="block mb-2">Bedrag (€)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-gray-700"
          />

          <label className="block mb-2">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-gray-700"
          >
            <option value="inkomst">Inkomst</option>
            <option value="uitgave">Uitgave</option>
          </select>

          <label className="block mb-2">Categorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-gray-700"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={addTransaction}
            className="mt-4 bg-blue-600 hover:bg-blue-700 w-full p-2 rounded-xl"
          >
            Toevoegen
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold mb-4">Huidig Saldo</h2>
          <p
            className={`text-3xl font-bold ${
              saldo >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            € {saldo.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-8 bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4">Transacties</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Datum</th>
              <th>Type</th>
              <th>Categorie</th>
              <th>Bedrag</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((t, i) => (
              <tr key={i} className="border-t border-gray-700">
                <td className="py-2">{t.date}</td>
                <td>{t.type}</td>
                <td>{t.category}</td>
                <td
                  className={
                    t.type === "inkomst" ? "text-green-400" : "text-red-400"
                  }
                >
                  € {t.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
