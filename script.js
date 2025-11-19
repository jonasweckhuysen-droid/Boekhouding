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
  const datum = document.getElementById("datum").value;
  const bedrag = parseFloat(document.getElementById("bedrag").value);
  const type = document.getElementById("type").value;

  if (!datum || !bedrag) {
    alert("Gelieve alle velden in te vullen");
    return;
  }

  const entry = { datum, bedrag, type };

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
    row.innerHTML = `
      <td>${entry.datum}</td>
      <td>${entry.type}</td>
      <td>€ ${entry.bedrag.toFixed(2)}</td>
    `;
    tbody.appendChild(row);
  });
}

updateSaldo();
