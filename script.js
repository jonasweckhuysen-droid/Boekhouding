function openModal() {
  document.getElementById("modal").classList.remove("modalHidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("modalHidden");
}

function goToOverzicht() {
  window.location.href = "overzicht.html";
}

function goToIndex() {
  window.location.href = "index.html";
}

function saveEntry() {
  const soort = document.getElementById("soort").value; // inkomst of uitgave
  const datum = document.getElementById("datum").value;
  const bedragRaw = parseFloat(document.getElementById("bedrag").value);
  const type = document.getElementById("type").value;
  const recurring = document.getElementById("recurring").checked;

  if (!datum || !bedragRaw) {
    alert("Gelieve alle velden in te vullen");
    return;
  }

  // Als het een uitgave is → bedrag negatief maken
  const bedrag = soort === "uitgave" ? -Math.abs(bedragRaw) : Math.abs(bedragRaw);

  const entry = {
    soort,
    datum,
    bedrag,
    type,
    recurring
};
  
  let data = JSON.parse(localStorage.getItem("boekhouding")) || [];
  data.push(entry);
  localStorage.setItem("boekhouding", JSON.stringify(data));

  closeModal();
  updateSaldo();
}

function updateSaldo() {
  let data = JSON.parse(localStorage.getItem("boekhouding")) || [];
  let total = data.reduce((sum, e) => sum + e.bedrag, 0);
  document.getElementById("saldo").innerText = "€ " + total.toFixed(2);
}

function loadOverzicht() {
  let data = JSON.parse(localStorage.getItem("boekhouding")) || [];

  const tbody = document.querySelector("#overzichtTabel tbody");
  tbody.innerHTML = "";

  data.forEach(entry => {
    const row = document.createElement("tr");

    const cssClass = entry.bedrag >= 0 ? "inkomst" : "uitgave";

    row.innerHTML = `
      <td>${entry.datum}</td>
      <td>${entry.type}</td>
      <td class="${cssClass}">€ ${entry.bedrag.toFixed(2)}</td>
    `;
    tbody.appendChild(row);
  });
}

updateSaldo();
function applyRecurring() {
    const entries = JSON.parse(localStorage.getItem("boekhouding") || "[]");
    let changed = false;

    entries.forEach(entry => {
        if (entry.recurring) {
            const lastDate = new Date(entry.datum);
            const now = new Date();

            // Check of we minstens 1 maand verder zijn
            while (
                lastDate.getFullYear() < now.getFullYear() ||
                (lastDate.getFullYear() === now.getFullYear() &&
                 lastDate.getMonth() < now.getMonth())
            ) {
                lastDate.setMonth(lastDate.getMonth() + 1);

                const newEntry = {
                    ...entry,
                    datum: lastDate.toISOString().split("T")[0]
                };

                entries.push(newEntry);
                changed = true;
            }
        }
    });

    if (changed) {
        localStorage.setItem("boekhouding", JSON.stringify(entries));
        updateSaldo();
    }
}

// bij opstart uitvoeren:
applyRecurring();
