const root = document.getElementById("root");

// Haal boekingen op uit localStorage of start leeg
let boekingen = JSON.parse(localStorage.getItem("boekingen")) || [];

// Render functie
function render(list) {
  let html = '';
  list.forEach(b => {
    html += `
      <div class="booking-card">
        <span>${b.datum}</span>
        <span class="booking-type ${b.category}">${b.type}</span>
        <span>€${b.bedrag}</span>
      </div>
    `;
  });

  const totaalInkomsten = list.filter(b => b.category === "inkomsten").reduce((sum, b) => sum + b.bedrag, 0);
  const totaalUitgaven = list.filter(b => b.category === "uitgaven").reduce((sum, b) => sum + b.bedrag, 0);
  const saldo = totaalInkomsten - totaalUitgaven;

  html += `<div class="totals">
    Inkomsten: €${totaalInkomsten} | Uitgaven: €${totaalUitgaven} | Saldo: €${saldo}
  </div>`;

  root.innerHTML = html;
}

// Voeg nieuwe boeking toe
function addBooking() {
  const datum = document.getElementById("datum").value;
  const bedrag = parseFloat(document.getElementById("bedrag").value);
  const type = document.getElementById("type").value;

  if (!datum || !bedrag || !type) {
    alert("Vul alle velden in!");
    return;
  }

  const category = ["Lening", "Sparen", "Sparen Loreana"].includes(type) ? "inkomsten" : "uitgaven";

  boekingen.push({ datum, type, bedrag, category });

  // Sla lokaal op
  localStorage.setItem("boekingen", JSON.stringify(boekingen));

  // Wis form
  document.getElementById("datum").value = "";
  document.getElementById("bedrag").value = "";
  document.getElementById("type").value = "Lening";

  render(boekingen);
}

// Init
render(boekingen);
