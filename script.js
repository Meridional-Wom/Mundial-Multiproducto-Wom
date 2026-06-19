function ocultarTodo() {

  document.querySelectorAll(".pagina").forEach(p => {
    p.style.display = "none";
  });

  document.getElementById("inicio").style.display = "none";
}

function mostrar(id) {

  ocultarTodo();

  document.getElementById(id).style.display = "block";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function inicio() {

  ocultarTodo();

  document.getElementById("inicio").style.display = "block";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* ==========================
   ADMIN WOM
========================== */

function admin() {

  const clave = prompt(
    "Ingrese código de administrador"
  );

  if (clave !== "Meridional") {

    alert("Código incorrecto");

    return;
  }

  alert("Bienvenido Administrador");

  mostrar("admin");
}

/* ==========================
   COMPARTIR PARTIDOS
========================== */

function compartirPartidos() {

  const texto =
`🏆 MUNDIAL MULTIPRODUCTO WOM

⚽ PARTIDOS DEL DÍA

🇵🇹 Portugal vs Uzbekistán 🇺🇿

🏴 Inglaterra vs Ghana 🇬🇭

🇵🇦 Panamá vs Croacia 🇭🇷

🇨🇴 Colombia vs RD Congo 🇨🇩

🎯 CONDICIÓN DEL DÍA

50% WOMGO

⏰ Cierre 13:00 hrs

🍕 Pronostica • Cumple • Gana`;

  if (navigator.share) {

    navigator.share({
      title: "Mundial Multiproducto WOM",
      text: texto
    });

  } else {

    navigator.clipboard.writeText(texto);

    alert("Texto copiado");
  }
}

/* ==========================
   COMPARTIR METAS
========================== */

function compartirMetas() {

  const texto =
`📊 METAS DEL DÍA

🏆 Mundial Multiproducto WOM

✅ Meta Accesorios

✅ Meta Seguros

✅ Meta WOMGO

🏪 Tiendas Participantes

Castro
Ancud
Osorno
Valdivia
Puerto Varas
Puerto Montt Centro
Paseo Costanera
Villarrica
Kiosco Plaza Los Ríos
Kiosco Mall Castro

🍕 Solo participan quienes cumplan
las condiciones comerciales.`;

  if (navigator.share) {

    navigator.share({
      title: "Metas del Día",
      text: texto
    });

  } else {

    navigator.clipboard.writeText(texto);

    alert("Texto copiado");
  }
}

/* ==========================
   CONTADOR 13:00
========================== */

function actualizarContador() {

  const ahora = new Date();

  const cierre = new Date();

  cierre.setHours(13);
  cierre.setMinutes(0);
  cierre.setSeconds(0);

  const diferencia = cierre - ahora;

  const elemento =
  document.getElementById("contador");

  if (!elemento) return;

  if (diferencia <= 0) {

    elemento.innerHTML =
    "Apuestas Cerradas";

    return;
  }

  const horas =
  Math.floor(diferencia / 1000 / 60 / 60);

  const minutos =
  Math.floor(
    diferencia / 1000 / 60
  ) % 60;

  const segundos =
  Math.floor(
    diferencia / 1000
  ) % 60;

  elemento.innerHTML =
  `${horas}h ${minutos}m ${segundos}s`;
}

setInterval(
  actualizarContador,
  1000
);

actualizarContador();

/* ==========================
   CARGA INICIAL
========================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    inicio();

    console.log(
      "Mundial Multiproducto WOM cargado"
    );
  }
);