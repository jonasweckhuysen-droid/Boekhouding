let transacties = JSON.parse(localStorage.getItem("boekhouding")) || [];

function saveLocal() {
  localStorage.setItem("boekhouding", JSON.stringify(transacties));
}

function updateSaldo() {
  let saldo = 0;
  transacties.forEach(t => {
    saldo += t.type === "Inkomst" ? Number(t.amount) : -Number(t.amount);
  });
  document.getElementById("saldoDisplay").innerText =
    "Saldo: €" + saldo.toFixed(2);
}

function renderTransacties() {
  const list = document.getElementById("transacties");
  list.innerHTML = "";

  transacties.forEach(t => {
    let li = document.createElement("li");
    li.innerHTML = `
      <span class="type">${t.type}</span> - €${t.amount}<br>
      <small>${t.date}</small>
    `;
    list.appendChild(li);
  });
}

function renderOverzicht() {
  const tbody = document.querySelector("#overzichtTabel tbody");
  tbody.innerHTML = "";

  let stats = {};

  transacties.forEach(t => {
    let maand = t.date.slice(0, 7);
    if (!stats[maand]) stats[maand] = {};
    if (!stats[maand][t.type]) stats[maand][t.type] = 0;

    stats[maand][t.type] += Number(t.amount);
  });

  Object.keys(stats).forEach(maand => {
    Object.keys(stats[maand]).forEach(type => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${maand}</td>
        <td>${type}</td>
        <td>€${stats[maand][type].toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function openPrompt() {
  document.getElementById("popupBg").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popupBg").classList.add("hidden");
}

function saveTransaction() {
  const date = document.getElementById("dateInput").value;
  const amount = document.getElementById("amountInput").value;
  const type = document.getElementById("typeInput").value;

  if (!date || !amount) {
    alert("Gelieve alle velden in te vullen.");
    return;
  }

  transacties.push({ date, amount, type });
  saveLocal();
  updateSaldo();
  renderTransacties();
  renderOverzicht();
  closePopup();
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// Init
updateSaldo();
renderTransacties();
renderOverzicht();
