let db;

// =====================
// DATABASE
// =====================
const request = indexedDB.open("BoekhoudingDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;

  if (!db.objectStoreNames.contains("boekhouding")) {
    db.createObjectStore("boekhouding", {
      keyPath: "id",
      autoIncrement: true
    });
  }
};

request.onsuccess = function (event) {
  db = event.target.result;
  applyRecurring();
  loadData();
};

request.onerror = function () {
  console.error("❌ IndexedDB kon niet geopend worden");
};

// =====================
// MODAL
// =====================
function openModal() {
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  clearForm();
}

// =====================
// OPSLAAN
// =====================
function saveEntry() {
  if (!db) { alert("Database wordt nog geladen..."); return; }

  const soort = document.getElementById("soort").value;
  const bron = document.getElementById("bron").value.trim();
  const datum = document.getElementById("datum").value;
  const bedragRaw = parseFloat(document.getElementById("bedrag").value);
  const recurring = document.getElementById("recurring").checked;

  if (!datum || isNaN(bedragRaw) || bron === "") {
    alert("Gelieve alle velden correct in te vullen");
    return;
  }

  const bedrag = soort === "uitgave" ? -Math.abs(bedragRaw) : Math.abs(bedragRaw);

  const entry = { soort, bron, datum, bedrag, recurring };

  const transaction = db.transaction(["boekhouding"], "readwrite");
  const store = transaction.objectStore("boekhouding");
  store.add(entry);

  transaction.oncomplete = function () {
    closeModal();
    loadData();
  };
}

// =====================
// FORM RESET
// =====================
function clearForm() {
  document.getElementById("bron").value = "";
  document.getElementById("datum").value = "";
  document.getElementById("bedrag").value = "";
  document.getElementById("recurring").checked = false;
}

// =====================
// SALDO & ENTRIES TONEN
// =====================
function loadData() {
  if (!db) return;

  const transaction = db.transaction(["boekhouding"], "readonly");
  const store = transaction.objectStore("boekhouding");
  const request = store.getAll();

  request.onsuccess = function () {
    const data = request.result;
    updateSaldo(data);
    showEntries(data);
  };
}

function updateSaldo(data) {
  let total = 0;
  data.forEach(e => total += e.bedrag);
  document.getElementById("saldoBox").innerText = "€ " + total.toFixed(2).replace(".", ",");
}

function showEntries(entries) {
  const container = document.getElementById("entriesList");
  container.innerHTML = "";

  entries.forEach(e => {
    const div = document.createElement("div");
    div.className = `entry ${e.soort}`;
    div.innerHTML = `
      <span>${e.datum} • ${e.bron} • € ${Math.abs(e.bedrag).toFixed(2).replace(".", ",")}</span>
      <button onclick="deleteEntry(${e.id})"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
  });
}

// =====================
// DELETE ENTRY
// =====================
function deleteEntry(id) {
  const transaction = db.transaction(["boekhouding"], "readwrite");
  const store = transaction.objectStore("boekhouding");
  store.delete(id);
  transaction.oncomplete = loadData;
}

// =====================
// FILTER / SEARCH
// =====================
function filterEntries() {
  const query = document.getElementById("search").value.toLowerCase();
  const transaction = db.transaction(["boekhouding"], "readonly");
  const store = transaction.objectStore("boekhouding");
  const request = store.getAll();

  request.onsuccess = function () {
    const filtered = request.result.filter(e => e.bron.toLowerCase().includes(query));
    showEntries(filtered);
    updateSaldo(filtered);
  };
}

// =====================
// TERUGKERENDE KOSTEN
// =====================
function applyRecurring() {
  if (!db) return;

  const transaction = db.transaction(["boekhouding"], "readwrite");
  const store = transaction.objectStore("boekhouding");
  const request = store.getAll();

  request.onsuccess = function () {
    const entries = request.result;
    const now = new Date();
    let newEntries = [];

    entries.forEach(entry => {
      if (entry.recurring) {
        let lastDate = new Date(entry.datum);

        while (
          lastDate.getFullYear() < now.getFullYear() ||
          (lastDate.getFullYear() === now.getFullYear() && lastDate.getMonth() < now.getMonth())
        ) {
          lastDate.setMonth(lastDate.getMonth() + 1);

          newEntries.push({
            soort: entry.soort,
            bron: entry.bron,
            datum: lastDate.toISOString().split("T")[0],
            bedrag: entry.bedrag,
            recurring: true
          });
        }
      }
    });

    newEntries.forEach(e => store.add(e));
  };
}
