// 🔥 Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️ VUL DIT AAN
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

// TRANSACTIE
window.addTransaction = async () => {
  const t = {
    type: type.value,
    bron: bron.value,
    bedrag: Number(bedrag.value),
    categorie: categorie.value,
    datum: new Date()
  };

  await addDoc(collection(db, "transactions"), t);
  transactions.push(t);

  updateUI();
};

// VASTE KOSTEN
window.addFixedCost = async () => {
  const c = {
    name: fixedName.value,
    amount: Number(fixedAmount.value)
  };

  await addDoc(collection(db, "fixedCosts"), c);
  fixedCosts.push(c);

  renderFixed();
  updateUI();
};

// SPAARDOEL
window.addGoal = async () => {
  const g = {
    name: goalName.value,
    target: Number(goalTarget.value),
    saved: 0
  };

  await addDoc(collection(db, "goals"), g);
  goals.push(g);

  renderGoals();
};

// UI
function updateUI() {
  let income = transactions.filter(t=>t.type==="inkomst")
    .reduce((a,b)=>a+b.bedrag,0);

  let expense = transactions.filter(t=>t.type==="uitgave")
    .reduce((a,b)=>a+b.bedrag,0);

  let fixed = fixedCosts.reduce((a,b)=>a+b.amount,0);

  let expected = income - expense - fixed;
  expectedTotal.textContent = expected.toFixed(2);

  balanceBar.value = Math.max(0, Math.min(100, (expected / income) * 100));

  renderChart();
}

function renderFixed() {
  fixedList.innerHTML = "";
  fixedCosts.forEach(c=>{
    fixedList.innerHTML += `
      <div class="list-item">
        ${c.name}
        <strong>€${c.amount}</strong>
      </div>`;
  });
}

function renderGoals() {
  goalList.innerHTML = "";
  goals.forEach(g=>{
    goalList.innerHTML += `
      <div class="list-item">
        ${g.name}
        <strong>€${g.saved} / €${g.target}</strong>
      </div>`;
  });
}

function renderChart() {
  const data = {};
  transactions
    .filter(t=>t.type==="uitgave")
    .forEach(t=>{
      data[t.categorie] = (data[t.categorie] || 0) + t.bedrag;
    });

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
      }]
    }
  });
}
