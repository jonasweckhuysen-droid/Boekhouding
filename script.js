let db;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// =====================
// DATABASE
// =====================
const request = indexedDB.open("BoekhoudingDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;

  if (!db.objectStoreNames.contains("boekhouding")) {
    db.createObjectStore("boekhouding", { keyPath: "id", autoIncrement: true });
  }
};

request.onsuccess = function (event) {
  db = event.target.result;
  applyRecurring();
  loadData();
  renderCalendar(currentYear, currentMonth);
};

request.onerror = function () {
  console.error("IndexedDB kon niet geopend worden");
};

// =====================
// MODAL
// =====================
function openModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove("modalHidden");
  modal.classList.add("modalShow");
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove("modalShow");
  modal.classList.add("modalHidden");
}

// =====================
// OPSLAAN
// =====================
function saveEntry() {
  if (!db) return;

  const soort = document.getElementById("soort").value;
  const datum = document.getElementById("datum").value;
  const bedragRaw = parseFloat(document.getElementById("bedrag").value);
  const beschrijving = document.getElementById("beschrijving").value.trim();
  const recurring = document.getElementById("recurring").checked;

  if (!datum || isNaN(bedragRaw) || !beschrijving) {
    alert("Vul alles correct in 🙂");
    return;
  }

  const bedrag =
    soort === "uitgave"
      ? -Math.abs(bedragRaw)
      : Math.abs(bedragRaw);

  const entry = {
    soort,
    datum,
    bedrag,
    beschrijving,
    recurring
  };

  const transaction = db.transaction(["boekhouding"], "readwrite");
  const store = transaction.objectStore("boekhouding");
  store.add(entry);

  transaction.oncomplete = () => {
    closeModal();
    animatePulse("saldo");
    loadData();
    renderCalendar(currentYear, currentMonth);
  };
}

// =====================
// DATA LADEN
// =====================
function loadData() {
  if (!db) return;

  const transaction = db.transaction(["boekhouding"], "readonly");
  const store = transaction.objectStore("boekhouding");
  const request = store.getAll();

  request.onsuccess = () => {
    const data = request.result;
    updateSaldo(data);
  };
}

// =====================
// SALDO
// =====================
function updateSaldo(data) {
  let total = 0;
  data.forEach(e => total += e.bedrag);

  const saldoEl = document.getElementById("saldo");
  saldoEl.innerText = "€ " + total.toFixed(2).replace(".", ",");

  saldoEl.classList.toggle("saldoPositief", total >= 0);
  saldoEl.classList.toggle("saldoNegatief", total < 0);
}

// =====================
// KALENDER
// =====================
function renderCalendar(year, month) {
  if (!db) return;

  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    calendar.appendChild(document.createElement("div"));
  }

  const transaction = db.transaction(["boekhouding"], "readonly");
  const store = transaction.objectStore("boekhouding");
  const request = store.getAll();

  request.onsuccess = () => {
    const entries = request.result;

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      cell.className = "calendarDay";

      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEntries = entries.filter(e => e.datum === dateStr);

      let dayTotal = 0;
      dayEntries.forEach(e => dayTotal += e.bedrag);

      cell.innerHTML = `
        <span class="dayNumber">${day}</span>
        ${dayTotal !== 0 ? `<span class="dayAmount ${dayTotal < 0 ? "neg" : "pos"}">
          € ${dayTotal.toFixed(0)}
        </span>` : ""}
      `;

      calendar.appendChild(cell);
    }
  };
}

// =====================
// MAAND NAVIGATIE
// =====================
function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentYear, currentMonth);
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentYear, currentMonth);
}

// =====================
// ANIMATIES
// =====================
function animatePulse(id) {
  const el = document.getElementById(id);
  el.classList.add("pulse");
  setTimeout(() => el.classList.remove("pulse"), 400);
}

// =====================
// TERUGKEREND
// =====================
function applyRecurring() {
  if (!db) return;

  const transaction = db.transaction(["boekhouding"], "readwrite");
  const store = transaction.objectStore("boekhouding");
  const request = store.getAll();

  request.onsuccess = () => {
    const entries = request.result;
    const now = new Date();

    entries.forEach(entry => {
      if (!entry.recurring) return;

      let last = new Date(entry.datum);

      while (
        last.getFullYear() < now.getFullYear() ||
        (last.getFullYear() === now.getFullYear() &&
          last.getMonth() < now.getMonth())
      ) {
        last.setMonth(last.getMonth() + 1);

        store.add({
          soort: entry.soort,
          datum: last.toISOString().split("T")[0],
          bedrag: entry.bedrag,
          beschrijving: entry.beschrijving,
          recurring: true
        });
      }
    });
  };
}
