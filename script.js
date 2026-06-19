/* =========================
   CONFIG
========================= */

const DEFAULT_API_URL = "";
const ADMIN_PASS = "Meridional";

let apiUrl = localStorage.getItem("api_wom") || DEFAULT_API_URL;

let config = {};
let partidos = [];
let metas = [];
let pronosticos = [];
let resultados = [];
let reglas = [];
let tiendas = [];
let ultimaApuesta = null;

const fallback = {
  config: {
    JornadaActual: 1,
    TotalJornadas: 7,
    FechaJornada: "Viernes 19 de junio",
    Premio: "🍕 Pizza Familiar",
    Condicion: "Cumplir condición del día, Accesorios, Seguros y WOMGO"
  },
  partidos: [
    { Jornada: 1, Hora: "15:00", Local: "Estados Unidos", Visita: "Australia", Resultado: "Pendiente", Ganador: "" },
    { Jornada: 1, Hora: "18:00", Local: "Escocia", Visita: "Marruecos", Resultado: "Pendiente", Ganador: "" },
    { Jornada: 1, Hora: "20:30", Local: "Brasil", Visita: "Haití", Resultado: "Pendiente", Ganador: "" },
    { Jornada: 1, Hora: "23:00", Local: "Turquía", Visita: "Paraguay", Resultado: "Pendiente", Ganador: "" }
  ],
  metas: [
    { Jornada: 1, Tienda: "Sucursal Valdivia", CondicionCumplida: false, AccesoriosMeta: 112234, AccesoriosAvance: 0, SegurosMeta: 2, SegurosAvance: 0, WOMGOMeta: 3, WOMGOAvance: 0 },
    { Jornada: 1, Tienda: "Sucursal Puerto Varas", CondicionCumplida: false, AccesoriosMeta: 56117, AccesoriosAvance: 0, SegurosMeta: 1, SegurosAvance: 0, WOMGOMeta: 2, WOMGOAvance: 0 },
    { Jornada: 1, Tienda: "Sucursal Costanera", CondicionCumplida: false, AccesoriosMeta: 112234, AccesoriosAvance: 0, SegurosMeta: 2, SegurosAvance: 0, WOMGOMeta: 3, WOMGOAvance: 0 },
    { Jornada: 1, Tienda: "Sucursal Osorno", CondicionCumplida: false, AccesoriosMeta: 88184, AccesoriosAvance: 0, SegurosMeta: 2, SegurosAvance: 0, WOMGOMeta: 3, WOMGOAvance: 0 },
    { Jornada: 1, Tienda: "Sucursal Ancud", CondicionCumplida: false, AccesoriosMeta: 56117, AccesoriosAvance: 0, SegurosMeta: 1, SegurosAvance: 0, WOMGOMeta: 2, WOMGOAvance: 0 },
    { Jornada: 1, Tienda: "Kiosco Plaza Los Ríos", CondicionCumplida: false, AccesoriosMeta: 56117, AccesoriosAvance: 0, SegurosMeta: 1, SegurosAvance: 0, WOMGOMeta: 2, WOMGOAvance: 0 },
    { Jornada: 1, Tienda: "Kiosco Mall Castro", CondicionCumplida: false, AccesoriosMeta: 56117, AccesoriosAvance: 0, SegurosMeta: 1, SegurosAvance: 0, WOMGOMeta: 2, WOMGOAvance: 0 },
    { Jornada: 1, Tienda: "Sucursal Puerto Montt", CondicionCumplida: false, AccesoriosMeta: 88184, AccesoriosAvance: 0, SegurosMeta: 2, SegurosAvance: 0, WOMGOMeta: 3, WOMGOAvance: 0 },
    { Jornada: 1, Tienda: "Sucursal Villarrica", CondicionCumplida: false, AccesoriosMeta: 112234, AccesoriosAvance: 0, SegurosMeta: 2, SegurosAvance: 0, WOMGOMeta: 3, WOMGOAvance: 0 },
    { Jornada: 1, Tienda: "Sucursal Castro", CondicionCumplida: false, AccesoriosMeta: 88184, AccesoriosAvance: 0, SegurosMeta: 2, SegurosAvance: 0, WOMGOMeta: 3, WOMGOAvance: 0 }
  ],
  pronosticos: []
};

/* =========================
   LOAD
========================= */

document.addEventListener("DOMContentLoaded", async () => {
  iniciarSplash();
  await cargarDesdeServidor(false);
  renderAll();
  showSection("inicio");
});

/* =========================
   API
========================= */

function getApiUrl(){
  return (localStorage.getItem("api_wom") || DEFAULT_API_URL || "").trim();
}

async function cargarDesdeServidor(showAlert = false){
  try{
    const url = getApiUrl();

    if(!url){
      usarFallback();
      return;
    }

    const res = await fetch(`${url}?action=getData&t=${Date.now()}`);
    const data = await res.json();

    if(!data || data.ok === false){
      throw new Error("Respuesta inválida");
    }

    procesarDatos(data);

    if(showAlert){
      alert("Datos actualizados desde Google Sheets.");
    }

  }catch(error){
    console.warn(error);
    usarFallback();

    if(showAlert){
      alert("No se pudo actualizar desde Google Sheets. Revisa la URL Apps Script.");
    }
  }
}

function procesarDatos(data){
  config = configArrayToObject(data.config || []);
  partidos = normalizarPartidos(data.partidos || []);
  metas = normalizarMetas(data.metas || []);
  pronosticos = normalizarPronosticos(data.pronosticos || []);
  resultados = data.resultados || [];
  reglas = data.reglas || [];

  if(!partidos.length) partidos = fallback.partidos;
  if(!metas.length) metas = fallback.metas;

  tiendas = obtenerTiendasDesdeMetas(metas);

  if(!tiendas.length){
    tiendas = obtenerTiendasDesdeConfig(data.config || []);
  }

  if(!tiendas.length){
    tiendas = fallback.metas.map(m => m.Tienda);
  }
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

  rows.forEach(row => {
    const campo = row.Campo || row.campo || row.CAMPO;
    const valor = row.Valor || row.valor || row.VALOR;

    if(campo){
      obj[campo] = valor;
    }
  });

  return {
    JornadaActual: Number(obj.JornadaActual || obj.jornadaActual || obj.numero_jornada || obj.Jornada || 1),
    TotalJornadas: Number(obj.TotalJornadas || obj.totalJornadas || 7),
    FechaJornada: obj.FechaJornada || obj.fechaJornada || obj.Fecha || "Viernes 19 de junio",
    Premio: obj.Premio || obj.premio || "🍕 Pizza Familiar",
    Condicion: obj.Condicion || obj.condicion || "Cumplir condición del día, Accesorios, Seguros y WOMGO",
    ClaveAdmin: obj.ClaveAdmin || obj.Clave || ADMIN_PASS
  };
}

function obtenerTiendasDesdeConfig(rows){
  return rows
    .filter(row => String(row.Campo || "").toLowerCase().startsWith("tienda"))
    .map(row => row.Valor)
    .filter(Boolean);
}

function normalizarPartidos(rows){
  return rows.map(row => ({
    Jornada: Number(row.Jornada || row.jornada || 1),
    Hora: row.Hora || row["Hora Chile"] || row.hora || "",
    Local: row.Local || row.local || "",
    Visita: row.Visita || row.visita || "",
    Resultado: row.Resultado || row.resultado || "Pendiente",
    Ganador: row.Ganador || row.ganador || ""
  })).filter(p => p.Local && p.Visita);
}

function normalizarMetas(rows){
  // Soporta formato ancho:
  // Jornada | Tienda | CondicionCumplida | AccesoriosMeta | AccesoriosAvance | SegurosMeta | SegurosAvance | WOMGOMeta | WOMGOAvance
  return rows.map(row => ({
    Jornada: Number(row.Jornada || row.jornada || 1),
    Tienda: row.Tienda || row.tienda || row["Punto de ventas"] || row.Punto || "",
    CondicionCumplida: parseBool(row.CondicionCumplida || row["Condición"] || row.Condicion || false),
    AccesoriosMeta: parseNumber(row.AccesoriosMeta || row["Meta en $ Accesorios"] || row.Accesorios || row.MetaAccesorios || 0),
    AccesoriosAvance: parseNumber(row.AccesoriosAvance || row.AvanceAccesorios || 0),
    SegurosMeta: parseNumber(row.SegurosMeta || row["Meta en Q Seguros"] || row.Seguros || row.MetaSeguros || 0),
    SegurosAvance: parseNumber(row.SegurosAvance || row.AvanceSeguros || 0),
    WOMGOMeta: parseNumber(row.WOMGOMeta || row["Meta WOMGO"] || row.WOMGO || row.MetaWOMGO || 0),
    WOMGOAvance: parseNumber(row.WOMGOAvance || row.AvanceWOMGO || 0)
  })).filter(m => m.Tienda);
}

function normalizarPronosticos(rows){
  return rows.map(row => ({
    ID: row.ID || row.Id || row.id || "",
    Fecha: row.Fecha || row.fecha || "",
    Hora: row.Hora || row.hora || "",
    Jornada: Number(row.Jornada || row.jornada || 1),
    Tienda: row.Tienda || row.tienda || "",
    Partido: row.Partido || row.partido || "",
    Pronostico: row.Pronostico || row.Pronóstico || row.pronostico || ""
  })).filter(p => p.Tienda);
}

function obtenerTiendasDesdeMetas(rows){
  return [...new Set(rows.map(m => m.Tienda).filter(Boolean))];
}

async function probarConexion(){
  try{
    const url = getApiUrl();

    if(!url){
      alert("Primero pega la URL Apps Script.");
      return;
    }

    const res = await fetch(`${url}?action=ping&t=${Date.now()}`);
    const data = await res.json();

    if(data.ok){
      alert("Conexión OK.");
    }else{
      alert("La URL responde, pero no entregó OK.");
    }

  }catch(error){
    alert("No conecta. Revisa la URL /exec y permisos del Apps Script.");
  }
}

/* =========================
   SPLASH
========================= */

function iniciarSplash(){
  const textos = ["Cargando jornada...","Preparando partidos...","¡Que comience la competencia!"];
  let index = 0;
  const loadingText = document.getElementById("loadingText");

  const intervalo = setInterval(() => {
    index++;
    if(loadingText && textos[index]){
      loadingText.textContent = textos[index];
    }
  },1300);

  setTimeout(() => {
    clearInterval(intervalo);
    const splash = document.getElementById("splashScreen");
    const app = document.getElementById("app");
    if(splash) splash.style.display = "none";
    if(app) app.classList.remove("hidden");
  },4000);
}

/* =========================
   RENDER
========================= */

function renderAll(){
  cargarInicio();
  cargarFormularioApuesta();
  cargarPronosticos();
  cargarMetas();
  cargarResultados();
  cargarAdmin();
}

function showSection(id){
  document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
  const section = document.getElementById(id);
  if(section) section.classList.add("active");

  if(id === "pronosticos") cargarPronosticos();
  if(id === "condicionMeta") cargarMetas();
  if(id === "resultados") cargarResultados();

  window.scrollTo({top:0,behavior:"smooth"});
}

/* =========================
   INICIO
========================= */

function cargarInicio(){
  setText("jornadaActual", `${config.JornadaActual || 1} de ${config.TotalJornadas || 7}`);
  setText("fechaJornada", config.FechaJornada || "Viernes 19 de junio");
  setText("premioDia", config.Premio || "🍕 Pizza Familiar");
  setText("bannerPremio", `🎁 ${config.Premio || "Pizza Familiar para la tienda ganadora"}`);

  const contenedor = document.getElementById("partidosHoy");
  if(!contenedor) return;

  const jornadaActual = Number(config.JornadaActual || 1);
  const data = partidos.filter(p => Number(p.Jornada) === jornadaActual);

  contenedor.innerHTML = data.map(partido => `
    <div class="match-card">
      <div class="match-time">${escapeHTML(partido.Hora)}</div>
      <div class="match-teams">${escapeHTML(partido.Local)} <span>VS</span> ${escapeHTML(partido.Visita)}</div>
    </div>
  `).join("");
}

/* =========================
   APUESTA
========================= */

function cargarFormularioApuesta(){
  const tiendaSelect = document.getElementById("tienda");

  if(tiendaSelect){
    tiendaSelect.innerHTML = `<option value="">Seleccionar tienda</option>`;
    tiendas.forEach(tienda => {
      tiendaSelect.innerHTML += `<option value="${escapeAttr(tienda)}">${escapeHTML(tienda)}</option>`;
    });
    tiendaSelect.onchange = revisarTiendaSeleccionada;
  }

  const formPartidos = document.getElementById("formPartidos");

  if(formPartidos){
    const jornadaActual = Number(config.JornadaActual || 1);
    const data = partidos.filter(p => Number(p.Jornada) === jornadaActual);

    formPartidos.innerHTML = data.map((partido,index) => `
      <div class="bet-card">
        <h3>⚽ ${escapeHTML(partido.Hora)}</h3>
        <p>${escapeHTML(partido.Local)} VS ${escapeHTML(partido.Visita)}</p>
        <select id="pronostico_${index}">
          <option value="">Seleccionar</option>
          <option value="${escapeAttr(partido.Local)}">${escapeHTML(partido.Local)}</option>
          <option value="Empate">Empate</option>
          <option value="${escapeAttr(partido.Visita)}">${escapeHTML(partido.Visita)}</option>
        </select>
      </div>
    `).join("");
  }

  resetFormularioApuesta();
}

function revisarTiendaSeleccionada(){
  const tienda = document.getElementById("tienda")?.value;
  resetFormularioApuesta();
  if(!tienda) return;

  const jornadaActual = Number(config.JornadaActual || 1);

  const registrada = pronosticos.filter(p =>
    p.Tienda === tienda && Number(p.Jornada) === jornadaActual
  );

  if(registrada.length){
    ultimaApuesta = armarApuestaDesdePronosticos(tienda, registrada);

    const dataPartidos = partidos.filter(p => Number(p.Jornada) === jornadaActual);

    dataPartidos.forEach((partido,index) => {
      const partidoTexto = `${partido.Local} VS ${partido.Visita}`;
      const encontrado = registrada.find(p => p.Partido === partidoTexto);
      const select = document.getElementById(`pronostico_${index}`);

      if(select && encontrado){
        select.value = encontrado.Pronostico;
      }
    });

    mostrarApuestaGuardada(ultimaApuesta);
  }
}

function resetFormularioApuesta(){
  const btn = document.getElementById("btnGuardar");
  const box = document.getElementById("apuestaGuardada");
  const tienda = document.getElementById("tienda");

  if(btn) btn.style.display = "block";
  if(box) box.classList.add("hidden");
  if(tienda) tienda.disabled = false;

  const jornadaActual = Number(config.JornadaActual || 1);
  const data = partidos.filter(p => Number(p.Jornada) === jornadaActual);

  data.forEach((_,index) => {
    const select = document.getElementById(`pronostico_${index}`);
    if(select){
      select.disabled = false;
      select.value = "";
    }
  });
}

async function guardarApuesta(){
  const tienda = document.getElementById("tienda")?.value;
  if(!tienda){
    alert("Selecciona una tienda.");
    return;
  }

  const jornadaActual = Number(config.JornadaActual || 1);

  const yaExiste = pronosticos.some(p =>
    p.Tienda === tienda && Number(p.Jornada) === jornadaActual
  );

  if(yaExiste){
    alert("Esta tienda ya registró su apuesta. No puede modificarse.");
    revisarTiendaSeleccionada();
    return;
  }

  const dataPartidos = partidos.filter(p => Number(p.Jornada) === jornadaActual);

  const elecciones = dataPartidos.map((partido,index) => {
    const valor = document.getElementById(`pronostico_${index}`)?.value;
    return {
      partido:`${partido.Local} VS ${partido.Visita}`,
      hora:partido.Hora,
      local:partido.Local,
      visita:partido.Visita,
      pronostico:valor
    };
  });

  if(elecciones.some(e => !e.pronostico)){
    alert("Completa todos los pronósticos.");
    return;
  }

  const fecha = new Date().toLocaleDateString("es-CL");
  const hora = new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});

  const payload = {
    action:"savePronostico",
    fecha,
    hora,
    jornada:jornadaActual,
    tienda,
    pronosticos: elecciones.map(e => ({
      partido:e.partido,
      pronostico:e.pronostico
    }))
  };

  try{
    const url = getApiUrl();
    if(!url) throw new Error("API no configurada");

    const res = await fetch(url,{
      method:"POST",
      body:JSON.stringify(payload)
    });

    const respuesta = await res.json();

    if(!respuesta.ok){
      throw new Error(respuesta.error || "Error al guardar");
    }

    await cargarDesdeServidor(false);

  }catch(error){
    console.warn(error);

    const id = Date.now();

    elecciones.forEach(e => {
      pronosticos.push({
        ID:id,
        Fecha:fecha,
        Hora:hora,
        Jornada:jornadaActual,
        Tienda:tienda,
        Partido:e.partido,
        Pronostico:e.pronostico
      });
    });

    localStorage.setItem("pronosticos_wom", JSON.stringify(pronosticos));
    alert("Guardado local. Revisa conexión con Google Sheets.");
  }

  const registradas = pronosticos.filter(p =>
    p.Tienda === tienda && Number(p.Jornada) === jornadaActual
  );

  ultimaApuesta = armarApuestaDesdePronosticos(tienda, registradas);
  mostrarApuestaGuardada(ultimaApuesta);
  cargarPronosticos();

  alert("Apuesta registrada correctamente.");
}

function armarApuestaDesdePronosticos(tienda, registros){
  return {
    tienda,
    jornada: Number(config.JornadaActual || 1),
    fechaRegistro: registros[0]?.Fecha || new Date().toLocaleDateString("es-CL"),
    horaRegistro: registros[0]?.Hora || new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"}),
    elecciones: registros.map(r => ({
      partido:r.Partido,
      eleccion:r.Pronostico
    }))
  };
}

function mostrarApuestaGuardada(registro){
  const btn = document.getElementById("btnGuardar");
  const box = document.getElementById("apuestaGuardada");
  const fecha = document.getElementById("fechaRegistro");
  const tienda = document.getElementById("tienda");

  if(btn) btn.style.display = "none";
  if(box) box.classList.remove("hidden");
  if(fecha) fecha.textContent = `Registrada: ${registro.fechaRegistro} · ${registro.horaRegistro}`;
  if(tienda) tienda.disabled = true;

  const jornadaActual = Number(config.JornadaActual || 1);
  const data = partidos.filter(p => Number(p.Jornada) === jornadaActual);

  data.forEach((_,index) => {
    const select = document.getElementById(`pronostico_${index}`);
    if(select) select.disabled = true;
  });
}

/* =========================
   PRONOSTICOS
========================= */

function cargarPronosticos(){
  const lista = document.getElementById("listaPronosticos");
  if(!lista) return;

  const jornadaActual = Number(config.JornadaActual || 1);
  const data = pronosticos.filter(p => Number(p.Jornada) === jornadaActual);

  if(!data.length){
    lista.innerHTML = `<div class="info-card"><p>Aún no hay apuestas registradas.</p></div>`;
    return;
  }

  const agrupado = {};

  data.forEach(p => {
    if(!agrupado[p.Tienda]){
      agrupado[p.Tienda] = {
        tienda:p.Tienda,
        fecha:p.Fecha,
        hora:p.Hora,
        pronosticos:[]
      };
    }
    agrupado[p.Tienda].pronosticos.push(p);
  });

  lista.innerHTML = Object.values(agrupado).map(item => `
    <div class="prediction-card">
      <h3>🏪 ${escapeHTML(item.tienda)}</h3>
      <small>Registrada: ${escapeHTML(item.fecha)} · ${escapeHTML(item.hora)}</small>
      ${item.pronosticos.map(p => `
        <p><strong>⚽ ${escapeHTML(p.Partido)}</strong><br>➡️ Elegimos: ${escapeHTML(p.Pronostico)}</p>
      `).join("")}
    </div>
  `).join("");
}

/* =========================
   METAS
========================= */

function cargarMetas(){
  setText("condicionDia", config.Condicion || "Para competir, la tienda debe cumplir condición, Accesorios, Seguros y WOMGO.");

  const contenedor = document.getElementById("metasTienda");
  if(!contenedor) return;

  const jornadaActual = Number(config.JornadaActual || 1);
  const data = metas.filter(m => Number(m.Jornada) === jornadaActual);

  if(!data.length){
    contenedor.innerHTML = `<p>No hay metas cargadas.</p>`;
    return;
  }

  contenedor.innerHTML = data.map(meta => {
    const accPct = getPct(meta.AccesoriosAvance, meta.AccesoriosMeta);
    const segPct = getPct(meta.SegurosAvance, meta.SegurosMeta);
    const womPct = getPct(meta.WOMGOAvance, meta.WOMGOMeta);

    const cumpleCondicion = Boolean(meta.CondicionCumplida);

    const cumpleMetas =
      Number(meta.AccesoriosAvance) >= Number(meta.AccesoriosMeta) &&
      Number(meta.SegurosAvance) >= Number(meta.SegurosMeta) &&
      Number(meta.WOMGOAvance) >= Number(meta.WOMGOMeta);

    const clasifica = cumpleCondicion && cumpleMetas;

    return `
      <div class="goal-row">
        <div class="goal-head">
          <strong>${escapeHTML(meta.Tienda)}</strong>
          <span class="goal-status">${clasifica ? "🟢 Clasificado" : "🔴 Pendiente"}</span>
        </div>

        <div class="condition-line">
          ${cumpleCondicion ? "✅ Condición cumplida" : "❌ Condición pendiente"}
        </div>

        ${kpiHTML("Accesorios", meta.AccesoriosAvance, meta.AccesoriosMeta, accPct, "$")}
        ${kpiHTML("Seguros", meta.SegurosAvance, meta.SegurosMeta, segPct, "Q")}
        ${kpiHTML("WOMGO", meta.WOMGOAvance, meta.WOMGOMeta, womPct, "Q")}
      </div>
    `;
  }).join("");
}

function kpiHTML(nombre,avance,meta,pct,tipo){
  return `
    <div class="kpi-line">
      <small>${escapeHTML(nombre)}</small>
      <div class="kpi-bar"><span style="width:${pct}%"></span></div>
      <b>${formatValor(avance,tipo)}/${formatValor(meta,tipo)}</b>
    </div>
  `;
}

function getPct(avance,meta){
  const a = Number(avance) || 0;
  const m = Number(meta) || 0;
  if(m <= 0) return 0;
  return Math.min(Math.round((a / m) * 100),100);
}

function formatValor(valor,tipo){
  const num = Number(valor) || 0;
  if(tipo === "$") return "$" + num.toLocaleString("es-CL");
  return String(num);
}

/* =========================
   RESULTADOS
========================= */

function cargarResultados(){
  const resultadosPartidos = document.getElementById("resultadosPartidos");

  if(resultadosPartidos){
    const jornadaActual = Number(config.JornadaActual || 1);
    const data = partidos.filter(p => Number(p.Jornada) === jornadaActual);

    resultadosPartidos.innerHTML = data.map(partido => `
      <div class="result-card">
        <strong>⚽ ${escapeHTML(partido.Local)} VS ${escapeHTML(partido.Visita)}</strong>
        <p>${escapeHTML(partido.Resultado || "Pendiente")}</p>
        <small>${partido.Ganador ? `Ganador: ${escapeHTML(partido.Ganador)}` : "Pendiente"}</small>
      </div>
    `).join("");
  }

  const resultadoFinal = document.getElementById("resultadoJornada");
  if(!resultadoFinal) return;

  if(!resultados || !resultados.length){
    resultadoFinal.innerHTML = `<p>Resultado de jornada pendiente.</p>`;
    return;
  }

  resultadoFinal.innerHTML = resultados.map(r => `
    <div class="result-card">
      <strong>${escapeHTML(r.Tienda || "")}</strong>
      <p>Aciertos: ${escapeHTML(r.Aciertos || 0)}</p>
      <small>${escapeHTML(r.Estado || "")}</small>
    </div>
  `).join("");
}

/* =========================
   WHATSAPP IMAGE
========================= */

function compartirApuesta(){
  if(!ultimaApuesta){
    alert("Primero guarda una apuesta.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0,0,1080,1350);
  grad.addColorStop(0,"#23004d");
  grad.addColorStop(.45,"#090011");
  grad.addColorStop(1,"#6f00ff");

  ctx.fillStyle = grad;
  ctx.fillRect(0,0,1080,1350);

  ctx.fillStyle = "rgba(255,47,146,.22)";
  ctx.fillRect(0,0,1080,18);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 58px Arial";
  ctx.fillText("🏆 MUNDIAL",70,100);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 60px Arial";
  ctx.fillText("MULTIPRODUCTO",70,170);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px Arial";
  ctx.fillText("WOM MERIDIONAL",70,225);

  drawCanvasCard(ctx,70,275,940,145);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px Arial";
  ctx.fillText(`🏪 ${ultimaApuesta.tienda.toUpperCase()}`,110,340);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 34px Arial";
  ctx.fillText("⚽ NUESTRA APUESTA",110,395);

  ctx.fillStyle = "#c9c3da";
  ctx.font = "28px Arial";
  ctx.fillText(`Jornada ${ultimaApuesta.jornada} de ${config.TotalJornadas || 7}`,110,445);

  let y = 520;

  ultimaApuesta.elecciones.forEach(e => {
    drawCanvasCard(ctx,70,y,940,145);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Arial";
    ctx.fillText(`⚽ ${e.partido}`,110,y + 50);

    ctx.fillStyle = "#ff2f92";
    ctx.font = "bold 34px Arial";
    ctx.fillText(`➡️ Elegimos: ${e.eleccion}`,110,y + 105);

    y += 160;
  });

  drawCanvasCard(ctx,70,1165,940,90);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial";
  ctx.fillText(`🎁 Premio: ${String(config.Premio || "Pizza Familiar").replace("🍕 ","")}`,110,1218);

  ctx.fillStyle = "#c9c3da";
  ctx.font = "26px Arial";
  ctx.fillText(`Registrada: ${ultimaApuesta.fechaRegistro} · ${ultimaApuesta.horaRegistro}`,70,1290);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial";
  ctx.fillText("⚽ Pronostica • Cumple • Compite • Gana",70,1330);

  compartirCanvas(canvas,"apuesta-wom.png");
}

function drawCanvasCard(ctx,x,y,w,h){
  ctx.fillStyle = "rgba(22,14,40,.92)";
  ctx.strokeStyle = "rgba(151,82,255,.46)";
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
    const file = new File([blob],nombre,{type:"image/png"});

    if(navigator.canShare && navigator.canShare({files:[file]})){
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

/* =========================
   ADMIN
========================= */

function validarAdmin(){
  const pass = document.getElementById("adminPass")?.value;
  const clave = config.ClaveAdmin || ADMIN_PASS;

  if(pass !== clave){
    alert("Código incorrecto.");
    return;
  }

  document.getElementById("adminLogin")?.classList.add("hidden");
  document.getElementById("adminContent")?.classList.remove("hidden");
}

function cargarAdmin(){
  const input = document.getElementById("apiUrl");
  if(input) input.value = getApiUrl();
}

function guardarApi(){
  const input = document.getElementById("apiUrl");
  if(!input) return;

  apiUrl = input.value.trim();
  localStorage.setItem("api_wom",apiUrl);

  alert("Conexión guardada.");
}

function limpiarApuestasLocales(){
  localStorage.removeItem("pronosticos_wom");
  if(!getApiUrl()) pronosticos = [];
  cargarPronosticos();
  cargarFormularioApuesta();
  alert("Caché local limpiado.");
}

function reabrirApuestaAdmin(){
  const tienda = prompt("Nombre exacto de la tienda a reabrir solo localmente:");
  if(!tienda) return;

  const jornadaActual = Number(config.JornadaActual || 1);

  pronosticos = pronosticos.filter(p =>
    !(p.Tienda === tienda && Number(p.Jornada) === jornadaActual)
  );

  localStorage.setItem("pronosticos_wom",JSON.stringify(pronosticos));

  cargarPronosticos();
  cargarFormularioApuesta();

  alert(`Apuesta local reabierta para: ${tienda}`);
}

/* =========================
   UTILS
========================= */

function setText(id,value){
  const el = document.getElementById(id);
  if(el) el.textContent = value;
}

function parseBool(value){
  if(value === true) return true;
  const text = String(value || "").toLowerCase().trim();
  return ["true","verdadero","si","sí","1","cumplida","cumplido"].includes(text);
}

function parseNumber(value){
  if(typeof value === "number") return value;
  return Number(String(value || "0").replace(/\./g,"").replace(",",".").replace("$","").trim()) || 0;
}

function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[char]));
}

function escapeAttr(value){
  return escapeHTML(value);
}
