import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

/* ===== FIREBASE ===== */
const firebaseConfig = {
  apiKey: "AIzaSyAkBAw17gNU_EBhn8dKgyY5qv-ecfWaG2s",
  authDomain: "finance-jonas.firebaseapp.com",
  projectId: "finance-jonas"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* ===== DATA ===== */
let user;
let items = [];
let fixedCosts = {};
let savings = {};

/* ===== HELPERS ===== */
const qs = id => document.getElementById(id);

/* ===== CHARTS ===== */
let savingsChart, expenseChart;
function updateCharts() {
  const savingsCtx = document.getElementById("savingsChart")?.getContext("2d");
  const expenseCtx = document.getElementById("expenseChart")?.getContext("2d");

  const savingsLabels = Object.keys(savings);
  const savingsValues = Object.values(savings);

  const expenseData = {};
  items.forEach(i => {
    if(i.bedrag < 0) {
      expenseData[i.categorie] = (expenseData[i.categorie] || 0) + Math.abs(i.bedrag);
    }
  });

  const expenseLabels = Object.keys(expenseData);
  const expenseValues = Object.values(expenseData);

  if(savingsChart) savingsChart.destroy();
  if(expenseChart) expenseChart.destroy();

  if(savingsCtx) {
    savingsChart = new Chart(savingsCtx, {
      type: 'doughnut',
      data: { labels: savingsLabels, datasets: [{ data: savingsValues, backgroundColor: savingsLabels.map((_,i)=>`hsl(${i*60},70%,60%)`) }] }
    });
  }

  if(expenseCtx) {
    expenseChart = new Chart(expenseCtx, {
      type: 'bar',
      data: { labels: expenseLabels, datasets: [{ label:'Uitgaven', data: expenseValues, backgroundColor:'#f97316' }] },
      options: { responsive:true, plugins:{legend:{display:false}} }
    });
  }
}

/* ===== AUTH ===== */
onAuthStateChanged(auth, async u => {
  if (!u) await signInWithPopup(auth, provider);
  user = auth.currentUser;

  await loadItems();
  await loadFixedCosts();
  await loadSavings();
  updateUI();
});

/* ===== LOAD DATA ===== */
async function loadItems(){
  const snap = await getDocs(collection(db,"users",user.uid,"items"));
  items = [];
  snap.forEach(d => items.push(d.data()));
}

async function loadFixedCosts(){
  const snap = await getDocs(collection(db,"users",user.uid,"fixedCosts"));
  fixedCosts = {};
  snap.forEach(d => fixedCosts[d.id] = d.data().amount);
}

async function loadSavings(){
  const snap = await getDocs(collection(db,"users",user.uid,"savings"));
  savings = {};
  snap.forEach(d => savings[d.id] = d.data().amount);
}

/* ===== UI ===== */
function updateUI(){
  const saldo = items.reduce((s,i)=>s + i.bedrag, 0);
  const fixedTotal = Object.values(fixedCosts).reduce((a,b)=>a + Number(b||0), 0);

  qs("saldo").innerText = `€ ${saldo.toFixed(2)}`;
  qs("expectedEnd").innerText = `🔮 Verwacht einde maand: € ${(saldo - fixedTotal).toFixed(2)}`;

  // Vaste kosten met verwijderknop
  qs("fixedCostsList").innerHTML = Object.keys(fixedCosts).length
    ? Object.entries(fixedCosts).map(([k,v])=>
        `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span>${k}: € ${v.toFixed(2)}</span>
          <button style="background:#ef4444;color:white;border:none;border-radius:6px;padding:2px 6px;cursor:pointer" onclick="removeFixedCost('${k}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>`
      ).join("")
    : "—";

  // Spaarpotten met verwijderknop
  qs("savingsList").innerHTML = Object.keys(savings).length
    ? Object.entries(savings).map(([k,v])=>
        `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span>${k}: € ${v.toFixed(2)}</span>
          <button style="background:#ef4444;color:white;border:none;border-radius:6px;padding:2px 6px;cursor:pointer" onclick="removeSavings('${k}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>`
      ).join("")
    : "—";

  refreshSavingsSelect();
  updateCharts();
}

/* ===== MODALS ===== */
qs("addBtn").onclick = ()=>qs("modal").style.display="flex";
qs("closeModalBtn").onclick = ()=>qs("modal").style.display="none";

qs("fixedCostsBtn").onclick = ()=>qs("fixedCostsModal").style.display="flex";
qs("closeFixedBtn").onclick = ()=>qs("fixedCostsModal").style.display="none";

qs("savingsBtn").onclick = ()=>{
  refreshSavingsSelect();
  qs("savingsModal").style.display="flex";
};
qs("closeSavingsBtn").onclick = ()=>qs("savingsModal").style.display="none";

/* ===== ENTRIES ===== */
qs("saveEntryBtn").onclick = async ()=>{
  const bedrag = Number(qs("bedrag").value);
  const soort = qs("soort").value;

  if(!bedrag) return;

  await addDoc(collection(db,"users",user.uid,"items"),{
    bedrag: soort==="uitgave" ? -Math.abs(bedrag) : Math.abs(bedrag),
    datum: qs("datum").value,
    categorie: qs("categorie").value
  });

  qs("modal").style.display="none";
  await loadItems();
  updateUI();
};

/* ===== FIXED COSTS ===== */
qs("saveFixedBtn").onclick = async ()=>{
  const data = {
    Wonen: Number(qs("fc-wonen").value||0),
    Auto: Number(qs("fc-auto").value||0),
    Verzekering: Number(qs("fc-verzekering").value||0),
    Internet: Number(qs("fc-internet")?.value||0),
    Telefoon: Number(qs("fc-telefoon")?.value||0),
    "Lening auto": Number(qs("fc-lening-auto")?.value||0),
    "Lening Moto": Number(qs("fc-lening-moto")?.value||0)
  };

  for(const [name, amount] of Object.entries(data)){
    await setDoc(doc(db,"users",user.uid,"fixedCosts",name), { amount });
  }

  fixedCosts = data;
  qs("fixedCostsModal").style.display="none";
  updateUI();
};

/* ===== SPAARPOTTEN ===== */
function refreshSavingsSelect(){
  const sel = qs("savingsSelect");
  sel.innerHTML = "";
  Object.keys(savings).forEach(name=>{
    const o = document.createElement("option");
    o.value = name;
    o.innerText = name;
    sel.appendChild(o);
  });
}

/* bedrag OPTELLEN of nieuwe spaarpot maken */
qs("saveSavingsBtn").onclick = async ()=>{
  const name = qs("savingsName").value.trim();
  const amount = Number(qs("savingsAmount").value);

  if(!name || isNaN(amount)) return;

  if(!savings[name]) savings[name] = 0;
  savings[name] += amount;

  await setDoc(doc(db,"users",user.uid,"savings",name), { amount: savings[name] });

  qs("savingsAmount").value = "";
  qs("savingsName").value = "";
  refreshSavingsSelect();
  updateUI();
};

/* naam wijzigen */
qs("renameSavingsBtn").onclick = async ()=>{
  const oldName = qs("savingsSelect").value;
  const newName = qs("savingsName").value.trim();

  if(!oldName || !newName || oldName === newName) return;
  if(savings[newName]) return alert("Deze spaarpot bestaat al");

  await setDoc(doc(db,"users",user.uid,"savings",newName), { amount: savings[oldName] });
  await deleteDoc(doc(db,"users",user.uid,"savings",oldName));

  delete savings[oldName];
  savings[newName] = savings[newName];

  refreshSavingsSelect();
  updateUI();
};

/* auto-invullen */
qs("savingsSelect").onchange = ()=>{
  qs("savingsName").value = qs("savingsSelect").value;
};

/* ===== SPAARPOT VERWIJDEREN ===== */
window.removeSavings = async (name) => {
  if(!confirm(`Weet je zeker dat je spaarpot "${name}" wilt verwijderen?`)) return;

  await deleteDoc(doc(db,"users",user.uid,"savings",name));
  delete savings[name];
  updateUI();
};

/* ===== VASTE KOSTEN VERWIJDEREN ===== */
window.removeFixedCost = async (name) => {
  if(!confirm(`Weet je zeker dat je vaste kost "${name}" wilt verwijderen?`)) return;

  await deleteDoc(doc(db,"users",user.uid,"fixedCosts",name));
  delete fixedCosts[name];
  updateUI();
};
