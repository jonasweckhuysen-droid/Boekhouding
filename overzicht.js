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
  loadOverzicht();
};

request.onerror = function () {
  console.error("DB error");
};

function loadOverzicht() {
  const tbody = document.querySelector("#overzichtTabel tbody");
  tbody.innerHTML = "";

  if (!db) return;

  const transaction = db.transaction(["boekhouding"], "readonly");
  const store = transaction.objectStore("boekhouding");
  const request = store.getAll();

  request.onsuccess = function () {
    const data = request.result;

    data.forEach(entry => {

      let icon = "";
      switch (entry.type.toLowerCase()) {
        case "loon": icon = '<i class="fas fa-money-bill"></i>'; break;
        case "premie": icon = '<i class="fas fa-gift"></i>'; break;
        case "winkel": icon = '<i class="fas fa-cart-shopping"></i>'; break;
        case "dokter": icon = '<i class="fas fa-user-doctor"></i>'; break;
        case "verzekering": icon = '<i class="fas fa-file-invoice"></i>'; break;
        case "sparen": icon = '<i class="fas fa-piggy-bank"></i>'; break;
        case "abonnementen": icon = '<i class="fas fa-repeat"></i>'; break;
        default: icon = '<i class="fas fa-receipt"></i>'; break;
      }

      const cssClass = entry.bedrag >= 0 ? "inkomst" : "uitgave";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.datum}</td>
        <td>${icon} ${entry.type}</td>
        <td class="${cssClass}">€ ${entry.bedrag.toFixed(2)}</td>
      `;

      tbody.appendChild(row);
    });
  };
}
