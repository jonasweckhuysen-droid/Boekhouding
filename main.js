let db;

const request = indexedDB.open("BoekhoudingDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains("boekhouding")) {
    db.createObjectStore("boekhouding", { keyPath: "id", autoIncrement: true });
  }
};

request.onsuccess = function (event) {
  db = event.target.result;
  loadBookings();
};

// Data ophalen
function loadBookings() {
  if (!db) return;

  const transaction = db.transaction(["boekhouding"], "readonly");
  const store = transaction.objectStore("boekhouding");

  const req = store.getAll();
  req.onsuccess = function () {
    render(req.result);
  };
}

// Renderen
function render(list) {
  const root = document.getElementById("root");
  let html = "";

  let inkomsten = 0;
  let uitgaven = 0;

  list.forEach(b => {
    if (b.bedrag > 0) inkomsten += b.bedrag;
    if (b.bedrag < 0) uitgaven += Math.abs(b.bedrag);

    html += `
      <div class="booking-card">
        <span>${b.datum}</span>
        <span>${b.type}</span>
        <span>€ ${b.bedrag.toFixed(2)}</span>
      </div>
    `;
  });

  const saldo = inkomsten - uitgaven;

  html += `
    <div class="totals">
      Inkomsten: € ${inkomsten.toFixed(2)} <br>
      Uitgaven: € ${uitgaven.toFixed(2)} <br>
      Saldo: € ${saldo.toFixed(2)}
    </div>
  `;

  root.innerHTML = html;
}
