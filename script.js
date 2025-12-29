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

// --- Dynamische categorieën ---
function getCategoryMap() {
  return JSON.parse(localStorage.getItem("categoryMap")) || {
    "Albert Heijn":"Boodschappen",
    "Colruyt":"Boodschappen",
    "Shell":"Mobiliteit",
    "Telenet":"Internet",
    "Netflix":"Entertainment"
  };
}
function saveCategoryMap(map) {
  localStorage.setItem("categoryMap", JSON.stringify(map));
}
function addCategory(bron, categorie){
  if(!bron || !categorie) return;
  const map = getCategoryMap();
  map[bron] = categorie;
  saveCategoryMap(map);
  updateCategoryListUI();
  updateBronAutocomplete();
}
function deleteCategory(bron){
  const map = getCategoryMap();
  delete map[bron];
  saveCategoryMap(map);
  updateCategoryListUI();
  updateBronAutocomplete();
}
function updateCategoryListUI(){
  const map = getCategoryMap();
  const listDiv = document.getElementById("categoryList");
  listDiv.innerHTML = "";
  Object.entries(map).forEach(([b,c])=>{
    const div = document.createElement("div");
    div.style.display="flex"; div.style.justifyContent="space-between"; div.style.margin="4px 0";
    div.innerHTML = `<span>${b} → ${c}</span> <button class="btn cancel" style="padding:2px 6px;font-size:12px;">❌</button>`;
    div.querySelector("button").addEventListener("click",()=>deleteCategory(b));
    listDiv.appendChild(div);
  });
}
function updateBronAutocomplete(){
  const map = getCategoryMap();
  const datalist = document.getElementById("bronList");
  datalist.innerHTML="";
  Object.keys(map).forEach(bron=>{
    const opt = document.createElement("option");
    opt.value = bron;
    datalist.appendChild(opt);
  });
}

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

let saveToSavings=document.getElementById("saveToSavings");

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
function openModal(){ modal.style.display="flex"; updateSavingsUI(); updateBronAutocomplete(); }
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

// --- Save Entry ---
async function saveEntry(){
  const soortVal=soort.value;
  const bronVal=bron.value;
  const datumVal=datum.value;
  let bedragVal=parseFloat(bedrag.value);
  if(isNaN(bedragVal)){ alert("Vul een geldig bedrag in"); return; }

  const recurringVal = recurring.checked;
  const savingsIndex = saveToSavings.value;

  if(!datumVal){alert("Vul een datum in"); return;}
  const categorie = getCategoryMap()[bronVal] || "Overig";

  const savings = getSavings();
  if(savingsIndex!==""){
    const sIndex=parseInt(savingsIndex);
    if(soortVal==="inkomst"){
      savings[sIndex].amount += bedragVal;
      saveSavingsToStorage(savings); updateSavingsUI();
      bedragVal=0;
    } else {
      const spaarBedrag=Math.min(bedragVal, savings[sIndex].amount);
      savings[sIndex].amount-=spaarBedrag;
      saveSavingsToStorage(savings); updateSavingsUI();
      bedragVal-=spaarBedrag;
    }
  }
  if(soortVal==="uitgave") bedragVal=-Math.abs(bedragVal);

  await addDoc(collection(db,"users",user.uid,"items"),{
    soort:soortVal, bron:bronVal, datum:datumVal, bedrag:bedragVal,
    categorie:categorie, recurring:recurringVal,
    savingsIndex: savingsIndex!==""?parseInt(savingsIndex):null,
    created:Date.now()
  });
  closeModal();
  loadData();
}

// --- Fixed Costs ---
function saveFixedCosts(){
  const costs={ lening:parseFloat(leningInput.value)||0,
                electriciteit:parseFloat(electriciteitInput.value)||0,
                mobiliteit:parseFloat(mobiliteitInput.value)||0,
                verzekering:parseFloat(verzekeringInput.value)||0 };
  localStorage.setItem("fixedCosts",JSON.stringify(costs));
  closeFixedCosts();
  updateFixedCostsUI();
}
function updateFixedCostsUI(){
  const costs=JSON.parse(localStorage.getItem("fixedCosts"))||{};
  fixedCostsList.innerHTML="";
  Object.entries(costs).forEach(([k,v])=>{fixedCostsList.innerHTML+=`<span>${k}: € ${v.toFixed(2)}</span>`;});
}
updateFixedCostsUI();

// --- Event Listeners ---
document.getElementById("addBtn").addEventListener("click",openModal);
document.getElementById("closeModalBtn").addEventListener("click",closeModal);
document.getElementById("saveEntryBtn").addEventListener("click",saveEntry);

document.getElementById("fixedCostsBtn").addEventListener("click",openFixedCosts);
document.getElementById("closeFixedBtn").addEventListener("click",closeFixedCosts);
document.getElementById("saveFixedBtn").addEventListener("click",saveFixedCosts);

document.getElementById("manageCategoriesBtn").addEventListener("click",()=>{document.getElementById("categoryModal").style.display="flex";updateCategoryListUI();});
document.getElementById("closeCategoryBtn").addEventListener("click",()=>{document.getElementById("categoryModal").style.display="none";});
document.getElementById("addCategoryBtn").addEventListener("click",()=>{
  const bron=document.getElementById("newBron").value.trim();
  const cat=document.getElementById("newCategorie").value.trim();
  addCategory(bron,cat);
  document.getElementById("newBron").value=""; document.getElementById("newCategorie").value="";
});

// --- Theme Toggle ---
const themeToggle=document.getElementById("themeToggle");
themeToggle.addEventListener("click",()=>{document.body.classList.toggle("dark");});

// --- Dummy LoadData + saldo update ---
async function loadData(){ 
  // Voorbeeld implementatie
  saldoDiv.innerText="€ 1234,56";
  saldoBar.style.width="80%";
  expectedEndDiv.innerText="🔮 Verwacht einde maand: € 1200,00";
}

// Init
updateBronAutocomplete();
