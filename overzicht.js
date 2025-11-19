function loadOverzicht() {
  let data = JSON.parse(localStorage.getItem("boekhouding")) || [];
  const tbody = document.querySelector("#overzichtTabel tbody");
  tbody.innerHTML = "";

  data.forEach(entry => {
    const row = document.createElement("tr");

    // Kies icoontje per type
    let icon = "";
    switch(entry.type.toLowerCase()) {
      case "loon": icon = '<i class="fas fa-money-bill-wave"></i>'; break;
      case "bonus": icon = '<i class="fas fa-gift"></i>'; break;
      case "winkel": icon = '<i class="fas fa-shopping-cart"></i>'; break;
      case "dokter": icon = '<i class="fas fa-user-md"></i>'; break;
      case "verzekering": icon = '<i class="fas fa-file-invoice-dollar"></i>'; break;
      case "sparen": icon = '<i class="fas fa-piggy-bank"></i>'; break;
      default: icon = '<i class="fas fa-receipt"></i>'; break;
    }

    const cssClass = entry.bedrag >= 0 ? "inkomst" : "uitgave";

    row.innerHTML = `
      <td>${entry.datum}</td>
      <td>${icon} ${entry.type}</td>
      <td class="${cssClass}">€ ${entry.bedrag.toFixed(2)}</td>
    `;
    tbody.appendChild(row);
  });
}

// Roep functie meteen op bij laden
window.onload = loadOverzicht;
