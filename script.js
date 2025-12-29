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
}

// =====================
// NAVIGATIE
// =====================
function goToOverzicht() {
  window.location.href = "overzicht.html";
}

function goToIndex() {
  window.location.href = "index.html";
}

// =====================
// OPSLAAN
// =====================
function saveEntry() {
  if (!db) {
    alert("Database wordt nog geladen...");
    return;
  }

  const soort = document.getElementById("soort").value;
  const bron = document.getElementById("bron").value.trim();
  const datum = document.getElementById("datum").value;
  const bedragRaw = parseFloat(document.getElementById("bedrag").value);
  const recurring = document.getElementById("recurring").checked;

  if (!datum || isNaN(bedragRaw) || bron === "") {
    alert("Gelieve alle velden correct in te vullen");
    return;
  }

  const bedrag =
    soort === "uitgave"
      ? -Math.abs(bedragRaw)
      : Math.abs(bedragRaw);

  const entry = {
    soort,
    bron,
    datum,
    bedrag,
    recurring
  };

  const transaction = db.transaction(["boekhouding"], "readwrite");
  const store = transaction.objectStore("boekhouding");
  store.add(entry);

  transaction.oncomplete = function () {
    closeModal();
    clearForm();
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
// SALDO
// =====================
function loadData() {
  if (!db) return;

  const transaction = db.transaction(["boekhouding"], "readonly");
  const store = transaction.objectStore("boekhouding");
  const request = store.getAll();

  request.onsuccess = function () {
    updateSaldo(request.result);
  };
}

function updateSaldo(data) {
  let total = 0;

  data.forEach(entry => {
    total += entry.bedrag;
  });

  document.getElementById("saldo").innerText =
    "€ " + total.toFixed(2).replace(".", ",");
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
          (
            lastDate.getFullYear() === now.getFullYear() &&
            lastDate.getMonth() < now.getMonth()
          )
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
