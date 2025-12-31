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

const qs = id => document.getElementById(id);

/* ===== AUTH ===== */
onAuthStateChanged(auth, async u => {
  if (!u) await signInWithPopup(auth, provider);
  user = auth.currentUser;

  await reloadAll();
});

/* ===== LOADERS ===== */
async function loadItems() {
  items = [];
  const snap = await getDocs(collection(db, "users", user.uid, "items"));
  snap.forEach(d => items.push(d.data()));
}

async function loadFixedCosts() {
  fixedCosts = {};
  const snap = await getDocs(collection(db, "users", user.uid, "fixedCosts"));
  snap.forEach(d => fixedCosts[d.id] = Number(d.data().amount));
}

async function loadSavings() {
  savings = {};
  const snap = await getDocs(collection(db, "users", user.uid, "savings"));
  snap.forEach(d => savings[d.id] = Number(d.data().amount));
}

async function reloadAll() {
  await loadItems();
  await loadFixedCosts();
  await loadSavings();
  updateUI();
}

/* ===== UI ===== */
function updateUI() {
  const saldo = items.reduce((s, i) => s + i.bedrag, 0);
  const fixedTotal = Object.values(fixedCosts).reduce((a, b) => a + b, 0);

  qs("saldo").innerText = `€ ${saldo.toFixed(2)}`;
  qs("expectedEnd").innerText =
    `🔮 Verwacht einde maand: € ${(saldo - fixedTotal).toFixed(2)}`;

  qs("fixedCostsList").innerHTML =
    Object.keys(fixedCosts).length
      ? Object.entries(fixedCosts).map(([k, v]) => `
        <div style="display:flex;justify-content:space-between">
          <span>${k}: € ${v.toFixed(2)}</span>
          <button onclick="removeFixedCost('${k}')">🗑</button>
        </div>`).join("")
      : "—";

  qs("savingsList").innerHTML =
    Object.keys(savings).length
      ? Object.entries(savings).map(([k, v]) => `
        <div style="display:flex;justify-content:space-between">
          <span>${k}: € ${v.toFixed(2)}</span>
          <button onclick="removeSavings('${k}')">🗑</button>
        </div>`).join("")
      : "—";

  refreshSavingsSelect();
}

/* ===== ENTRIES ===== */
qs("saveEntryBtn").onclick = async () => {
  const bedrag = Number(qs("bedrag").value);
  const soort = qs("soort").value;
  if (!bedrag) return;

  await addDoc(collection(db, "users", user.uid, "items"), {
    bedrag: soort === "uitgave" ? -Math.abs(bedrag) : Math.abs(bedrag),
    datum: qs("datum").value,
    categorie: qs("categorie").value
  });

  qs("modal").style.display = "none";
  await reloadAll();
};

/* ===== FIXED COSTS ===== */
qs("saveFixedBtn").onclick = async () => {
  const data = {
    Wonen: Number(qs("fc-wonen")?.value || 0),
    Auto: Number(qs("fc-auto")?.value || 0),
    Verzekering: Number(qs("fc-verzekering")?.value || 0),
    Internet: Number(qs("fc-internet")?.value || 0),
    Telefoon: Number(qs("fc-telefoon")?.value || 0),
    "Lening auto": Number(qs("fc-lening-auto")?.value || 0),
    "Lening Moto": Number(qs("fc-lening-moto")?.value || 0)
  };

  for (const [name, amount] of Object.entries(data)) {
    await setDoc(doc(db, "users", user.uid, "fixedCosts", name), { amount });
  }

  qs("fixedCostsModal").style.display = "none";
  await loadFixedCosts();
  updateUI();
};

/* ===== SPAARPOTTEN ===== */
function refreshSavingsSelect() {
  const sel = qs("savingsSelect");
  sel.innerHTML = "";
  Object.keys(savings).forEach(name => {
    const o = document.createElement("option");
    o.value = name;
    o.innerText = name;
    sel.appendChild(o);
  });
}

qs("saveSavingsBtn").onclick = async () => {
  const name = qs("savingsName").value.trim();
  const amount = Number(qs("savingsAmount").value);
  if (!name || isNaN(amount)) return;

  const total = (savings[name] || 0) + amount;
  await setDoc(doc(db, "users", user.uid, "savings", name), { amount: total });

  qs("savingsName").value = "";
  qs("savingsAmount").value = "";
  await loadSavings();
  updateUI();
};

qs("renameSavingsBtn").onclick = async () => {
  const oldName = qs("savingsSelect").value;
  const newName = qs("savingsName").value.trim();
  if (!oldName || !newName || oldName === newName) return;
  if (savings[newName]) return alert("Deze spaarpot bestaat al");

  const amount = savings[oldName];
  await setDoc(doc(db, "users", user.uid, "savings", newName), { amount });
  await deleteDoc(doc(db, "users", user.uid, "savings", oldName));

  await loadSavings();
  updateUI();
};

/* ===== DELETE ===== */
window.removeSavings = async name => {
  if (!confirm(`Spaarpot "${name}" verwijderen?`)) return;
  await deleteDoc(doc(db, "users", user.uid, "savings", name));
  await loadSavings();
  updateUI();
};

window.removeFixedCost = async name => {
  if (!confirm(`Vaste kost "${name}" verwijderen?`)) return;
  await deleteDoc(doc(db, "users", user.uid, "fixedCosts", name));
  await loadFixedCosts();
  updateUI();
};
