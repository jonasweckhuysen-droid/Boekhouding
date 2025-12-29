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
// --------------------
// CALENDAR
// --------------------
export function buildCalendar(){
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // eerste dag van de maand
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month+1, 0).getDate();

  // lege dagen voor start van de maand
  for(let i=0;i<firstDay;i++){
    const empty = document.createElement("div");
    calendar.appendChild(empty);
  }

  // echte dagen
  for(let d=1;d<=lastDate;d++){
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");
    dayDiv.innerText = d;

    dayDiv.addEventListener("click", ()=>openDayModal(year, month, d));

    calendar.appendChild(dayDiv);
  }

  // markeer dagen met bewegingen
  markDaysWithEntries(year, month);
}

// --------------------
// MARK DAYS WITH ENTRIES
// --------------------
async function markDaysWithEntries(year, month){
  const calendar = document.getElementById("calendar");
  const q = query(collection(window.db, "users", window.user.uid, "items"));
  const snap = await getDocs(q);

  const daysWithEntries = new Set();

  snap.forEach(doc=>{
    const e = doc.data();
    const d = new Date(e.datum);
    if(d.getFullYear()===year && d.getMonth()===month){
      daysWithEntries.add(d.getDate());
    }
  });

  // markeer
  const dayDivs = calendar.getElementsByClassName("day");
  for(const div of dayDivs){
    const dayNum = parseInt(div.innerText);
    if(daysWithEntries.has(dayNum)){
      div.classList.add("has");
    }
  }
}

// --------------------
// DAG MODAL
// --------------------
export async function openDayModal(year, month, day){
  const dayTitle = document.getElementById("dayTitle");
  const dayList = document.getElementById("dayList");

  dayTitle.innerText = `Bewegingen ${day}-${month+1}-${year}`;
  dayList.innerHTML = "";

  const q = query(collection(window.db, "users", window.user.uid, "items"));
  const snap = await getDocs(q);

  snap.forEach(doc=>{
    const e = doc.data();
    const d = new Date(e.datum);
    if(d.getFullYear()===year && d.getMonth()===month && d.getDate()===day){
      const div = document.createElement("div");
      div.classList.add("entry");
      div.innerHTML = `
        <span>${e.soort==="inkomst"?"💰":"💸"} ${e.bron}</span>
        <span class="${e.bedrag>0?"pos":"neg"}">€ ${Math.abs(e.bedrag).toFixed(2).replace(".",",")}</span>
      `;
      dayList.appendChild(div);
    }
  });

  document.getElementById("dayModal").style.display="flex";
}

export function closeDay(){
  document.getElementById("dayModal").style.display="none";
}

