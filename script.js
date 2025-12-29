import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase
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
window.db = db;

// --- automatische categorie mapping ---
const categoryMap = {
  "Albert Heijn":"Boodschappen",
  "Colruyt":"Boodschappen",
  "Shell":"Mobiliteit",
  "Telenet":"Internet",
  "Netflix":"Entertainment"
};

// --- Auth ---
const login = async () => {
  try { const result = await signInWithPopup(auth, provider); window.user = result.user; loadData(); }
  catch(e){console.error(e);alert("Login mislukt!");}
};
onAuthStateChanged(auth,user=>{if(!user) login(); else {window.user=user; loadData();}});

// --- Elements ---
const modal=document.getElementById("modal");
const dayModal=document.getElementById("dayModal");
const fixedCostsModal=document.getElementById("fixedCostsModal");

const soort=document.getElementById("soort");
const bron=document.getElementById("bron");
const datum=document.getElementById("datum");
const bedrag=document.getElementById("bedrag");
const recurring=document.getElementById("recurring");

// Spaarpot dropdown
let saveToSavings;
if(!document.getElementById("saveToSavings")) {
  const select = document.createElement("select");
  select.id="saveToSavings";
  const defaultOption = document.createElement("option");
  defaultOption.value="";
  defaultOption.innerText="Geen spaarpot";
  select.appendChild(defaultOption);
  document.querySelector("#modal .box").insertBefore(select, document.querySelector("#modal .box div:last-child"));
}
saveToSavings=document.getElementById("saveToSavings");

const saldoDiv=document.getElementById("saldo");
const saldoBar=document.getElementById("saldoBar");
const expectedEndDiv=document.getElementById("expectedEnd");
const fixedCostsList=document.getElementById("fixedCostsList");
const dayTitle=document.getElementById("dayTitle");
const dayList=document.getElementById("dayList");

const leningInput=document.getElementById("leningInput");
const electriciteitInput=document.getElementById("electriciteitInput");
const mobiliteitInput=document.getElementById("mobiliteitInput");
const verzekeringInput=document.getElementById("verzekeringInput");

// --- Spaarpotten ---
function getSavings(){ return JSON.parse(localStorage.getItem("savings"))||[]; }
function saveSavingsToStorage(s){ localStorage.setItem("savings",JSON.stringify(s)); }
function updateSavingsUI(){
  const savings = getSavings();
  saveToSavings.innerHTML="";
  const defaultOption = document.createElement("option");
  defaultOption.value="";
  defaultOption.innerText="Geen spaarpot";
  saveToSavings.appendChild(defaultOption);
  savings.forEach((s,i)=>{
    const opt = document.createElement("option");
    opt.value=i;
    opt.innerText=`${s.name}: € ${s.amount.toFixed(2)}`;
    saveToSavings.appendChild(opt);
  });
}

// --- Modals ---
function openModal(){ 
  modal.style.display="flex"; 
  updateSavingsUI();
}
function closeModal(){ modal.style.display="none"; }
function openDayModal(){ dayModal.style.display="flex"; }
function closeDayModal(){ dayModal.style.display="none"; }
function openFixedCosts(){
  fixedCostsModal.style.display="flex";
  const costs=JSON.parse(localStorage.getItem("fixedCosts"))||{};
  leningInput.value=costs.lening||"";
  electriciteitInput.value=costs.electriciteit||"";
  mobiliteitInput.value=costs.mobiliteit||"";
  verzekeringInput.value=costs.verzekering||"";
}
function closeFixedCosts(){ fixedCostsModal.style.display="none"; }

// --- Save Entry (met spaarpotten) ---
async function saveEntry(){
  const soortVal=soort.value;
  const bronVal=bron.value;
  const datumVal=datum.value;
  let bedragVal=parseFloat(bedrag.value);
  if(isNaN(bedragVal)){ alert("Vul een geldig bedrag in"); return; }

  const recurringVal=recurring.checked;
  const savingsIndex = saveToSavings.value;

  if(!datumVal){alert("Vul een datum in"); return;}
  const categorie = categoryMap[bronVal] || "Overig";

  // --- Spaarpot update ---
  const savings = getSavings();

  if(savingsIndex!==""){
    const sIndex = parseInt(savingsIndex);
    if(soortVal==="inkomst"){
      savings[sIndex].amount += bedragVal;
      saveSavingsToStorage(savings);
      updateSavingsUI();
      bedragVal = 0; 
    } else {
      const spaarBedrag = Math.min(bedragVal, savings[sIndex].amount);
      savings[sIndex].amount -= spaarBedrag;
      saveSavingsToStorage(savings);
      updateSavingsUI();
      bedragVal = bedragVal - spaarBedrag;
    }
  }

  if(soortVal==="uitgave") bedragVal = -Math.abs(bedragVal);

  await addDoc(collection(db,"users",user.uid,"items"),{
    soort:soortVal,
    bron:bronVal,
    datum:datumVal,
    bedrag:bedragVal,
    categorie:categorie,
    recurring:recurringVal,
    savingsIndex: savingsIndex!=="" ? parseInt(savingsIndex) : null,
    created:Date.now()
  });

  closeModal();
  loadData();
}

// --- Fixed Costs ---
function saveFixedCosts(){
  const costs={
    lening:parseFloat(leningInput.value)||0,
    electriciteit:parseFloat(electriciteitInput.value)||0,
    mobiliteit:parseFloat(mobiliteitInput.value)||0,
    verzekering:parseFloat(verzekeringInput.value)||0
  };
  localStorage.setItem("fixedCosts",JSON.stringify(costs));
  closeFixedCosts();
  updateFixedCostsUI();
  loadData();
}

function updateFixedCostsUI(){
  const costs=JSON.parse(localStorage.getItem("fixedCosts"))||{};
  const keys=Object.keys(costs).filter(k=>costs[k]>0);
  if(keys.length===0) fixedCostsList.innerText="Geen vaste kosten ingesteld";
  else fixedCostsList.innerHTML=keys.map(k=>`<span>${k.charAt(0).toUpperCase()+k.slice(1)}: € ${costs[k].toFixed(2)}</span>`).join("<br>");
}

// --- Saldo UI ---
function updateSaldoUI(saldo=0, spent=0){
  const costs=JSON.parse(localStorage.getItem("fixedCosts"))||{};
  const totalFixed=Object.values(costs).reduce((a,b)=>a+b,0);
  const expectedEnd = saldo - totalFixed;

  saldoDiv.innerHTML = saldo>=0 ? `💰 € ${saldo.toFixed(2).replace(".",",")}` : `🔴 € ${saldo.toFixed(2).replace(".",",")}`;
  expectedEndDiv.innerHTML = `🔮 Verwacht einde maand: € ${expectedEnd.toFixed(2).replace(".",",")}`;

  const budget = parseFloat(localStorage.getItem("monthlyBudget"))||0;
  const percent = budget>0 ? Math.min((spent/budget)*100,100) : 0;
  saldoBar.style.width = percent+"%";
  saldoBar.style.background = percent>=100 ? "#ef4444" : percent>=80 ? "#facc15" : "#22c55e";
}

// --- Load Data ---
async function loadData(){
  const q=query(collection(db,"users",user.uid,"items"));
  const snap=await getDocs(q);

  let saldo=0, spent=0;
  const now=new Date();
  const m=now.getMonth(), y=now.getFullYear();
  const items=[];

  snap.forEach(doc=>{
    const e=doc.data();
    saldo+=e.bedrag;
    const d=new Date(e.datum);
    items.push({...e,datumObj:d});
    if(e.bedrag<0 && d.getMonth()===m && d.getFullYear()===y) spent+=Math.abs(e.bedrag);
  });

  window.items = items;
  updateFixedCostsUI();
  updateSaldoUI(saldo,spent);
  updateBudgetChart(items);
  updateSavingsUI();
}

// --- Calendar ---
function buildCalendar(){
  const calendar=document.getElementById("calendar");
  calendar.innerHTML="";
  const now=new Date();
  const year=now.getFullYear();
  const month=now.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();

  for(let i=0;i<firstDay;i++) calendar.appendChild(document.createElement("div"));

  for(let d=1;d<=daysInMonth;d++){
    const dayDiv=document.createElement("div");
    dayDiv.className="day";
    dayDiv.innerText=d;

    const dayItems = window.items.filter(item=>{
      const itemDate=item.datumObj;
      return itemDate.getDate()===d && itemDate.getMonth()===month && itemDate.getFullYear()===year;
    });

    if(dayItems.length>0) dayDiv.classList.add("has");

    dayDiv.addEventListener("click",()=>{
      dayTitle.innerText=`${d}/${month+1}/${year}`;
      dayList.innerHTML="";
      if(dayItems.length===0) dayList.innerHTML="<p>Geen bewegingen</p>";
      else dayItems.forEach(item=>{
        const p=document.createElement("div");
        p.className="entry "+(item.bedrag>=0?"pos":"neg");
        const icon=item.bedrag>=0?"💵":"💸";
        let spaarTxt = item.savingsIndex!==null ? " (Spaarpot)" : "";
        p.innerText=`${icon} ${item.soort} - ${item.bron} : € ${item.bedrag.toFixed(2).replace(".",",")}${spaarTxt}`;
        dayList.appendChild(p);
      });
      openDayModal();
    });

    calendar.appendChild(dayDiv);
  }
}

// --- Budget Chart ---
let expenseChart=null;
function updateBudgetChart(items){
  const now=new Date();
  const m=now.getMonth(), y=now.getFullYear();
  const categories={};
  items.forEach(i=>{
    const d=i.datumObj;
    if(d.getMonth()===m && d.getFullYear()===y && i.bedrag<0){
      const cat = i.categorie || "Overig";
      categories[cat] = (categories[cat]||0) + Math.abs(i.bedrag);
    }
  });

  const ctx=document.getElementById("expenseChart").getContext("2d");
  if(expenseChart) expenseChart.destroy();

  expenseChart = new Chart(ctx,{
    type:'bar',
    data:{
      labels:Object.keys(categories),
      datasets:[{label:'Uitgaven per categorie',data:Object.values(categories),backgroundColor:'#ef4444'}]
    },
    options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}
  });
}

// --- Event Listeners ---
document.getElementById("addBtn").addEventListener("click", openModal);
document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("saveEntryBtn").addEventListener("click", saveEntry);
document.getElementById("calBtn").addEventListener("click", buildCalendar);
document.getElementById("fixedCostsBtn").addEventListener("click", openFixedCosts);
document.getElementById("closeFixedBtn").addEventListener("click", closeFixedCosts);
document.getElementById("saveFixedBtn").addEventListener("click", saveFixedCosts);
document.getElementById("themeToggle").addEventListener("click", ()=>document.body.classList.toggle("dark"));
document.getElementById("closeDayBtn").addEventListener("click", closeDayModal);

// --- Spaarpot helper functies om toe te voegen vanuit de console of UI ---
window.addSavings = (name, amount=0) => {
  const savings = getSavings();
  savings.push({name, amount});
  saveSavingsToStorage(savings);
  updateSavingsUI();
}
window.deleteSavings = (index) => {
  const savings = getSavings();
  savings.splice(index,1);
  saveSavingsToStorage(savings);
  updateSavingsUI();
}
