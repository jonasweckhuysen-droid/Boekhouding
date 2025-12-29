let db;

// =====================
// DATABASE
// =====================
const request = indexedDB.open("BoekhoudingDB", 1);

request.onupgradeneeded = e => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("items")) {
    db.createObjectStore("items", { keyPath: "id", autoIncrement: true });
  }
};

request.onsuccess = e => {
  db = e.target.result;
  loadData();
};

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
// OPSLAAN
// =====================
function saveEntry(){
  const soort = soort.value;
  const bron = bron.value;
  const datum = datum.value;
  const bedrag = parseFloat(bedrag.value) * (soort==="uitgave"?-1:1);
  const recurring = recurring.checked;

  if(!datum || isNaN(bedrag)){
    alert("Vul alles in");
    return;
  }

  const tx = db.transaction("items","readwrite");
  tx.objectStore("items").add({soort,bron,datum,bedrag,recurring});
  tx.oncomplete = ()=>{
    closeModal();
    loadData();
  };
}

// =====================
// SALDO + BUDGET CHECK
// =====================
function loadData(){
  const tx = db.transaction("items","readonly");
  const req = tx.objectStore("items").getAll();

  req.onsuccess = ()=>{
    const data = req.result;
    let saldo = 0;
    let uitgavenDezeMaand = 0;

    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();

    data.forEach(e=>{
      saldo += e.bedrag;
      const d = new Date(e.datum);
      if(e.bedrag < 0 && d.getMonth()===m && d.getFullYear()===y){
        uitgavenDezeMaand += Math.abs(e.bedrag);
      }
    });

    document.getElementById("saldo").innerText =
      "€ " + saldo.toFixed(2).replace(".",",");

    updateBudgetUI(uitgavenDezeMaand);
  };
}

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
