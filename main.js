const root = document.getElementById("root");

// Voorbeeldboekingen
const boekingen = [
  { id: 1, type: "inkomsten", item: "Salaris", bedrag: 2000 },
  { id: 2, type: "uitgaven", item: "Huur", bedrag: 800 },
  { id: 3, type: "uitgaven", item: "Lunch", bedrag: 15 },
  { id: 4, type: "inkomsten", item: "Verkoop oude boeken", bedrag: 50 }
];

// Functie om te renderen
function render(gefilterdeBoekingen) {
  let html = "<h2>Boekingen</h2><ul>";
  gefilterdeBoekingen.forEach(b => {
    html += `<li><span>${b.item}</span><span>€${b.bedrag}</span></li>`;
  });
  html += "</ul>";
  root.innerHTML = html;
}

// Filteren op type
function filterType(type) {
  if (type === 'alle') {
    render(boekingen);
  } else {
    const gefilterd = boekingen.filter(b => b.type === type);
    render(gefilterd);
  }
}

// Start met alles
render(boekingen);
