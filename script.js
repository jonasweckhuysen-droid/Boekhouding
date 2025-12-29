import { collection, addDoc, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --------------------
// MODALS
// --------------------
export function openModal(){ document.getElementById("modal").style.display="flex"; }
export function closeModal(){ document.getElementById("modal").style.display="none"; }

// --------------------
// BUDGET
// --------------------
export function openBudget(){
  const budgetModal = document.getElementById("budgetModal");
  budgetModal.style.display="flex";
  document.getElementById("budgetInput").value = localStorage.getItem("monthlyBudget") || "";
}
export function closeBudget(){ document.getElementById("budgetModal").style.display="none"; }
export function saveBudget(){
  const val = parseFloat(document.getElementById("budgetInput").value);
  if(isNaN(val) || val<=0){ alert("Geef een geldig bedrag in"); return; }
  localStorage.setItem("monthlyBudget", val);
  closeBudget();
  updateBudgetUI();
}

// --------------------
// OPSLAAN FIRESTORE
// --------------------
export async function saveEntry(){
  const soortVal = document.getElementById("soort").value;
  const bronVal = document.getElementById("bron").value;
  const datumVal = document.getElementById("datum").value;
  const bedragVal = parseFloat(document.getElementById("bedrag").value) * (soortVal==="uitgave"?-1:1);
  const recurringVal = document.getElementById("recurring").checked;

  if(!datumVal || isNaN(bedragVal)){ alert("Vul alles in"); return; }

  await addDoc(
    collection(window.db, "users", window.user.uid, "items"),
    {
      soort: soortVal,
      bron: bronVal,
      datum: datumVal,
      bedrag: bedragVal,
      recurring: recurringVal,
      created: Date.now()
    }
  );

  closeModal();
  loadData();
}

// --------------------
// LOAD DATA
// --------------------
export async function loadData(){
  const q = query(collection(window.db, "users", window.user.uid, "items"));
  const snap = await getDocs(q);

  let saldo = 0;
  let uitgavenDezeMaand = 0;
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();

  snap.forEach(doc=>{
    const e = doc.data();
    saldo += e.bedrag;
    const d = new Date(e.datum);
    if(e.bedrag<0 && d.getMonth()===m && d.getFullYear()===y){
      uitgavenDezeMaand += Math.abs(e.bedrag);
    }
  });

  document.getElementById("saldo").innerText =
    "€ " + saldo.toFixed(2).replace(".",",");

  updateBudgetUI(uitgavenDezeMaand);
}

// --------------------
// BUDGET UI
// --------------------
export function updateBudgetUI(spent=0){
  const budget = parseFloat(localStorage.getItem("monthlyBudget"));
  const label = document.getElementById("budgetAmount");
  const warning = document.getElementById("budgetWarning");

  if(!budget){
    label.innerText = "Niet ingesteld";
    warning.style.display="none";
    return;
  }

  label.innerText = `€ ${budget.toFixed(2)}`;
  const percent = spent / budget;

  if(percent >= 1){
    warning.style.display="block";
    warning.style.background="#fee2e2";
    warning.style.color="#991b1b";
    warning.innerText="⚠️ Budget overschreden!";
  } else if(percent>=0.8){
    warning.style.display="block";
    warning.style.background="#fef3c7";
    warning.style.color="#92400e";
    warning.innerText="⚠️ Je zit boven 80% van je budget";
  } else {
    warning.style.display="none";
  }
}

// --------------------
// THEME TOGGLE
// --------------------
export function toggleTheme(){
  document.body.classList.toggle("dark");
}
