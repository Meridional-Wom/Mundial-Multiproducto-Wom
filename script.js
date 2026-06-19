const DEFAULT_API_URL = ""; // Puedes pegar aquí la URL /exec si quieres dejarla fija.
const ADMIN_PASS = "Meridional";

let appData = {
  config:{JornadaActual:1,TotalJornadas:7,FechaJornada:"Viernes 19 de junio",Premio:"🍕 Pizza Familiar",Horario:"Chile Continental"},
  partidos:[
    {Jornada:1,Hora:"15:00",Local:"Estados Unidos",Visita:"Australia",Resultado:"Pendiente",Ganador:""},
    {Jornada:1,Hora:"18:00",Local:"Escocia",Visita:"Marruecos",Resultado:"Pendiente",Ganador:""},
    {Jornada:1,Hora:"20:30",Local:"Brasil",Visita:"Haití",Resultado:"Pendiente",Ganador:""},
    {Jornada:1,Hora:"23:00",Local:"Turquía",Visita:"Paraguay",Resultado:"Pendiente",Ganador:""}
  ],
  metas:[
    {Jornada:1,Tienda:"Sucursal Castro",KPI:"Accesorios",Tipo:"$",Meta:88.18,Avance:0,Obligatorio:"SI"},
    {Jornada:1,Tienda:"Sucursal Castro",KPI:"Seguros",Tipo:"Q",Meta:2,Avance:0,Obligatorio:"SI"},
    {Jornada:1,Tienda:"Sucursal Castro",KPI:"WOMGO",Tipo:"Q",Meta:3,Avance:0,Obligatorio:"SI"}
  ],
  pronosticos:[],
  resultados:[],
  reglas:[
    {Titulo:"Una apuesta por tienda",Detalle:"Cada tienda puede registrar una sola apuesta por jornada."},
    {Titulo:"Metas obligatorias",Detalle:"Para competir, la tienda debe cumplir sus metas asignadas."},
    {Titulo:"Más aciertos",Detalle:"Entre las tiendas clasificadas, gana la que obtenga más aciertos."},
    {Titulo:"Horario Chile",Detalle:"Todos los partidos se muestran en horario Chile Continental."}
  ]
};

let ultimaApuesta = null;

document.addEventListener("DOMContentLoaded", async () => {
  iniciarSplash();
  await cargarDatos(false);
  renderAll();
  showSection("inicio");
});

function getApiUrl(){ return (localStorage.getItem("api_wom") || DEFAULT_API_URL || "").trim(); }

async function cargarDatos(showAlert=false){
  try{
    const url = getApiUrl();
    if(!url) throw new Error("Sin API");
    const res = await fetch(`${url}?action=getData&t=${Date.now()}`);
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || "API error");
    appData = data;
    localStorage.setItem("cache_wom", JSON.stringify(appData));
    if(showAlert) alert("Datos actualizados.");
  }catch(e){
    const cache = localStorage.getItem("cache_wom");
    if(cache) appData = JSON.parse(cache);
    if(showAlert) alert("No se pudo conectar. Revisa URL Apps Script.");
  }
}

function renderAll(){
  cargarInicio(); cargarFormularioApuesta(); cargarPronosticos(); cargarMetas(); cargarReglas(); cargarResultados(); cargarAdmin();
}

function iniciarSplash(){
  const textos=["Cargando jornada...","Preparando partidos...","¡Que comience la competencia!"];
  let i=0; const loadingText=document.getElementById("loadingText");
  const intervalo=setInterval(()=>{i++; if(loadingText && textos[i]) loadingText.textContent=textos[i];},1200);
  setTimeout(()=>{clearInterval(intervalo);document.getElementById("splashScreen").style.display="none";document.getElementById("app").classList.remove("hidden");},3500);
}

function showSection(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  const section=document.getElementById(id); if(section) section.classList.add("active");
  if(id==="pronosticos") cargarPronosticos();
  if(id==="metas") cargarMetas();
  if(id==="reglas") cargarReglas();
  if(id==="resultados") cargarResultados();
  window.scrollTo({top:0,behavior:"smooth"});
}

function currentJornada(){ return Number(appData.config.JornadaActual || 1); }
function partidosJornada(){ return appData.partidos.filter(p=>Number(p.Jornada)===currentJornada()); }
function tiendas(){ return [...new Set(appData.metas.filter(m=>Number(m.Jornada)===currentJornada()).map(m=>m.Tienda))]; }

function cargarInicio(){
  setText("jornadaActual", `${currentJornada()} de ${appData.config.TotalJornadas || 7}`);
  setText("fechaJornada", appData.config.FechaJornada || "");
  setText("premioDia", appData.config.Premio || "");
  const cont=document.getElementById("partidosHoy");
  if(!cont) return;
  cont.innerHTML = partidosJornada().map(p=>`
    <div class="match-card">
      <div class="match-time">${safe(p.Hora)}</div>
      <div class="match-teams">${safe(p.Local)} <span>VS</span> ${safe(p.Visita)}</div>
    </div>`).join("");
}

function cargarFormularioApuesta(){
  const sel=document.getElementById("tienda");
  if(sel){
    sel.innerHTML = `<option value="">Seleccionar tienda</option>` + tiendas().map(t=>`<option value="${safeAttr(t)}">${safe(t)}</option>`).join("");
    sel.onchange = revisarTiendaSeleccionada;
  }
  const form=document.getElementById("formPartidos");
  if(form){
    form.innerHTML = partidosJornada().map((p,i)=>`
      <div class="bet-card">
        <h3>⚽ ${safe(p.Hora)}</h3>
        <p>${safe(p.Local)} VS ${safe(p.Visita)}</p>
        <select id="pronostico_${i}">
          <option value="">Seleccionar</option>
          <option value="${safeAttr(p.Local)}">${safe(p.Local)}</option>
          <option value="Empate">Empate</option>
          <option value="${safeAttr(p.Visita)}">${safe(p.Visita)}</option>
        </select>
      </div>`).join("");
  }
  resetFormularioApuesta();
}

function revisarTiendaSeleccionada(){
  resetFormularioApuesta();
  const tienda=document.getElementById("tienda")?.value;
  if(!tienda) return;
  const existe = appData.pronosticos.find(p=>p.Tienda===tienda && Number(p.Jornada)===currentJornada());
  if(existe){
    const data = appData.pronosticos.filter(p=>p.ID===existe.ID);
    data.forEach((p,i)=>{const s=document.getElementById(`pronostico_${i}`); if(s) s.value=p.Pronostico;});
    ultimaApuesta = buildApuestaFromRows(data);
    mostrarApuestaGuardada(ultimaApuesta);
  }
}

async function guardarApuesta(){
  const tienda=document.getElementById("tienda")?.value;
  if(!tienda) return alert("Selecciona una tienda.");
  if(appData.pronosticos.some(p=>p.Tienda===tienda && Number(p.Jornada)===currentJornada())){
    return alert("Esta tienda ya registró su apuesta.");
  }
  const partidos = partidosJornada();
  const elecciones = partidos.map((p,i)=>({
    partido:`${p.Local} VS ${p.Visita}`,
    hora:p.Hora,
    pronostico:document.getElementById(`pronostico_${i}`)?.value
  }));
  if(elecciones.some(e=>!e.pronostico)) return alert("Completa todos los pronósticos.");
  const payload = {
    action:"savePronostico",
    fecha:new Date().toLocaleDateString("es-CL"),
    hora:new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"}),
    jornada:currentJornada(),
    tienda,
    pronosticos:elecciones
  };
  try{
    const url=getApiUrl();
    if(!url) throw new Error("Sin URL Apps Script");
    const res=await fetch(url,{method:"POST",body:JSON.stringify(payload)});
    const out=await res.json();
    if(!out.ok) throw new Error(out.error || "No guardó");
    await cargarDatos(false);
    const rows=appData.pronosticos.filter(p=>p.ID===out.id);
    ultimaApuesta=buildApuestaFromRows(rows);
  }catch(e){
    const id=`local_${Date.now()}`;
    elecciones.forEach(e=>appData.pronosticos.push({ID:id,Fecha:payload.fecha,Hora:payload.hora,Jornada:payload.jornada,Tienda:tienda,Partido:e.partido,HoraPartido:e.hora,Pronostico:e.pronostico}));
    localStorage.setItem("cache_wom",JSON.stringify(appData));
    ultimaApuesta=buildApuestaFromRows(appData.pronosticos.filter(p=>p.ID===id));
    alert("Guardado local. Para que lo vean todos, conecta Google Sheets.");
  }
  mostrarApuestaGuardada(ultimaApuesta);
  cargarPronosticos();
  alert("Apuesta registrada.");
}

function buildApuestaFromRows(rows){
  if(!rows.length) return null;
  return {
    id: rows[0].ID, tienda: rows[0].Tienda, jornada: rows[0].Jornada,
    fecha: rows[0].Fecha, hora: rows[0].Hora,
    elecciones: rows.map(r=>({partido:r.Partido,hora:r.HoraPartido,eleccion:r.Pronostico}))
  };
}

function mostrarApuestaGuardada(a){
  const btn=document.getElementById("btnGuardar"), box=document.getElementById("apuestaGuardada"), fecha=document.getElementById("fechaRegistro"), tienda=document.getElementById("tienda");
  if(btn) btn.style.display="none"; if(box) box.classList.remove("hidden");
  if(fecha) fecha.textContent=`Registrada: ${a.fecha} · ${a.hora}`;
  if(tienda) tienda.disabled=true;
  partidosJornada().forEach((_,i)=>{const s=document.getElementById(`pronostico_${i}`); if(s) s.disabled=true;});
}

function resetFormularioApuesta(){
  const btn=document.getElementById("btnGuardar"), box=document.getElementById("apuestaGuardada"), tienda=document.getElementById("tienda");
  if(btn) btn.style.display="block"; if(box) box.classList.add("hidden"); if(tienda) tienda.disabled=false;
  partidosJornada().forEach((_,i)=>{const s=document.getElementById(`pronostico_${i}`); if(s){s.disabled=false;s.value="";}});
}

function cargarPronosticos(){
  const cont=document.getElementById("listaPronosticos"); if(!cont) return;
  const rows=appData.pronosticos.filter(p=>Number(p.Jornada)===currentJornada());
  if(!rows.length){cont.innerHTML=`<div class="info-card"><p>Aún no hay apuestas registradas.</p></div>`;return;}
  const byId={}; rows.forEach(r=>{if(!byId[r.ID]) byId[r.ID]=[]; byId[r.ID].push(r);});
  cont.innerHTML=Object.values(byId).map(group=>{
    const g=group[0];
    return `<div class="prediction-card"><h3>🏪 ${safe(g.Tienda)}</h3><small>${safe(g.Fecha)} · ${safe(g.Hora)}</small>`+
    group.map(r=>`<p><strong>⚽ ${safe(r.Partido)}</strong><br>➡️ Elegimos: ${safe(r.Pronostico)}</p>`).join("")+`</div>`;
  }).join("");
}

function cargarMetas(){
  const cont=document.getElementById("metasTienda"); if(!cont) return;
  const rows=appData.metas.filter(m=>Number(m.Jornada)===currentJornada());
  const byStore={}; rows.forEach(r=>{if(!byStore[r.Tienda]) byStore[r.Tienda]=[]; byStore[r.Tienda].push(r);});
  cont.innerHTML=Object.entries(byStore).map(([tienda,kpis])=>{
    const obligatorios=kpis.filter(k=>String(k.Obligatorio||"SI").toUpperCase()!=="NO");
    const clasificado=obligatorios.every(k=>Number(k.Avance)>=Number(k.Meta));
    return `<div class="goal-row"><div class="goal-head"><strong>${safe(tienda)}</strong><span class="goal-status">${clasificado?"🟢 Clasificado":"🔴 Pendiente"}</span></div>`+
      kpis.map(k=>{
        const pct = Number(k.Meta)>0 ? Math.min(Math.round(Number(k.Avance)/Number(k.Meta)*100),100) : 0;
        return `<div class="kpi-line"><small>${safe(k.KPI)}</small><div class="kpi-bar"><span style="width:${pct}%"></span></div><b>${formatKpi(k.Avance,k.Tipo)}/${formatKpi(k.Meta,k.Tipo)}</b></div>`;
      }).join("")+`</div>`;
  }).join("");
}

function cargarReglas(){
  const cont=document.getElementById("reglasContainer"); if(!cont) return;
  cont.innerHTML = appData.reglas.map(r=>`<article class="rule-card"><h3>${safe(r.Titulo)}</h3><p>${safe(r.Detalle)}</p></article>`).join("");
}

function cargarResultados(){
  const cont=document.getElementById("resultadosPartidos");
  if(cont){
    cont.innerHTML=partidosJornada().map(p=>`<div class="result-card"><strong>⚽ ${safe(p.Local)} VS ${safe(p.Visita)}</strong><p>${safe(p.Resultado||"Pendiente")}</p><small>${p.Ganador?`Ganador: ${safe(p.Ganador)}`:"Pendiente"}</small></div>`).join("");
  }
  const final=document.getElementById("resultadoJornada");
  if(final) final.innerHTML=`<p>Actualiza resultados y ganador desde Google Sheets.</p>`;
}

function compartirApuesta(){
  if(!ultimaApuesta) return alert("Primero guarda una apuesta.");
  const canvas=document.createElement("canvas"); canvas.width=1080; canvas.height=1350;
  const ctx=canvas.getContext("2d");
  const grad=ctx.createLinearGradient(0,0,1080,1350);
  grad.addColorStop(0,"#23004d"); grad.addColorStop(.5,"#090011"); grad.addColorStop(1,"#6f00ff");
  ctx.fillStyle=grad; ctx.fillRect(0,0,1080,1350);
  ctx.fillStyle="rgba(255,47,146,.24)"; ctx.fillRect(0,0,1080,18);
  ctx.fillStyle="#fff"; ctx.font="bold 58px Arial"; ctx.fillText("🏆 MUNDIAL",70,100);
  ctx.fillStyle="#ff2f92"; ctx.font="bold 60px Arial"; ctx.fillText("MULTIPRODUCTO",70,170);
  ctx.fillStyle="#fff"; ctx.font="bold 34px Arial"; ctx.fillText("WOM MERIDIONAL",70,225);
  drawCanvasCard(ctx,70,275,940,145);
  ctx.fillStyle="#fff"; ctx.font="bold 40px Arial"; ctx.fillText(`🏪 ${ultimaApuesta.tienda.toUpperCase()}`,110,340);
  ctx.fillStyle="#ff2f92"; ctx.font="bold 34px Arial"; ctx.fillText("⚽ NUESTRA APUESTA",110,395);
  ctx.fillStyle="#c9c3da"; ctx.font="28px Arial"; ctx.fillText(`Jornada ${ultimaApuesta.jornada} de ${appData.config.TotalJornadas||7}`,110,445);
  let y=520;
  ultimaApuesta.elecciones.forEach(e=>{drawCanvasCard(ctx,70,y,940,145);ctx.fillStyle="#fff";ctx.font="bold 30px Arial";ctx.fillText(`⚽ ${e.partido}`,110,y+50);ctx.fillStyle="#ff2f92";ctx.font="bold 34px Arial";ctx.fillText(`➡️ Elegimos: ${e.eleccion}`,110,y+105);y+=160;});
  drawCanvasCard(ctx,70,1165,940,90); ctx.fillStyle="#fff"; ctx.font="bold 28px Arial"; ctx.fillText(`🎁 Premio: ${String(appData.config.Premio||"").replace("🍕 ","")}`,110,1218);
  ctx.fillStyle="#c9c3da"; ctx.font="26px Arial"; ctx.fillText(`Registrada: ${ultimaApuesta.fecha} · ${ultimaApuesta.hora}`,70,1290);
  ctx.fillStyle="#fff"; ctx.font="bold 28px Arial"; ctx.fillText("⚽ Pronostica • Cumple • Compite • Gana",70,1330);
  compartirCanvas(canvas,"apuesta-wom.png");
}
function drawCanvasCard(ctx,x,y,w,h){ctx.fillStyle="rgba(22,14,40,.92)";ctx.strokeStyle="rgba(151,82,255,.46)";ctx.lineWidth=3;roundRect(ctx,x,y,w,h,26,true,true);}
function roundRect(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();if(fill)ctx.fill();if(stroke)ctx.stroke();}
function compartirCanvas(canvas,nombre){canvas.toBlob(async blob=>{const file=new File([blob],nombre,{type:"image/png"});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:"Mundial Multiproducto WOM",files:[file]});}else{const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=nombre;a.click();alert("Imagen generada para compartir.");}});}
function validarAdmin(){const pass=document.getElementById("adminPass")?.value;if(pass!==ADMIN_PASS)return alert("Código incorrecto.");document.getElementById("adminLogin")?.classList.add("hidden");document.getElementById("adminContent")?.classList.remove("hidden");}
function cargarAdmin(){const input=document.getElementById("apiUrl"); if(input) input.value=getApiUrl();}
function guardarApi(){const input=document.getElementById("apiUrl"); if(!input)return; localStorage.setItem("api_wom",input.value.trim()); alert("Conexión guardada.");}
async function probarConexion(){try{const url=getApiUrl();const r=await fetch(`${url}?action=ping&t=${Date.now()}`);const j=await r.json();alert(j.ok?"Conexión OK":"No conecta");}catch(e){alert("No conecta. Revisa implementación del Apps Script.");}}
function limpiarApuestasLocales(){localStorage.removeItem("cache_wom"); alert("Caché local limpiado.");}
function setText(id,value){const el=document.getElementById(id); if(el) el.textContent=value;}
function safe(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function safeAttr(v){return safe(v);}
function formatKpi(v,tipo){const n=Number(v);if(tipo==="$")return "$"+n.toLocaleString("es-CL");return String(v);}
