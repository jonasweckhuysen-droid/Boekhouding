document.addEventListener("DOMContentLoaded",()=>{

/* ===== STORAGE ===== */
const store = (k,v)=>localStorage.setItem(k,JSON.stringify(v));
const load  = (k,d)=>JSON.parse(localStorage.getItem(k))||d;

/* ===== DATA ===== */
let items = load("items",[]);
let fixed = load("fixed",{});
let savings = load("savings",[]);

/* ===== ELEMENTS ===== */
const saldoEl = document.getElementById("saldo");
const expectedEl = document.getElementById("expected");
const calendar = document.getElementById("calendar");
const chartEl = document.getElementById("chart");

/* ===== MODALS ===== */
const entryModal=document.getElementById("entryModal");
const fixedModal=document.getElementById("fixedModal");
const savingsModal=document.getElementById("savingsModal");

/* ===== FUNCTIONS ===== */
function updateSaldo(){
  const saldo = items.reduce((s,i)=>s+i.bedrag,0);
  const vaste = Object.values(fixed).reduce((s,v)=>s+v,0);
  saldoEl.innerText=`€ ${saldo.toFixed(2)}`;
  expectedEl.innerText=`🔮 Verwacht einde maand: € ${(saldo-vaste).toFixed(2)}`;
}

function renderFixed(){
  const div=document.getElementById("fixedCostsList");
  div.innerHTML="";
  Object.entries(fixed).forEach(([k,v])=>{
    div.innerHTML+=`<div>${k}: € ${v.toFixed(2)}</div>`;
  });
}

function renderSavings(){
  const div=document.getElementById("savingsList");
  div.innerHTML="";
  savings.forEach(s=>{
    div.innerHTML+=`<div>${s.name}: € ${s.amount.toFixed(2)} / ${s.target}</div>`;
  });
  const sel=document.getElementById("saveToSavings");
  sel.innerHTML="<option value=''>Niet sparen</option>";
  savings.forEach((s,i)=>{
    sel.innerHTML+=`<option value="${i}">${s.name}</option>`;
  });
}

function renderCalendar(){
  calendar.innerHTML="";
  const now=new Date();
  const days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  for(let d=1;d<=days;d++){
    const div=document.createElement("div");
    div.className="day";
    div.innerText=d;
    const list=items.filter(i=>new Date(i.datum).getDate()===d);
    if(list.length) div.classList.add("has");
    div.onclick=()=>alert(list.map(i=>`${i.bron}: € ${i.bedrag}`).join("\n")||"Geen");
    calendar.appendChild(div);
  }
}

function renderChart(){
  const data={};
  items.filter(i=>i.bedrag<0).forEach(i=>{
    data[i.bron]=(data[i.bron]||0)+Math.abs(i.bedrag);
  });
  new Chart(chartEl,{
    type:"pie",
    data:{
      labels:Object.keys(data),
      datasets:[{data:Object.values(data)}]
    }
  });
}

/* ===== EVENTS ===== */
document.getElementById("addBtn").onclick=()=>entryModal.style.display="flex";
document.getElementById("closeEntry").onclick=()=>entryModal.style.display="none";

document.getElementById("saveEntry").onclick=()=>{
  const soort=document.getElementById("soort").value;
  let bedrag=parseFloat(document.getElementById("bedrag").value);
  if(isNaN(bedrag))return;
  if(soort==="uitgave") bedrag=-Math.abs(bedrag);
  items.push({
    bron:document.getElementById("bron").value,
    datum:document.getElementById("datum").value,
    bedrag
  });
  store("items",items);
  updateSaldo(); renderCalendar(); renderChart();
  entryModal.style.display="none";
};

document.getElementById("fixedBtn").onclick=()=>fixedModal.style.display="flex";
document.getElementById("closeFixed").onclick=()=>fixedModal.style.display="none";
document.getElementById("saveFixed").onclick=()=>{
  fixed={
    lening:+lening.value||0,
    elek:+elek.value||0,
    mob:+mob.value||0,
    verz:+verz.value||0
  };
  store("fixed",fixed);
  renderFixed(); updateSaldo();
};

document.getElementById("savingsBtn").onclick=()=>savingsModal.style.display="flex";
document.getElementById("closeSavings").onclick=()=>savingsModal.style.display="none";
document.getElementById("addSaving").onclick=()=>{
  savings.push({
    name:savName.value,
    target:+savTarget.value,
    amount:0
  });
  store("savings",savings);
  renderSavings();
};

/* ===== INIT ===== */
updateSaldo();
renderFixed();
renderSavings();
renderCalendar();
renderChart();

});
