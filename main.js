const root = document.getElementById("root");

// Voorbeeld: lijst met boekingen
const boekingen = [
  { id: 1, item: "Boek Aankoop", bedrag: 50 },
  { id: 2, item: "Lunch", bedrag: 15 },
];

function renderBoekingen() {
  root.innerHTML = `
    <ul>
      ${boekingen.map(b => `<li>${b.item}: €${b.bedrag}</li>`).join("")}
    </ul>
  `;
}

renderBoekingen();
