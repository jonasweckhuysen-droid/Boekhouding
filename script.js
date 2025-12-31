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

  await loadItems();
  await loadFixedCosts();
  await loadSavings();
  updateUI();
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
  snap.forEach(d => fixedCosts[d.id] = d.data().amount);
}

async function loadSavings() {
  savings = {};
  const snap = await getDocs(collection(db, "users", user.uid, "savings"));
  snap.forEach(d => savings[d.id] = d.data().amount);
}

/* ===== UI ===== */
function updateUI() {
  const saldo = items.reduce((s, i) => s + i.bedrag, 0);
  const fixedTotal = Object.values(fixedCosts).reduce((a, b) => a + Number(b), 0);

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

/* ===== FIXED COSTS SAVE ===== */
qs("saveFixedBtn").onclick = async () => {
  const inputs = [
    ["Wonen", "fc-wonen"],
    ["Verzekering", "fc-verzekering"],
    ["Internet", "fc-internet"],
    ["Telefoon", "fc-telefoon"],
    ["Lening auto", "fc-lening-auto"],
    ["Lening Moto", "fc-lening-moto"]
  ];

  for (const [name, id] of inputs) {
    const val = Number(qs(id)?.value);
    if (!isNaN(val) && val > 0) {
      await setDoc(doc(db, "users", user.uid, "fixedCosts", name), { amount: val });
    }
  }

  await loadFixedCosts();
  qs("fixedCostsModal").style.display = "none";
  updateUI();
};

/* ===== SPAARPOTTEN ===== */
function refreshSavingsSelect() {
  const sel = qs("savingsSelect");
  sel.innerHTML = "";
  Object.keys(savings).forEach(k => {
    const o = document.createElement("option");
    o.value = k;
    o.innerText = k;
    sel.appendChild(o);
  });
}

qs("saveSavingsBtn").onclick = async () => {
  const name = qs("savingsName").value.trim();
  const amount = Number(qs("savingsAmount").value);

  if (!name || isNaN(amount)) return;

  const newAmount = (savings[name] || 0) + amount;
  await setDoc(doc(db, "users", user.uid, "savings", name), { amount: newAmount });

  await loadSavings();
  qs("savingsName").value = "";
  qs("savingsAmount").value = "";
  updateUI();
};

qs("renameSavingsBtn").onclick = async () => {
  const oldName = qs("savingsSelect").value;
  const newName = qs("savingsName").value.trim();
  if (!oldName || !newName || oldName === newName) return;
  if (savings[newName]) return alert("Bestaat al");

  const amount = savings[oldName];
  await setDoc(doc(db, "users", user.uid, "savings", newName), { amount });
  await deleteDoc(doc(db, "users", user.uid, "savings", oldName));

  await loadSavings();
  updateUI();
};

qs("savingsSelect").onchange = () => {
  qs("savingsName").value = qs("savingsSelect").value;
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
