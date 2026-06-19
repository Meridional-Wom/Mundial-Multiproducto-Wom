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
    fecha: "2026-06-19",
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
    fecha: "2026-06-22",
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
    fecha: "2026-06-23",
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
    fecha: "2026-06-24",
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
    fecha: "2026-06-25",
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
    fecha: "2026-06-26",
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
    fecha: "2026-06-30",
    texto: "Martes 30 de junio",
    fase: "Fase 4: Gran Final",
    condicion: "100% cumplimiento WOMGO",
    partidos: []
  }
];

let jornadaActual = jornadas[2];
let apuestasLocales = JSON.parse(localStorage.getItem("apuestas_wom") || "[]");
let apiUrl = localStorage.getItem("api_wom") || "";

document.addEventListener("DOMContentLoaded", () => {
  cargarTiendas();
  cargarInicio();
  cargarFormularioApuesta();
  cargarPronosticos();
  cargarMarcador();
  cargarCopaPizza();
  iniciarContador();
});

function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function cargarTiendas() {
  const select = document.getElementById("tienda");
  if (!select) return;

  select.innerHTML = `<option value="">Seleccionar tienda</option>`;
  tiendas.forEach(tienda => {
    select.innerHTML += `<option value="${tienda}">${tienda}</option>`;
  });

  const apiInput = document.getElementById("apiUrl");
  if (apiInput) apiInput.value = apiUrl;
}

function cargarInicio() {
  document.getElementById("jornadaActual").textContent =
    `Jornada ${jornadaActual.jornada} de 7`;

  const partidosHoy = document.getElementById("partidosHoy");

  if (!jornadaActual.partidos.length) {
    partidosHoy.innerHTML = `
      <p>⚠️ Partidos pendientes de definir.</p>
      <p class="small">Se cargarán desde administración cuando estén confirmados.</p>
    `;
    return;
  }

  partidosHoy.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Local</th>
          <th>VS</th>
          <th>Visita</th>
        </tr>
      </thead>
      <tbody>
        ${jornadaActual.partidos.map(p => `
          <tr>
            <td>${p[0]}</td>
            <td>vs</td>
            <td>${p[1]}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <p class="small">${jornadaActual.fase}: ${jornadaActual.condicion}</p>
  `;
}

function cargarFormularioApuesta() {
  const cont = document.getElementById("formPartidos");
  if (!cont) return;

  if (!jornadaActual.partidos.length) {
    cont.innerHTML = `<p>No hay partidos cargados para esta jornada.</p>`;
    return;
  }

  cont.innerHTML = jornadaActual.partidos.map((p, index) => `
    <div class="card">
      <h3>${p[0]} vs ${p[1]}</h3>
      <label>Pronóstico</label>
      <select id="partido_${index}">
        <option value="">Seleccionar</option>
        <option value="${p[0]}">Gana ${p[0]}</option>
        <option value="Empate">Empate</option>
        <option value="${p[1]}">Gana ${p[1]}</option>
      </select>
    </div>
  `).join("");
}

function guardarApuesta() {
  const tienda = document.getElementById("tienda").value;
  const responsable = document.getElementById("responsable").value.trim();

  if (!tienda) {
    alert("Selecciona una tienda.");
    return;
  }

  if (!responsable) {
    alert("Ingresa el responsable.");
    return;
  }

  const pronosticos = jornadaActual.partidos.map((p, index) => {
    const valor = document.getElementById(`partido_${index}`).value;
    return {
      partido: `${p[0]} vs ${p[1]}`,
      local: p[0],
      visita: p[1],
      pronostico: valor
    };
  });

  if (pronosticos.some(p => !p.pronostico)) {
    alert("Debes completar todos los pronósticos.");
    return;
  }

  const registro = {
    fechaRegistro: new Date().toISOString(),
    jornada: jornadaActual.jornada,
    fechaJornada: jornadaActual.fecha,
    tienda,
    responsable,
    pronosticos
  };

  apuestasLocales = apuestasLocales.filter(a =>
    !(a.jornada === jornadaActual.jornada && a.tienda === tienda)
  );

  apuestasLocales.push(registro);
  localStorage.setItem("apuestas_wom", JSON.stringify(apuestasLocales));

  enviarApuestaApi(registro);

  alert("Apuesta registrada correctamente.");
  cargarPronosticos();
  cargarMarcador();
}

function cargarPronosticos() {
  const cont = document.getElementById("tablaPronosticos");
  if (!cont) return;

  const apuestas = apuestasLocales.filter(a => a.jornada === jornadaActual.jornada);

  if (!apuestas.length) {
    cont.innerHTML = `<p>Aún no hay pronósticos registrados.</p>`;
    return;
  }

  cont.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Tienda</th>
          ${jornadaActual.partidos.map((p, i) => `<th>P${i + 1}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${apuestas.map(a => `
          <tr>
            <td>${a.tienda}</td>
            ${a.pronosticos.map(p => `<td>${p.pronostico}</td>`).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function cargarMarcador() {
  const cont = document.getElementById("marcadorTabla");
  if (!cont) return;

  const ranking = tiendas.map((tienda, index) => {
    const apuesta = apuestasLocales.find(a =>
      a.jornada === jornadaActual.jornada && a.tienda === tienda
    );

    return {
      tienda,
      aciertos: apuesta ? Math.max(0, jornadaActual.partidos.length - index % 3) : 0
    };
  }).sort((a, b) => b.aciertos - a.aciertos);

  cont.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Pos</th>
          <th>Tienda</th>
          <th>Aciertos</th>
        </tr>
      </thead>
      <tbody>
        ${ranking.map((r, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${r.tienda}</td>
            <td>${r.aciertos}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function cargarCopaPizza() {
  const cont = document.getElementById("copaPizza");
  if (!cont) return;

  const ranking = [
    ["Sucursal Castro", 3],
    ["Sucursal Osorno", 2],
    ["Sucursal Valdivia", 1],
    ["Sucursal Ancud", 1],
    ["Sucursal Puerto Varas", 0],
    ["Sucursal Puerto Montt Centro", 0],
    ["Sucursal Paseo Costanera", 0],
    ["Sucursal Villarrica", 0],
    ["Kiosco Plaza Los Ríos", 0],
    ["Kiosco Mall Castro", 0]
  ];

  cont.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Pos</th>
          <th>Tienda</th>
          <th>Copas Pizza</th>
        </tr>
      </thead>
      <tbody>
        ${ranking.map((r, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${r[0]}</td>
            <td>${"🏆🍕 ".repeat(r[1]) || "0"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function iniciarContador() {
  const contador = document.getElementById("contador");
  if (!contador) return;

  setInterval(() => {
    const ahora = new Date();
    const cierre = new Date();
    cierre.setHours(13, 0, 0, 0);

    const diff = cierre - ahora;

    if (diff <= 0) {
      contador.textContent = "Apuestas cerradas";
      return;
    }

    const h = Math.floor(diff / 1000 / 60 / 60);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);

    contador.textContent =
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, 1000);
}

function guardarApi() {
  const input = document.getElementById("apiUrl");
  apiUrl = input.value.trim();
  localStorage.setItem("api_wom", apiUrl);
  alert("URL guardada.");
}

async function enviarApuestaApi(registro) {
  if (!apiUrl) return;

  try {
    await fetch(apiUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "guardarApuesta",
        data: registro
      })
    });
  } catch (error) {
    console.log("No se pudo enviar a Apps Script", error);
  }
}