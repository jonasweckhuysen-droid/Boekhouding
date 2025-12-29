import {
  collection,
  addDoc,
  getDocs,
  query
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =====================
// MODALS
// =====================
function openModal(){ modal.style.display="flex"; }
function closeModal(){ modal.style.display="none"; }

// =====================
// BUDGET
// =====================
function openBudget(){
  budgetModal.style.display="flex";
  budgetInput.value = localStorage.getItem("monthlyBudget") || "";
}

function closeBudget(){
  budgetModal.style.display="none";
}

function saveBudget(){
  const val = parseFloat(budgetInput.value);
  if(isNaN(val) || val <= 0){
    alert("Geef een geldig bedrag in");
    return;
  }
  localStorage.setItem("monthlyBudget", val);
  closeBudget();
  updateBudgetUI();
}

// =====================
// OPSLAAN (FIREBASE)
// =====================
async function saveEntry(){
  const soortVal = soort.value;
  const bronVal = bron.value;
  const datumVal = datum.value;
  const bedragVal = parseFloat(bedrag.value) * (soortVal==="uitgave"?-1:1);
  const recurringVal = recurring.checked;

  if(!datumVal || isNaN(bedragVal)){
    alert("Vul alles in");
    return;
  }

  await addDoc(
    collection(db, "users", user.uid, "items"),
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

// =====================
// SALDO + BUDGET CHECK
// =====================
async function loadData(){
  const q = query(collection(db, "users", user.uid, "items"));
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
    if(e.bedrag < 0 && d.getMonth()===m && d.getFullYear()===y){
      uitgavenDezeMaand += Math.abs(e.bedrag);
    }
  });

  document.getElementById("saldo").innerText =
    "€ " + saldo.toFixed(2).replace(".",",");

  updateBudgetUI(uitgavenDezeMaand);
}

// =====================
// BUDGET UI
// =====================
function updateBudgetUI(spent=0){
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
    warning.innerText = "⚠️ Budget overschreden!";
  }
  else if(percent >= 0.8){
    warning.style.display="block";
    warning.style.background="#fef3c7";
    warning.style.color="#92400e";
    warning.innerText = "⚠️ Je zit boven 80% van je budget";
  }
  else{
    warning.style.display="none";
  }
}
