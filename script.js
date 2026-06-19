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

const jornada = {
  numero: 1,
  total: 7,
  fecha: "Viernes 19 de junio",
  premio: "🍕 Pizza para la tienda ganadora",
  condicion: "Mínimo 1 WOMGO vendido",
  partidos: [
    {
      hora: "15:00",
      local: "Estados Unidos",
      visita: "Australia",
      resultado: "Pendiente",
      ganador: ""
    },
    {
      hora: "18:00",
      local: "Escocia",
      visita: "Marruecos",
      resultado: "Pendiente",
      ganador: ""
    },
    {
      hora: "21:00",
      local: "Brasil",
      visita: "Haití",
      resultado: "Pendiente",
      ganador: ""
    },
    {
      hora: "00:00",
      local: "Turquía",
      visita: "Paraguay",
      resultado: "Pendiente",
      ganador: ""
    }
  ]
};

const metas = [
  { tienda: "Castro", meta: 8, avance: 5, condicion: false },
  { tienda: "Ancud", meta: 5, avance: 2, condicion: false },
  { tienda: "Osorno", meta: 10, avance: 7, condicion: true },
  { tienda: "Valdivia", meta: 12, avance: 9, condicion: true },
  { tienda: "Puerto Varas", meta: 6, avance: 4, condicion: false },
  { tienda: "Puerto Montt", meta: 9, avance: 4, condicion: false },
  { tienda: "Paseo Costanera", meta: 7, avance: 3, condicion: false },
  { tienda: "Villarrica", meta: 6, avance: 2, condicion: false },
  { tienda: "Kiosco Plaza Los Ríos", meta: 4, avance: 2, condicion: true },
  { tienda: "Kiosco Mall Castro", meta: 5, avance: 3, condicion: true }
];

const resultadoJornada = {
  estado: "pendiente", 
  ganador: "",
  aciertos: 0,
  mensaje: "El ganador de la jornada será informado al cierre."
};

let apuestas = JSON.parse(localStorage.getItem("apuestas_wom") || "[]");
let apiUrl = localStorage.getItem("api_wom") || "";
let ultimaApuesta = null;

/* =========================
   INICIO
========================= */

document.addEventListener("DOMContentLoaded", () => {
  iniciarSplash();
  cargarInicio();
  cargarFormularioApuesta();
  cargarPronosticos();
  cargarMetas();
  cargarResultados();
  cargarAdmin();
  showSection("inicio");
});

/* =========================
   SPLASH
========================= */

function iniciarSplash() {
  const textos = [
    "Cargando jornada...",
    "Preparando partidos...",
    "¡Que comience la competencia!"
  ];

  let index = 0;
  const loadingText = document.getElementById("loadingText");

  const intervalo = setInterval(() => {
    index++;
    if (loadingText && textos[index]) {
      loadingText.textContent = textos[index];
    }
  }, 1300);

  setTimeout(() => {
    clearInterval(intervalo);

    const splash = document.getElementById("splashScreen");
    const app = document.getElementById("app");

    if (splash) splash.style.display = "none";
    if (app) app.classList.remove("hidden");
  }, 4000);
}

/* =========================
   NAVEGACIÓN
========================= */

function showSection(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const section = document.getElementById(id);
  if (section) section.classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================
   INICIO
========================= */

function cargarInicio() {
  setText("jornadaActual", `${jornada.numero} de ${jornada.total}`);
  setText("fechaJornada", jornada.fecha);
  setText("premioDia", jornada.premio);

  const partidosHoy = document.getElementById("partidosHoy");

  if (partidosHoy) {
    partidosHoy.innerHTML = jornada.partidos.map(partido => `
      <div class="match-card">
        <div class="match-time">${partido.hora}</div>
        <div class="match-teams">
          ${partido.local} <span>VS</span> ${partido.visita}
        </div>
      </div>
    `).join("");
  }
}

/* =========================
   APUESTA
========================= */

function cargarFormularioApuesta() {
  const tiendaSelect = document.getElementById("tienda");

  if (tiendaSelect) {
    tiendaSelect.innerHTML = `<option value="">Seleccionar tienda</option>`;

    tiendas.forEach(tienda => {
      tiendaSelect.innerHTML += `<option value="${tienda}">${tienda}</option>`;
    });
  }

  const formPartidos = document.getElementById("formPartidos");

  if (formPartidos) {
    formPartidos.innerHTML = jornada.partidos.map((partido, index) => `
      <div class="form-card">
        <h3>${partido.hora}</h3>
        <p>${partido.local} VS ${partido.visita}</p>

        <label>Elige tu apuesta</label>

        <select id="pronostico_${index}">
          <option value="">Seleccionar</option>
          <option value="${partido.local}">${partido.local}</option>
          <option value="Empate">Empate</option>
          <option value="${partido.visita}">${partido.visita}</option>
        </select>
      </div>
    `).join("");
  }

  revisarApuestaBloqueada();
}

function guardarApuesta() {
  const tienda = document.getElementById("tienda")?.value;

  if (!tienda) {
    alert("Selecciona una tienda.");
    return;
  }

  const yaExiste = apuestas.find(a => a.tienda === tienda && a.jornada === jornada.numero);

  if (yaExiste) {
    alert("Esta tienda ya registró su apuesta. No puede modificarse.");
    ultimaApuesta = yaExiste;
    mostrarApuestaGuardada(yaExiste);
    return;
  }

  const elecciones = jornada.partidos.map((partido, index) => {
    const valor = document.getElementById(`pronostico_${index}`)?.value;

    return {
      partido: `${partido.local} VS ${partido.visita}`,
      local: partido.local,
      visita: partido.visita,
      hora: partido.hora,
      eleccion: valor
    };
  });

  if (elecciones.some(e => !e.eleccion)) {
    alert("Completa todos los pronósticos.");
    return;
  }

  const registro = {
    jornada: jornada.numero,
    fechaJornada: jornada.fecha,
    tienda,
    elecciones,
    fechaRegistro: new Date().toLocaleDateString("es-CL"),
    horaRegistro: new Date().toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  apuestas.push(registro);
  localStorage.setItem("apuestas_wom", JSON.stringify(apuestas));

  ultimaApuesta = registro;

  mostrarApuestaGuardada(registro);
  cargarPronosticos();

  alert("Apuesta registrada correctamente.");
}

function mostrarApuestaGuardada(registro) {
  const btnGuardar = document.getElementById("btnGuardar");
  const box = document.getElementById("apuestaGuardada");
  const fecha = document.getElementById("fechaRegistro");
  const tienda = document.getElementById("tienda");

  if (btnGuardar) btnGuardar.style.display = "none";
  if (box) box.classList.remove("hidden");
  if (fecha) fecha.textContent = `Registrada: ${registro.fechaRegistro} · ${registro.horaRegistro}`;

  if (tienda) tienda.disabled = true;

  jornada.partidos.forEach((_, index) => {
    const select = document.getElementById(`pronostico_${index}`);
    if (select) select.disabled = true;
  });
}

function revisarApuestaBloqueada() {
  const tiendaSelect = document.getElementById("tienda");

  if (!tiendaSelect) return;

  tiendaSelect.addEventListener("change", () => {
    const tienda = tiendaSelect.value;
    const registrada = apuestas.find(a => a.tienda === tienda && a.jornada === jornada.numero);

    const btnGuardar = document.getElementById("btnGuardar");
    const box = document.getElementById("apuestaGuardada");

    jornada.partidos.forEach((_, index) => {
      const select = document.getElementById(`pronostico_${index}`);
      if (select) {
        select.disabled = false;
        select.value = "";
      }
    });

    if (btnGuardar) btnGuardar.style.display = "block";
    if (box) box.classList.add("hidden");

    if (registrada) {
      ultimaApuesta = registrada;

      registrada.elecciones.forEach((eleccion, index) => {
        const select = document.getElementById(`pronostico_${index}`);
        if (select) select.value = eleccion.eleccion;
      });

      mostrarApuestaGuardada(registrada);
    }
  });
}

/* =========================
   PRONÓSTICOS
========================= */

function cargarPronosticos() {
  const lista = document.getElementById("listaPronosticos");

  if (!lista) return;

  const data = apuestas.filter(a => a.jornada === jornada.numero);

  if (!data.length) {
    lista.innerHTML = `
      <div class="info-card">
        <p>Aún no hay apuestas registradas.</p>
      </div>
    `;
    return;
  }

  lista.innerHTML = data.map(apuesta => `
    <div class="prediction-card">
      <h3>🏪 ${apuesta.tienda}</h3>

      ${apuesta.elecciones.map(e => `
        <p>
          <strong>${e.partido}</strong><br>
          ➡️ Elegimos: ${e.eleccion}
        </p>
      `).join("")}
    </div>
  `).join("");
}

/* =========================
   CONDICIÓN / META
========================= */

function cargarMetas() {
  setText("condicionDia", jornada.condicion);

  const contenedor = document.getElementById("metasTienda");

  if (!contenedor) return;

  contenedor.innerHTML = metas.map(meta => {
    const porcentaje = Math.round((meta.avance / meta.meta) * 100);
    const compite = meta.condicion && porcentaje >= 100;

    return `
      <div class="goal-row">
        <strong>${meta.tienda}</strong>
        <span>${meta.avance} / ${meta.meta} ventas · ${porcentaje}%</span>
        <br>
        <span>${compite ? "✅ En competencia" : "❌ Pendiente condición/meta"}</span>
      </div>
    `;
  }).join("");
}

/* =========================
   RESULTADOS
========================= */

function cargarResultados() {
  const resultadosPartidos = document.getElementById("resultadosPartidos");

  if (resultadosPartidos) {
    resultadosPartidos.innerHTML = jornada.partidos.map(partido => `
      <div class="result-card">
        <strong>${partido.local} VS ${partido.visita}</strong>
        <p>${partido.resultado}</p>
        <small>${partido.ganador ? `Ganador: ${partido.ganador}` : "Pendiente"}</small>
      </div>
    `).join("");
  }

  const resultadoFinal = document.getElementById("resultadoJornada");

  if (!resultadoFinal) return;

  if (resultadoJornada.estado === "ganador") {
    resultadoFinal.innerHTML = `
      <div class="success-card">
        <h2>🏆 Ganador de la jornada</h2>
        <p>${resultadoJornada.ganador}</p>
        <p>${resultadoJornada.aciertos} aciertos</p>
        <p>🎁 ${jornada.premio}</p>
      </div>
    `;
  } else if (resultadoJornada.estado === "sin_ganador") {
    resultadoFinal.innerHTML = `
      <div class="info-card">
        <h2>⚠️ Sin ganador</h2>
        <p>Ninguna tienda cumplió los requisitos para obtener el premio.</p>
      </div>
    `;
  } else if (resultadoJornada.estado === "empate") {
    resultadoFinal.innerHTML = `
      <div class="info-card">
        <h2>🤝 Empate</h2>
        <p>${resultadoJornada.ganador}</p>
        <p>🎁 Premio compartido</p>
      </div>
    `;
  } else {
    resultadoFinal.innerHTML = `
      <p>${resultadoJornada.mensaje}</p>
    `;
  }
}

/* =========================
   COMPARTIR APUESTA
========================= */

function compartirApuesta() {
  if (!ultimaApuesta) {
    alert("Primero guarda una apuesta.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#07070b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
  grad.addColorStop(0, "rgba(111,0,255,.35)");
  grad.addColorStop(0.45, "rgba(255,47,146,.12)");
  grad.addColorStop(1, "rgba(7,7,11,1)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px Arial";
  ctx.fillText("MUNDIAL", 70, 110);

  ctx.fillStyle = "#ff2f92";
  ctx.font = "bold 64px Arial";
  ctx.fillText("MULTIPRODUCTO", 70, 180);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px Arial";
  ctx.fillText("WOM MERIDIONAL", 70, 235);

  drawCanvasCard(ctx, 70, 290, 940, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px Arial";
  ctx.fillText(ultimaApuesta.tienda.toUpperCase(), 110, 360);

  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 34px Arial";
  ctx.fillText("✅ APUESTA OFICIAL", 110, 415);

  ctx.fillStyle = "#a7b0c0";
  ctx.font = "28px Arial";
  ctx.fillText(`Jornada ${ultimaApuesta.jornada} de ${jornada.total}`, 110, 465);

  let y = 550;

  ultimaApuesta.elecciones.forEach(e => {
    drawCanvasCard(ctx, 70, y, 940, 145);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Arial";
    ctx.fillText(e.partido, 110, y + 50);

    ctx.fillStyle = "#ff2f92";
    ctx.font = "bold 32px Arial";
    ctx.fillText(`➡️ Elegimos: ${e.eleccion}`, 110, y + 105);

    y += 165;
  });

  ctx.fillStyle = "#a7b0c0";
  ctx.font = "28px Arial";
  ctx.fillText(
    `Registrada: ${ultimaApuesta.fechaRegistro} · ${ultimaApuesta.horaRegistro}`,
    70,
    1240
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px Arial";
  ctx.fillText("Pronostica • Cumple • Compite • Gana", 70, 1295);

  compartirCanvas(canvas, "apuesta-wom.png");
}

function drawCanvasCard(ctx, x, y, w, h) {
  ctx.fillStyle = "rgba(17,19,26,.92)";
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 3;

  roundRect(ctx, x, y, w, h, 28, true, true);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function compartirCanvas(canvas, nombre) {
  canvas.toBlob(async blob => {
    const file = new File([blob], nombre, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "Mundial Multiproducto WOM",
        files: [file]
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
   ADMIN
========================= */

function validarAdmin() {
  const pass = document.getElementById("adminPass")?.value;

  if (pass !== "Meridional") {
    alert("Código incorrecto.");
    return;
  }

  document.getElementById("adminLogin")?.classList.add("hidden");
  document.getElementById("adminContent")?.classList.remove("hidden");
}

function cargarAdmin() {
  const input = document.getElementById("apiUrl");
  if (input) input.value = apiUrl;
}

function guardarApi() {
  const input = document.getElementById("apiUrl");
  if (!input) return;

  apiUrl = input.value.trim();
  localStorage.setItem("api_wom", apiUrl);

  alert("Conexión guardada.");
}

function limpiarApuestas() {
  if (!confirm("¿Seguro que quieres reiniciar las apuestas locales?")) return;

  localStorage.removeItem("apuestas_wom");
  apuestas = [];

  cargarPronosticos();
  cargarFormularioApuesta();

  alert("Apuestas locales reiniciadas.");
}

function reabrirApuestaAdmin() {
  const tienda = prompt("Nombre exacto de la tienda a reabrir:");

  if (!tienda) return;

  apuestas = apuestas.filter(a => !(a.tienda === tienda && a.jornada === jornada.numero));
  localStorage.setItem("apuestas_wom", JSON.stringify(apuestas));

  cargarPronosticos();
  cargarFormularioApuesta();

  alert(`Apuesta reabierta para: ${tienda}`);
}

/* =========================
   UTILIDADES
========================= */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}