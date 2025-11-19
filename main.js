const root = document.getElementById("root");

// Start met een paar voorbeeldboekingen
let boekingen = [
  { id: 1, datum: "2025-11-01", type: "Lening", bedrag: 2000, category: "inkomsten" },
  { id: 2, datum: "2025-11-05", type: "Winkel", bedrag: 50, category: "uitgaven" }
];

// Renderfunctie
function render(list) {
  let html = "<h2>Boekingen</h2><ul>";
  list.forEach(b => {
    html += `<li><span>${b.datum} - ${b.type}</span><span>€${b.bedrag}</span></li>`;
  });
  html += "</ul>";

  const totaalInkomsten = list.filter(b => b.category === "inkomsten").reduce((sum, b) => sum + b.bedrag, 0);
  const totaalUitgaven = list.filter(b => b.category === "uitgaven").reduce((sum, b) => sum + b.bedrag, 0);
  const saldo = totaalInkomsten - totaalUitgaven;

  html += `<div class="totals">
    Inkomsten: €${totaalInkomsten} | Uitgaven: €${totaalUitgaven} | Saldo: €${saldo}
  </div>`;

  root.innerHTML = html;
}

// Toevoegen van nieuwe boeking
function addBooking() {
  const datum = document.getElementById("datum").value;
  const bedrag = parseFloat(document.getElementById("bedrag").value);
  const type = document.getElementById("type").value;

  if (!datum || !bedrag || !type) {
    alert("Vul alle velden in!");
    return;
  }

  // Bepaal categorie: alles wat "Lening" of "Sparen" is -> inkomsten, rest -> uitgaven
  let category = ["Lening", "Sparen", "Sparen Loreana"].includes(type) ? "inkomsten" : "uitgaven";

  boekingen.push({ id: boekingen.length + 1, datum, type, bedrag, category });

  // Wis invoer
  document.getElementById("datum").value = "";
  document.getElementById("bedrag").value = "";
  document.getElementById("type").value = "Lening";

  render(boekingen);
}

// Filterfunctie
function filterType(filter) {
  if (filter === "alle") {
    render(boekingen);
  } else {
    const gefilterd = boekingen.filter(b => b.category === filter);
    render(gefilterd);
  }
}

// Initieel tonen
render(boekingen);
