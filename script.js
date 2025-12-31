import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs,
  doc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, onAuthStateChanged
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

/* ===== STATE ===== */
let user;
let items = [];
let fixedCosts = {};
let savings = {};

const qs = id => document.getElementById(id);

/* ===== AUTH ===== */
onAuthStateChanged(auth, async u => {
  if (!u) await signInWithPopup(auth, provider);
  user = auth.currentUser;
  await reloadAll();
});

/* ===== LOADERS ===== */
async function reloadAll(){
  items = [];
  fixedCosts = {};
  savings = {};

  const itemsSnap = await getDocs(collection(db,"users",user.uid,"items"));
  itemsSnap.forEach(d=>items.push(d.data()));

  const fcSnap = await getDocs(collection(db,"users",user.uid,"fixedCosts"));
  fcSnap.forEach(d=>fixedCosts[d.id]=Number(d.data().amount));

  const savSnap = await getDocs(collection(db,"users",user.uid,"savings"));
  savSnap.forEach(d=>savings[d.id]=Number(d.data().amount));

  updateUI();
}

/* ===== UI ===== */
function updateUI(){
  const saldo = items.reduce((s,i)=>s+i.bedrag,0);
  const fixed = Object.values(fixedCosts).reduce((a,b)=>a+b,0);

  qs("saldo").innerText = `€ ${saldo.toFixed(2)}`;
  qs("expectedEnd").innerText = `🔮 Verwacht einde maand: € ${(saldo-fixed).toFixed(2)}`;

  qs("fixedCostsList").innerHTML = Object.entries(fixedCosts)
    .map(([k,v])=>`
      <div class="fixed-item" data-name="${k}">
        ${k}: € ${v.toFixed(2)}
        <button class="delete-fixed">🗑</button>
      </div>`).join("") || "—";

  qs("savingsList").innerHTML = Object.entries(savings)
    .map(([k,v])=>`
      <div class="savings-item" data-name="${k}">
        ${k}: € ${v.toFixed(2)}
        <button class="delete-savings">🗑</button>
      </div>`).join("") || "—";

  refreshSavingsSelect();
}

/* ===== EVENTS ===== */
document.addEventListener("DOMContentLoaded", () => {

  qs("addBtn").onclick = ()=>qs("modal").style.display="flex";
  qs("closeModalBtn").onclick = ()=>qs("modal").style.display="none";
  qs("fixedCostsBtn").onclick = ()=>qs("fixedCostsModal").style.display="flex";
  qs("closeFixedBtn").onclick = ()=>qs("fixedCostsModal").style.display="none";
  qs("savingsBtn").onclick = ()=>qs("savingsModal").style.display="flex";
  qs("closeSavingsBtn").onclick = ()=>qs("savingsModal").style.display="none";

});

/* ===== ENTRIES ===== */
qs("saveEntryBtn").onclick = async ()=>{
  const bedrag = Number(qs("bedrag").value);
  if(!bedrag) return;
  await addDoc(collection(db,"users",user.uid,"items"),{
    bedrag: qs("soort").value==="uitgave"?-Math.abs(bedrag):Math.abs(bedrag),
    datum: qs("datum").value,
    categorie: qs("categorie").value
  });
  qs("modal").style.display="none";
  reloadAll();
};

/* ===== FIXED COSTS ===== */
qs("saveFixedBtn").onclick = async ()=>{
  const map = {
    Wonen:"fc-wonen", Auto:"fc-auto", Verzekering:"fc-verzekering",
    Internet:"fc-internet", Telefoon:"fc-telefoon",
    "Lening auto":"fc-lening-auto", "Lening moto":"fc-lening-moto"
  };
  for(const k in map){
    const v = Number(qs(map[k]).value||0);
    await setDoc(doc(db,"users",user.uid,"fixedCosts",k),{amount:v});
  }
  qs("fixedCostsModal").style.display="none";
  reloadAll();
};

/* ===== SPAARPOTTEN ===== */
function refreshSavingsSelect(){
  qs("savingsSelect").innerHTML = Object.keys(savings)
    .map(k=>`<option>${k}</option>`).join("");
}

qs("saveSavingsBtn").onclick = async ()=>{
  const n = qs("savingsName").value.trim();
  const a = Number(qs("savingsAmount").value);
  if(!n||isNaN(a)) return;
  await setDoc(doc(db,"users",user.uid,"savings",n),{amount:(savings[n]||0)+a});
  reloadAll();
};

qs("renameSavingsBtn").onclick = async ()=>{
  const oldN = qs("savingsSelect").value;
  const newN = qs("savingsName").value.trim();
  if(!oldN||!newN||oldN===newN) return;
  await setDoc(doc(db,"users",user.uid,"savings",newN),{amount:savings[oldN]});
  await deleteDoc(doc(db,"users",user.uid,"savings",oldN));
  reloadAll();
};

/* ===== DELETE ===== */
qs("fixedCostsList").onclick = async e=>{
  if(!e.target.classList.contains("delete-fixed"))return;
  const n = e.target.parentElement.dataset.name;
  await deleteDoc(doc(db,"users",user.uid,"fixedCosts",n));
  reloadAll();
};

qs("savingsList").onclick = async e=>{
  if(!e.target.classList.contains("delete-savings"))return;
  const n = e.target.parentElement.dataset.name;
  await deleteDoc(doc(db,"users",user.uid,"savings",n));
  reloadAll();
};
