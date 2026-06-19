const tiendas = [
  "Sucursal Villarrica",
  "Sucursal Valdivia",
  "Kiosco Plaza Los Ríos",
  "Sucursal Osorno",
  "Sucursal Puerto Varas",
  "Sucursal Puerto Montt Centro",
  "Sucursal Paseo Costanera",
  "Sucursal Ancud",
  "Sucursal Castro",
  "Kiosco Mall Castro"
];

const jornadas = [
  {
    jornada: 1,
    texto: "Viernes 19 de junio",
    fase: "Fase 1: Activación",
    condicion: "Mínimo 1 WOMGO vendido",
    partidos: [
      ["Estados Unidos", "Australia"],
      ["Escocia", "Marruecos"],
      ["Brasil", "Haití"],
      ["Turquía", "Paraguay"]
    ]
  },
  {
    jornada: 2,
    texto: "Lunes 22 de junio",
    fase: "Fase 1: Activación",
    condicion: "Mínimo 1 WOMGO vendido",
    partidos: [
      ["Argentina", "Austria"],
      ["Francia", "Irak"],
      ["Noruega", "Senegal"],
      ["Jordania", "Argelia"]
    ]
  },
  {
    jornada: 3,
    texto: "Martes 23 de junio",
    fase: "Fase 2: Presión",
    condicion: "50% o más de cumplimiento WOMGO",
    partidos: [
      ["Portugal", "Uzbekistán"],
      ["Inglaterra", "Ghana"],
      ["Panamá", "Croacia"],
      ["Colombia", "RD Congo"]
    ]
  },
  {
    jornada: 4,
    texto: "Miércoles 24 de junio",
    fase: "Fase 2: Presión",
    condicion: "50% o más de cumplimiento WOMGO",
    partidos: [
      ["Suiza", "Canadá"],
      ["Bosnia y Herzegovina", "Qatar"],
      ["Escocia", "Brasil"],
      ["Marruecos", "Haití"],
      ["Chequia", "México"],
      ["Sudáfrica", "Corea del Sur"]
    ]
  },
  {
    jornada: 5,
    texto: "Jueves 25 de junio",
    fase: "Fase 3: Esprint",
    condicion: "80% o más de cumplimiento WOMGO",
    partidos: [
      ["Ecuador", "Alemania"],
      ["Curazao", "Costa de Marfil"],
      ["Túnez", "Países Bajos"],
      ["Japón", "Suecia"],
      ["Turquía", "Estados Unidos"],
      ["Paraguay", "Australia"]
    ]
  },
  {
    jornada: 6,
    texto: "Viernes 26 de junio",
    fase: "Fase 3: Esprint",
    condicion: "80% o más de cumplimiento WOMGO",
    partidos: [
      ["Noruega", "Francia"],
      ["Senegal", "Irak"],
      ["Uruguay", "España"],
      ["Cabo Verde", "Arabia Saudita"],
      ["Nueva Zelanda", "Bélgica"],
      ["Egipto", "Irán"]
    ]
  },
  {
    jornada: 7,
    texto: "Martes 30 de junio",
    fase: "Fase 4: Gran Final",
    condicion: "100% cumplimiento WOMGO",
    partidos: []
  }
];

let jornadaActual = jornadas[0];
let apuestasLocales = JSON.parse(localStorage.getItem("apuestas_wom") || "[]");
let apiUrl = localStorage.getItem("api_wom") || "";

document.addEventListener("DOMContentLoaded", () => {
  cargarInicio();
  cargarTiendas();
  cargarFormularioApuesta();
  cargarPronosticos();
  cargarMarcador();
  cargarCopaPizza();
  iniciarContador();
  showSection("inicio");
});

function showSection(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const section = document.getElementById(id);
  if(section) section.classList.add("active");
  window.scrollTo({top:0, behavior:"smooth"});
}

function admin(){
  const clave = prompt("Ingrese código de administrador");
  if(clave !== "Meridional"){
    alert("Código incorrecto");
    return;
  }
  showSection("adminPanel");
}

function cargarInicio(){
  const jornada = document.getElementById("jornadaActual");
  const condicion = document.getElementById("condicionDia");

  if(jornada) jornada.textContent = `${jornadaActual.jornada} de 7`;
  if(condicion) condicion.textContent = jornadaActual.condicion;

  const cont = document.getElementById("partidosHoy");
  if(!cont) return;

  if(!jornadaActual.partidos.length){
    cont.innerHTML = `<p>Partidos pendientes de definir.</p>`;
    return;
  }

  cont.innerHTML = jornadaActual.partidos.map(p => `
    <div class="match-card">
      <span>${p[0]}</span>
      <b>VS</b>
      <span>${p[1]}</span>
    </div>
  `).join("");
}

function cargarTiendas(){
  const select = document.getElementById("tienda");
  if(select){
    select.innerHTML = `<option value="">Seleccionar tienda</option>`;
    tiendas.forEach(t => select.innerHTML += `<option value="${t}">${t}</option>`);
  }

  const apiInput = document.getElementById("apiUrl");
  if(apiInput) apiInput.value = apiUrl;
}

function cargarFormularioApuesta(){
  const cont = document.getElementById("formPartidos");
  if(!cont) return;

  cont.innerHTML = jornadaActual.partidos.map((p,i) => `
    <div class="partido">
      <strong>${p[0]} vs ${p[1]}</strong>
      <select id="partido_${i}">
        <option value="">Seleccionar</option>
        <option value="${p[0]}">Gana ${p[0]}</option>
        <option value="Empate">Empate</option>
        <option value="${p[1]}">Gana ${p[1]}</option>
      </select>
    </div>
  `).join("");
}

function guardarApuesta(){
  const tienda = document.getElementById("tienda").value;
  const responsable = document.getElementById("responsable").value.trim();

  if(!tienda) return alert("Selecciona una tienda.");
  if(!responsable) return alert("Ingresa responsable.");

  const pronosticos = jornadaActual.partidos.map((p,i) => {
    const valor = document.getElementById(`partido_${i}`).value;
    return { partido:`${p[0]} vs ${p[1]}`, pronostico:valor };
  });

  if(pronosticos.some(p => !p.pronostico)){
    return alert("Completa todos los pronósticos.");
  }

  const registro = {
    fecha:new Date().toISOString(),
    jornada:jornadaActual.jornada,
    tienda,
    responsable,
    pronosticos
  };

  apuestasLocales = apuestasLocales.filter(a => !(a.jornada === jornadaActual.jornada && a.tienda === tienda));
  apuestasLocales.push(registro);
  localStorage.setItem("apuestas_wom", JSON.stringify(apuestasLocales));

  alert("Apuesta guardada correctamente.");
  cargarPronosticos();
  cargarMarcador();
}

function cargarPronosticos(){
  const cont = document.getElementById("tablaPronosticos");
  if(!cont) return;

  const apuestas = apuestasLocales.filter(a => a.jornada === jornadaActual.jornada);

  if(!apuestas.length){
    cont.innerHTML = `<p>Aún no hay pronósticos registrados.</p>`;
    return;
  }

  cont.innerHTML = apuestas.map(a => `
    <div class="ranking-row">
      <span>${a.tienda}</span>
      <strong>${a.pronosticos.length} pronósticos</strong>
    </div>
  `).join("");
}

function cargarMarcador(){
  const cont = document.getElementById("marcadorTabla");
  if(!cont) return;

  const ranking = tiendas.map((t,i) => ({
    tienda:t,
    aciertos: Math.max(0, 18 - i * 2)
  }));

  cont.innerHTML = ranking.map((r,i) => `
    <div class="ranking-row">
      <span>${i+1}. ${r.tienda}</span>
      <strong>${r.aciertos} pts</strong>
    </div>
  `).join("");
}

function cargarCopaPizza(){
  const cont = document.getElementById("copaPizza");
  if(!cont) return;

  const ranking = [
    ["Sucursal Castro", 2],
    ["Sucursal Osorno", 1],
    ["Sucursal Puerto Montt Centro", 1],
    ["Sucursal Ancud", 0],
    ["Sucursal Valdivia", 0]
  ];

  cont.innerHTML = ranking.map((r,i) => `
    <div class="ranking-row">
      <span>${i+1}. ${r[0]}</span>
      <strong>${"🍕".repeat(r[1]) || "0"}</strong>
    </div>
  `).join("");
}

function iniciarContador(){
  const contador = document.getElementById("contador");
  if(!contador) return;

  setInterval(() => {
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
    contador.textContent = `${h}:${String(m).padStart(2,"0")}`;
  },1000);
}

async function generarReportePartidos(){
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");

  fondoReporte(ctx, canvas);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 64px Arial";
  ctx.fillText("MUNDIAL", 70, 120);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 72px Arial";
  ctx.fillText("MULTIPRODUCTO", 70, 200);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 36px Arial";
  ctx.fillText("WOM MERIDIONAL", 70, 260);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 46px Arial";
  ctx.fillText("⚽ PARTIDOS DEL DÍA", 70, 380);

  let y = 470;
  jornadaActual.partidos.forEach(p => {
    tarjeta(ctx, 70, y, 940, 95);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 34px Arial";
    ctx.fillText(`${p[0]}  VS  ${p[1]}`, 110, y + 60);
    y += 120;
  });

  tarjeta(ctx, 70, 1050, 940, 150);
  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 40px Arial";
  ctx.fillText("🎯 CONDICIÓN DEL DÍA", 110, 1110);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 38px Arial";
  ctx.fillText(jornadaActual.condicion, 110, 1170);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 34px Arial";
  ctx.fillText("⏰ Cierre de apuestas: 13:00 hrs", 110, 1260);

  compartirCanvas(canvas, "reporte-partidos.png");
}

async function generarReporteMetas(){
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");

  fondoReporte(ctx, canvas);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 72px Arial";
  ctx.fillText("METAS", 70, 140);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 72px Arial";
  ctx.fillText("DEL DÍA", 70, 220);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 36px Arial";
  ctx.fillText("MUNDIAL MULTIPRODUCTO WOM", 70, 290);

  tarjeta(ctx, 70, 370, 940, 260);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 42px Arial";
  ctx.fillText("✅ Meta Accesorios", 120, 450);
  ctx.fillText("✅ Meta Seguros", 120, 520);
  ctx.fillText(`✅ ${jornadaActual.condicion}`, 120, 590);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 42px Arial";
  ctx.fillText("🏪 TIENDAS PARTICIPANTES", 70, 720);

  let y = 790;
  tiendas.forEach(t => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px Arial";
    ctx.fillText(`• ${t}`, 100, y);
    y += 45;
  });

  tarjeta(ctx, 70, 1180, 940, 110);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 34px Arial";
  ctx.fillText("🍕 Solo compiten tiendas que cumplan las condiciones", 100, 1245);

  compartirCanvas(canvas, "reporte-metas.png");
}

function fondoReporte(ctx, canvas){
  const grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
  grad.addColorStop(0,"#140028");
  grad.addColorStop(.5,"#5b00c8");
  grad.addColorStop(1,"#090015");
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px Arial";
  ctx.fillText("WOM", 70, 70);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 32px Arial";
  ctx.fillText("MERIDIONAL", 70, 105);
}

function tarjeta(ctx,x,y,w,h){
  ctx.fillStyle = "rgba(20,0,40,.85)";
  ctx.strokeStyle = "rgba(255,255,255,.25)";
  ctx.lineWidth = 3;
  roundRect(ctx,x,y,w,h,28,true,true);
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
      alert("Imagen generada. Descárgala y compártela por WhatsApp.");
    }
  });
}

function guardarApi(){
  const input = document.getElementById("apiUrl");
  if(!input) return;
  apiUrl = input.value.trim();
  localStorage.setItem("api_wom", apiUrl);
  alert("Conexión guardada.");
}