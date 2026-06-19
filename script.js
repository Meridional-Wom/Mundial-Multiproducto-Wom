const API_URL="https://script.google.com/macros/s/AKfycbyb6FGbZw-JZ-fihSfjux0bJ3Two4tfgOXhq88RlET2fp75Y79kh1TS5Vp-XczLRLZoLg/exec";
const ADMIN_PASS="Meridional";

let config={},partidos=[],metas=[],pronosticos=[],resultados=[],tiendas=[],ultimaApuesta=null;

const fallback={
  config:{JornadaActual:1,TotalJornadas:7,FechaJornada:"Viernes 19 de junio",Premio:"🍕 Pizza Familiar"},
  partidos:[
    {Jornada:1,Hora:"15:00",Local:"Estados Unidos",Visita:"Australia",Resultado:"Pendiente",Ganador:""},
    {Jornada:1,Hora:"18:00",Local:"Escocia",Visita:"Marruecos",Resultado:"Pendiente",Ganador:""},
    {Jornada:1,Hora:"20:30",Local:"Brasil",Visita:"Haití",Resultado:"Pendiente",Ganador:""},
    {Jornada:1,Hora:"23:00",Local:"Turquía",Visita:"Paraguay",Resultado:"Pendiente",Ganador:""}
  ],
  metas:[],
  pronosticos:[],
  resultados:[]
};

document.addEventListener("DOMContentLoaded",async()=>{
  iniciarSplash();
  await cargarDesdeServidor(false);
  renderAll();
  showSection("inicio");
});

async function cargarDesdeServidor(showAlert=false){
  try{
    const res=await fetch(`${API_URL}?action=getData&t=${Date.now()}`);
    const data=await res.json();

    if(!data||data.ok===false) throw new Error("Respuesta inválida");

    procesarDatos(data);

    if(showAlert) alert("Datos actualizados desde Google Sheets.");
  }catch(e){
    console.warn(e);
    usarFallback();

    if(showAlert) alert("No se pudo actualizar desde Google Sheets.");
  }
}

function procesarDatos(data){
  config=configArrayToObject(data.config||[]);
  partidos=normalizarPartidos(data.partidos||[]);
  metas=normalizarMetas(data.metas||[]);
  pronosticos=normalizarPronosticos(data.pronosticos||[]);
  resultados=normalizarResultados(data.resultados||[]);

  if(!partidos.length) partidos=fallback.partidos;
  if(!metas.length) metas=fallback.metas;

  tiendas=obtenerTiendasDesdeMetas(metas);

  if(!tiendas.length) tiendas=["Sucursal Castro"];
}

function usarFallback(){
  config=fallback.config;
  partidos=fallback.partidos;
  metas=fallback.metas;
  pronosticos=JSON.parse(localStorage.getItem("pronosticos_wom")||"[]");
  resultados=fallback.resultados;
  tiendas=obtenerTiendasDesdeMetas(metas);
}

function configArrayToObject(rows){
  const obj={};

  rows.forEach(r=>{
    const c=r.Campo||r.campo||r.CAMPO;
    const v=r.Valor||r.valor||r.VALOR;
    if(c)obj[c]=v;
  });

  return{
    JornadaActual:Number(obj.JornadaActual||obj.jornadaActual||obj.numero_jornada||obj.Jornada||1),
    TotalJornadas:Number(obj.TotalJornadas||obj.totalJornadas||7),
    FechaJornada:obj.FechaJornada||obj.fechaJornada||obj.Fecha||"Viernes 19 de junio",
    Premio:obj.Premio||obj.premio||"🍕 Pizza Familiar",
    Clave:obj.Clave||obj.ClaveAdmin||ADMIN_PASS
  };
}

function normalizarPartidos(rows){
  return rows.map(r=>({
    Jornada:Number(r.Jornada||r.jornada||1),
    Hora:r.Hora||r["Hora Chile"]||r.hora||"",
    Local:r.Local||r.local||"",
    Visita:r.Visita||r.visita||"",
    Resultado:r.Resultado||r.resultado||"Pendiente",
    Ganador:r.Ganador||r.ganador||""
  })).filter(p=>p.Local&&p.Visita);
}

function normalizarMetas(rows){
  const agrupadas={};

  rows.forEach(r=>{
    const jornada=Number(r.Jornada||r.jornada||1);
    const tienda=r.Tienda||r.tienda||r["Punto de ventas"]||r.Punto||"";
    if(!tienda)return;

    const key=`${jornada}_${tienda}`;

    if(!agrupadas[key]){
      agrupadas[key]={
        Jornada:jornada,
        Tienda:tienda,
        AccesoriosMeta:0,
        AccesoriosAvance:0,
        SegurosMeta:0,
        SegurosAvance:0,
        WOMGOMeta:0,
        WOMGOAvance:0
      };
    }

    const tieneFormatoKPI=r.KPI||r.kpi;

    if(tieneFormatoKPI){
      const kpi=String(r.KPI||r.kpi||"").toLowerCase();
      const meta=Number(r.Meta||r.meta||0);
      const avance=Number(r.Avance||r.avance||0);

      if(kpi.includes("accesorios")){
        agrupadas[key].AccesoriosMeta=meta;
        agrupadas[key].AccesoriosAvance=avance;
      }

      if(kpi.includes("seguros")){
        agrupadas[key].SegurosMeta=meta;
        agrupadas[key].SegurosAvance=avance;
      }

      if(kpi.includes("womgo")){
        agrupadas[key].WOMGOMeta=meta;
        agrupadas[key].WOMGOAvance=avance;
      }
    }else{
      agrupadas[key].AccesoriosMeta=Number(r.AccesoriosMeta||r["Meta en $ Accesorios"]||r.Accesorios||0);
      agrupadas[key].AccesoriosAvance=Number(r.AccesoriosAvance||r.AvanceAccesorios||0);
      agrupadas[key].SegurosMeta=Number(r.SegurosMeta||r["Meta en Q Seguros"]||r.Seguros||0);
      agrupadas[key].SegurosAvance=Number(r.SegurosAvance||r.AvanceSeguros||0);
      agrupadas[key].WOMGOMeta=Number(r.WOMGOMeta||r["Meta WOMGO"]||r.WOMGO||0);
      agrupadas[key].WOMGOAvance=Number(r.WOMGOAvance||r.AvanceWOMGO||0);
    }
  });

  return Object.values(agrupadas);
}

function normalizarPronosticos(rows){
  return rows.map(r=>({
    ID:r.ID||r.Id||r.id||"",
    Fecha:r.Fecha||r.fecha||"",
    Hora:r.Hora||r.hora||"",
    Jornada:Number(r.Jornada||r.jornada||1),
    Tienda:r.Tienda||r.tienda||"",
    Partido:r.Partido||r.partido||"",
    Pronostico:
      r.Pronostico||
      r.PRONOSTICO||
      r.Pronóstico||
      r["Pronóstico"]||
      r.pronostico||
      r.eleccion||
      r.Eleccion||
      ""
  })).filter(p=>p.Tienda&&p.Partido);
}

function normalizarResultados(rows){
  return rows.map(r=>({
    Jornada:Number(r.Jornada||r.jornada||1),
    Tienda:r.Tienda||r.tienda||"",
    Clasificado:r.Clasificado||r.clasificado||"",
    Aciertos:r.Aciertos||r.aciertos||0,
    Premio:r.Premio||r.premio||"",
    Observacion:r.Observación||r.Observacion||r.observacion||"",
    Estado:r.Estado||r.estado||""
  })).filter(r=>r.Tienda||r.Observacion||r.Estado);
}

function obtenerTiendasDesdeMetas(rows){
  return[...new Set(rows.map(m=>m.Tienda).filter(Boolean))];
}

async function probarConexion(){
  try{
    const res=await fetch(`${API_URL}?action=ping&t=${Date.now()}`);
    const data=await res.json();
    alert(data.ok?"Conexión OK.":"La URL responde, pero no entregó OK.");
  }catch(e){
    alert("No conecta. Revisa la implementación del Apps Script.");
  }
}

function iniciarSplash(){
  const textos=["Cargando jornada...","Preparando partidos...","¡Que comience la competencia!"];
  let index=0;
  const loadingText=document.getElementById("loadingText");

  const intervalo=setInterval(()=>{
    index++;
    if(loadingText&&textos[index])loadingText.textContent=textos[index];
  },1300);

  setTimeout(()=>{
    clearInterval(intervalo);
    const s=document.getElementById("splashScreen");
    const a=document.getElementById("app");
    if(s)s.style.display="none";
    if(a)a.classList.remove("hidden");
  },4000);
}

function renderAll(){
  cargarInicio();
  cargarFormularioApuesta();
  cargarPronosticos();
  cargarMetas();
  cargarResultados();
  cargarAdmin();
}

function showSection(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));

  const section=document.getElementById(id);
  if(section)section.classList.add("active");

  if(id==="pronosticos")cargarPronosticos();
  if(id==="condicionMeta")cargarMetas();
  if(id==="resultados")cargarResultados();

  window.scrollTo({top:0,behavior:"smooth"});
}

function cargarInicio(){
  setText("jornadaActual",`${config.JornadaActual||1} de ${config.TotalJornadas||7}`);
  setText("fechaJornada",config.FechaJornada||"Viernes 19 de junio");
  setText("bannerPremio",`🎁 ${config.Premio||"Pizza Familiar para la tienda ganadora"}`);

  cargarGanadorInicio();

  const c=document.getElementById("partidosHoy");
  if(!c)return;

  const j=Number(config.JornadaActual||1);
  const data=partidos.filter(p=>Number(p.Jornada)===j);

  c.innerHTML=data.map(p=>`
    <div class="match-card">
      <div class="match-time">${escapeHTML(p.Hora)}</div>
      <div class="match-teams">
        ${escapeHTML(p.Local)} <span>VS</span> ${escapeHTML(p.Visita)}
      </div>
    </div>
  `).join("");
}

function cargarGanadorInicio(){
  const el=document.getElementById("ganadorJornadaInicio");
  if(!el)return;

  const j=Number(config.JornadaActual||1);

  const ganador=resultados.find(r=>
    Number(r.Jornada)===j&&
    (
      String(r.Observacion||"").toLowerCase().includes("ganador")||
      String(r.Estado||"").toLowerCase().includes("ganador")||
      String(r.Premio||"").toLowerCase()==="sí"||
      String(r.Premio||"").toLowerCase()==="si"
    )
  );

  if(ganador&&ganador.Tienda){
    const ac=ganador.Aciertos?` · ${ganador.Aciertos} aciertos`:"";
    el.textContent=`🏆 ${ganador.Tienda}${ac}`;
  }else{
    el.textContent="Resultado pendiente de actualización";
  }
}

function cargarFormularioApuesta(){
  const sel=document.getElementById("tienda");

  if(sel){
    sel.innerHTML=`<option value="">Seleccionar tienda</option>`;

    tiendas.forEach(t=>{
      sel.innerHTML+=`<option value="${escapeAttr(t)}">${escapeHTML(t)}</option>`;
    });

    sel.onchange=revisarTiendaSeleccionada;
  }

  const form=document.getElementById("formPartidos");

  if(form){
    const j=Number(config.JornadaActual||1);
    const data=partidos.filter(p=>Number(p.Jornada)===j);

    form.innerHTML=data.map((p,i)=>`
      <div class="bet-card">
        <h3>⚽ ${escapeHTML(p.Hora)}</h3>
        <p>${escapeHTML(p.Local)} VS ${escapeHTML(p.Visita)}</p>

        <select id="pronostico_${i}">
          <option value="">Seleccionar</option>
          <option value="${escapeAttr(p.Local)}">${escapeHTML(p.Local)}</option>
          <option value="Empate">Empate</option>
          <option value="${escapeAttr(p.Visita)}">${escapeHTML(p.Visita)}</option>
        </select>
      </div>
    `).join("");
  }

  resetFormularioApuesta();
}

function revisarTiendaSeleccionada(){
  const tienda=document.getElementById("tienda")?.value;

  resetFormularioApuesta();

  if(!tienda)return;

  const j=Number(config.JornadaActual||1);

  const reg=pronosticos.filter(p=>
    p.Tienda===tienda&&Number(p.Jornada)===j
  );

  if(reg.length){
    ultimaApuesta=armarApuestaDesdePronosticos(tienda,reg);

    const data=partidos.filter(p=>Number(p.Jornada)===j);

    data.forEach((p,i)=>{
      const txt=`${p.Local} VS ${p.Visita}`;
      const enc=reg.find(x=>x.Partido===txt);
      const s=document.getElementById(`pronostico_${i}`);

      if(s&&enc)s.value=enc.Pronostico;
    });

    mostrarApuestaGuardada(ultimaApuesta);
  }
}

function resetFormularioApuesta(){
  const btn=document.getElementById("btnGuardar");
  const box=document.getElementById("apuestaGuardada");
  const tienda=document.getElementById("tienda");

  if(btn)btn.style.display="block";
  if(box)box.classList.add("hidden");
  if(tienda)tienda.disabled=false;

  const j=Number(config.JornadaActual||1);
  const data=partidos.filter(p=>Number(p.Jornada)===j);

  data.forEach((_,i)=>{
    const s=document.getElementById(`pronostico_${i}`);

    if(s){
      s.disabled=false;
      s.value="";
    }
  });
}

async function guardarApuesta(){
  const tienda=document.getElementById("tienda")?.value;

  if(!tienda)return alert("Selecciona una tienda.");

  const j=Number(config.JornadaActual||1);

  if(pronosticos.some(p=>p.Tienda===tienda&&Number(p.Jornada)===j)){
    alert("Esta tienda ya registró su apuesta. No puede modificarse.");
    revisarTiendaSeleccionada();
    return;
  }

  const data=partidos.filter(p=>Number(p.Jornada)===j);

  const elecciones=data.map((p,i)=>({
    partido:`${p.Local} VS ${p.Visita}`,
    hora:p.Hora,
    local:p.Local,
    visita:p.Visita,
    pronostico:document.getElementById(`pronostico_${i}`)?.value
  }));

  if(elecciones.some(e=>!e.pronostico)){
    return alert("Completa todos los pronósticos.");
  }

  const fecha=new Date().toLocaleDateString("es-CL");
  const hora=new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});

  const payload={
    action:"savePronostico",
    fecha,
    hora,
    jornada:j,
    tienda,
    pronosticos:elecciones.map(e=>({
      partido:e.partido,
      pronostico:e.pronostico
    }))
  };

  try{
    const res=await fetch(API_URL,{
      method:"POST",
      body:JSON.stringify(payload)
    });

    const r=await res.json();

    if(!r.ok)throw new Error(r.error||"Error al guardar");

    await cargarDesdeServidor(false);
  }catch(e){
    console.warn(e);

    const id=Date.now();

    elecciones.forEach(x=>{
      pronosticos.push({
        ID:id,
        Fecha:fecha,
        Hora:hora,
        Jornada:j,
        Tienda:tienda,
        Partido:x.partido,
        Pronostico:x.pronostico
      });
    });

    localStorage.setItem("pronosticos_wom",JSON.stringify(pronosticos));

    alert("Guardado local. Revisa conexión con Google Sheets.");
  }

  const regs=pronosticos.filter(p=>p.Tienda===tienda&&Number(p.Jornada)===j);

  ultimaApuesta=armarApuestaDesdePronosticos(tienda,regs);

  mostrarApuestaGuardada(ultimaApuesta);
  cargarPronosticos();

  alert("Apuesta registrada correctamente.");
}

function armarApuestaDesdePronosticos(tienda,registros){
  return{
    tienda,
    jornada:Number(config.JornadaActual||1),
    fechaRegistro:registros[0]?.Fecha||new Date().toLocaleDateString("es-CL"),
    horaRegistro:registros[0]?.Hora||new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"}),
    elecciones:registros.map(r=>({
      partido:r.Partido,
      eleccion:r.Pronostico||r.Pronóstico||r.Eleccion||""
    }))
  };
}

function mostrarApuestaGuardada(registro){
  const btn=document.getElementById("btnGuardar");
  const box=document.getElementById("apuestaGuardada");
  const fecha=document.getElementById("fechaRegistro");
  const tienda=document.getElementById("tienda");

  if(btn)btn.style.display="none";
  if(box)box.classList.remove("hidden");
  if(fecha)fecha.textContent=`Registrada: ${registro.fechaRegistro} · ${registro.horaRegistro}`;
  if(tienda)tienda.disabled=true;

  const j=Number(config.JornadaActual||1);
  const data=partidos.filter(p=>Number(p.Jornada)===j);

  data.forEach((_,i)=>{
    const s=document.getElementById(`pronostico_${i}`);
    if(s)s.disabled=true;
  });
}

function cargarPronosticos(){
  const lista=document.getElementById("listaPronosticos");

  if(!lista)return;

  const j=Number(config.JornadaActual||1);

  const data=pronosticos.filter(p=>Number(p.Jornada)===j);

  if(!data.length){
    lista.innerHTML=`<div class="info-card"><p>Aún no hay apuestas registradas.</p></div>`;
    return;
  }

  const g={};

  data.forEach(p=>{
    if(!g[p.Tienda]){
      g[p.Tienda]={
        tienda:p.Tienda,
        fecha:p.Fecha,
        hora:p.Hora,
        pronosticos:[]
      };
    }

    g[p.Tienda].pronosticos.push(p);
  });

  lista.innerHTML=Object.values(g).map(item=>`
    <div class="prediction-card">
      <h3>🏪 ${escapeHTML(item.tienda)}</h3>
      <small>Registrada: ${escapeHTML(item.fecha)} · ${escapeHTML(item.hora)}</small>

      ${item.pronosticos.map(p=>`
        <p>
          <strong>⚽ ${escapeHTML(p.Partido)}</strong><br>
          ➡️ Elegimos: ${escapeHTML(p.Pronostico||p.Pronóstico||p.Eleccion||"")}
        </p>
      `).join("")}
    </div>
  `).join("");
}

function cargarMetas(){
  setText("condicionDia","Para competir, la tienda debe cumplir sus metas de Accesorios, Seguros y WOMGO.");

  const c=document.getElementById("metasTienda");

  if(!c)return;

  const j=Number(config.JornadaActual||1);
  const data=metas.filter(m=>Number(m.Jornada)===j);

  if(!data.length){
    c.innerHTML=`<p>No hay metas cargadas.</p>`;
    return;
  }

  c.innerHTML=data.map(m=>{
    const a=getPct(m.AccesoriosAvance,m.AccesoriosMeta);
    const s=getPct(m.SegurosAvance,m.SegurosMeta);
    const w=getPct(m.WOMGOAvance,m.WOMGOMeta);

    const ok=
      Number(m.AccesoriosMeta)>0&&
      Number(m.SegurosMeta)>0&&
      Number(m.WOMGOMeta)>0&&
      Number(m.AccesoriosAvance)>=Number(m.AccesoriosMeta)&&
      Number(m.SegurosAvance)>=Number(m.SegurosMeta)&&
      Number(m.WOMGOAvance)>=Number(m.WOMGOMeta);

    return`
      <div class="goal-row">
        <div class="goal-head">
          <strong>${escapeHTML(m.Tienda)}</strong>
          <span class="goal-status">${ok?"🟢 Clasificado":"🔴 En revisión"}</span>
        </div>

        ${kpiHTML("Accesorios",m.AccesoriosAvance,m.AccesoriosMeta,a,"$")}
        ${kpiHTML("Seguros",m.SegurosAvance,m.SegurosMeta,s,"Q")}
        ${kpiHTML("WOMGO",m.WOMGOAvance,m.WOMGOMeta,w,"Q")}
      </div>
    `;
  }).join("");
}

function kpiHTML(n,av,mt,pct,tipo){
  return`
    <div class="kpi-line">
      <small>${escapeHTML(n)}</small>
      <div class="kpi-bar">
        <span style="width:${pct}%"></span>
      </div>
      <b>${formatValor(av,tipo)}/${formatValor(mt,tipo)}</b>
    </div>
  `;
}

function getPct(a,m){
  a=Number(a)||0;
  m=Number(m)||0;
  if(m<=0)return 0;
  return Math.min(Math.round((a/m)*100),100);
}

function formatValor(v,tipo){
  const n=Number(v)||0;
  if(tipo==="$")return"$"+n.toLocaleString("es-CL");
  return String(n);
}

function cargarResultados(){
  const rp=document.getElementById("resultadosPartidos");

  if(rp){
    const j=Number(config.JornadaActual||1);
    const data=partidos.filter(p=>Number(p.Jornada)===j);

    rp.innerHTML=data.map(p=>`
      <div class="result-card">
        <strong>⚽ ${escapeHTML(p.Local)} VS ${escapeHTML(p.Visita)}</strong>
        <p>${escapeHTML(p.Resultado||"Pendiente")}</p>
        <small>${p.Ganador?`Ganador: ${escapeHTML(p.Ganador)}`:"Pendiente"}</small>
      </div>
    `).join("");
  }

  const rf=document.getElementById("resultadoJornada");

  if(!rf)return;

  const j=Number(config.JornadaActual||1);
  const data=resultados.filter(r=>Number(r.Jornada)===j);

  if(!data.length){
    rf.innerHTML=`<p>Resultado de jornada pendiente.</p>`;
    return;
  }

  rf.innerHTML=data.map(r=>`
    <div class="result-card">
      <strong>${escapeHTML(r.Tienda||"")}</strong>
      <p>Aciertos: ${escapeHTML(r.Aciertos||0)}</p>
      <small>${escapeHTML(r.Observacion||r.Estado||"")}</small>
    </div>
  `).join("");
}

function compartirApuesta(){
  if(!ultimaApuesta)return alert("Primero guarda una apuesta.");

  const canvas=document.createElement("canvas");
  canvas.width=1080;
  canvas.height=1350;

  const ctx=canvas.getContext("2d");

  const grad=ctx.createLinearGradient(0,0,1080,1350);
  grad.addColorStop(0,"#23004d");
  grad.addColorStop(.45,"#090011");
  grad.addColorStop(1,"#6f00ff");

  ctx.fillStyle=grad;
  ctx.fillRect(0,0,1080,1350);

  ctx.fillStyle="rgba(255,47,146,.22)";
  ctx.fillRect(0,0,1080,18);

  ctx.fillStyle="#fff";
  ctx.font="bold 58px Arial";
  ctx.fillText("🏆 MUNDIAL",70,100);

  ctx.fillStyle="#ff2f92";
  ctx.font="bold 60px Arial";
  ctx.fillText("MULTIPRODUCTO",70,170);

  ctx.fillStyle="#fff";
  ctx.font="bold 34px Arial";
  ctx.fillText("WOM MERIDIONAL",70,225);

  drawCanvasCard(ctx,70,275,940,145);

  ctx.fillStyle="#fff";
  ctx.font="bold 38px Arial";
  ctx.fillText(`🏪 ${ultimaApuesta.tienda.toUpperCase()}`,110,340);

  ctx.fillStyle="#ff2f92";
  ctx.font="bold 34px Arial";
  ctx.fillText("⚽ NUESTRA APUESTA",110,395);

  ctx.fillStyle="#c9c3da";
  ctx.font="28px Arial";
  ctx.fillText(`Jornada ${ultimaApuesta.jornada} de ${config.TotalJornadas||7}`,110,445);

  let y=520;

  ultimaApuesta.elecciones.forEach(e=>{
    const elegido=e.eleccion||e.pronostico||e.Pronostico||e.Pronóstico||e.Eleccion||"";

    drawCanvasCard(ctx,70,y,940,145);

    ctx.fillStyle="#fff";
    ctx.font="bold 30px Arial";
    ctx.fillText(`⚽ ${e.partido}`,110,y+50);

    ctx.fillStyle="#ff2f92";
    ctx.font="bold 34px Arial";
    ctx.fillText(`➡️ Elegimos: ${elegido}`,110,y+105);

    y+=160;
  });

  drawCanvasCard(ctx,70,1165,940,90);

  ctx.fillStyle="#fff";
  ctx.font="bold 28px Arial";
  ctx.fillText(`🎁 Premio: ${String(config.Premio||"Pizza Familiar").replace("🍕 ","")}`,110,1218);

  ctx.fillStyle="#c9c3da";
  ctx.font="26px Arial";
  ctx.fillText(`Registrada: ${ultimaApuesta.fechaRegistro} · ${ultimaApuesta.horaRegistro}`,70,1290);

  ctx.fillStyle="#fff";
  ctx.font="bold 28px Arial";
  ctx.fillText("⚽ Pronostica • Cumple • Compite • Gana",70,1330);

  compartirCanvas(canvas,"apuesta-wom.png");
}

function drawCanvasCard(ctx,x,y,w,h){
  ctx.fillStyle="rgba(22,14,40,.92)";
  ctx.strokeStyle="rgba(151,82,255,.46)";
  ctx.lineWidth=3;
  roundRect(ctx,x,y,w,h,26,true,true);
}

function roundRect(ctx,x,y,w,h,r,fill,stroke){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();

  if(fill)ctx.fill();
  if(stroke)ctx.stroke();
}

function compartirCanvas(canvas,nombre){
  canvas.toBlob(async blob=>{
    const file=new File([blob],nombre,{type:"image/png"});

    if(navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({
        title:"Mundial Multiproducto WOM",
        files:[file]
      });
    }else{
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=nombre;
      a.click();
      alert("Imagen generada. Se descargó para compartir por WhatsApp.");
    }
  });
}

function validarAdmin(){
  const pass=document.getElementById("adminPass")?.value;
  const clave=config.Clave||ADMIN_PASS;

  if(pass!==clave)return alert("Código incorrecto.");

  document.getElementById("adminLogin")?.classList.add("hidden");
  document.getElementById("adminContent")?.classList.remove("hidden");
}

function cargarAdmin(){
  const e=document.getElementById("estadoConexion");
  if(e)e.textContent="Conectado a Google Sheets";
}

function limpiarApuestasLocales(){
  localStorage.removeItem("pronosticos_wom");
  alert("Caché local limpiado.");
}

function reabrirApuestaAdmin(){
  const tienda=prompt("Nombre exacto de la tienda a reabrir solo localmente:");

  if(!tienda)return;

  const j=Number(config.JornadaActual||1);

  pronosticos=pronosticos.filter(p=>
    !(p.Tienda===tienda&&Number(p.Jornada)===j)
  );

  localStorage.setItem("pronosticos_wom",JSON.stringify(pronosticos));

  cargarPronosticos();
  cargarFormularioApuesta();

  alert(`Apuesta local reabierta para: ${tienda}`);
}

function setText(id,value){
  const el=document.getElementById(id);
  if(el)el.textContent=value;
}

function escapeHTML(v){
  return String(v??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[c]));
}

function escapeAttr(v){
  return escapeHTML(v);
}