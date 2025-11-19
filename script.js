let entries = JSON.parse(localStorage.getItem("boekhouding") || "[]");

const saldoSpan = document.getElementById("saldo");
const content = document.getElementById("content");

const popup = document.getElementById("popupOverlay");
const btnInvoer = document.getElementById("btnInvoer");
const btnOverzicht = document.getElementById("btnOverzicht");

function updateSaldo() {
    let total = 0;
    entries.forEach(e => {
        if (e.type === "Inkomst") total += e.amount;
        else total -= e.amount;
    });
    saldoSpan.textContent = "€" + total.toFixed(2);
}

function saveEntries() {
    localStorage.setItem("boekhouding", JSON.stringify(entries));
    updateSaldo();
}

function showPopup() {
    popup.classList.remove("hidden");
}

function hidePopup() {
    popup.classList.add("hidden");
}

btnInvoer.onclick = () => showPopup();
document.getElementById("cancelEntry").onclick = () => hidePopup();

document.getElementById("saveEntry").onclick = () => {
    const date = document.getElementById("inputDate").value;
    const amount = parseFloat(document.getElementById("inputAmount").value);
    const type = document.getElementById("inputType").value;

    if (!date || !amount) {
        alert("Gelieve alle velden in te vullen.");
        return;
    }

    entries.push({ date, amount, type });
    saveEntries();
    hidePopup();
    loadHome();
};

function loadHome() {
    content.innerHTML = `
        <h2>Welkom</h2>
        <p>Gebruik de knoppen hierboven om een nieuwe invoer toe te voegen of het overzicht te bekijken.</p>
    `;
}

function loadOverzicht() {
    let overzicht = {};

    entries.forEach(e => {
        const month = e.date.substring(0, 7); 
        if (!overzicht[month]) overzicht[month] = {};
        if (!overzicht[month][e.type]) overzicht[month][e.type] = 0;

        overzicht[month][e.type] += e.type === "Inkomst" ? e.amount : -e.amount;
    });

    let html = `<h2>Maandelijks overzicht</h2>`;

    Object.keys(overzicht).forEach(month => {
        html += `<h3>${month}</h3>`;
        html += `<table>
                    <tr><th>Type</th><th>Bedrag</th></tr>`;
        Object.keys(overzicht[month]).forEach(type => {
            html += `<tr>
                        <td>${type}</td>
                        <td>€${overzicht[month][type].toFixed(2)}</td>
                     </tr>`;
        });
        html += `</table>`;
    });

    content.innerHTML = html;
}

btnOverzicht.onclick = loadOverzicht;

// Initial load
loadHome();
updateSaldo();
