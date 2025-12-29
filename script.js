import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔥 Firebase
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
const db = getFirestore(app);

// 🧠 DOM READY
document.addEventListener("DOMContentLoaded", () => {

  const addBtn = document.getElementById("addBtn");
  const modal = document.getElementById("modal");
  const saveBtn = document.getElementById("saveBtn");
  const closeBtn = document.getElementById("closeBtn");
  const soort = document.getElementById("soort");
  const bedrag = document.getElementById("bedrag");
  const saldoDiv = document.getElementById("saldo");
  const expectedEndDiv = document.getElementById("expectedEnd");

  let items = [];

  addBtn.addEventListener("click", () => {
    modal.style.display = "block";
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  saveBtn.addEventListener("click", async () => {
    const bedragVal = Number(bedrag.value);
    if (!bedragVal) return alert("Vul bedrag in");

    const item = {
      soort: soort.value,
      bedrag: soort.value === "uitgave" ? -bedragVal : bedragVal,
      datum: Date.now()
    };

    await addDoc(collection(db, "items"), item);
    items.push(item);

    bedrag.value = "";
    modal.style.display = "none";
    updateUI();
  });

  function updateUI() {
    const saldo = items.reduce((s, i) => s + i.bedrag, 0);
    saldoDiv.innerText = `€ ${saldo.toFixed(2)}`;
    expectedEndDiv.innerText = `€ ${(saldo - 100).toFixed(2)}`;
  }
});
