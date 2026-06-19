const tiendas = [
  "Castro",
  "Ancud",
  "Osorno",
  "Valdivia",
  "Puerto Varas",
  "Puerto Montt",
  "Paseo Costanera",
  "Villarrica",
  "Kiosco Plaza Los Ríos",
  "Kiosco Mall Castro"
];

const jornadaActual = {
  numero: 1,
  fecha: "Viernes 19 de junio",
  cierre: "13:00",
  condicion: "Mínimo 1 WOMGO vendido",
  meta: 8,
  avance: 5,
  condicionCumplida: false,
  partidos: [
    { hora:"12:00", local:"Estados Unidos", visita:"Australia" },
    { hora:"15:00", local:"Escocia", visita:"Marruecos" },
    { hora:"18:00", local:"Brasil", visita:"Haití" },
    { hora:"21:00", local:"Turquía", visita:"Paraguay" }
  ]
};

const metasDia = [
  { tienda:"Castro", meta:8, avance:5, condicion:false },
  { tienda:"Ancud", meta:5, avance:2, condicion:false },
  { tienda:"Osorno", meta:10, avance:7, condicion:true },
  { tienda:"Valdivia", meta:12, avance:9, condicion:true },
  { tienda:"Puerto Montt", meta:9, avance:4, condicion:false }
];

const copaPizza = [
  { tienda:"Castro", pizzas:3 },
  { tienda:"Osorno", pizzas:2 },
  { tienda:"Valdivia", pizzas:1 },
  { tienda:"Ancud", pizzas:0 },
  { tienda:"Puerto Varas", pizzas:0 }
];

let apuestas = JSON.parse(localStorage.getItem("apuestas_wom") || "[]");
let apiUrl = localStorage.getItem("api_wom") || "";

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("splash").classList.add("hidden");
  }, 1800);

  cargarInicio();
  cargarApuesta();
  cargarPronosticos();
  cargarMarcador();
  cargarCopaPizza();
  cargarAvance();
  showSection("inicio");
});

function showSection(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
  window.scrollTo({ top:0, behavior:"smooth" });
}

function admin(){
  const clave = prompt("Código administrador");

  if(clave !== "Meridional"){
    alert("Código incorrecto");
    return;
  }

  showSection("adminPanel");
}

function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = value;
}

function cargarInicio(){
  const porcentaje = Math.round((jornadaActual.avance / jornadaActual.meta) * 100);
  const metaCumplida = porcentaje >= 100;
  const compite = metaCumplida && jornadaActual.condicionCumplida;

  setText("jornadaActual", `${jornadaActual.numero} de 7`);
  setText("fechaJornada", jornadaActual.fecha);
  setText("condicionDia", jornadaActual.condicion);
  setText("estadoCondicion", jornadaActual.condicionCumplida ? "Cumplida" : "Pendiente");
  setText("metaResumen", `${jornadaActual.avance} / ${jornadaActual.meta} ventas`);
  setText("estadoMeta", `${porcentaje}% cumplido`);
  setText("estadoCompetencia", compite ? "En competencia" : "No compite aún");

  const barra = document.getElementById("metaBarra");
  if(barra) barra.style.width = `${Math.min(porcentaje,100)}%`;

  const partidos = document.getElementById("partidosHoy");
  if(partidos){
    partidos.innerHTML = jornadaActual.partidos.map(p => `
      <div class="match-card">
        <div class="match-time">${p.hora}</div>
        <div class="team">${p.local}</div>
        <div class="vs">VS</div>
        <div class="team away">${p.visita}</div>
      </div>
    `).join("");
  }

  const apiInput = document.getElementById("apiUrl");
  if(apiInput) apiInput.value = apiUrl;

  iniciarContador();
}

function cargarApuesta(){
  const select = document.getElementById("tienda");

  if(select){
    select.innerHTML = `<option value="">Seleccionar tienda</option>`;
    tiendas.forEach(t => {
      select.innerHTML += `<option value="${t}">${t}</option>`;
    });
  }

  const form = document.getElementById("formPartidos");

  if(form){
    form.innerHTML = jornadaActual.partidos.map((p, i) => `
      <div class="apuesta-card">
        <strong>${p.local} vs ${p.visita}</strong>
        <small>${p.hora}</small>

        <select id="pronostico_${i}">
          <option value="">Pronóstico</option>
          <option value="${p.local}">Gana ${p.local}</option>
          <option value="Empate">Empate</option>
          <option value="${p.visita}">Gana ${p.visita}</option>
        </select>
      </div>
    `).join("");
  }
}

function guardarApuesta(){
  const tienda = document.getElementById("tienda")?.value;
  const responsable = document.getElementById("responsable")?.value.trim();

  if(!tienda) return alert("Selecciona una tienda.");
  if(!responsable) return alert("Ingresa responsable.");

  const pronosticos = jornadaActual.partidos.map((p, i) => ({
    partido:`${p.local} vs ${p.visita}`,
    pronostico:document.getElementById(`pronostico_${i}`).value
  }));

  if(pronosticos.some(p => !p.pronostico)){
    return alert("Completa todos los pronósticos.");
  }

  const registro = {
    jornada:jornadaActual.numero,
    tienda,
    responsable,
    pronosticos,
    fecha:new Date().toISOString()
  };

  apuestas = apuestas.filter(a => !(a.jornada === jornadaActual.numero && a.tienda === tienda));
  apuestas.push(registro);

  localStorage.setItem("apuestas_wom", JSON.stringify(apuestas));

  alert("Apuesta guardada correctamente.");
  cargarPronosticos();
  showSection("pronosticos");
}

function cargarPronosticos(){
  const cont = document.getElementById("tablaPronosticos");
  if(!cont) return;

  const data = apuestas.filter(a => a.jornada === jornadaActual.numero);

  if(!data.length){
    cont.innerHTML = `<p>Aún no hay pronósticos registrados.</p>`;
    return;
  }

  cont.innerHTML = data.map(a => `
    <div class="ranking-row">
      <strong>${a.tienda}</strong>
      <small>${a.responsable}</small>
      <div>
        ${a.pronosticos.map(p => `<span class="chip">${p.pronostico}</span>`).join("")}
      </div>
    </div>
  `).join("");
}

function cargarAvance(){
  const cont = document.getElementById("avanceDia");
  if(!cont) return;

  cont.innerHTML = metasDia.map(m => {
    const pct = Math.round((m.avance / m.meta) * 100);
    const estado = pct >= 100 && m.condicion ? "En competencia" : "Pendiente";

    return `
      <div class="advance-row">
        <strong>${m.tienda}</strong>
        <small>Meta ${m.meta} · Avance ${m.avance}</small>
        <div class="bar"><span style="width:${Math.min(pct,100)}%"></span></div>
        <small>${pct}% · ${estado}</small>
      </div>
    `;
  }).join("");
}

function cargarMarcador(){
  const cont = document.getElementById("marcadorTabla");
  if(!cont) return;

  const ranking = metasDia.map((m, i) => {
    const pct = Math.round((m.avance / m.meta) * 100);
    return {
      tienda:m.tienda,
      puntos:Math.max(0,18 - i * 2),
      valido:pct >= 100 && m.condicion
    };
  });

  cont.innerHTML = ranking.map((r, i) => `
    <div class="ranking-row">
      <strong>${medalla(i)} ${r.tienda}</strong>
      <small>${r.valido ? "Habilitada" : "Pendiente meta/condición"}</small>
      <b>${r.puntos} pts</b>
    </div>
  `).join("");
}

function cargarCopaPizza(){
  const cont = document.getElementById("copaPizza");
  if(!cont) return;

  cont.innerHTML = copaPizza.map((r, i) => `
    <div class="ranking-row">
      <strong>${medalla(i)} ${r.tienda}</strong>
      <small>Copa Pizza</small>
      <div class="pizza-count">${r.pizzas ? "🍕".repeat(r.pizzas) : "0"}</div>
    </div>
  `).join("");
}

function medalla(i){
  if(i === 0) return "🥇";
  if(i === 1) return "🥈";
  if(i === 2) return "🥉";
  return `${i + 1}.`;
}

function iniciarContador(){
  const contador = document.getElementById("contador");
  if(!contador) return;

  function update(){
    const ahora = new Date();
    const cierre = new Date();
    cierre.setHours(13,0,0,0);

    const diff = cierre - ahora;

    if(diff <= 0){
      contador.textContent = "Cerrado";
      return;
    }

    const h = Math.floor(diff / 1000 / 60 / 60);
    const m = Math.floor((diff / 1000 / 60) % 60);

    contador.textContent = `${h}h ${String(m).padStart(2,"0")}m`;
  }

  update();
  setInterval(update,60000);
}

function generarReportePartidos(){
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0b0b0f";
  ctx.fillRect(0,0,1080,1350);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 58px Arial";
  ctx.fillText("MUNDIAL",70,120);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 58px Arial";
  ctx.fillText("MULTIPRODUCTO",70,185);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px Arial";
  ctx.fillText("WOM MERIDIONAL",70,240);

  ctx.fillStyle = "#aaaabb";
  ctx.font = "28px Arial";
  ctx.fillText(`Jornada ${jornadaActual.numero} de 7 · ${jornadaActual.fecha}`,70,310);

  let y = 400;

  jornadaActual.partidos.forEach(p => {
    drawReportCard(ctx,70,y,940,120);

    ctx.fillStyle = "#aaaabb";
    ctx.font = "bold 26px Arial";
    ctx.fillText(p.hora,105,y+70);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Arial";
    ctx.fillText(p.local,230,y+70);

    ctx.fillStyle = "#ff2f92";
    ctx.font = "bold 28px Arial";
    ctx.fillText("VS",560,y+70);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Arial";
    ctx.fillText(p.visita,640,y+70);

    y += 145;
  });

  drawReportCard(ctx,70,1040,940,160);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 34px Arial";
  ctx.fillText("CONDICIÓN DEL DÍA",105,1105);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Arial";
  ctx.fillText(jornadaActual.condicion,105,1165);

  ctx.fillStyle = "#aaaabb";
  ctx.font = "28px Arial";
  ctx.fillText("Cierre de apuestas: 13:00 hrs",105,1230);

  compartirCanvas(canvas,"reporte-jornada.png");
}

function drawReportCard(ctx,x,y,w,h){
  ctx.fillStyle = "#17171d";
  ctx.strokeStyle = "#2b2b34";
  ctx.lineWidth = 3;
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

  if(fill) ctx.fill();
  if(stroke) ctx.stroke();
}

function compartirCanvas(canvas,nombre){
  canvas.toBlob(async blob => {
    const file = new File([blob], nombre, { type:"image/png" });

    if(navigator.canShare && navigator.canShare({ files:[file] })){
      await navigator.share({
        title:"Mundial Multiproducto WOM",
        files:[file]
      });
    }else{
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      a.click();
      alert("Imagen generada. Se descargó para compartir por WhatsApp.");
    }
  });
}

function guardarApi(){
  const input = document.getElementById("apiUrl");
  if(!input) return;

  apiUrl = input.value.trim();
  localStorage.setItem("api_wom",apiUrl);

  alert("Conexión guardada.");
}