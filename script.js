// 🔥 Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️ VUL JE EIGEN CONFIG IN
const firebaseConfig = {
  apiKey: "AIzaSyAkBAw17gNU_EBhn8dKgyY5qv-ecfWaG2s",
  authDomain: "finance-jonas.firebaseapp.com",
  projectId: "finance-jonas",
  storageBucket: "finance-jonas.firebasestorage.app",
  messagingSenderId: "497182804753",
  appId: "1:497182804753:web:ea942a578dd1c15f631ab0",
  measurementId: "G-0J29T1Z7MV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DATA
let transactions = [];
let fixedCosts = [];
let goals = [];
let chart;

// 🧠 HULPFUNCTIE
const $ = id => document.getElementById(id);

// ===============================
// TRANSACTIE TOEVOEGEN
// ===============================
window.addTransaction = async () => {
  const type = $("type").value;
  const bron = $("bron").value;
  const bedrag = Number($("bedrag").value);
  const categorie = $("categorie").value;

  if (!bedrag || !categorie) {
    alert("Vul bedrag en categorie in");
    return;
  }

  const t = {
    type,
    bron,
    bedrag,
    categorie,
    datum: new Date()
  };

  await addDoc(collection(db, "transactions"), t);
  transactions.push(t);

  $("bedrag").value = "";
  $("categorie").value = "";

  updateUI();
};

// ===============================
// VASTE KOST TOEVOEGEN
// ===============================
window.addFixedCost = async () => {
  const name = $("fixedName").value;
  const amount = Number($("fixedAmount").value);

  if (!name || !amount) {
    alert("Vul naam en bedrag in");
    return;
  }

  const c = { name, amount };

  await addDoc(collection(db, "fixedCosts"), c);
  fixedCosts.push(c);

  $("fixedName").value = "";
  $("fixedAmount").value = "";

  renderFixed();
  updateUI();
};

// ===============================
// SPAARDOEL TOEVOEGEN
// ===============================
window.addGoal = async () => {
  const name = $("goalName").value;
  const target = Number($("goalTarget").value);

  if (!name || !target) {
    alert("Vul doel en bedrag in");
    return;
  }

  const g = { name, target, saved: 0 };

  await addDoc(collection(db, "goals"), g);
  goals.push(g);

  $("goalName").value = "";
  $("goalTarget").value = "";

  renderGoals();
};

// ===============================
// UI UPDATES
// ===============================
function updateUI() {
  const income = transactions
    .filter(t => t.type === "inkomst")
    .reduce((a, b) => a + b.bedrag, 0);

  const expense = transactions
    .filter(t => t.type === "uitgave")
    .reduce((a, b) => a + b.bedrag, 0);

  const fixed = fixedCosts.reduce((a, b) => a + b.amount, 0);

  const expected = income - expense - fixed;
  $("expectedTotal").textContent = expected.toFixed(2);

  $("balanceBar").value = income > 0
    ? Math.max(0, Math.min(100, (expected / income) * 100))
    : 0;

  renderChart();
}

// ===============================
// VASTE KOSTEN RENDEREN
// ===============================
function renderFixed() {
  $("fixedList").innerHTML = "";
  fixedCosts.forEach(c => {
    $("fixedList").innerHTML += `
      <div class="list-item">
        ${c.name}
        <strong>€${c.amount}</strong>
      </div>`;
  });
}

// ===============================
// SPAARDOELEN RENDEREN
// ===============================
function renderGoals() {
  $("goalList").innerHTML = "";
  goals.forEach(g => {
    $("goalList").innerHTML += `
      <div class="list-item">
        ${g.name}
        <strong>€${g.saved} / €${g.target}</strong>
      </div>`;
  });
}

// ===============================
// GRAFIEK
// ===============================
function renderChart() {
  const data = {};
  transactions
    .filter(t => t.type === "uitgave")
    .forEach(t => {
      data[t.categorie] = (data[t.categorie] || 0) + t.bedrag;
    });

  if (chart) chart.destroy();

  chart = new Chart($("chart"), {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data)
      }]
    }
  });
}
