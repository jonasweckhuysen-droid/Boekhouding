let db;
const request = indexedDB.open("BoekhoudingDB",1);

request.onupgradeneeded=e=>{
  db=e.target.result;
  db.createObjectStore("items",{keyPath:"id",autoIncrement:true});
};
request.onsuccess=e=>{
  db=e.target.result;
  loadData();
  buildCalendar();
};

function openModal(){modal.style.display="flex"}
function closeModal(){modal.style.display="none"}
function closeDay(){dayModal.style.display="none"}

function saveEntry(){
  const soort=soort.value;
  const bron=bron.value;
  const datum=datum.value;
  const bedrag=parseFloat(bedrag.value)*(soort==="uitgave"?-1:1);
  const recurring=recurring.checked;

  const tx=db.transaction("items","readwrite");
  tx.objectStore("items").add({soort,bron,datum,bedrag,recurring});
  tx.oncomplete=()=>{
    closeModal();
    loadData();
    buildCalendar();
  }
}

function loadData(){
  const tx=db.transaction("items","readonly");
  const req=tx.objectStore("items").getAll();
  req.onsuccess=()=>{
    let total=0;
    req.result.forEach(e=>total+=e.bedrag);
    saldo.innerText="€ "+total.toFixed(2).replace(".",",");
  }
}

function buildCalendar(){
  calendar.innerHTML="";
  const now=new Date();
  const year=now.getFullYear();
  const month=now.getMonth();
  const days=new Date(year,month+1,0).getDate();

  const tx=db.transaction("items","readonly");
  tx.objectStore("items").getAll().onsuccess=e=>{
    const data=e.target.result;
    for(let d=1;d<=days;d++){
      const date=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const entries=data.filter(i=>i.datum===date);
      const div=document.createElement("div");
      div.className="day"+(entries.length?" has":"");
      div.innerText=d;
      div.onclick=()=>openDay(date,entries);
      calendar.appendChild(div);
    }
  }
}

function openDay(date,entries){
  dayTitle.innerText=date;
  dayList.innerHTML="";
  entries.forEach(e=>{
    const div=document.createElement("div");
    div.className="entry";
    div.innerHTML=`<span>${e.bron}</span>
    <span class="${e.bedrag>=0?"pos":"neg"}">€ ${e.bedrag.toFixed(2)}</span>`;
    dayList.appendChild(div);
  });
  dayModal.style.display="flex";
}

function toggleTheme(){
  document.body.classList.toggle("dark");
  localStorage.setItem("theme",document.body.classList.contains("dark"));
}
if(localStorage.getItem("theme")==="true"){
  document.body.classList.add("dark");
}
