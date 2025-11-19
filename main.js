const root = document.getElementById("root");

const boekingen = [
  { id: 1, item: "Boek Aankoop", bedrag: 50 },
  { id: 2, item: "Lunch", bedrag: 15 },
  { id: 3, item: "Abonnement", bedrag: 20 }
];

let html = "<h2>Boekingen</h2><ul>";
boekingen.forEach(b => {
  html += `<li>${b.item}: €${b.bedrag}</li>`;
});
html += "</ul>";

root.innerHTML = html;
