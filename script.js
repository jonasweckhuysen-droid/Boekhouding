import { collection, addDoc, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const modal = document.getElementById("modal");
const dayModal = document.getElementById("dayModal");
const budgetModal = document.getElementById("budgetModal");

const soort = document.getElementById("soort");
const bron = document.getElementById("bron");
const datum = document.getElementById("datum");
const bedrag = document.getElementById("bedrag");
const recurring = document.getElementById("recurring");
const budgetInput = document.getElementById("budgetInput");

const dayTitle = document.getElementById("dayTitle");
const dayList = document.getElementById("dayList");
const saldoDiv = document.getElementById("saldo");
const budgetLabel = document.getElementById("budgetAmount");
const budgetWarning = document.getElementById("budgetWarning");

// =====================
// MODALS
// =====================
function openModal(){ modal.style.display="flex"; }
function closeModal(){ modal.style.display="none"; }

function openDayModal(){ dayModal.style.display="flex"; }
function closeDayModal(){ dayModal.style.display="none"; }

// =====================
// BUDGET
// =====================
function openBudget(){ 
  budgetModal.style.display="flex"; 
  budgetInput.value = localStorage.getItem("monthlyBudget")||""; 
}
function closeBudget(){ budgetModal.style.display="none"; }
function saveBudget(){
  const val = parseFloat(budgetInput.value);
  if(isNaN(val)||val<=0){ alert("Geef een geldig bedrag in"); return; }
  localStorage.setItem("monthlyBudget", val);
  closeBudget();
  updateBudgetUI();
}

// =====================
// OPSLAAN FIREBASE
// =====================
async function saveEntry(){
  const soortVal = soort.value;
  const bronVal = bron.value;
  const datumVal = datum.value;
  const bedragVal = parseFloat(bedrag.value) * (soortVal==="uitgave"?-1:1);
  const recurringVal = recurring.checked;

  if(!datumVal||isNaN(bedragVal)){ alert("Vul alles in"); return; }

  await addDoc(collection(db,"users",user.uid,"items"),{
    soort: soortVal,
    bron: bronVal,
    datum: datumVal,
    bedrag: bedragVal,
    recurring: recurringVal,
    created: Date.now()
  });

  closeModal();
  loadData();
}

// =====================
// LOAD DATA
// =====================
async function loadData(){
  const q = query(collection(db,"users",user.uid,"items"));
  const snap = await getDocs(q);

  let saldo=0, uitgavenDezeMaand=0;
  const now = new Date(), m=now.getMonth(), y=now.getFullYear();
  const items = [];

  snap.forEach(doc=>{
    const e = doc.data();
    saldo += e.bedrag;
    const d = new Date(e.datum);
    items.push({...e, datumObj: d});

    if(e.bedrag<0 && d.getMonth()===m && d.getFullYear()===y){
      uitgavenDezeMaand += Math.abs(e.bedrag);
    }
  });

  window.items = items; // Sla items op voor kalender

  // Saldo visueel
  saldoDiv.innerHTML = saldo>=0 
    ? `💰 € ${saldo.toFixed(2).replace(".",",")}` 
    : `🔴 € ${saldo.toFixed(2).replace(".",",")}`;

  updateBudgetUI(uitgavenDezeMaand);
}

// =====================
// BUDGET UI
// =====================
function updateBudgetUI(spent=0){
  const budget = parseFloat(localStorage.getItem("monthlyBudget"));
  if(!budget){ 
    budgetLabel.innerText="Niet ingesteld"; 
    budgetWarning.style.display="none"; 
    return; 
  }

  budgetLabel.innerText = `💵 € ${budget.toFixed(2)}`;
  const percent = spent/budget;

  if(percent>=1){
    budgetWarning.style.display="block";
    budgetWarning.style.background="#fee2e2";
    budgetWarning.style.color="#991b1b";
    budgetWarning.innerText="⚠️ Budget overschreden!";
  } else if(percent>=0.8){
    budgetWarning.style.display="block";
    budgetWarning.style.background="#fef3c7";
    budgetWarning.style.color="#92400e";
    budgetWarning.innerText="⚠️ Je zit boven 80% van je budget";
  } else budgetWarning.style.display="none";
}

// =====================
// KALENDER
// =====================
function buildCalendar(){
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Eerste dag van de maand
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1,0).getDate();

  // Lege blokken voor uitlijning
  for(let i=0;i<firstDay;i++){
    const empty = document.createElement("div");
    calendar.appendChild(empty);
  }

  for(let d=1;d<=daysInMonth;d++){
    const dayDiv = document.createElement("div");
    dayDiv.className = "day";
    dayDiv.innerText = d;

    const dayItems = window.items.filter(item=>{
      const itemDate = item.datumObj;
      return itemDate.getDate()===d && itemDate.getMonth()===month && itemDate.getFullYear()===year;
    });

    if(dayItems.length>0){
      // Kleuren voor kalenderdagen
      const hasInkomen = dayItems.some(i=>i.bedrag>0);
      const hasUitgave = dayItems.some(i=>i.bedrag<0);

      if(hasInkomen && hasUitgave) dayDiv.style.background="#facc15"; // geel/oranje = beide
      else if(hasInkomen) dayDiv.style.background="#22c55e"; // groen
      else if(hasUitgave) dayDiv.style.background="#ef4444"; // rood
      dayDiv.style.color="white";
      dayDiv.style.fontWeight="600";
    }

    dayDiv.addEventListener("click", ()=>{
      dayTitle.innerText = `${d}/${month+1}/${year}`;
      dayList.innerHTML = "";

      if(dayItems.length===0){
        dayList.innerHTML = "<p>Geen bewegingen</p>";
      } else {
        dayItems.forEach(item=>{
          const p = document.createElement("div");
          p.className = "entry "+(item.bedrag>=0?"pos":"neg");
          const icon = item.bedrag>=0 ? "💵" : "💸";
          p.innerText = `${icon} ${item.soort} - ${item.bron} : € ${item.bedrag.toFixed(2).replace(".",",")}`;
          dayList.appendChild(p);
        });
      }

      openDayModal();
    });

    calendar.appendChild(dayDiv);
  }
}

// =====================
// THEME
// =====================
function toggleTheme(){ document.body.classList.toggle("dark"); }

// =====================
// EXPORTS
// =====================
export { openModal, closeModal, saveEntry, buildCalendar, openBudget, closeBudget, saveBudget, loadData, toggleTheme, closeDayModal as closeDay };
