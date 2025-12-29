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
  measurementId: "G-0J29T1Z7MV"} ;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
window.db = db;

// --- Categorieën
function getCategoryMap(){ return JSON.parse(localStorage.getItem("categoryMap")) || {"Albert Heijn":"Boodschappen"}; }
function saveCategoryMap(map){ localStorage.setItem("categoryMap",JSON.stringify(map)); }
function addCategory(bron,cat){ if(!bron||!cat) return; const map=getCategoryMap(); map[bron]=cat; saveCategoryMap(map); updateCategoryListUI(); updateBronAutocomplete();}
function deleteCategory(bron){ const map=getCategoryMap(); delete map[bron]; saveCategoryMap(map); updateCategoryListUI(); updateBronAutocomplete();}
function updateCategoryListUI(){ const map=getCategoryMap(); const listDiv=document.getElementById("categoryList"); listDiv.innerHTML=""; Object.entries(map).forEach(([b,c])=>{const div=document.createElement("div"); div.style.display="flex"; div.style.justifyContent="space-between"; div.style.margin="4px 0"; div.innerHTML=`<span>${b} → ${c}</span> <button class="btn cancel" style="padding:2px 6px;font-size:12px;">❌</button>`; div.querySelector("button").addEventListener("click",()=>deleteCategory(b)); listDiv.appendChild(div);}); }
function updateBronAutocomplete(){ const map=getCategoryMap(); const datalist=document.getElementById("bronList"); datalist.innerHTML=""; Object.keys(map).forEach(b=>{const opt=document.createElement("option"); opt.value=b; datalist.appendChild(opt);});}

// --- Auth
onAuthStateChanged(auth,user=>{ if(!user){ signInWithPopup(auth,provider).then(r=>{window.user=r.user; loadData();}).catch(e=>console.error(e));} else {window.user=user; loadData();} });

// --- Elements
const modal=document.getElementById("modal");
const dayModal=document.getElementById("dayModal");
const fixedCostsModal=document.getElementById("fixedCostsModal");
const soort=document.getElementById("soort");
const bron=document.getElementById("bron");
const datum=document.getElementById("datum");
const bedrag=document.getElementById("bedrag");
const recurring=document.getElementById("recurring");
let saveToSavings=document.getElementById("saveToSavings");

// --- Spaarpotten
function getSavings(){return JSON.parse(localStorage.getItem("savings"))||[];}
function saveSavingsToStorage(s){localStorage.setItem("savings",JSON.stringify(s));}
function updateSavingsUI(){ const savings=getSavings(); saveToSavings.innerHTML=""; const defaultOpt=document.createElement("option"); defaultOpt.value=""; defaultOpt.innerText="Geen spaarpot"; saveToSavings.appendChild(defaultOpt); savings.forEach((s,i)=>{const opt=document.createElement("option"); opt.value=i; opt.innerText=`${s.name}: € ${s.amount.toFixed(2)}`; saveToSavings.appendChild(opt); }); }

// --- Modals
function openModal(entry=null){ modal.style.display="flex"; updateSavingsUI(); updateBronAutocomplete(); if(entry){ soort.value=entry.soort; bron.value=entry.bron; datum.value=entry.datum; bedrag.value=entry.bedrag; recurring.checked=entry.recurring;} else {soort.value="inkomst";bron.value="";datum.value="";bedrag.value=""; recurring.checked=false;} }
function closeModal(){ modal.style.display="none"; }
function openDayModal(day, entries){ dayModal.style.display="flex"; document.getElementById("dayTitle").innerText=`Dag ${day}`; const list=document.getElementById("dayList"); list.innerHTML=""; entries.forEach(e=>{ const div=document.createElement("div"); div.innerText=`${e.soort==='inkomst'?'💰':'💸'} ${e.bron}: € ${e.bedrag}`; list.appendChild(div);});}
function closeDayModal(){ dayModal.style.display="none"; }

// --- Calendar
function renderCalendar(items=[]){
    const calendar=document.getElementById("calendar");
    calendar.innerHTML="";
    const today=new Date();
    const daysInMonth=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
    for(let d=1;d<=daysInMonth;d++){
        const div=document.createElement("div"); div.className="day"; div.innerText=d;
        const dayEntries=items.filter(i=>new Date(i.datum).getDate()===d && new Date(i.datum).getMonth()===today.getMonth());
        if(dayEntries.length) div.classList.add("has");
        div.addEventListener("click",()=>openDayModal(d,dayEntries));
        calendar.appendChild(div);
    }
}

// --- Save Entry
async function saveEntry(){
    const soortVal=soort.value; const bronVal=bron.value; const datumVal=datum.value;
    let bedragVal=parseFloat(bedrag.value); if(isNaN(bedragVal)){alert("Vul een geldig bedrag in"); return;}
    const recurringVal=recurring.checked; const savingsIndex=saveToSavings.value; const categorie=getCategoryMap()[bronVal]||"Overig";
    const savings=getSavings();
    if(savingsIndex!==""){ const sIndex=parseInt(savingsIndex); if(soortVal==="inkomst"){ savings[sIndex].amount+=bedragVal; saveSavingsToStorage(savings); updateSavingsUI(); bedragVal=0;} else { const spaarBedrag=Math.min(bedragVal,savings[sIndex].amount); savings[sIndex].amount-=spaarBedrag; saveSavingsToStorage(savings); updateSavingsUI(); bedragVal-=spaarBedrag;} }
    if(soortVal==="uitgave") bedragVal=-Math.abs(bedragVal);
    await addDoc(collection(db,"users",user.uid,"items"),{soort:soortVal,bron:bronVal,datum:datumVal,bedrag:bedragVal,categorie,c,recurring:recurringVal, savingsIndex:savingsIndex!==""?parseInt(savingsIndex):null,created:Date.now()});
    closeModal(); loadData();
}

// --- Fixed Costs
function saveFixedCosts(){ const costs={ lening:parseFloat(leningInput.value)||0, electriciteit:parseFloat(electriciteitInput.value)||0, mobiliteit:parseFloat(mobiliteitInput.value)||0, verzekering:parseFloat(verzekeringInput.value)||0 }; localStorage.setItem("fixedCosts",JSON.stringify(costs)); closeFixedCosts(); updateFixedCostsUI();}
function updateFixedCostsUI(){ const costs=JSON.parse(localStorage.getItem("fixedCosts"))||{}; fixedCostsList.innerHTML=""; Object.entries(costs).forEach(([k,v])=>{fixedCostsList.innerHTML+=`<span>${k}: € ${v.toFixed(2)}</span>`;}); }
updateFixedCostsUI();

// --- Event Listeners
document.getElementById("addBtn").addEventListener("click",()=>openModal());
document.getElementById("closeModalBtn").addEventListener("click",closeModal);
document.getElementById("saveEntryBtn").addEventListener("click",saveEntry);
document.getElementById("fixedCostsBtn").addEventListener("click",openFixedCosts);
document.getElementById("closeFixedBtn").addEventListener("click",closeFixedCosts);
document.getElementById("saveFixedBtn").addEventListener("click",saveFixedCosts);
document.getElementById("calBtn").addEventListener("click",()=>{
    const calendar=document.getElementById("calendar"); calendar.style.display=calendar.style.display==="grid"?"none":"grid";
    loadCalendar();
});
document.getElementById("closeDayBtn").addEventListener("click",closeDayModal);
document.getElementById("manageCategoriesBtn").addEventListener("click",()=>{ document.getElementById("categoryModal").style.display="flex"; updateCategoryListUI();});
document.getElementById("closeCategoryBtn").addEventListener("click",()=>{ document.getElementById("categoryModal").style.display="none";});
document.getElementById("addCategoryBtn").addEventListener("click",()=>{ addCategory(document.getElementById("newBron").value.trim(),document.getElementById("newCategorie").value.trim()); document.getElementById("newBron").value=""; document.getElementById("newCategorie").value=""; });

// --- Theme
document.getElementById("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("dark");});

// --- LoadData
async function loadData(){
    // Hier haal je entries van Firestore
    const q = query(collection(db,"users",user.uid,"items"));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(d=>d.data());
    // Saldo update (voorbeeld)
    const saldo = items.reduce((sum,i)=>sum+i.bedrag,0);
    saldoDiv.innerText=`€ ${saldo.toFixed(2)}`;
    saldoBar.style.width="80%";
    expectedEndDiv.innerText=`🔮 Verwacht einde maand: € ${(saldo-34).toFixed(2)}`;
    // Kalender render
    renderCalendar(items);
}

// Init
updateBronAutocomplete();
