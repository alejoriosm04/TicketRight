// Barra lateral compartida por las pantallas del prototipo, más el simulador de estados
// y las transiciones entre pantallas. No es parte del producto: es la herramienta de
// navegación de este prototipo.
(function () {
  var PERSONAS = {
    fan: {
      etiqueta: "Fan",
      pantallas: [
        { href: "fan-eventos.html", texto: "Inicio" },
        { href: "fan-evento.html", texto: "Evento" },
        { href: "fan-fila.html", texto: "Fila de venta" },
        { href: "fan-seleccion.html", texto: "Selección de localidad" },
        { href: "fan-reserva.html", texto: "Tu reserva" },
        { href: "fan-datos.html", texto: "Confirmar titular" },
        { href: "fan-pago.html", texto: "Pago" },
        { href: "fan-boleta.html", texto: "Boleta emitida" }
      ]
    },
    promotor: {
      etiqueta: "Promotor",
      pantallas: [
        { href: "promotor-metricas.html", texto: "Resumen de ventas" },
        { href: "promotor-ocupacion.html", texto: "Ocupación y velocidad" }
      ]
    },
    operacion: {
      etiqueta: "Operación interna",
      pantallas: [
        { href: "operacion-convenio.html", texto: "Convenio comercial" },
        { href: "operacion-especificaciones.html", texto: "Especificaciones del evento" },
        { href: "operacion-discrepancias.html", texto: "Discrepancias abiertas" },
        { href: "operacion-detalle.html", texto: "Detalle de discrepancia" }
      ]
    }
  };

  function archivoActual() {
    var partes = window.location.pathname.split("/");
    return partes[partes.length - 1] || "index.html";
  }

  function detectarPersona(archivo) {
    if (archivo.indexOf("fan-") === 0) return "fan";
    if (archivo.indexOf("promotor-") === 0) return "promotor";
    if (archivo.indexOf("operacion-") === 0) return "operacion";
    return null;
  }

  function aplicarTema(tema) {
    document.documentElement.setAttribute("data-tema", tema);
    try { localStorage.setItem("tr-tema", tema); } catch (e) {}
  }

  function temaActual() {
    try { return localStorage.getItem("tr-tema") || "dark"; } catch (e) { return "dark"; }
  }

  // ---------- Transición entre pantallas (páginas estáticas, sin router) ----------
  function irA(href) {
    var principal = document.querySelector(".contenido-principal");
    if (principal) principal.style.opacity = "0";
    setTimeout(function () { window.location.href = href; }, 150);
  }
  window.irA = irA;

  function habilitarTransiciones() {
    document.addEventListener("click", function (e) {
      var enlace = e.target.closest("a");
      if (!enlace) return;
      var href = enlace.getAttribute("href") || "";
      if (href.indexOf(".html") === -1 || enlace.target === "_blank" || /^https?:\/\//.test(href)) return;
      e.preventDefault();
      irA(href);
    });
  }

  // ---------- Menú desplegable propio (reemplaza el <select> nativo) ----------
  // opciones: [{ valor, texto, seleccionada }]. onSeleccionar(valor) se llama al elegir.
  function crearMenuDesplegable(opciones, onSeleccionar) {
    var raiz = document.createElement("div");
    raiz.className = "menu-desplegable";

    var actual = opciones.filter(function (o) { return o.seleccionada; })[0] || opciones[0];

    var boton = document.createElement("button");
    boton.type = "button";
    boton.className = "menu-desplegable-boton";
    boton.innerHTML = '<span class="texto-actual">' + actual.texto + '</span><span class="flecha">▾</span>';
    raiz.appendChild(boton);

    var lista = document.createElement("ul");
    lista.className = "menu-desplegable-opciones";
    opciones.forEach(function (o) {
      var li = document.createElement("li");
      li.textContent = o.texto;
      li.dataset.valor = o.valor;
      if (o.seleccionada) li.classList.add("seleccionada");
      li.addEventListener("click", function () {
        raiz.classList.remove("abierto");
        onSeleccionar(o.valor);
      });
      lista.appendChild(li);
    });
    raiz.appendChild(lista);

    boton.addEventListener("click", function (e) {
      e.stopPropagation();
      var yaAbierto = raiz.classList.contains("abierto");
      document.querySelectorAll(".menu-desplegable.abierto").forEach(function (m) { m.classList.remove("abierto"); });
      if (!yaAbierto) raiz.classList.add("abierto");
    });

    return { raiz: raiz, boton: boton };
  }

  document.addEventListener("click", function () {
    document.querySelectorAll(".menu-desplegable.abierto").forEach(function (m) { m.classList.remove("abierto"); });
  });

  // ---------- Simulador de estados por pantalla (vacío / carga / error…) ----------
  function aplicarEstadoSimulado(grupo, valor, textoBoton) {
    document.querySelectorAll('[data-grupo-panel="' + grupo + '"]').forEach(function (panel) {
      panel.classList.toggle("visible", panel.getAttribute("data-estado-panel") === valor);
    });
    var boton = document.querySelector("#bl-simulador-menu .texto-actual");
    if (boton && textoBoton) boton.textContent = textoBoton;
    if (typeof window.alCambiarEstadoSimulado === "function") window.alCambiarEstadoSimulado(valor);
  }
  window.aplicarEstadoSimulado = function (grupo, valor) {
    var cfg = window.ESTADOS_SIMULADOS;
    var opcion = cfg && cfg.opciones.filter(function (o) { return o.valor === valor; })[0];
    aplicarEstadoSimulado(grupo, valor, opcion && opcion.etiqueta);
    var lista = document.getElementById("bl-simulador-lista");
    if (lista) {
      lista.querySelectorAll("li").forEach(function (li) {
        li.classList.toggle("seleccionada", li.dataset.valor === valor);
      });
    }
  };

  function construirSimulador() {
    var cfg = window.ESTADOS_SIMULADOS;
    if (!cfg) return null;

    var inicial = cfg.inicial;
    try {
      var deUrl = new URLSearchParams(window.location.search).get("estado");
      if (deUrl && cfg.opciones.some(function (o) { return o.valor === deUrl; })) inicial = deUrl;
    } catch (e) {}

    var contenedor = document.createElement("div");
    contenedor.className = "bl-simulador";
    contenedor.innerHTML = '<label>Simular estado</label>';
    var opciones = cfg.opciones.map(function (o) {
      return { valor: o.valor, texto: o.etiqueta, seleccionada: o.valor === inicial };
    });
    var menu = crearMenuDesplegable(opciones, function (valor) { window.aplicarEstadoSimulado(cfg.grupo, valor); });
    menu.raiz.id = "bl-simulador-menu";
    menu.lista = menu.raiz.querySelector(".menu-desplegable-opciones");
    menu.raiz.querySelector(".menu-desplegable-opciones").id = "bl-simulador-lista";
    contenedor.appendChild(menu.raiz);
    aplicarEstadoSimulado(cfg.grupo, inicial, cfg.opciones.filter(function (o) { return o.valor === inicial; })[0].etiqueta);
    return contenedor;
  }

  // Chip de sesión en la esquina superior derecha del contenido, no en la barra lateral:
  // representa la identidad federada (AD-004), cuyo inicio de sesión real ocurre fuera de
  // estas pantallas. El chip enlaza a fan-identidad.html.
  function construirBarraSuperior(personaActual, archivo) {
    var principal = document.querySelector(".contenido-principal");
    if (!principal) return;
    var existente = principal.querySelector(".barra-superior");
    if (existente) existente.remove();
    if (personaActual !== "fan") return;

    var barra = document.createElement("div");
    barra.className = "barra-superior";
    var chip = document.createElement("a");
    chip.href = "fan-identidad.html";
    chip.className = "chip-identidad";
    if (archivo === "fan-identidad.html") chip.classList.add("actual");
    chip.innerHTML =
      '<span class="avatar-iniciales">QV</span>' +
      '<span class="nombre">Quinn Villa</span>';
    barra.appendChild(chip);
    principal.insertBefore(barra, principal.firstChild);
  }

  function construir() {
    var archivo = archivoActual();
    var personaActual = detectarPersona(archivo);
    var contenedor = document.getElementById("barra-lateral");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    var marca = document.createElement("div");
    marca.className = "bl-marca";
    marca.innerHTML = 'Ticket<span class="acento">Right</span>';
    contenedor.appendChild(marca);

    var bloqueSelector = document.createElement("div");
    bloqueSelector.className = "bl-selector";
    bloqueSelector.innerHTML = "<label>Perfil</label>";
    var esGuia = archivo === "guia-de-estilo.html";
    var opcionesPerfil = [
      { valor: "index.html", texto: "Mapa de navegación", seleccionada: !personaActual && !esGuia },
      { valor: "fan", texto: "Fan", seleccionada: personaActual === "fan" },
      { valor: "promotor", texto: "Promotor", seleccionada: personaActual === "promotor" },
      { valor: "operacion", texto: "Operación interna", seleccionada: personaActual === "operacion" },
      { valor: "guia-de-estilo.html", texto: "Guía de estilo", seleccionada: esGuia }
    ];
    var menuPerfil = crearMenuDesplegable(opcionesPerfil, function (valor) {
      irA(valor === "index.html" || valor === "guia-de-estilo.html" ? valor : PERSONAS[valor].pantallas[0].href);
    });
    bloqueSelector.appendChild(menuPerfil.raiz);
    contenedor.appendChild(bloqueSelector);

    construirBarraSuperior(personaActual, archivo);

    var nav = document.createElement("nav");
    nav.className = "bl-lista";
    if (personaActual) {
      var pantallas = PERSONAS[personaActual].pantallas;
      var indiceActual = -1;
      pantallas.forEach(function (p, i) { if (p.href === archivo) indiceActual = i; });
      pantallas.forEach(function (p, i) {
        var a = document.createElement("a");
        a.href = p.href;
        if (p.href === archivo) a.className = "actual";
        else if (indiceActual > -1 && i < indiceActual) a.className = "hecho";
        a.innerHTML = '<span class="num">' + (i + 1) + "</span>" + p.texto;
        nav.appendChild(a);
        if (p.href === archivo) {
          var simulador = construirSimulador();
          if (simulador) nav.appendChild(simulador);
        }
      });
    } else {
      [["fan-login.html", "Ir al flujo del fan →"],
       ["promotor-metricas.html", "Ir a métricas del promotor →"],
       ["operacion-convenio.html", "Ir a operación interna →"],
       ["guia-de-estilo.html", "Ver guía de estilo →"]].forEach(function (par) {
        var a = document.createElement("a");
        a.href = par[0];
        a.textContent = par[1];
        nav.appendChild(a);
      });
    }
    contenedor.appendChild(nav);

    var botonTema = document.createElement("button");
    botonTema.type = "button";
    botonTema.className = "bl-tema";
    contenedor.appendChild(botonTema);

    function refrescarBotonTema() {
      var tema = temaActual();
      botonTema.textContent = tema === "light" ? "☀️" : "🌙";
      botonTema.setAttribute("aria-label", tema === "light" ? "Cambiar a tema oscuro" : "Cambiar a tema claro");
    }
    refrescarBotonTema();
    botonTema.addEventListener("click", function () {
      aplicarTema(temaActual() === "light" ? "dark" : "light");
      refrescarBotonTema();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    construir();
    habilitarTransiciones();
  });
})();
