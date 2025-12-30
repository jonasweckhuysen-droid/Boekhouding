import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

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

let fixedCosts = JSON.parse(localStorage.getItem("fixedCosts")) || {};
let savings = JSON.parse(localStorage.getItem("savings")) || {};

/* ===== AUTH ===== */
onAuthStateChanged(auth, async u => {
  if (!u) await signInWithPopup(auth, provider);
  user = auth.currentUser;
  await loadItems();
});

/* ===== LOAD DATA ===== */
async function loadItems(){
  const snap = await getDocs(collection(db,"users",user.uid,"items"));
  items = [];
  snap.forEach(d => items.push(d.data()));
  updateUI();
}

/* ===== UI ===== */
function updateUI(){
  const saldo = items.reduce((s,i)=>s + i.bedrag, 0);
  const fixedTotal = Object.values(fixedCosts).reduce((a,b)=>a + Number(b||0), 0);

  qs("saldo").innerText = `€ ${saldo.toFixed(2)}`;
  qs("expectedEnd").innerText =
    `🔮 Verwacht einde maand: € ${(saldo - fixedTotal).toFixed(2)}`;

  qs("fixedCostsList").innerHTML =
    Object.keys(fixedCosts).length
      ? Object.entries(fixedCosts).map(([k,v])=>`${k}: € ${v}`).join("<br>")
      : "—";

  qs("savingsList").innerHTML =
    Object.keys(savings).length
      ? Object.entries(savings).map(([k,v])=>`${k}: € ${v.toFixed(2)}`).join("<br>")
      : "—";

  refreshSavingsSelect();
}

/* ===== HELPERS ===== */
const qs = id => document.getElementById(id);

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
};

/* ===== FIXED COSTS ===== */
qs("saveFixedBtn").onclick = ()=>{
  fixedCosts = {
    Wonen: Number(qs("fc-wonen").value||0),
    Auto: Number(qs("fc-auto").value||0),
    Verzekering: Number(qs("fc-verzekering").value||0)
  };

  localStorage.setItem("fixedCosts", JSON.stringify(fixedCosts));
  qs("fixedCostsModal").style.display="none";
  updateUI();
};

/* ===== SPAARPOTTEN ===== */

/* dropdown vullen */
function refreshSavingsSelect(){
  const sel = qs("savingsSelect");
  if(!sel) return;

  sel.innerHTML = "";
  Object.keys(savings).forEach(name=>{
    const o = document.createElement("option");
    o.value = name;
    o.innerText = name;
    sel.appendChild(o);
  });

  if(sel.value) qs("savingsName").value = sel.value;
}

/* bedrag toevoegen / aftrekken */
qs("saveSavingsBtn").onclick = ()=>{
  const name = qs("savingsSelect").value || qs("savingsName").value.trim();
  const amount = Number(qs("savingsAmount").value);

  if(!name || isNaN(amount)) return;

  savings[name] = (savings[name] || 0) + amount;

  localStorage.setItem("savings", JSON.stringify(savings));
  qs("savingsAmount").value = "";
  updateUI();
};

/* naam wijzigen */
qs("renameSavingsBtn").onclick = ()=>{
  const oldName = qs("savingsSelect").value;
  const newName = qs("savingsName").value.trim();

  if(!oldName || !newName || oldName === newName) return;
  if(savings[newName]) return alert("Deze spaarpot bestaat al");

  savings[newName] = savings[oldName];
  delete savings[oldName];

  localStorage.setItem("savings", JSON.stringify(savings));
  updateUI();
};

/* auto-invullen bij selectie */
qs("savingsSelect").onchange = ()=>{
  qs("savingsName").value = qs("savingsSelect").value;
};
