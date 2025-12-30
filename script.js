import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkBAw17gNU_EBhn8dKgyY5qv-ecfWaG2s",
  authDomain: "finance-jonas.firebaseapp.com",
  projectId: "finance-jonas"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let user, items = [];
let fixedCosts = JSON.parse(localStorage.getItem("fixedCosts")) || {};
let savings = JSON.parse(localStorage.getItem("savings")) || {};

onAuthStateChanged(auth, async u => {
  if(!u) await signInWithPopup(auth, provider);
  user = auth.currentUser;
  await loadItems();
});

async function loadItems(){
  const snap = await getDocs(collection(db,"users",user.uid,"items"));
  items = [];
  snap.forEach(d => items.push(d.data()));
  updateUI();
}

function updateUI(){
  const saldo = items.reduce((s,i)=>s+i.bedrag,0);
  const fixedTotal = Object.values(fixedCosts).reduce((a,b)=>a+Number(b||0),0);

  document.getElementById("saldo").innerText = `€ ${saldo.toFixed(2)}`;
  document.getElementById("expectedEnd").innerText =
    `🔮 Verwacht einde maand: € ${(saldo - fixedTotal).toFixed(2)}`;

  document.getElementById("fixedCostsList").innerHTML =
    Object.entries(fixedCosts).map(([k,v])=>`${k}: € ${v}`).join("<br>") || "—";

  document.getElementById("savingsList").innerHTML =
    Object.entries(savings).map(([k,v])=>`${k}: € ${v}`).join("<br>") || "—";
}

/* ===== EVENTS ===== */
const qs = id => document.getElementById(id);
qs("addBtn").onclick = ()=>qs("modal").style.display="flex";
qs("closeModalBtn").onclick = ()=>qs("modal").style.display="none";

qs("saveEntryBtn").onclick = async ()=>{
  const bedrag = Number(qs("bedrag").value);
  const soort = qs("soort").value;
  await addDoc(collection(db,"users",user.uid,"items"),{
    bedrag: soort==="uitgave"?-Math.abs(bedrag):bedrag,
    datum: qs("datum").value,
    categorie: qs("categorie").value
  });
  qs("modal").style.display="none";
  await loadItems();
};

qs("fixedCostsBtn").onclick = ()=>qs("fixedCostsModal").style.display="flex";
qs("closeFixedBtn").onclick = ()=>qs("fixedCostsModal").style.display="none";

qs("saveFixedBtn").onclick = ()=>{
  fixedCosts = {
    Wonen:Number(qs("fc-wonen").value||0),
    Auto:Number(qs("fc-auto").value||0),
    Verzekering:Number(qs("fc-verzekering").value||0)
  };
  localStorage.setItem("fixedCosts",JSON.stringify(fixedCosts));
  qs("fixedCostsModal").style.display="none";
  updateUI();
};

qs("savingsBtn").onclick = ()=>qs("savingsModal").style.display="flex";
qs("closeSavingsBtn").onclick = ()=>qs("savingsModal").style.display="none";

qs("saveSavingsBtn").onclick = ()=>{
  const name = qs("savingsName").value;
  const amount = Number(qs("savingsAmount").value);
  savings[name] = (savings[name]||0) + amount;
  localStorage.setItem("savings",JSON.stringify(savings));
  updateUI();
};
