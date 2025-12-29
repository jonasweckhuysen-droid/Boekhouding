let db;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// =====================
// DATABASE
// =====================
const request = indexedDB.open("BoekhoudingDB", 2);

request.onupgradeneeded = e => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("boekhouding")) {
    db.createObjectStore("boekhouding", {
      keyPath: "id",
      autoIncrement: true
    });
  }
};

request.onsuccess = e => {
  db = e.target.result;
  applyRecurring();
  loadData();
};

request.onerror = () => console.error("IndexedDB fout");

// =====================
// OPSLAAN
// =====================
function saveEntry() {
  const soort = document.getElementById("soort").value;
  const datum = document.getElementById("datum").value;
  const bedragRaw = parseFloat(document.getElementById("bedrag").value);
  const beschrijving = document.getElementById("beschrijving").value.trim();
  const recurring = document.getElementById("recurring").checked;

  if (!datum || isNaN(bedragRaw) || !beschrijving) {
    alert("Alles invullen 😉");
    return;
  }

  const bedrag = soort === "uitgave"
    ? -Math.abs(bedragRaw)
    : Math.abs(bedragRaw);

  const entry = {
    soort,
    datum,
    bedrag,
    beschrijving,
    recurring
  };

  const tx = db.transaction("boekhouding", "readwrite");
  tx.objectStore("boekhouding").add(entry);

  tx.oncomplete = () => {
    closeModal();
    document.getElementById("bedrag").value = "";
    document.getElementById("beschrijving").value = "";
    loadData();
  };
}

// =====================
// LADEN + SALDO
// =====================
function loadData() {
  const tx = db.transaction("boekhouding", "readonly");
  const store = tx.objectStore("boekhouding");
  store.getAll().onsuccess = e => {
    const data = e.target.result;
    updateSaldo(data);
    buildCalendar(data);
  };
}

function updateSaldo(data) {
  let total = data.reduce((s, e) => s + e.bedrag, 0);
  const saldoEl = document.getElementById("saldo");

  saldoEl.textContent = "€ " + total.toFixed(2).replace(".", ",");
  saldoEl.className = total >= 0 ? "saldoPositief" : "saldoNegatief";

  saldoEl.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }],
    { duration: 300 }
  );
}

// =====================
// KALENDER
// =====================
function buildCalendar(data) {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1).getDay() || 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // lege vakken
  for (let i = 1; i < firstDay; i++) {
    cal.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const day = document.createElement("div");
    day.className = "calendarDay";

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const dayData = data.filter(e => e.datum === dateStr);
    const totaal = dayData.reduce((s, e) => s + e.bedrag, 0);

    day.innerHTML = `
      <div class="dayNumber">${d}</div>
      ${totaal !== 0 ? `<div class="dayAmount ${totaal >= 0 ? "pos" : "neg"}">
        € ${totaal.toFixed(0)}
      </div>` : ""}
    `;

    cal.appendChild(day);
  }
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  loadData();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  loadData();
}

// =====================
// TERUGKEREND
// =====================
function applyRecurring() {
  const tx = db.transaction("boekhouding", "readwrite");
  const store = tx.objectStore("boekhouding");

  store.getAll().onsuccess = e => {
    const entries = e.target.result;
    const now = new Date();

    entries.forEach(entry => {
      if (!entry.recurring) return;

      let d = new Date(entry.datum);
      while (
        d.getFullYear() < now.getFullYear() ||
        (d.getFullYear() === now.getFullYear() && d.getMonth() < now.getMonth())
      ) {
        d.setMonth(d.getMonth() + 1);
        store.add({
          ...entry,
          datum: d.toISOString().split("T")[0]
        });
      }
    });
  };
          }
