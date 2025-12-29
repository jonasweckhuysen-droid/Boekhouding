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

// DOM elements
const saldoDiv = document.getElementById("saldo");
const saldoBar = document.getElementById("saldoBar");
const expectedEndDiv = document.getElementById("expectedEnd");
const saveToSavings = document.getElementById("saveToSavings");

// --- Categorieën
function getCategoryMap(){ return JSON.parse(localStorage.getItem("categoryMap"))||{"Albert Heijn":"Boodschappen"}; }
function saveCategoryMap(map){ localStorage.setItem("categoryMap",JSON.stringify(map)); }
function addCategory(bron,cat){ if(!bron||!cat) return; const map=getCategoryMap(); map[bron]=cat; saveCategoryMap(map); updateCategoryListUI(); updateBronAutocomplete();}
function deleteCategory(bron){ const map=getCategoryMap(); delete map[bron]; saveCategoryMap(map); updateCategoryListUI(); updateBronAutocomplete();}
function updateCategoryListUI(){ const map=getCategoryMap(); const listDiv=document.getElementById("categoryList"); if(!listDiv) return; listDiv.innerHTML=""; Object.entries(map).forEach(([b,c])=>{const div=document.createElement("div"); div.style.display="flex"; div.style.justifyContent="space-between"; div.style.margin="4px 0"; div.innerHTML=`<span>${b} → ${c}</span> <button class="btn cancel" style="padding:2px 6px;font-size:12px;">❌</button>`; div.querySelector("button").addEventListener("click",()=>deleteCategory(b)); listDiv.appendChild(div);}); }
function updateBronAutocomplete(){ const map=getCategoryMap(); const datalist=document.getElementById("bronList"); if(!datalist) return; datalist.innerHTML=""; Object.keys(map).forEach(b=>{const opt=document.createElement("option"); opt.value=b; datalist.appendChild(opt);});}

// --- Auth
onAuthStateChanged(auth,user=>{
    if(!user){
        signInWithPopup(auth,provider).then(r=>{window.user=r.user; loadData();}).catch(e=>console.error(e));
    } else { window.user=user; loadData(); }
});

// --- Spaarpotten
function getSavings(){return JSON.parse(localStorage.getItem("savings"))||[];}
function saveSavingsToStorage(s){localStorage.setItem("savings",JSON.stringify(s));}
function updateSavingsUI(){ 
    if(!saveToSavings) return;
    const savings=getSavings(); 
    saveToSavings.innerHTML="";
    const defaultOpt=document.createElement("option"); defaultOpt.value=""; defaultOpt.innerText="Geen spaarpot"; saveToSavings.appendChild(defaultOpt);
    savings.forEach((s,i)=>{const opt=document.createElement("option"); opt.value=i; opt.innerText=`${s.name}: € ${s.amount.toFixed(2)}`; saveToSavings.appendChild(opt); });
}

// --- Save Entry
async function saveEntry(){
    const soortVal=soort.value, bronVal=bron.value, datumVal=datum.value;
    let bedragVal=parseFloat(bedrag.value);
    if(isNaN(bedragVal)){ alert("Vul een geldig bedrag in"); return; }
    const recurringVal=recurring.checked;
    const savingsIndex = saveToSavings?.value;
    const categorie = getCategoryMap()[bronVal] || "Overig";
    const savings = getSavings();

    // Spaarpotten logica
    if(savingsIndex!=="" && savings[savingsIndex]){
        const sIndex=parseInt(savingsIndex);
        if(soortVal==="inkomst"){ savings[sIndex].amount += bedragVal; saveSavingsToStorage(savings); updateSavingsUI(); bedragVal=0; }
        else{ 
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
        savingsIndex:savingsIndex!==""?parseInt(savingsIndex):null,
        created:Date.now()
    });

    closeModal();
    loadData();
}

// --- LoadData
async function loadData(){
    const q=query(collection(db,"users",user.uid,"items"));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(d=>d.data());

    const saldo = items.reduce((sum,i)=>sum+i.bedrag,0);
    saldoDiv.innerText = `€ ${saldo.toFixed(2)}`;
    saldoBar.style.width = `${Math.min(100, Math.abs(saldo)/1000*100)}%`;
    expectedEndDiv.innerText = `🔮 Verwacht einde maand: € ${saldo.toFixed(2)}`;

    renderCalendar(items);
}
