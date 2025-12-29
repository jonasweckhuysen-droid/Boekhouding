document.addEventListener("DOMContentLoaded", () => {

  const addBtn = document.getElementById("addBtn");
  const calBtn = document.getElementById("calBtn");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const saveEntryBtn = document.getElementById("saveEntryBtn");

  const soort = document.getElementById("soort");
  const bron = document.getElementById("bron");
  const datum = document.getElementById("datum");
  const bedrag = document.getElementById("bedrag");

  const saldoDiv = document.getElementById("saldo");
  const expectedDiv = document.getElementById("expected");
  const calendar = document.getElementById("calendar");

  let items = JSON.parse(localStorage.getItem("items")) || [];

  function saveItems(){
    localStorage.setItem("items", JSON.stringify(items));
  }

  function updateSaldo(){
    const saldo = items.reduce((s,i)=>s+i.bedrag,0);
    saldoDiv.innerText = `€ ${saldo.toFixed(2)}`;
    expectedDiv.innerText = `🔮 Verwacht einde maand: € ${(saldo).toFixed(2)}`;
  }

  function renderCalendar(){
    calendar.innerHTML="";
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();

    for(let d=1; d<=days; d++){
      const div = document.createElement("div");
      div.className="day";
      div.innerText=d;

      const dayItems = items.filter(i=>{
        const dt=new Date(i.datum);
        return dt.getDate()===d && dt.getMonth()===now.getMonth();
      });

      if(dayItems.length) div.classList.add("has");

      div.addEventListener("click",()=>{
        alert(
          dayItems.map(i =>
            `${i.soort==="inkomst"?"💰":"💸"} ${i.bron}: € ${Math.abs(i.bedrag).toFixed(2)}`
          ).join("\n") || "Geen transacties"
        );
      });

      calendar.appendChild(div);
    }
  }

  // EVENTS
  addBtn.onclick = () => modal.style.display="flex";
  closeModalBtn.onclick = () => modal.style.display="none";

  saveEntryBtn.onclick = () => {
    const val = parseFloat(bedrag.value);
    if(isNaN(val)){ alert("Vul een geldig bedrag in"); return; }

    items.push({
      soort: soort.value,
      bron: bron.value,
      datum: datum.value,
      bedrag: soort.value==="uitgave" ? -Math.abs(val) : val
    });

    saveItems();
    updateSaldo();
    renderCalendar();

    modal.style.display="none";
    bron.value = bedrag.value = "";
  };

  calBtn.onclick = () => {
    calendar.style.display = calendar.style.display==="grid"?"none":"grid";
    renderCalendar();
  };

  // INIT
  updateSaldo();
  renderCalendar();

});
