// ===== Firebase setup =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// Firebase config (zet hier jouw eigen config)
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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ===== Global variables =====
let windowUser = null;
let items = [];
let fixedCosts = {};
let savings = [];

// ===== Auth en data load =====
onAuthStateChanged(auth, async user => {
  if(!user){
    try { await signInWithPopup(auth, provider); }
    catch(e){ console.error(e); alert("Login mislukt!"); return; }
  }
  windowUser = user;
  await loadData();
});

// ===== Load all data from Firebase =====
async function loadData(){
  if(!windowUser) return;

  // --- Load entries ---
  const snap = await getDocs(query(collection(db,"users",windowUser.uid,"items"), orderBy("created","asc")));
  items = [];
  snap.forEach(doc=>{
    items.push({...doc.data(), id: doc.id, datumObj: new Date(doc.data().datum)});
  });

  // --- Load fixed costs and savings from localStorage ---
  fixedCosts = JSON.parse(localStorage.getItem("fixedCosts")) || {};
  savings = JSON.parse(localStorage.getItem("savings")) || [];

  updateUI();
}

// ===== Update UI =====
function updateUI(){
  updateSaldoUI();
  updateFixedCostsUI();
  updateSavingsUI();
  updateBudgetChart(items);
  updateCalendar(items);
}

// --- Saldo berekenen en tonen ---
function updateSaldoUI(){
  let saldo = 0;
  let spent = 0;
  const now = new Date();
  items.forEach(e=>{
    saldo += e.bedrag;
    if(e.bedrag < 0 && e.datumObj.getMonth() === now.getMonth() && e.datumObj.getFullYear() === now.getFullYear())
      spent += Math.abs(e.bedrag);
  });

  document.getElementById("saldo").innerText = `€ ${saldo.toFixed(2)}`;
  document.getElementById("expectedEnd").innerText = `🔮 Verwacht einde maand: € ${(saldo - spent).toFixed(2)}`;

  // Saldo bar (percentage)
  const bar = document.getElementById("saldoBar");
  const perc = Math.min(Math.max((saldo / 1000)*100, 0),100);
  bar.style.width = perc+"%";
}

// --- Fixed costs UI ---
function updateFixedCostsUI(){
  const listDiv = document.getElementById("fixedCostsList");
  if(Object.keys(fixedCosts).length === 0){
    listDiv.innerHTML = "Geen vaste kosten ingesteld";
  } else {
    listDiv.innerHTML = "";
    for(const key in fixedCosts){
      const p = document.createElement("div");
      p.innerText = `${key}: € ${fixedCosts[key].toFixed(2)}`;
      listDiv.appendChild(p);
    }
  }
}

// --- Savings UI ---
function updateSavingsUI(){
  const listDiv = document.getElementById("savingsList");
  if(savings.length === 0){
    listDiv.innerHTML = "Geen spaarpotjes ingesteld";
  } else {
    listDiv.innerHTML = "";
    savings.forEach(sp => {
      const p = document.createElement("div");
      p.innerText = `${sp.name}: € ${sp.amount.toFixed(2)}`;
      listDiv.appendChild(p);
    });
  }
}

// ===== Add entry =====
async function saveEntry(entry){
  if(!windowUser) return;

  // Spaarpotten cumulatief
  if(entry.savingsIndex !== null){
    savings[entry.savingsIndex].amount += entry.bedrag;
    localStorage.setItem("savings", JSON.stringify(savings));
    updateSavingsUI();
    entry.bedrag = 0; // alles naar spaarpot
  }

  if(entry.soort === "uitgave") entry.bedrag = -Math.abs(entry.bedrag);

  await addDoc(collection(db,"users",windowUser.uid,"items"), {
    ...entry,
    created: Date.now()
  });

  await loadData(); // alles opnieuw laden
}

// ===== Fixed costs management =====
function saveFixedCosts(newCosts){
  fixedCosts = {...newCosts};
  localStorage.setItem("fixedCosts", JSON.stringify(fixedCosts));
  updateFixedCostsUI();
}

// ===== Savings management =====
function saveSavingsToStorage(newSavings){
  savings = [...newSavings];
  localStorage.setItem("savings", JSON.stringify(savings));
  updateSavingsUI();
}

// ===== Calendar & Chart placeholders =====
function updateCalendar(items){
  // hier komt jouw bestaande kalender code
}

function updateBudgetChart(items){
  // hier komt jouw bestaande Chart.js code
}

// ===== Event listeners voor modals en knoppen =====
// Bijvoorbeeld:
// addBtn.onclick = () => openModal('entry');
// fixedCostsBtn.onclick = () => openModal('fixedCosts');
// savingsBtn.onclick = () => openModal('savings');
// En daarna saveEntry(), saveFixedCosts(), saveSavingsToStorage() aanroepen bij submit
