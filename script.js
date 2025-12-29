import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Firebase configuratie ---
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
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();
let user;

// --- Elementen ---
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

// =====================
// MODALS
// =====================
export function openModal(){ modal.style.display="flex"; }
export function closeModal(){ modal.style.display="none"; }
export function openDay(){ dayModal.style.display="flex"; }
export function closeDay(){ dayModal.style.display="none"; }
export function openBudget(){ budgetModal.style.display="flex"; budgetInput.value = localStorage.getItem("monthlyBudget")||""; }
export function closeBudget(){ budgetModal.style.display="none"; }

// =====================
// BUDGET
// =====================
export function saveBudget(){
  const val = parseFloat(budgetInput.value);
  if(isNaN(val)||val<=0){ alert("Geef een geldig bedrag in"); return; }
  localStorage.setItem("monthlyBudget", val);
  closeBudget();
  updateBudgetUI();
}

// =====================
// LOGIN + LOAD DATA
// =====================
async function login(){
  try{
    const result = await signInWithPopup(auth, provider);
    user = result.user;
    loadData();
  } catch(e){
    console.error(e);
    alert("Login mislukt!");
  }
}

onAuthStateChanged(auth,(u)=>{
  if(!u) login();
  else { user=u; loadData(); }
});

// =====================
// OPSLAAN FIREBASE
// =====================
export async function saveEntry(){
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
export async function loadData(){
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

  window.items = items;
  document.getElementById("saldo").innerText = "€ "+saldo.toFixed(2).replace(".",",");
  updateBudgetUI(uitgavenDezeMaand);
}

// =====================
// BUDGET UI
// =====================
function updateBudgetUI(spent=0){
  const budget = parseFloat(localStorage.getItem("monthlyBudget"));
  const label = document.getElementById("budgetAmount");
  const warning = document.getElementById("budgetWarning");

  if(!budget){ label.innerText="Niet ingesteld"; warning.style.display="none"; return; }

  label.innerText = `€ ${budget.toFixed(2)}`;
  const percent = spent/budget;

  if(percent>=1){
    warning.style.display="block";
    warning.style.background="#fee2e2";
    warning.style.color="#991b1b";
    warning.innerText="⚠️ Budget overschreden!";
  } else if(percent>=0.8){
    warning.style.display="block";
    warning.style.background="#fef3c7";
    warning.style.color="#92400e";
    warning.innerText="⚠️ Je zit boven 80% van je budget";
  } else warning.style.display="none";
}

// =====================
// KALENDER
// =====================
export function buildCalendar(){
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1,0).getDate();

  for(let i=0;i<firstDay;i++){ calendar.appendChild(document.createElement("div")); }

  for(let d=1;d<=daysInMonth;d++){
    const dayDiv = document.createElement("div");
    dayDiv.className = "day";
    dayDiv.innerText = d;

    const dayItems = window.items.filter(item=>{
      const itemDate = item.datumObj;
      return itemDate.getDate()===d && itemDate.getMonth()===month && itemDate.getFullYear()===year;
    });

    if(dayItems.length>0) dayDiv.classList.add("has");

    dayDiv.addEventListener("click", ()=>{
      dayTitle.innerText = `${d}/${month+1}/${year}`;
      dayList.innerHTML = "";

      if(dayItems.length===0){
        dayList.innerHTML = "<p>Geen bewegingen</p>";
      } else {
        dayItems.forEach(item=>{
          const p = document.createElement("div");
          p.className = "entry "+(item.bedrag>=0?"pos":"neg");
          p.innerText = `${item.soort} - ${item.bron} : € ${item.bedrag.toFixed(2).replace(".",",")}`;
          dayList.appendChild(p);
        });
      }

      openDay();
    });

    calendar.appendChild(dayDiv);
  }
}

// =====================
// THEME
// =====================
export function toggleTheme(){ document.body.classList.toggle("dark"); }

// =====================
// Event Listeners
// =====================
document.getElementById("addBtn").addEventListener("click", openModal);
document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("saveEntryBtn").addEventListener("click", saveEntry);
document.getElementById("calBtn").addEventListener("click", buildCalendar);
document.getElementById("budgetBtn").addEventListener("click", openBudget);
document.getElementById("closeBudgetBtn").addEventListener("click", closeBudget);
document.getElementById("saveBudgetBtn").addEventListener("click", saveBudget);
document.getElementById("themeToggle").addEventListener("click", toggleTheme);
document.getElementById("closeDayBtn").addEventListener("click", closeDay);
