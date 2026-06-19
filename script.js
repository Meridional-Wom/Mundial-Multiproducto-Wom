/* =========================
   DATOS DE PRUEBA
========================= */

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
  fase: "Fase 1: Activación",
  fecha: "Viernes 19 de junio",
  cierre: "13:00",
  condicion: "Mínimo 1 WOMGO vendido",
  partidos: [
    { hora:"12:00", local:"Estados Unidos", visita:"Australia", estadio:"Estadio SoFi" },
    { hora:"15:00", local:"Escocia", visita:"Marruecos", estadio:"Lincoln Financial Field" },
    { hora:"18:00", local:"Brasil", visita:"Haití", estadio:"Hard Rock Stadium" },
    { hora:"21:00", local:"Turquía", visita:"Paraguay", estadio:"Mercedes-Benz Stadium" }
  ]
};

const metasDia = [
  { tienda:"Castro", meta:8, avance:5, condicion:true },
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

/* =========================
   INICIO
========================= */

document.addEventListener("DOMContentLoaded", () => {
  cargarInicio();
  cargarApuesta();
  cargarPronosticos();
  cargarMarcador();
  cargarCopaPizza();
  cargarAvance();
  showSection("inicio");
});

/* =========================
   NAVEGACIÓN
========================= */

function showSection(id){
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.remove("active");
  });

  const section = document.getElementById(id);
  if(section) section.classList.add("active");

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

/* =========================
   CARGA INICIO
========================= */

function cargarInicio(){
  setText("jornadaActual", `${jornadaActual.numero} de 7`);
  setText("faseActual", jornadaActual.fase);
  setText("fechaJornada", jornadaActual.fecha);
  setText("condicionDia", jornadaActual.condicion);

  const partidos = document.getElementById("partidosHoy");
  if(partidos){
    partidos.innerHTML = jornadaActual.partidos.map((p, i) => `
      <div class="fixture-card">
        <div class="fixture-time">${p.hora}</div>
        <div>
          <strong>${p.local}</strong>
          <small>${p.estadio}</small>
        </div>
        <div class="fixture-vs">VS</div>
        <div>
          <strong>${p.visita}</strong>
        </div>
      </div>
    `).join("");
  }

  const apiInput = document.getElementById("apiUrl");
  if(apiInput) apiInput.value = apiUrl;

  iniciarContador();
}

function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = value;
}

/* =========================
   APUESTA
========================= */

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
      <div class="fixture-card apuesta-card">
        <div>
          <strong>${p.local} vs ${p.visita}</strong>
          <small>${p.hora} hrs</small>
        </div>
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

  const pronosticos = jornadaActual.partidos.map((p, i) => {
    return {
      partido: `${p.local} vs ${p.visita}`,
      pronostico: document.getElementById(`pronostico_${i}`).value
    };
  });

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
  cargarMarcador();
  showSection("pronosticos");
}

/* =========================
   PRONÓSTICOS
========================= */

function cargarPronosticos(){
  const cont = document.getElementById("tablaPronosticos");
  if(!cont) return;

  const data = apuestas.filter(a => a.jornada === jornadaActual.numero);

  if(!data.length){
    cont.innerHTML = `
      <p>Aún no hay pronósticos registrados.</p>
    `;
    return;
  }

  cont.innerHTML = data.map(a => `
    <div class="ranking-row">
      <div>
        <strong>${a.tienda}</strong>
        <small>${a.responsable}</small>
      </div>
      <div>
        ${a.pronosticos.map(p => `<span class="chip">${p.pronostico}</span>`).join("")}
      </div>
    </div>
  `).join("");
}

/* =========================
   AVANCE
========================= */

function cargarAvance(){
  const cont = document.getElementById("avanceDia");
  if(!cont) return;

  cont.innerHTML = metasDia.map(m => {
    const pct = Math.round((m.avance / m.meta) * 100);
    const estado = pct >= 100 && m.condicion ? "En competencia" : "En riesgo";

    return `
      <div class="advance-row">
        <div>
          <strong>${m.tienda}</strong>
          <small>Meta ${m.meta} · Avance ${m.avance}</small>
        </div>
        <div class="bar">
          <span style="width:${Math.min(pct,100)}%"></span>
        </div>
        <b>${pct}%</b>
        <em class="${estado === "En competencia" ? "ok" : "risk"}">${estado}</em>
      </div>
    `;
  }).join("");
}

/* =========================
   MARCADOR
========================= */

function cargarMarcador(){
  const cont = document.getElementById("marcadorTabla");
  if(!cont) return;

  const ranking = metasDia.map((m, i) => {
    const pct = Math.round((m.avance / m.meta) * 100);
    return {
      tienda:m.tienda,
      aciertos: Math.max(0, 18 - i * 2),
      pct,
      valido: pct >= 100 && m.condicion
    };
  }).sort((a,b) => b.aciertos - a.aciertos);

  cont.innerHTML = ranking.map((r, i) => `
    <div class="ranking-row">
      <div>
        <strong>${medalla(i)} ${r.tienda}</strong>
        <small>${r.valido ? "Habilitada" : "Pendiente de meta/condición"}</small>
      </div>
      <div>
        <b>${r.aciertos} pts</b>
      </div>
    </div>
  `).join("");
}

function medalla(i){
  if(i === 0) return "🥇";
  if(i === 1) return "🥈";
  if(i === 2) return "🥉";
  return `${i + 1}.`;
}

/* =========================
   COPA PIZZA
========================= */

function cargarCopaPizza(){
  const cont = document.getElementById("copaPizza");
  if(!cont) return;

  cont.innerHTML = copaPizza.map((r, i) => `
    <div class="ranking-row">
      <div>
        <strong>${medalla(i)} ${r.tienda}</strong>
        <small>Historial Copa Pizza</small>
      </div>
      <div class="pizza-count">
        ${r.pizzas ? "🍕".repeat(r.pizzas) : "0"}
      </div>
    </div>
  `).join("");
}

/* =========================
   CONTADOR
========================= */

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
  setInterval(update, 60000);
}

/* =========================
   COMPARTIR IMAGEN
========================= */

async function generarReportePartidos(){
  const canvas = crearCanvasBase("PARTIDOS DEL DÍA");

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fff";
  ctx.font = "bold 38px Arial";
  ctx.fillText(`Jornada ${jornadaActual.numero} de 7`, 80, 290);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 34px Arial";
  ctx.fillText(jornadaActual.fecha, 80, 340);

  let y = 440;

  jornadaActual.partidos.forEach((p, i) => {
    drawCard(ctx, 70, y, 940, 95);

    ctx.fillStyle = "#ff2f92";
    ctx.font = "bold 28px Arial";
    ctx.fillText(p.hora, 100, y + 58);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 34px Arial";
    ctx.fillText(p.local, 220, y + 58);

    ctx.fillStyle = "#ffcc33";
    ctx.font = "bold 34px Arial";
    ctx.fillText("VS", 530, y + 58);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 34px Arial";
    ctx.fillText(p.visita, 620, y + 58);

    y += 120;
  });

  drawCard(ctx, 70, 1050, 940, 170);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 36px Arial";
  ctx.fillText("🎯 CONDICIÓN DEL DÍA", 110, 1115);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 38px Arial";
  wrapText(ctx, jornadaActual.condicion, 110, 1175, 850, 44);

  ctx.fillStyle = "#ffcc33";
  ctx.font = "bold 30px Arial";
  ctx.fillText("⏰ Cierre de apuestas: 13:00 hrs", 110, 1270);

  compartirCanvas(canvas, "reporte-partidos.png");
}

async function generarReporteMetas(){
  const canvas = crearCanvasBase("METAS DEL DÍA");
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fff";
  ctx.font = "bold 36px Arial";
  ctx.fillText("Condición + Meta por tienda", 80, 300);

  let y = 390;

  metasDia.forEach(m => {
    const pct = Math.round((m.avance / m.meta) * 100);

    drawCard(ctx, 70, y, 940, 105);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 32px Arial";
    ctx.fillText(m.tienda, 110, y + 42);

    ctx.fillStyle = "#b9b9d1";
    ctx.font = "26px Arial";
    ctx.fillText(`Meta ${m.meta} · Avance ${m.avance}`, 110, y + 78);

    ctx.fillStyle = pct >= 100 ? "#21e66a" : "#ffcc33";
    ctx.font = "bold 34px Arial";
    ctx.fillText(`${pct}%`, 840, y + 62);

    y += 125;
  });

  drawCard(ctx, 70, 1090, 940, 150);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 34px Arial";
  ctx.fillText("🏆 REQUISITOS PARA COMPETIR", 110, 1150);

  ctx.fillStyle = "#fff";
  ctx.font = "28px Arial";
  ctx.fillText("✅ Cumplir condición del día", 110, 1195);
  ctx.fillText("✅ Cumplir meta diaria de la tienda", 110, 1235);

  compartirCanvas(canvas, "reporte-metas.png");
}

function crearCanvasBase(titulo){
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;

  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
  grad.addColorStop(0,"#090015");
  grad.addColorStop(.45,"#34006f");
  grad.addColorStop(1,"#090015");

  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 58px Arial";
  ctx.fillText("WOM", 70, 90);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 34px Arial";
  ctx.fillText("MERIDIONAL", 70, 130);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 70px Arial";
  ctx.fillText("MUNDIAL", 70, 210);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 70px Arial";
  ctx.fillText("MULTIPRODUCTO", 70, 280);

  ctx.fillStyle = "#ffcc33";
  ctx.font = "bold 42px Arial";
  ctx.fillText(`🍕 ${titulo}`, 70, 365);

  return canvas;
}

function drawCard(ctx, x, y, w, h){
  ctx.fillStyle = "rgba(20,0,45,.88)";
  ctx.strokeStyle = "rgba(255,47,146,.65)";
  ctx.lineWidth = 3;

  roundRect(ctx, x, y, w, h, 28, true, true);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();

  if(fill) ctx.fill();
  if(stroke) ctx.stroke();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(" ");
  let line = "";

  for(let n = 0; n < words.length; n++){
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);

    if(metrics.width > maxWidth && n > 0){
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, y);
}

function compartirCanvas(canvas, nombre){
  canvas.toBlob(async blob => {
    const file = new File([blob], nombre, { type:"image/png" });

    if(navigator.canShare && navigator.canShare({ files:[file] })){
      await navigator.share({
        title:"Mundial Multiproducto WOM",
        files:[file]
      });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      a.click();
      alert("Imagen generada. Se descargó para compartir por WhatsApp.");
    }
  });
}

/* =========================
   ADMIN / API
========================= */

function guardarApi(){
  const input = document.getElementById("apiUrl");
  if(!input) return;

  apiUrl = input.value.trim();
  localStorage.setItem("api_wom", apiUrl);

  alert("Conexión guardada.");
}