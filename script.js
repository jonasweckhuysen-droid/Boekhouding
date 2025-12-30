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

// --- Alles pas uitvoeren na DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", ()=>{

  // --- Elementen ---
  const modal=document.getElementById("modal");
  const dayModal=document.getElementById("dayModal");
  const fixedCostsModal=document.getElementById("fixedCostsModal");

  const soort=document.getElementById("soort");
  const bron=document.getElementById("bron");
  const datum=document.getElementById("datum");
  const bedrag=document.getElementById("bedrag");
  const recurring=document.getElementById("recurring");

  // Spaarpot dropdown
  let saveToSavings = document.getElementById("saveToSavings");
  if(!saveToSavings){
    const select = document.createElement("select");
    select.id="saveToSavings";
    const defaultOption = document.createElement("option");
    defaultOption.value="";
    defaultOption.innerText="Geen spaarpot";
    select.appendChild(defaultOption);
    document.querySelector("#modal .box").insertBefore(select, document.querySelector("#modal .box div:last-child"));
    saveToSavings = document.getElementById("saveToSavings");
  }

  const saldoDiv=document.getElementById("saldo");
  const saldoBar=document.getElementById("saldoBar");
  const expectedEndDiv=document.getElementById("expectedEnd");
  const fixedCostsList=document.getElementById("fixedCostsList");

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

    const container = document.getElementById("savingsList");
    container.innerHTML="";
    if(savings.length===0){ container.innerText="Geen spaarpotjes ingesteld"; return; }
    savings.forEach(s=>{
      const div = document.createElement("div");
      div.className="entry";
      div.innerText=`${s.name}: € ${s.amount.toFixed(2)}`;
      container.appendChild(div);
    });
  }

  // --- Fixed Costs ---
  function updateFixedCostsUI(){
    const costs=JSON.parse(localStorage.getItem("fixedCosts"))||{};
    const keys=Object.keys(costs).filter(k=>costs[k]>0);
    if(keys.length===0) fixedCostsList.innerText="Geen vaste kosten ingesteld";
    else fixedCostsList.innerHTML=keys.map(k=>`<span>${k.charAt(0).toUpperCase()+k.slice(1)}: € ${costs[k].toFixed(2)}</span>`).join("<br>");
  }

  // --- Modals ---
  function openModal(){ modal.style.display="flex"; updateSavingsUI(); }
  function closeModal(){ modal.style.display="none"; }
  function openFixedCosts(){
    fixedCostsModal.style.display="flex";
    const costs=JSON.parse(localStorage.getItem("fixedCosts"))||{};
    leningInput.value=costs.lening||"";
    electriciteitInput.value=costs.electriciteit||"";
    mobiliteitInput.value=costs.mobiliteit||"";
    verzekeringInput.value=costs.verzekering||"";
  }
  function closeFixedCosts(){ fixedCostsModal.style.display="none"; }

  // --- Save Entry ---
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

    const savings = getSavings();
    if(savingsIndex !== ""){
      const sIndex = parseInt(savingsIndex);
      if(soortVal === "inkomst"){
        savings[sIndex].amount += bedragVal;
        saveSavingsToStorage(savings);
        updateSavingsUI();
        bedragVal=0;
      } else {
        const spaarBedrag = Math.min(bedragVal, savings[sIndex].amount);
        savings[sIndex].amount -= spaarBedrag;
        saveSavingsToStorage(savings);
        updateSavingsUI();
        bedragVal -= spaarBedrag;
      }
    }
    if(soortVal==="uitgave") bedragVal=-Math.abs(bedragVal);

    await addDoc(collection(db,"users",user.uid,"items"),{
      soort:soortVal,
      bron:bronVal,
      datum:datumVal,
      bedrag:bedragVal,
      categorie:categorie,
      recurring:recurringVal,
      savingsIndex: savingsIndex!==""?parseInt(savingsIndex):null,
      created:Date.now()
    });

    closeModal();
    loadData();
  }

  // --- Save Fixed Costs ---
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

  // --- Saldo UI ---
  function updateSaldoUI(saldo=0, spent=0){
    const costs=JSON.parse(localStorage.getItem("fixedCosts"))||{};
    const totalFixed=Object.values(costs).reduce((a,b)=>a+b,0);
    const expectedEnd=saldo-totalFixed;

    saldoDiv.innerHTML = saldo>=0?`💰 € ${saldo.toFixed(2).replace(".",",")}`:`🔴 € ${saldo.toFixed(2).replace(".",",")}`;
    expectedEndDiv.innerHTML=`🔮 Verwacht einde maand: € ${expectedEnd.toFixed(2).replace(".",",")}`;

    const budget=parseFloat(localStorage.getItem("monthlyBudget"))||0;
    const percent=budget>0?Math.min((spent/budget)*100,100):0;
    saldoBar.style.width=percent+"%";
    saldoBar.style.background = percent>=100?"#ef4444":percent>=80?"#facc15":"#22c55e";
  }

  // --- Load Data ---
  async function loadData(){
    if(!window.user) return;
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

    window.items=items;
    updateFixedCostsUI();
    updateSaldoUI(saldo,spent);
    updateSavingsUI();
  }

  // --- Event Listeners ---
  document.getElementById("addBtn").addEventListener("click", openModal);
  document.getElementById("fixedCostsBtn").addEventListener("click", openFixedCosts);
  document.getElementById("saveEntryBtn")?.addEventListener("click", saveEntry);
  document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);
  document.getElementById("closeFixedBtn")?.addEventListener("click", closeFixedCosts);
  document.getElementById("saveFixedCostsBtn")?.addEventListener("click", saveFixedCosts);
  document.getElementById("savingsBtn").addEventListener("click", ()=>document.getElementById("savingsModal").style.display="flex");
  document.getElementById("closeSavingsBtn")?.addEventListener("click", ()=>document.getElementById("savingsModal").style.display="none");

  // --- Klik buiten modals sluiten ---
  ["modal","dayModal","fixedCostsModal","savingsModal"].forEach(id=>{
    const m=document.getElementById(id);
    if(m)m.addEventListener("click",e=>{if(e.target===m)m.style.display="none"});
  });

  // --- Init ---
  updateSavingsUI();
  updateFixedCostsUI();

});
