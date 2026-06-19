const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbyb6FGbZw-JZ-fihSfjux0bJ3Two4tfgOXhq88RlET2fp75Y79kh1TS5Vp-XczLRLZoLg/exec";
const ADMIN_PASS = "Meridional";

let config = {};
let partidos = [];
let metas = [];
let pronosticos = [];
let resultados = [];
let tiendas = [];
let ultimaApuesta = null;

const fallback = {
  config:{JornadaActual:1,TotalJornadas:7,FechaJornada:"Viernes 19 de junio",Premio:"🍕 Pizza Familiar",Condicion:"Cumplir condición del día, Accesorios, Seguros y WOMGO"},
  partidos:[
    {Jornada:1,Hora:"15:00",Local:"Estados Unidos",Visita:"Australia",Resultado:"Pendiente",Ganador:""},
    {Jornada:1,Hora:"18:00",Local:"Escocia",Visita:"Marruecos",Resultado:"Pendiente",Ganador:""},
    {Jornada:1,Hora:"20:30",Local:"Brasil",Visita:"Haití",Resultado:"Pendiente",Ganador:""},
    {Jornada:1,Hora:"23:00",Local:"Turquía",Visita:"Paraguay",Resultado:"Pendiente",Ganador:""}
  ],
  metas:[
    {Jornada:1,Tienda:"Sucursal Valdivia",CondicionCumplida:false,AccesoriosMeta:112234,AccesoriosAvance:0,SegurosMeta:2,SegurosAvance:0,WOMGOMeta:3,WOMGOAvance:0},
    {Jornada:1,Tienda:"Sucursal Puerto Varas",CondicionCumplida:false,AccesoriosMeta:56117,AccesoriosAvance:0,SegurosMeta:1,SegurosAvance:0,WOMGOMeta:2,WOMGOAvance:0},
    {Jornada:1,Tienda:"Sucursal Costanera",CondicionCumplida:false,AccesoriosMeta:112234,AccesoriosAvance:0,SegurosMeta:2,SegurosAvance:0,WOMGOMeta:3,WOMGOAvance:0},
    {Jornada:1,Tienda:"Sucursal Osorno",CondicionCumplida:false,AccesoriosMeta:88184,AccesoriosAvance:0,SegurosMeta:2,SegurosAvance:0,WOMGOMeta:3,WOMGOAvance:0},
    {Jornada:1,Tienda:"Sucursal Ancud",CondicionCumplida:false,AccesoriosMeta:56117,AccesoriosAvance:0,SegurosMeta:1,SegurosAvance:0,WOMGOMeta:2,WOMGOAvance:0},
    {Jornada:1,Tienda:"Kiosco Plaza Los Ríos",CondicionCumplida:false,AccesoriosMeta:56117,AccesoriosAvance:0,SegurosMeta:1,SegurosAvance:0,WOMGOMeta:2,WOMGOAvance:0},
    {Jornada:1,Tienda:"Kiosco Mall Castro",CondicionCumplida:false,AccesoriosMeta:56117,AccesoriosAvance:0,SegurosMeta:1,SegurosAvance:0,WOMGOMeta:2,WOMGOAvance:0},
    {Jornada:1,Tienda:"Sucursal Puerto Montt",CondicionCumplida:false,AccesoriosMeta:88184,AccesoriosAvance:0,SegurosMeta:2,SegurosAvance:0,WOMGOMeta:3,WOMGOAvance:0},
    {Jornada:1,Tienda:"Sucursal Villarrica",CondicionCumplida:false,AccesoriosMeta:112234,AccesoriosAvance:0,SegurosMeta:2,SegurosAvance:0,WOMGOMeta:3,WOMGOAvance:0},
    {Jornada:1,Tienda:"Sucursal Castro",CondicionCumplida:false,AccesoriosMeta:88184,AccesoriosAvance:0,SegurosMeta:2,SegurosAvance:0,WOMGOMeta:3,WOMGOAvance:0}
  ]
};

document.addEventListener("DOMContentLoaded", async () => {
  iniciarSplash();
  await cargarDesdeServidor(false);
  renderAll();
  showSection("inicio");
});

function getApiUrl(){
  return DEFAULT_API_URL.trim();
}

async function cargarDesdeServidor(showAlert=false){
  try{
    const url = getApiUrl();
    if(!url){ usarFallback(); return; }

    const res = await fetch(`${url}?action=getData&t=${Date.now()}`);
    const data = await res.json();
    if(!data || data.ok === false) throw new Error("Respuesta inválida");

    procesarDatos(data);
    if(showAlert) alert("Datos actualizados desde Google Sheets.");
  }catch(e){
    console.warn(e);
    usarFallback();
    if(showAlert) alert("No se pudo actualizar desde Google Sheets. Revisa la URL Apps Script.");
  }
}

function procesarDatos(data){
  config = configArrayToObject(data.config || []);
  partidos = normalizarPartidos(data.partidos || []);
  metas = normalizarMetas(data.metas || []);
  pronosticos = normalizarPronosticos(data.pronosticos || []);
  resultados = data.resultados || [];

  if(!partidos.length) partidos = fallback.partidos;
  if(!metas.length) metas = fallback.metas;

  tiendas = obtenerTiendasDesdeMetas(metas);
  if(!tiendas.length) tiendas = fallback.metas.map(m => m.Tienda);
}

function usarFallback(){
  config = fallback.config;
  partidos = fallback.partidos;
  metas = fallback.metas;
  pronosticos = JSON.parse(localStorage.getItem("pronosticos_wom") || "[]");
  tiendas = obtenerTiendasDesdeMetas(metas);
}

function configArrayToObject(rows){
  const obj = {};
  rows.forEach(r => {
    const campo = r.Campo || r.campo || r.CAMPO;
    const valor = r.Valor || r.valor || r.VALOR;
    if(campo) obj[campo] = valor;
  });

  return {
    JornadaActual:Number(obj.JornadaActual || obj.jornadaActual || obj.numero_jornada || 1),
    TotalJornadas:Number(obj.TotalJornadas || obj.totalJornadas || 7),
    FechaJornada:obj.FechaJornada || obj.fechaJornada || "Viernes 19 de junio",
    Premio:obj.Premio || obj.premio || "🍕 Pizza Familiar",
    Condicion:obj.Condicion || obj.condicion || "Cumplir condición del día, Accesorios, Seguros y WOMGO",
    ClaveAdmin:obj.ClaveAdmin || obj.Clave || ADMIN_PASS
  };
}

function normalizarPartidos(rows){
  return rows.map(r => ({
    Jornada:Number(r.Jornada || r.jornada || 1),
    Hora:r.Hora || r["Hora Chile"] || r.hora || "",
    Local:r.Local || r.local || "",
    Visita:r.Visita || r.visita || "",
    Resultado:r.Resultado || r.resultado || "Pendiente",
    Ganador:r.Ganador || r.ganador || ""
  })).filter(p => p.Local && p.Visita);
}

function normalizarMetas(rows){
  const agrupadas = {};

  rows.forEach(row => {
    const jornada = Number(row.Jornada || row.jornada || 1);
    const tienda = row.Tienda || row.tienda || row["Punto de ventas"] || "";
    if(!tienda) return;

    const key = `${jornada}_${tienda}`;

    if(!agrupadas[key]){
      agrupadas[key] = {
        Jornada:jornada,
        Tienda:tienda,
        CondicionCumplida:parseBool(row.CondicionCumplida || row.Condicion || row["Condición"] || false),
        AccesoriosMeta:0, AccesoriosAvance:0,
        SegurosMeta:0, SegurosAvance:0,
        WOMGOMeta:0, WOMGOAvance:0
      };
    }

    if(parseBool(row.CondicionCumplida || row.Condicion || row["Condición"] || false)){
      agrupadas[key].CondicionCumplida = true;
    }

    const kpi = String(row.KPI || row.kpi || "").toLowerCase();

    if(kpi.includes("accesorios")){
      agrupadas[key].AccesoriosMeta = parseNumber(row.Meta || row.meta || row.AccesoriosMeta || row.MetaAccesorios || 0);
      agrupadas[key].AccesoriosAvance = parseNumber(row.Avance || row.avance || row.AccesoriosAvance || row.AvanceAccesorios || 0);
    }

    if(kpi.includes("seguros")){
      agrupadas[key].SegurosMeta = parseNumber(row.Meta || row.meta || row.SegurosMeta || row.MetaSeguros || 0);
      agrupadas[key].SegurosAvance = parseNumber(row.Avance || row.avance || row.SegurosAvance || row.AvanceSeguros || 0);
    }

    if(kpi.includes("womgo")){
      agrupadas[key].WOMGOMeta = parseNumber(row.Meta || row.meta || row.WOMGOMeta || row.MetaWOMGO || 0);
      agrupadas[key].WOMGOAvance = parseNumber(row.Avance || row.avance || row.WOMGOAvance || row.AvanceWOMGO || 0);
    }

    if(!kpi){
      agrupadas[key].AccesoriosMeta = parseNumber(row.AccesoriosMeta || row.MetaAccesorios || row["Meta en $ Accesorios"] || agrupadas[key].AccesoriosMeta);
      agrupadas[key].AccesoriosAvance = parseNumber(row.AccesoriosAvance || row.AvanceAccesorios || agrupadas[key].AccesoriosAvance);
      agrupadas[key].SegurosMeta = parseNumber(row.SegurosMeta || row.MetaSeguros || row["Meta en Q Seguros"] || agrupadas[key].SegurosMeta);
      agrupadas[key].SegurosAvance = parseNumber(row.SegurosAvance || row.AvanceSeguros || agrupadas[key].SegurosAvance);
      agrupadas[key].WOMGOMeta = parseNumber(row.WOMGOMeta || row.MetaWOMGO || row["Meta WOMGO"] || agrupadas[key].WOMGOMeta);
      agrupadas[key].WOMGOAvance = parseNumber(row.WOMGOAvance || row.AvanceWOMGO || agrupadas[key].WOMGOAvance);
    }
  });

  return Object.values(agrupadas);
}

function normalizarPronosticos(rows){
  return rows.map(r => ({
    ID:r.ID || r.Id || r.id || "",
    Fecha:r.Fecha || r.fecha || "",
    Hora:r.Hora || r.hora || "",
    Jornada:Number(r.Jornada || r.jornada || 1),
    Tienda:r.Tienda || r.tienda || "",
    Partido:r.Partido || r.partido || "",
    Pronostico:r.Pronostico || r.Pronóstico || r.pronostico || ""
  })).filter(p => p.Tienda);
}

function obtenerTiendasDesdeMetas(rows){ return [...new Set(rows.map(m => m.Tienda).filter(Boolean))]; }

async function probarConexion(){
  try{
    const url = getApiUrl();
    if(!url){ alert("Primero pega la URL Apps Script."); return; }
    const res = await fetch(`${url}?action=ping&t=${Date.now()}`);
    const data = await res.json();
    alert(data.ok ? "Conexión OK." : "La URL responde, pero no entregó OK.");
  }catch(e){ alert("No conecta. Revisa la URL /exec y permisos del Apps Script."); }
}

function iniciarSplash(){
  const textos=["Cargando jornada...","Preparando partidos...","¡Que comience la competencia!"];
  let i=0; const el=document.getElementById("loadingText");
  const inter=setInterval(()=>{i++; if(el && textos[i]) el.textContent=textos[i];},1300);
  setTimeout(()=>{clearInterval(inter);document.getElementById("splashScreen").style.display="none";document.getElementById("app").classList.remove("hidden");},4000);
}

function renderAll(){cargarInicio();cargarFormularioApuesta();cargarPronosticos();cargarMetas();cargarResultados();cargarAdmin();}
function showSection(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
  if(id==="pronosticos") cargarPronosticos();
  if(id==="condicionMeta") cargarMetas();
  if(id==="resultados") cargarResultados();
  window.scrollTo({top:0,behavior:"smooth"});
}

function cargarInicio(){
  setText("jornadaActual",`${config.JornadaActual || 1} de ${config.TotalJornadas || 7}`);
  setText("fechaJornada",config.FechaJornada || "Viernes 19 de junio");
  setText("bannerPremio",`🎁 Premio: ${config.Premio || "Pizza Familiar"}`);

  const cont=document.getElementById("partidosHoy");
  if(!cont) return;
  const data=partidos.filter(p=>Number(p.Jornada)===Number(config.JornadaActual || 1));
  cont.innerHTML=data.map(p=>`<div class="match-card"><div class="match-time">${escapeHTML(p.Hora)}</div><div class="match-teams">${escapeHTML(p.Local)} <span>VS</span> ${escapeHTML(p.Visita)}</div></div>`).join("");
}

function cargarFormularioApuesta(){
  const sel=document.getElementById("tienda");
  if(sel){
    sel.innerHTML=`<option value="">Seleccionar tienda</option>`;
    tiendas.forEach(t=>sel.innerHTML+=`<option value="${escapeAttr(t)}">${escapeHTML(t)}</option>`);
    sel.onchange=revisarTiendaSeleccionada;
  }

  const form=document.getElementById("formPartidos");
  if(form){
    const data=partidos.filter(p=>Number(p.Jornada)===Number(config.JornadaActual || 1));
    form.innerHTML=data.map((p,i)=>`<div class="bet-card"><h3>⚽ ${escapeHTML(p.Hora)}</h3><p>${escapeHTML(p.Local)} VS ${escapeHTML(p.Visita)}</p><select id="pronostico_${i}"><option value="">Seleccionar</option><option value="${escapeAttr(p.Local)}">${escapeHTML(p.Local)}</option><option value="Empate">Empate</option><option value="${escapeAttr(p.Visita)}">${escapeHTML(p.Visita)}</option></select></div>`).join("");
  }
  resetFormularioApuesta();
}

function revisarTiendaSeleccionada(){
  const tienda=document.getElementById("tienda")?.value;
  resetFormularioApuesta();
  if(!tienda) return;
  const jornada=Number(config.JornadaActual || 1);
  const regs=pronosticos.filter(p=>p.Tienda===tienda && Number(p.Jornada)===jornada);
  if(regs.length){
    ultimaApuesta=armarApuestaDesdePronosticos(tienda,regs);
    const data=partidos.filter(p=>Number(p.Jornada)===jornada);
    data.forEach((p,i)=>{
      const select=document.getElementById(`pronostico_${i}`);
      const found=regs.find(r=>r.Partido===`${p.Local} VS ${p.Visita}`);
      if(select && found) select.value=found.Pronostico;
    });
    mostrarApuestaGuardada(ultimaApuesta);
  }
}

function resetFormularioApuesta(){
  const btn=document.getElementById("btnGuardar"), box=document.getElementById("apuestaGuardada"), tienda=document.getElementById("tienda");
  if(btn) btn.style.display="block";
  if(box) box.classList.add("hidden");
  if(tienda) tienda.disabled=false;
  partidos.filter(p=>Number(p.Jornada)===Number(config.JornadaActual || 1)).forEach((_,i)=>{
    const select=document.getElementById(`pronostico_${i}`);
    if(select){select.disabled=false;select.value="";}
  });
}

async function guardarApuesta(){
  const tienda=document.getElementById("tienda")?.value;
  if(!tienda){alert("Selecciona una tienda.");return;}

  const jornada=Number(config.JornadaActual || 1);
  if(pronosticos.some(p=>p.Tienda===tienda && Number(p.Jornada)===jornada)){
    alert("Esta tienda ya registró su apuesta. No puede modificarse.");
    revisarTiendaSeleccionada();
    return;
  }

  const data=partidos.filter(p=>Number(p.Jornada)===jornada);
  const elecciones=data.map((p,i)=>({partido:`${p.Local} VS ${p.Visita}`,pronostico:document.getElementById(`pronostico_${i}`)?.value}));
  if(elecciones.some(e=>!e.pronostico)){alert("Completa todos los pronósticos.");return;}

  const fecha=new Date().toLocaleDateString("es-CL");
  const hora=new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});
  const payload={action:"savePronostico",fecha,hora,jornada,tienda,pronosticos:elecciones};

  try{
    const url=getApiUrl();
    if(!url) throw new Error("API no configurada");
    const res=await fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
    const respuesta=await res.json();
    if(!respuesta.ok) throw new Error(respuesta.error || "Error al guardar");
    await cargarDesdeServidor(false);
    alert("Apuesta registrada correctamente en Google Sheets.");
  }catch(e){
    console.warn(e);
    alert("No se pudo guardar en Google Sheets. Revisa implementación del Apps Script.");
    return;
  }

  const regs=pronosticos.filter(p=>p.Tienda===tienda && Number(p.Jornada)===jornada);
  ultimaApuesta=armarApuestaDesdePronosticos(tienda,regs);
  mostrarApuestaGuardada(ultimaApuesta);
  cargarPronosticos();
}

function armarApuestaDesdePronosticos(tienda,regs){
  return{tienda,jornada:Number(config.JornadaActual || 1),fechaRegistro:regs[0]?.Fecha || "",horaRegistro:regs[0]?.Hora || "",elecciones:regs.map(r=>({partido:r.Partido,eleccion:r.Pronostico}))};
}

function mostrarApuestaGuardada(registro){
  document.getElementById("btnGuardar").style.display="none";
  document.getElementById("apuestaGuardada").classList.remove("hidden");
  setText("fechaRegistro",`Registrada: ${registro.fechaRegistro} · ${registro.horaRegistro}`);
  document.getElementById("tienda").disabled=true;
  partidos.filter(p=>Number(p.Jornada)===Number(config.JornadaActual || 1)).forEach((_,i)=>{
    const select=document.getElementById(`pronostico_${i}`);
    if(select) select.disabled=true;
  });
}

function cargarPronosticos(){
  const lista=document.getElementById("listaPronosticos");
  if(!lista) return;
  const data=pronosticos.filter(p=>Number(p.Jornada)===Number(config.JornadaActual || 1));
  if(!data.length){lista.innerHTML=`<div class="info-card"><p>Aún no hay apuestas registradas.</p></div>`;return;}

  const group={};
  data.forEach(p=>{
    if(!group[p.Tienda]) group[p.Tienda]={tienda:p.Tienda,fecha:p.Fecha,hora:p.Hora,pronosticos:[]};
    group[p.Tienda].pronosticos.push(p);
  });

  lista.innerHTML=Object.values(group).map(item=>`<div class="prediction-card"><h3>🏪 ${escapeHTML(item.tienda)}</h3><small>Registrada: ${escapeHTML(item.fecha)} · ${escapeHTML(item.hora)}</small>${item.pronosticos.map(p=>`<p><strong>⚽ ${escapeHTML(p.Partido)}</strong><br>➡️ Elegimos: ${escapeHTML(p.Pronostico)}</p>`).join("")}</div>`).join("");
}

function cargarMetas(){
  setText("condicionDia",config.Condicion || "Para competir, la tienda debe cumplir condición, Accesorios, Seguros y WOMGO.");
  const cont=document.getElementById("metasTienda");
  if(!cont) return;
  const data=metas.filter(m=>Number(m.Jornada)===Number(config.JornadaActual || 1));
  if(!data.length){cont.innerHTML=`<p>No hay metas cargadas.</p>`;return;}

  cont.innerHTML=data.map(m=>{
    const acc=getPct(m.AccesoriosAvance,m.AccesoriosMeta), seg=getPct(m.SegurosAvance,m.SegurosMeta), wom=getPct(m.WOMGOAvance,m.WOMGOMeta);
    const cond=Boolean(m.CondicionCumplida);
    const metasOk=Number(m.AccesoriosAvance)>=Number(m.AccesoriosMeta) && Number(m.SegurosAvance)>=Number(m.SegurosMeta) && Number(m.WOMGOAvance)>=Number(m.WOMGOMeta);
    const clasifica=cond && metasOk;
    return `<div class="goal-row"><div class="goal-head"><strong>${escapeHTML(m.Tienda)}</strong><span class="goal-status">${clasifica?"🟢 Clasificado":"🔴 Pendiente"}</span></div><div class="condition-line">${cond?"✅ Condición cumplida":"❌ Condición pendiente"}</div>${kpiHTML("Accesorios",m.AccesoriosAvance,m.AccesoriosMeta,acc,"$")}${kpiHTML("Seguros",m.SegurosAvance,m.SegurosMeta,seg,"Q")}${kpiHTML("WOMGO",m.WOMGOAvance,m.WOMGOMeta,wom,"Q")}</div>`;
  }).join("");
}

function kpiHTML(nombre,avance,meta,pct,tipo){return `<div class="kpi-line"><small>${escapeHTML(nombre)}</small><div class="kpi-bar"><span style="width:${pct}%"></span></div><b>${formatValor(avance,tipo)}/${formatValor(meta,tipo)}</b></div>`;}
function getPct(a,m){a=Number(a)||0;m=Number(m)||0;if(m<=0)return 0;return Math.min(Math.round((a/m)*100),100);}
function formatValor(v,tipo){const n=Number(v)||0;return tipo==="$"?"$"+n.toLocaleString("es-CL"):String(n);}

function cargarResultados(){
  const cont=document.getElementById("resultadosPartidos");
  if(cont){
    const data=partidos.filter(p=>Number(p.Jornada)===Number(config.JornadaActual || 1));
    cont.innerHTML=data.map(p=>`<div class="result-card"><strong>⚽ ${escapeHTML(p.Local)} VS ${escapeHTML(p.Visita)}</strong><p>${escapeHTML(p.Resultado || "Pendiente")}</p><small>${p.Ganador?`Ganador: ${escapeHTML(p.Ganador)}`:"Pendiente"}</small></div>`).join("");
  }
  const final=document.getElementById("resultadoJornada");
  if(!final) return;
  if(!resultados.length){final.innerHTML=`<p>Resultado de jornada pendiente.</p>`;return;}
  final.innerHTML=resultados.map(r=>`<div class="result-card"><strong>${escapeHTML(r.Tienda || "")}</strong><p>Aciertos: ${escapeHTML(r.Aciertos || 0)}</p><small>${escapeHTML(r.Estado || "")}</small></div>`).join("");
}

function compartirApuesta(){
  if(!ultimaApuesta){alert("Primero guarda una apuesta.");return;}
  const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext("2d");
  const grad=ctx.createLinearGradient(0,0,1080,1350);grad.addColorStop(0,"#23004d");grad.addColorStop(.45,"#090011");grad.addColorStop(1,"#6f00ff");ctx.fillStyle=grad;ctx.fillRect(0,0,1080,1350);
  ctx.fillStyle="rgba(255,47,146,.22)";ctx.fillRect(0,0,1080,18);
  ctx.fillStyle="#fff";ctx.font="bold 58px Arial";ctx.fillText("🏆 MUNDIAL",70,100);
  ctx.fillStyle="#ff2f92";ctx.font="bold 60px Arial";ctx.fillText("MULTIPRODUCTO",70,170);
  ctx.fillStyle="#fff";ctx.font="bold 34px Arial";ctx.fillText("WOM MERIDIONAL",70,225);
  drawCanvasCard(ctx,70,275,940,145);ctx.fillStyle="#fff";ctx.font="bold 38px Arial";ctx.fillText(`🏪 ${ultimaApuesta.tienda.toUpperCase()}`,110,340);
  ctx.fillStyle="#ff2f92";ctx.font="bold 34px Arial";ctx.fillText("⚽ NUESTRA APUESTA",110,395);
  ctx.fillStyle="#c9c3da";ctx.font="28px Arial";ctx.fillText(`Jornada ${ultimaApuesta.jornada} de ${config.TotalJornadas || 7}`,110,445);
  let y=520;ultimaApuesta.elecciones.forEach(e=>{drawCanvasCard(ctx,70,y,940,145);ctx.fillStyle="#fff";ctx.font="bold 30px Arial";ctx.fillText(`⚽ ${e.partido}`,110,y+50);ctx.fillStyle="#ff2f92";ctx.font="bold 34px Arial";ctx.fillText(`➡️ Elegimos: ${e.eleccion}`,110,y+105);y+=160;});
  drawCanvasCard(ctx,70,1165,940,90);ctx.fillStyle="#fff";ctx.font="bold 28px Arial";ctx.fillText(`🎁 Premio: ${String(config.Premio || "Pizza Familiar").replace("🍕 ","")}`,110,1218);
  ctx.fillStyle="#c9c3da";ctx.font="26px Arial";ctx.fillText(`Registrada: ${ultimaApuesta.fechaRegistro} · ${ultimaApuesta.horaRegistro}`,70,1290);
  ctx.fillStyle="#fff";ctx.font="bold 28px Arial";ctx.fillText("⚽ Pronostica • Cumple • Compite • Gana",70,1330);
  compartirCanvas(canvas,"apuesta-wom.png");
}
function drawCanvasCard(ctx,x,y,w,h){ctx.fillStyle="rgba(22,14,40,.92)";ctx.strokeStyle="rgba(151,82,255,.46)";ctx.lineWidth=3;roundRect(ctx,x,y,w,h,26,true,true);}
function roundRect(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();if(fill)ctx.fill();if(stroke)ctx.stroke();}
function compartirCanvas(canvas,nombre){canvas.toBlob(async blob=>{const file=new File([blob],nombre,{type:"image/png"});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:"Mundial Multiproducto WOM",files:[file]});}else{const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=nombre;a.click();alert("Imagen generada. Se descargó para compartir por WhatsApp.");}});}

function validarAdmin(){
  const pass=document.getElementById("adminPass")?.value;
  if(pass !== (config.ClaveAdmin || ADMIN_PASS)){alert("Código incorrecto.");return;}
  document.getElementById("adminLogin")?.classList.add("hidden");
  document.getElementById("adminContent")?.classList.remove("hidden");
}
function cargarAdmin(){const input=document.getElementById("apiUrl");if(input)input.value=getApiUrl();}
function guardarApi(){const input=document.getElementById("apiUrl");if(!input)return;localStorage.setItem("api_wom",input.value.trim());alert("Conexión guardada.");}
function limpiarApuestasLocales(){localStorage.removeItem("pronosticos_wom");alert("Caché local limpiado.");}

function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
function parseBool(v){if(v===true)return true;return ["true","verdadero","si","sí","1","cumplida","cumplido"].includes(String(v||"").toLowerCase().trim());}
function parseNumber(v){if(typeof v==="number")return v;return Number(String(v||"0").replace(/\$/g,"").replace(/\./g,"").replace(",",".").trim())||0;}
function escapeHTML(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function escapeAttr(v){return escapeHTML(v);}
