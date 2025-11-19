const boekhoudingList = document.getElementById('boekhoudingList');
const modal = document.getElementById('invoerModal');
const closeModal = document.querySelector('.close');
const invoerForm = document.getElementById('invoerForm');

let huidigeCategorie = '';

// Laad opgeslagen data
let boekhouding = JSON.parse(localStorage.getItem('boekhouding')) || [];
renderList();

// Knoppen openen modal
document.getElementById('btnInkomsten').addEventListener('click', () => openModal('Inkomsten'));
document.getElementById('btnUitgaven').addEventListener('click', () => openModal('Uitgaven'));

// Modal functies
function openModal(categorie) {
  huidigeCategorie = categorie;
  modal.style.display = 'block';
}

closeModal.onclick = function() {
  modal.style.display = 'none';
}

window.onclick = function(event) {
  if (event.target == modal) modal.style.display = 'none';
}

// Form submission
invoerForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const datum = document.getElementById('datum').value;
  const bedrag = document.getElementById('bedrag').value;
  const type = document.getElementById('type').value;

  const item = { datum, bedrag, type, categorie: huidigeCategorie };
  boekhouding.push(item);
  localStorage.setItem('boekhouding', JSON.stringify(boekhouding));
  renderList();
  invoerForm.reset();
  modal.style.display = 'none';
});

// Render lijst
function renderList() {
  boekhoudingList.innerHTML = '';
  boekhouding.forEach(item => {
    const li = document.createElement('li');
    li.className = item.type; // voor kleur per type
    li.innerHTML = `
      <span>${item.datum}</span>
      <span>${item.type} (${item.categorie})</span>
      <span>€${item.bedrag}</span>
    `;
    boekhoudingList.appendChild(li);
  });
}
