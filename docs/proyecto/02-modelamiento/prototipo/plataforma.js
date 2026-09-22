/*
 * Plataforma funcional de TicketRight — SPA tipo ticketera (Ticketmaster) CONECTADA A LAS
 * APIS REALES. El usuario ve un producto de venta de boletas; la arquitectura opera detrás:
 *   - Catálogo desde PostgreSQL (lectura CQRS) con búsqueda en tiempo real.
 *   - Cuentas de fan (registro/ingreso/perfil) con PII cifrada — homólogo de Cognito (AD-004).
 *   - Fila de admisión justa en Redis (space-based / back pressure).
 *   - Reserva → pago → emisión por la SAGA, con temporizador y conciliación reales.
 *   - Métricas de Promotor y Operación leídas de /metrics (Prometheus/OTel).
 *
 * Vistas (navegación por hash #/ruta):
 *   inicio · eventos · evento · fila · seleccion · reserva · datos · pago · boleta
 *   perfil · promotor · operacion
 */
(function () {
  "use strict";

  var FAN = "88888888-8888-4888-8888-888888888888";
  function headers() {
    var h = { "content-type": "application/json", "x-fan-id": FAN, "user-agent": "Mozilla/5.0 TicketRight" };
    if (S.sesion && S.sesion.token) h["authorization"] = "Bearer " + S.sesion.token;
    return h;
  }

  // Estado global de la SPA (sesión de compra + cuenta).
  var S = {
    catalogo: null, evento: null, localidad: null, cantidad: 1,
    token: null, turnoId: null, compraId: null, reservaId: null,
    pagoId: null, total: 0, venceEn: null, titular: {}, boletas: null,
    sesion: null,          // { token, perfil } de la cuenta de fan
  };

  // Recupera la sesión persistida (localStorage).
  try {
    var guardada = localStorage.getItem("tr-sesion");
    if (guardada) S.sesion = JSON.parse(guardada);
  } catch (e) { /* noop */ }

  var app = document.getElementById("app");
  var toastEl = document.getElementById("toast");

  // ============================ UTILIDADES ============================
  function money(cent) { return "$" + Math.round(cent / 100).toLocaleString("es-CO"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function toast(msg, tipo) {
    toastEl.textContent = msg;
    toastEl.className = "tr-toast " + (tipo || "err") + " on";
    setTimeout(function () { toastEl.className = "tr-toast"; }, 3800);
  }
  async function api(m, ruta, cuerpo) {
    var r = await fetch(ruta, { method: m, headers: headers(), body: cuerpo ? JSON.stringify(cuerpo) : undefined });
    var t = await r.text(); var d = t ? JSON.parse(t) : {};
    if (!r.ok) throw new Error((d && d.mensaje) || (m + " " + ruta + " → " + r.status));
    return d;
  }
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // Emoji e imagen (gradiente CSS del catálogo) por categoría/artista.
  var EMOJI_CAT = { "Conciertos": "🎤", "Festivales": "🎶", "Teatro": "🎭", "Deporte": "⚽", "General": "🎫" };
  function emojiEvento(e) {
    var a = (e.artista || "").toLowerCase();
    if (a.indexOf("shakira") >= 0) return "🐺";
    if (a.indexOf("karol") >= 0) return "🐝";
    if (a.indexOf("taylor") >= 0) return "✨";
    if (a.indexOf("romeo") >= 0) return "🌹";
    if (a.indexOf("calvin") >= 0) return "🎧";
    if (a.indexOf("feid") >= 0) return "💚";
    if (a.indexOf("cepeda") >= 0) return "🎹";
    if (a.indexOf("liga") >= 0 || a.indexOf("millonarios") >= 0) return "⚽";
    return EMOJI_CAT[e.categoria] || "🎫";
  }
  function portada(e) { return e.imagen ? e.imagen : "linear-gradient(135deg,#7c3aed,#ec4899)"; }
  function fechaLarga(iso) {
    if (!iso) return "Fecha por confirmar";
    var d = new Date(iso);
    var dias = ["dom.", "lun.", "mar.", "mié.", "jue.", "vie.", "sáb."];
    var meses = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];
    var hh = d.getHours(), ap = hh >= 12 ? "p.m." : "a.m.", h12 = ((hh + 11) % 12) + 1;
    var mm = d.getMinutes();
    return dias[d.getDay()] + " " + d.getDate() + " de " + meses[d.getMonth()] + ", " + h12 + (mm ? ":" + String(mm).padStart(2, "0") : "") + ":00 " + ap;
  }
  function lugarEvento(e) { return (e.recinto || "Recinto por confirmar") + ", " + (e.ciudad || ""); }
  function desdePrecio(e) { return Math.min.apply(null, e.localidades.map(function (l) { return l.precioCentavos; })); }
  function dispTotal(e) { return e.localidades.reduce(function (a, l) { return a + l.disponibles; }, 0); }

  // ============================ NAVEGACIÓN ============================
  var rutas = {
    "inicio": vistaInicio,
    "eventos": vistaEventos,
    "evento": vistaEvento,
    "fila": vistaFila,
    "seleccion": vistaSeleccion,
    "reserva": vistaReserva,
    "datos": vistaDatos,
    "pago": vistaPago,
    "boleta": vistaBoleta,
    "perfil": vistaPerfil,
    "promotor": vistaPromotor,
    "operacion": vistaOperacion,
  };

  function ir(ruta) { location.hash = "#/" + ruta; }
  function render() {
    var ruta = (location.hash.replace("#/", "") || "inicio").split("?")[0];
    var fn = rutas[ruta] || vistaInicio;
    marcarNav(ruta);
    pintarCuenta();
    window.scrollTo(0, 0);
    fn();
  }
  window.addEventListener("hashchange", render);

  function marcarNav(ruta) {
    var equiv = { evento: "eventos", fila: "eventos", seleccion: "eventos", reserva: "eventos", datos: "eventos", pago: "eventos", boleta: "eventos" };
    var activa = equiv[ruta] || ruta;
    document.querySelectorAll(".tr-nav a").forEach(function (a) {
      a.classList.toggle("on", a.dataset.ruta === activa);
    });
  }

  // ============================ CUENTA (header) ============================
  function pintarCuenta() {
    var c = document.getElementById("cuenta");
    if (!c) return;
    if (S.sesion && S.sesion.perfil) {
      var nombre = S.sesion.perfil.nombre || S.sesion.perfil.correo;
      var ini = (nombre[0] || "T").toUpperCase();
      c.innerHTML =
        '<div class="tr-cuenta-menu">' +
          '<button class="tr-avatar" id="btn-avatar" title="' + esc(nombre) + '">' + esc(ini) + '</button>' +
          '<div class="tr-drop" id="drop">' +
            '<div class="tr-drop-cab">Hola,<strong>' + esc((nombre + "").split(" ")[0]) + '</strong></div>' +
            '<a data-r="perfil">Mi perfil</a>' +
            '<a data-r="perfil">Mis entradas</a>' +
            '<a id="btn-salir" class="tr-drop-salir">Cerrar sesión</a>' +
          '</div>' +
        '</div>';
      var drop = c.querySelector("#drop");
      c.querySelector("#btn-avatar").addEventListener("click", function (ev) { ev.stopPropagation(); drop.classList.toggle("on"); });
      document.addEventListener("click", function () { drop && drop.classList.remove("on"); });
      c.querySelectorAll(".tr-drop a[data-r]").forEach(function (a) { a.addEventListener("click", function () { drop.classList.remove("on"); ir(a.dataset.r); }); });
      c.querySelector("#btn-salir").addEventListener("click", cerrarSesion);
    } else {
      c.innerHTML = '<button class="btn btn-primario btn-sm" id="btn-ingresar">Ingresar / Registrarse</button>';
      c.querySelector("#btn-ingresar").addEventListener("click", function () { abrirAuth("ingreso"); });
    }
  }

  function cerrarSesion() {
    S.sesion = null;
    try { localStorage.removeItem("tr-sesion"); } catch (e) {}
    pintarCuenta();
    toast("Cerraste sesión", "ok");
    if ((location.hash || "").indexOf("perfil") >= 0) ir("inicio");
  }

  // ============================ MODAL DE AUTENTICACIÓN ============================
  var modoAuth = "ingreso";
  var modal = document.getElementById("modal-auth");
  function abrirAuth(modo, alEntrar) {
    modoAuth = modo || "ingreso";
    S._alEntrar = alEntrar || null;
    pintarAuth();
    modal.classList.add("on");
  }
  function cerrarAuth() { modal.classList.remove("on"); }

  function pintarAuth() {
    var esRegistro = modoAuth === "registro";
    document.getElementById("auth-titulo").textContent = esRegistro ? "Crea tu cuenta" : "Ingresar en tu cuenta";
    document.getElementById("auth-sub").innerHTML = esRegistro
      ? '¿Ya tienes cuenta? <a class="tr-link" id="auth-toggle">Ingresa aquí</a>'
      : '¿No tienes cuenta? <a class="tr-link" id="auth-toggle">Regístrate ahora</a>';
    document.getElementById("auth-campos").innerHTML =
      (esRegistro ? '<div class="tr-campo"><label>Nombre completo</label><input id="a-nombre" placeholder="Tu nombre"></div>' : "") +
      '<div class="tr-campo"><label>Correo electrónico</label><input id="a-correo" type="email" placeholder="tucorreo@ejemplo.com"></div>' +
      '<div class="tr-campo"><label>Contraseña</label><input id="a-clave" type="password" placeholder="••••••••"></div>' +
      (esRegistro ? '<div class="tr-campo"><label>Documento (opcional)</label><input id="a-doc" placeholder="C.C. / pasaporte"></div>' : "");
    document.getElementById("auth-enviar").textContent = esRegistro ? "Crear cuenta" : "Ingresar";
    document.getElementById("auth-error").textContent = "";
    document.getElementById("captcha-ok").checked = false;
    document.getElementById("auth-toggle").addEventListener("click", function () { modoAuth = esRegistro ? "ingreso" : "registro"; pintarAuth(); });
  }

  document.getElementById("auth-cerrar").addEventListener("click", cerrarAuth);
  modal.addEventListener("click", function (e) { if (e.target === modal) cerrarAuth(); });
  document.getElementById("auth-enviar").addEventListener("click", enviarAuth);

  async function enviarAuth() {
    var err = document.getElementById("auth-error");
    err.textContent = "";
    if (!document.getElementById("captcha-ok").checked) { err.textContent = "Confirma que no eres un robot para continuar."; return; }
    var correo = (document.getElementById("a-correo").value || "").trim();
    var clave = document.getElementById("a-clave").value || "";
    if (!correo || !clave) { err.textContent = "Escribe tu correo y tu contraseña."; return; }
    var btn = document.getElementById("auth-enviar");
    btn.disabled = true; var etq = btn.textContent; btn.textContent = "Un momento…";
    try {
      var res;
      if (modoAuth === "registro") {
        res = await api("POST", "/auth/registro", {
          correo: correo, clave: clave,
          nombre: (document.getElementById("a-nombre").value || "").trim(),
          documento: (document.getElementById("a-doc").value || "").trim(),
        });
      } else {
        res = await api("POST", "/auth/ingreso", { correo: correo, clave: clave });
      }
      S.sesion = { token: res.token, perfil: res.perfil };
      try { localStorage.setItem("tr-sesion", JSON.stringify(S.sesion)); } catch (e) {}
      cerrarAuth();
      pintarCuenta();
      toast(modoAuth === "registro" ? "¡Cuenta creada! Bienvenida a TicketRight" : "¡Hola de nuevo!", "ok");
      if (S._alEntrar) { var f = S._alEntrar; S._alEntrar = null; f(); }
    } catch (e) {
      err.textContent = e.message;
    } finally { btn.disabled = false; btn.textContent = etq; }
  }

  // Exige sesión antes de una acción sensible (comprar). Si no hay, abre el modal.
  function conSesion(accion) {
    if (S.sesion && S.sesion.token) return accion();
    toast("Ingresa o crea tu cuenta para continuar", "ok");
    abrirAuth("ingreso", accion);
  }

  // ============================ CARGA DE CATÁLOGO ============================
  async function cargarCatalogo(q) {
    var ruta = "/catalogo" + (q ? "?q=" + encodeURIComponent(q) : "");
    var d = await api("GET", ruta);
    if (!q) S.catalogo = d;   // el catálogo completo se cachea para el resto del flujo
    return d.eventos;
  }

  // ============================ VISTA: INICIO ============================
  async function vistaInicio() {
    app.innerHTML =
      '<div class="tr-busca-top"><div class="tr-buscador tr-buscador-hero">' +
        '<span class="tr-lupa">🔍</span><input id="q-home" placeholder="Busca artistas, eventos, equipos o recintos" autocomplete="off">' +
      '</div><div class="tr-suger" id="suger"></div></div>' +
      '<div id="carrusel" class="tr-carrusel-wrap"></div>' +
      '<section class="tr-sec"><div class="tr-sec-cab"><h2>Recomendados para ti</h2><a href="#/eventos" class="tr-link">Ver todo</a></div><div class="tr-fila-cards" id="reco"><p class="tr-mut">Cargando…</p></div></section>' +
      '<section class="tr-sec"><div class="tr-sec-cab"><h2>Próximos eventos</h2><a href="#/eventos" class="tr-link">Ver todo</a></div><div class="tr-grid" id="prox"></div></section>';
    conectarBuscadorHome();
    try {
      var eventos = await cargarCatalogo("");
      pintarCarrusel(eventos.filter(function (e) { return e.destacado; }).slice(0, 4));
      var reco = eventos.slice(0, 6);
      document.getElementById("reco").innerHTML = reco.map(tarjetaCompacta).join("");
      enlazarCards(document.getElementById("reco"));
      var prox = eventos.slice().sort(function (a, b) { return (a.fecha || "") < (b.fecha || "") ? -1 : 1; });
      document.getElementById("prox").innerHTML = prox.map(tarjetaEvento).join("");
      enlazarCards(document.getElementById("prox"));
    } catch (err) {
      document.getElementById("reco").innerHTML = '<p class="tr-mut">No se pudo cargar el catálogo: ' + esc(err.message) + '</p>';
    }
  }

  // ---- Carrusel de destacados ----
  var carruselTimer = null, carruselIdx = 0;
  function pintarCarrusel(destacados) {
    if (!destacados.length) { document.getElementById("carrusel").innerHTML = ""; return; }
    var wrap = document.getElementById("carrusel");
    wrap.innerHTML =
      '<div class="tr-carrusel" id="carr">' +
        destacados.map(function (e, i) {
          return '<div class="tr-slide' + (i === 0 ? " on" : "") + '" data-i="' + i + '" style="background:' + esc(portada(e)) + '">' +
            '<div class="tr-slide-emoji">' + emojiEvento(e) + '</div>' +
            '<div class="tr-slide-txt">' +
              '<span class="etiqueta">Evento destacado · ' + esc(e.ciudad) + '</span>' +
              '<h1>' + esc(e.artista || e.nombre) + '</h1>' +
              '<p>' + esc(e.nombre) + '</p>' +
              '<p class="tr-slide-lugar">' + esc(lugarEvento(e)) + ' · ' + fechaLarga(e.fecha) + '</p>' +
              '<button class="btn btn-primario" data-ev="' + esc(e.eventoId) + '">Comprar boletas</button>' +
            '</div></div>';
        }).join("") +
      '</div>' +
      '<div class="tr-dots">' + destacados.map(function (_, i) { return '<span class="tr-dot' + (i === 0 ? " on" : "") + '" data-i="' + i + '"></span>'; }).join("") + '</div>';
    wrap.querySelectorAll(".tr-slide button[data-ev]").forEach(function (b) {
      b.addEventListener("click", function () { abrirEvento(b.dataset.ev); });
    });
    wrap.querySelectorAll(".tr-dot").forEach(function (d) { d.addEventListener("click", function () { irSlide(Number(d.dataset.i), destacados.length); }); });
    if (carruselTimer) clearInterval(carruselTimer);
    carruselIdx = 0;
    carruselTimer = setInterval(function () {
      if (!document.getElementById("carr")) { clearInterval(carruselTimer); return; }
      irSlide((carruselIdx + 1) % destacados.length, destacados.length);
    }, 5000);
  }
  function irSlide(i, total) {
    carruselIdx = i;
    document.querySelectorAll(".tr-slide").forEach(function (s) { s.classList.toggle("on", Number(s.dataset.i) === i); });
    document.querySelectorAll(".tr-dot").forEach(function (d) { d.classList.toggle("on", Number(d.dataset.i) === i); });
  }

  // ---- Buscador del inicio: sugerencias en tiempo real ----
  var debTimer = null;
  function conectarBuscadorHome() {
    var input = document.getElementById("q-home");
    var caja = document.getElementById("suger");
    input.addEventListener("input", function () {
      var q = input.value.trim();
      if (debTimer) clearTimeout(debTimer);
      if (!q) { caja.classList.remove("on"); caja.innerHTML = ""; return; }
      debTimer = setTimeout(async function () {
        try {
          var eventos = await cargarCatalogo(q);
          if (!eventos.length) { caja.innerHTML = '<div class="tr-suger-vacio">Sin resultados para “' + esc(q) + '”</div>'; caja.classList.add("on"); return; }
          caja.innerHTML = eventos.slice(0, 6).map(function (e) {
            return '<a class="tr-suger-item" data-ev="' + esc(e.eventoId) + '"><span class="tr-suger-emoji">' + emojiEvento(e) + '</span>' +
              '<span class="tr-suger-txt"><strong>' + esc(e.artista || e.nombre) + '</strong><small>' + esc(lugarEvento(e)) + '</small></span></a>';
          }).join("");
          caja.classList.add("on");
          caja.querySelectorAll(".tr-suger-item").forEach(function (it) { it.addEventListener("click", function () { caja.classList.remove("on"); input.value = ""; abrirEvento(it.dataset.ev); }); });
        } catch (e) { /* noop */ }
      }, 200);
    });
    input.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { location.hash = "#/eventos?q=" + encodeURIComponent(input.value.trim()); } });
    document.addEventListener("click", function (ev) { if (!caja.contains(ev.target) && ev.target !== input) caja.classList.remove("on"); });
  }

  // ---- Tarjetas ----
  function tarjetaEvento(e) {
    var totalDisp = dispTotal(e);
    var poco = totalDisp < 1500;
    return '<div class="tr-card" data-ev="' + esc(e.eventoId) + '">' +
      '<div class="tr-portada" style="background:' + esc(portada(e)) + '">' +
        '<span class="insignia ' + (poco ? "insignia-alerta" : "insignia-exito") + '">' + (poco ? "Últimas boletas" : "Venta abierta") + '</span>' +
        '<span class="emoji">' + emojiEvento(e) + '</span></div>' +
      '<div class="cuerpo"><span class="tr-card-cat">' + esc(e.categoria) + '</span><h3>' + esc(e.artista || e.nombre) + '</h3>' +
        '<p class="lugar">' + esc(lugarEvento(e)) + '</p>' +
        '<p class="tr-fecha">📅 ' + fechaLarga(e.fecha) + '</p>' +
        '<div class="pie"><span class="precio">Desde ' + money(desdePrecio(e)) + '</span><span class="btn btn-primario btn-sm">Ver evento</span></div></div></div>';
  }
  function tarjetaCompacta(e) {
    return '<div class="tr-card tr-card-mini" data-ev="' + esc(e.eventoId) + '">' +
      '<div class="tr-portada" style="background:' + esc(portada(e)) + '"><span class="emoji">' + emojiEvento(e) + '</span></div>' +
      '<div class="cuerpo"><h3>' + esc(e.artista || e.nombre) + '</h3><p class="lugar">' + esc(e.ciudad) + '</p>' +
        '<span class="precio">Desde ' + money(desdePrecio(e)) + '</span></div></div>';
  }
  function enlazarCards(cont) {
    cont.querySelectorAll(".tr-card").forEach(function (c) { c.addEventListener("click", function () { abrirEvento(c.dataset.ev); }); });
  }
  function abrirEvento(id) {
    var buscar = function () { return (S.catalogo && S.catalogo.eventos || []).find(function (e) { return e.eventoId === id; }); };
    var e = buscar();
    if (e) { S.evento = e; ir("evento"); return; }
    cargarCatalogo("").then(function () { S.evento = buscar(); ir("evento"); });
  }

  // ============================ VISTA: EVENTOS (catálogo + búsqueda) ============================
  async function vistaEventos() {
    var qInicial = (location.hash.split("?q=")[1] || "");
    qInicial = qInicial ? decodeURIComponent(qInicial) : "";
    app.innerHTML =
      '<div class="tr-hero-mini"><h1>Explora todos los eventos</h1>' +
      '<div class="tr-buscador"><span class="tr-lupa">🔍</span><input id="q" placeholder="Busca un evento, artista, recinto o ciudad" value="' + esc(qInicial) + '"></div>' +
      '<div class="tr-cats" id="cats"><span class="tr-cat on" data-c="">Todos</span><span class="tr-cat" data-c="Conciertos">Conciertos</span><span class="tr-cat" data-c="Festivales">Festivales</span><span class="tr-cat" data-c="Teatro">Teatro</span><span class="tr-cat" data-c="Deporte">Deporte</span></div></div>' +
      '<div class="tr-grid" id="grid"><p class="tr-mut">Cargando catálogo…</p></div>';
    var input = document.getElementById("q"), grid = document.getElementById("grid");
    var catActiva = "";

    async function refrescar() {
      grid.innerHTML = '<p class="tr-mut">Buscando…</p>';
      try {
        var eventos = await cargarCatalogo(input.value.trim());
        if (catActiva) eventos = eventos.filter(function (e) { return e.categoria === catActiva; });
        grid.innerHTML = eventos.length
          ? eventos.map(tarjetaEvento).join("")
          : '<p class="tr-mut">No encontramos eventos para tu búsqueda. Prueba con otro artista o ciudad.</p>';
        enlazarCards(grid);
      } catch (err) { grid.innerHTML = '<p class="tr-mut">No se pudo cargar el catálogo: ' + esc(err.message) + '</p>'; }
    }

    var t = null;
    input.addEventListener("input", function () { if (t) clearTimeout(t); t = setTimeout(refrescar, 220); });
    document.querySelectorAll("#cats .tr-cat").forEach(function (c) {
      c.addEventListener("click", function () {
        document.querySelectorAll("#cats .tr-cat").forEach(function (o) { o.classList.remove("on"); });
        c.classList.add("on"); catActiva = c.dataset.c; refrescar();
      });
    });
    refrescar();
  }

  // ============================ VISTA: DETALLE ("Acerca del evento") ============================
  function vistaEvento() {
    if (!S.evento) return ir("eventos");
    var e = S.evento;
    app.innerHTML =
      '<a class="tr-volver" href="#/eventos">← Volver a eventos</a>' +
      '<div class="tr-detalle">' +
        '<div class="tr-detalle-portada" style="background:' + esc(portada(e)) + '"><span class="emoji">' + emojiEvento(e) + '</span></div>' +
        '<div class="tr-detalle-info"><span class="etiqueta">' + esc(e.categoria) + ' · Alta demanda</span><h1>' + esc(e.artista || e.nombre) + '</h1>' +
          '<p class="tr-detalle-sub">' + esc(e.nombre) + '</p>' +
          '<div class="fila-datos"><span class="k">📍 Recinto</span><span class="v">' + esc(lugarEvento(e)) + '</span></div>' +
          '<div class="fila-datos"><span class="k">📅 Fecha</span><span class="v">' + fechaLarga(e.fecha) + '</span></div>' +
          '<div class="fila-datos"><span class="k">🎟️ Precio desde</span><span class="v">' + money(desdePrecio(e)) + '</span></div>' +
          '<div class="fila-datos"><span class="k">🏟️ Localidades</span><span class="v">' + e.localidades.length + ' zonas</span></div>' +
          '<button class="btn btn-primario btn-ancho tr-mt" id="ver-entradas">Ver entradas</button>' +
          '<p class="tr-mini tr-mt">Al continuar entrarás a una fila virtual que asegura una venta justa para todos.</p></div>' +
      '</div>' +
      '<section class="tr-sec"><h2>Acerca del evento</h2><p class="tr-desc">' + esc(e.descripcion || "Un evento imperdible. Consigue tus boletas antes de que se agoten.") + '</p></section>' +
      '<section class="tr-sec"><h2>Localidades y precios</h2><div class="tr-locs-lista">' +
        e.localidades.map(function (l) {
          var poco = l.disponibles > 0 && l.disponibles < l.aforoAutorizado * 0.15;
          return '<div class="tr-loc-item"><div><strong>' + esc(l.nombre) + '</strong><small>' + (l.disponibles > 0 ? l.disponibles.toLocaleString("es-CO") + " disponibles" : "Agotado") + (poco ? " · ¡pocas!" : "") + '</small></div><span class="precio">' + money(l.precioCentavos) + '</span></div>';
        }).join("") +
      '</div></section>';
    document.getElementById("ver-entradas").addEventListener("click", function () { conSesion(function () { ir("fila"); }); });
  }

  // ============================ VISTA: FILA (Redis) ============================
  async function vistaFila() {
    if (!S.evento) return ir("eventos");
    app.innerHTML =
      '<div class="tr-centro"><div class="tarjeta tr-fila-card">' +
      '<div class="tr-spinner"></div>' +
      '<h2 id="fila-titulo">Estás en la fila</h2>' +
      '<p class="tr-mut" id="fila-sub">Asegurando tu lugar de forma justa…</p>' +
      '<div class="tr-pista"><div class="tr-avance" id="fila-avance"></div><span class="tr-icono" id="fila-icono">🎫</span><span class="tr-meta">🏁</span></div>' +
      '<div class="fila-datos"><span class="k">Posición</span><span class="v" id="fila-pos">—</span></div>' +
      '<div class="fila-datos"><span class="k">Estado</span><span class="v"><span class="insignia insignia-alerta" id="fila-estado">en espera</span></span></div>' +
      '<p class="tr-mini">Puedes esperar aquí; te damos acceso automáticamente cuando sea tu turno.</p>' +
      '</div></div>';
    try {
      var entrada = await api("POST", "/fila/entrar", { fanId: FAN });
      S.turnoId = entrada.turnoId;
      var pos0 = null;
      for (var i = 0; i < 60; i++) {
        var s = await api("GET", "/fila/" + S.turnoId);
        if (pos0 === null) pos0 = s.posicion || 1;
        document.getElementById("fila-pos").textContent = s.estado === "admitido" ? "¡es tu turno!" : ("#" + (s.posicion || 0));
        document.getElementById("fila-sub").textContent = "Hay " + (s.personasDelante || 0) + " personas delante de ti";
        var avance = Math.max(0, Math.min(1, 1 - (s.posicion || 0) / (pos0 || 1)));
        if (s.estado === "admitido") avance = 1;
        document.getElementById("fila-avance").style.width = (avance * 100) + "%";
        document.getElementById("fila-icono").style.left = (avance * 100) + "%";
        if (s.estado === "admitido") {
          S.token = s.token;
          document.getElementById("fila-estado").textContent = "admitido";
          document.getElementById("fila-estado").className = "insignia insignia-exito";
          document.getElementById("fila-titulo").textContent = "¡Es tu turno!";
          await sleep(500);
          return ir("seleccion");
        }
        await sleep(700);
      }
      toast("La fila está muy llena. Intenta de nuevo."); ir("evento");
    } catch (err) { toast(err.message); ir("evento"); }
  }

  // ============================ VISTA: SELECCIÓN (mapa según recinto) ============================
  function vistaSeleccion() {
    if (!S.token || !S.evento) return ir("eventos");
    S.cantidad = 1; S.localidad = S.evento.localidades[0];
    var locs = S.evento.localidades;
    app.innerHTML =
      '<div class="encabezado-pagina"><span class="etiqueta">Turno admitido · ' + esc(S.evento.recinto || "") + '</span><h1>Elige tu localidad</h1></div>' +
      '<div class="tr-sel-layout">' +
        '<div class="tarjeta"><div class="tr-mapa">' + mapaRecinto(locs) + '</div>' +
          '<div class="tr-leyenda"><span><span class="tr-muestra tr-m-ok"></span>Disponible</span><span><span class="tr-muestra tr-m-warn"></span>Pocas</span><span><span class="tr-muestra tr-m-off"></span>Agotado</span></div>' +
        '</div>' +
        '<div class="tarjeta" id="panel-loc"></div>' +
      '</div>' +
      '<div class="tr-barra-total" id="barra-total"></div>';
    document.querySelectorAll(".tr-zona").forEach(function (z) {
      z.addEventListener("click", function () {
        var loc = locs.find(function (l) { return l.localidadId === z.dataset.loc; });
        if (!loc || loc.disponibles <= 0) return;
        S.localidad = loc; S.cantidad = 1;
        document.querySelectorAll(".tr-zona").forEach(function (o) { o.classList.remove("sel"); });
        z.classList.add("sel");
        pintarPanelLoc();
      });
    });
    pintarPanelLoc();
  }

  // Dibuja el mapa según el tipo de recinto (estadio / coliseo / teatro) inferido del nombre.
  function mapaRecinto(locs) {
    var recinto = (S.evento.recinto || "").toLowerCase();
    var tipo = recinto.indexOf("teatro") >= 0 ? "teatro" : (recinto.indexOf("coliseo") >= 0 || recinto.indexOf("macarena") >= 0 || recinto.indexOf("medplus") >= 0) ? "coliseo" : "estadio";
    var color = function (l) {
      if (l.disponibles <= 0) return ["var(--color-danger-soft,#3b1e2a)", "var(--color-danger,#f87171)"];
      if (l.disponibles < l.aforoAutorizado * 0.15) return ["var(--color-warning-soft,#3a2f1a)", "var(--color-warning,#fbbf24)"];
      return ["var(--color-primary-soft,#241a3a)", "var(--color-primary,#a78bfa)"];
    };
    var etiqueta = function (l) { return l.disponibles > 0 ? l.disponibles.toLocaleString("es-CO") + " disp." : "Agotado"; };

    if (tipo === "teatro") {
      // Escenario arriba, lunetas en abanico.
      var svg = '<svg viewBox="0 0 600 340" width="100%"><rect x="180" y="10" width="240" height="34" rx="4" fill="#111" stroke="var(--color-text-muted,#888)"/><text x="300" y="32" text-anchor="middle" fill="var(--color-text-muted,#aaa)" style="font:700 12px sans-serif">ESCENARIO</text>';
      var y2 = 64;
      locs.forEach(function (l) {
        var c = color(l);
        svg += '<g class="tr-zona" data-loc="' + l.localidadId + '" style="cursor:pointer"><path d="M90 ' + y2 + ' Q300 ' + (y2 - 18) + ' 510 ' + y2 + ' L500 ' + (y2 + 40) + ' Q300 ' + (y2 + 24) + ' 100 ' + (y2 + 40) + ' Z" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="2"/><text x="300" y="' + (y2 + 26) + '" text-anchor="middle" fill="' + c[1] + '" style="font:700 13px sans-serif">' + l.nombre + ' · ' + etiqueta(l) + '</text></g>';
        y2 += 52;
      });
      return svg + "</svg>";
    }
    if (tipo === "coliseo") {
      // Anillos concéntricos alrededor de una pista central.
      var svgC = '<svg viewBox="0 0 600 340" width="100%"><ellipse cx="300" cy="170" rx="70" ry="40" fill="#111" stroke="var(--color-text-muted,#888)"/><text x="300" y="175" text-anchor="middle" fill="var(--color-text-muted,#aaa)" style="font:700 11px sans-serif">TARIMA</text>';
      var rx = 110, ry = 70;
      locs.forEach(function (l) {
        var c = color(l);
        svgC += '<g class="tr-zona" data-loc="' + l.localidadId + '" style="cursor:pointer"><ellipse cx="300" cy="170" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="' + c[1] + '" stroke-width="16" opacity="0.85"/><ellipse cx="300" cy="170" rx="' + rx + '" ry="' + ry + '" fill="' + c[0] + '" opacity="0.10"/><text x="300" y="' + (170 - ry + 4) + '" text-anchor="middle" fill="' + c[1] + '" style="font:700 11px sans-serif">' + l.nombre + ' · ' + etiqueta(l) + '</text></g>';
        rx += 46; ry += 30;
      });
      return svgC + "</svg>";
    }
    // Estadio: escenario arriba, tribunas en rectángulos alrededor del campo.
    var svgE = '<svg viewBox="0 0 600 340" width="100%"><rect x="220" y="10" width="160" height="34" rx="4" fill="#111" stroke="var(--color-text-muted,#888)"/><text x="300" y="32" text-anchor="middle" fill="var(--color-text-muted,#aaa)" style="font:700 12px sans-serif">ESCENARIO</text><rect x="200" y="120" width="200" height="120" rx="8" fill="#0c2a17" stroke="#1f6f45"/><text x="300" y="185" text-anchor="middle" fill="#3fae70" style="font:700 12px sans-serif">CAMPO</text>';
    // Ubica hasta 5 tribunas: campo, occidental(izq), oriental(der), norte(arriba), sur(abajo).
    var slots = [
      { x: 210, y: 250, w: 180, h: 40 },  // sur/general abajo
      { x: 60, y: 120, w: 120, h: 120 },  // occidental izq
      { x: 420, y: 120, w: 120, h: 120 }, // oriental der
      { x: 210, y: 60, w: 180, h: 40 },   // norte arriba
      { x: 210, y: 130, w: 180, h: 40 },  // grama/field (sobre campo)
    ];
    locs.forEach(function (l, i) {
      var s = slots[i % slots.length]; var c = color(l);
      svgE += '<g class="tr-zona" data-loc="' + l.localidadId + '" style="cursor:pointer"><rect x="' + s.x + '" y="' + s.y + '" width="' + s.w + '" height="' + s.h + '" rx="8" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="2"/><text x="' + (s.x + s.w / 2) + '" y="' + (s.y + s.h / 2 - 2) + '" text-anchor="middle" fill="' + c[1] + '" style="font:700 12px sans-serif">' + l.nombre + '</text><text x="' + (s.x + s.w / 2) + '" y="' + (s.y + s.h / 2 + 14) + '" text-anchor="middle" fill="' + c[1] + '" style="font:600 10px sans-serif">' + etiqueta(l) + '</text></g>';
    });
    return svgE + "</svg>";
  }

  function pintarPanelLoc() {
    var l = S.localidad;
    var vendido = l.aforoAutorizado - l.disponibles;
    var pct = Math.round((vendido / l.aforoAutorizado) * 100);
    document.getElementById("panel-loc").innerHTML =
      '<h3>' + esc(l.nombre) + '</h3>' +
      '<div class="fila-datos"><span class="k">Precio nominal</span><span class="v">' + money(l.precioCentavos) + '</span></div>' +
      '<div class="tr-disp"><div class="tr-disp-rot"><span class="tr-mut">Vendido</span><span>' + vendido.toLocaleString("es-CO") + " / " + l.aforoAutorizado.toLocaleString("es-CO") + '</span></div>' +
        '<div class="tr-disp-pista"><div class="tr-disp-fill' + (pct >= 90 ? " peligro" : "") + '" style="width:' + pct + '%"></div></div>' +
        '<div class="tr-mini">' + l.disponibles.toLocaleString("es-CO") + ' disponibles</div></div>' +
      '<label class="tr-lbl">Cantidad (máx. 4 por persona)</label>' +
      '<div class="tr-contador"><button id="menos">−</button><span id="cifra">' + S.cantidad + '</span><button id="mas">+</button></div>';
    document.getElementById("menos").addEventListener("click", function () { if (S.cantidad > 1) { S.cantidad--; pintarPanelLoc(); pintarTotal(); } });
    document.getElementById("mas").addEventListener("click", function () { if (S.cantidad < Math.min(4, l.disponibles)) { S.cantidad++; pintarPanelLoc(); pintarTotal(); } });
    pintarTotal();
  }

  function pintarTotal() {
    var l = S.localidad;
    var nominal = l.precioCentavos * S.cantidad;
    var servicio = Math.round(nominal * 0.12);
    var para = l.precioCentavos >= 15000000 ? Math.round(nominal * 0.10) : 0;
    S.total = nominal + servicio + para;
    document.getElementById("barra-total").innerHTML =
      '<div class="tr-bt-info"><span class="tr-mut">' + S.cantidad + (S.cantidad === 1 ? " boleta · " : " boletas · ") + esc(l.nombre) + '</span>' +
      '<span class="tr-bt-cifra">' + money(S.total) + '</span></div>' +
      '<button class="btn btn-primario" id="btn-reservar">Reservar</button>';
    document.getElementById("btn-reservar").addEventListener("click", reservar);
  }

  async function reservar() {
    var btn = document.getElementById("btn-reservar");
    btn.disabled = true; btn.textContent = "Reservando…";
    try {
      var c = await api("POST", "/compras", { fanId: FAN, tokenAdmision: S.token, localidadId: S.localidad.localidadId, cantidad: S.cantidad });
      S.compraId = c.compraId; S.reservaId = c.reservaId; S.total = c.totalCentavos; S.venceEn = c.venceEn;
      ir("reserva");
    } catch (err) { toast(err.message); btn.disabled = false; btn.textContent = "Reservar"; }
  }

  // ============================ VISTA: RESERVA (temporizador real) ============================
  var relojInterval = null;
  function vistaReserva() {
    if (!S.compraId) return ir("eventos");
    var l = S.localidad;
    var nominal = l.precioCentavos * S.cantidad;
    var servicio = Math.round(nominal * 0.12);
    var para = S.total - nominal - servicio;
    app.innerHTML =
      '<div class="encabezado-pagina"><span class="etiqueta">Tu reserva</span><h1>' + S.cantidad + ' boleta' + (S.cantidad > 1 ? "s" : "") + ' — ' + esc(l.nombre) + '</h1></div>' +
      '<div class="tr-centro-2"><div class="tarjeta tr-txt-centro"><div class="etiqueta">Tu inventario está reservado por</div>' +
        '<div class="tr-anillo"><svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="none" stroke="var(--color-border,#333)" stroke-width="10"/>' +
        '<circle id="anillo" cx="80" cy="80" r="70" fill="none" stroke="var(--color-primary,#a78bfa)" stroke-width="10" stroke-linecap="round" stroke-dasharray="439.8" stroke-dashoffset="0" transform="rotate(-90 80 80)"/>' +
        '<text id="reloj" x="80" y="88" text-anchor="middle" style="font:700 26px sans-serif;fill:var(--color-text,#fff)">10:00</text></svg></div>' +
        '<p class="tr-mut">Si no completas el pago dentro de este tiempo, tu reserva se libera automáticamente.</p></div>' +
      '<div class="tarjeta"><h3>Resumen</h3>' +
        '<div class="fila-datos"><span class="k">' + S.cantidad + ' x ' + esc(l.nombre) + ' (' + money(l.precioCentavos) + ' c/u)</span><span class="v">' + money(nominal) + '</span></div>' +
        '<div class="fila-datos"><span class="k">Cargo por servicio</span><span class="v">' + money(servicio) + '</span></div>' +
        (para > 0 ? '<div class="fila-datos"><span class="k">Contribución parafiscal</span><span class="v">' + money(para) + '</span></div>' : '') +
        '<div class="fila-datos"><span class="k"><strong>Total</strong></span><span class="v"><strong>' + money(S.total) + '</strong></span></div>' +
        '<button class="btn btn-primario btn-ancho tr-mt" id="btn-continuar">Continuar</button>' +
        '<a class="tr-cancelar" id="btn-cancelar">Cancelar reserva</a></div></div>';
    document.getElementById("btn-continuar").addEventListener("click", function () { ir("datos"); });
    document.getElementById("btn-cancelar").addEventListener("click", function () { S.compraId = null; ir("eventos"); });
    if (relojInterval) clearInterval(relojInterval);
    var anillo = document.getElementById("anillo"), reloj = document.getElementById("reloj");
    var total = 600, circ = 439.8;
    relojInterval = setInterval(function () {
      var rest = Math.max(0, Math.round((new Date(S.venceEn).getTime() - Date.now()) / 1000));
      var m = String(Math.floor(rest / 60)).padStart(2, "0"), s = String(rest % 60).padStart(2, "0");
      if (!reloj) { clearInterval(relojInterval); return; }
      reloj.textContent = m + ":" + s;
      var frac = rest / total;
      anillo.setAttribute("stroke-dashoffset", String(circ * (1 - frac)));
      anillo.style.stroke = frac < 0.34 ? "var(--color-danger,#f87171)" : frac < 0.6 ? "var(--color-warning,#fbbf24)" : "var(--color-primary,#a78bfa)";
      if (rest <= 0) clearInterval(relojInterval);
    }, 1000);
  }

  // ============================ VISTA: DATOS DEL TITULAR ============================
  function vistaDatos() {
    if (!S.compraId) return ir("eventos");
    var perfil = (S.sesion && S.sesion.perfil) || {};
    app.innerHTML =
      '<a class="tr-volver" href="#/reserva">← Volver a la reserva</a>' +
      '<div class="encabezado-pagina"><span class="etiqueta">Confirma al titular</span><h1>¿A nombre de quién van las boletas?</h1></div>' +
      '<div class="tr-centro-1"><div class="tarjeta">' +
        '<div class="tr-campo"><label>Nombre completo</label><input id="d-nombre" value="' + esc(perfil.nombre || "") + '" placeholder="Tu nombre"></div>' +
        '<div class="tr-campo"><label>Correo electrónico</label><input id="d-correo" value="' + esc(perfil.correo || "") + '" placeholder="tucorreo@ejemplo.com"></div>' +
        '<div class="tr-campo"><label>Documento</label><input id="d-doc" value="' + esc(perfil.documento || "") + '" placeholder="C.C. / pasaporte"></div>' +
        '<div class="tr-nota">🔒 Tus datos se cifran (AES-256) y solo se usan para emitir tu boleta nominal. No se comparten sin tu consentimiento.</div>' +
        '<button class="btn btn-primario btn-ancho" id="btn-datos">Ir a pagar</button></div></div>';
    document.getElementById("btn-datos").addEventListener("click", function () {
      S.titular = { nombre: document.getElementById("d-nombre").value, correo: document.getElementById("d-correo").value };
      ir("pago");
    });
  }

  // ============================ VISTA: PAGO (SAGA) ============================
  function vistaPago() {
    if (!S.compraId) return ir("eventos");
    app.innerHTML =
      '<div class="encabezado-pagina"><span class="etiqueta">Pago · ' + money(S.total) + '</span><h1>Completa tu pago</h1></div>' +
      '<div class="tr-centro-1"><div class="tarjeta" id="pago-form">' +
        '<div class="tr-campo"><label>Medio de pago</label><select id="p-medio"><option value="tarjeta">Tarjeta de crédito o débito</option><option value="pse">PSE</option><option value="billetera">Billetera digital</option></select></div>' +
        '<div class="tr-campo"><label>Número de tarjeta</label><input id="p-num" value="4242 4242 4242 4242"></div>' +
        '<div class="tr-campo"><label>Nombre del titular</label><input id="p-tit" value="' + esc(S.titular.nombre || "") + '"></div>' +
        '<button class="btn btn-primario btn-ancho" id="btn-pagar">Pagar ' + money(S.total) + '</button>' +
        '<p class="tr-mini tr-txt-centro tr-mt">🔒 Pago procesado de forma segura</p></div></div>';
    document.getElementById("btn-pagar").addEventListener("click", pagar);
  }

  async function pagar() {
    var cont = document.getElementById("pago-form");
    cont.innerHTML = '<div class="tr-txt-centro"><div class="tr-spinner"></div><h3>Procesando tu pago…</h3><p class="tr-mut">Esperando la confirmación de la pasarela. No cierres esta ventana.</p></div>';
    try {
      var p = await api("POST", "/compras/" + S.compraId + "/pago", { medio: document.getElementById("p-medio") ? document.getElementById("p-medio").value : "tarjeta" });
      S.pagoId = p.pagoId;
      for (var i = 0; i < 25; i++) {
        await sleep(700);
        var est = await api("GET", "/compras/" + S.compraId);
        if (est.pago && est.pago.estado !== "confirmado") { await api("POST", "/demo/pasarela/confirmar/" + est.pago.pagoId, {}).catch(function () {}); }
        if (est.compra.paso === "emitida") { S.boletas = est.boletas; return ir("boleta"); }
        if (est.compra.paso === "enConciliacion") { return pintarConciliacion(); }
      }
      pintarConciliacion();
    } catch (err) { toast(err.message); ir("pago"); }
  }

  function pintarConciliacion() {
    document.getElementById("pago-form").innerHTML =
      '<div class="alerta alerta-alerta"><strong>Tu pago está confirmado, estamos emitiendo tu boleta</strong>La pasarela tardó en responder. Tu cobro quedó registrado y no se te cobrará dos veces. Si tu boleta no aparece en unos minutos, soporte ya tiene el caso.</div>' +
      '<div class="fila-datos"><span class="k">Estado del pago</span><span class="v"><span class="insignia insignia-alerta">en conciliación</span></span></div>';
  }

  // ============================ VISTA: BOLETA EMITIDA ============================
  function vistaBoleta() {
    if (!S.boletas) return ir("eventos");
    app.innerHTML =
      '<div class="tr-centro-1"><div class="alerta alerta-exito"><strong>¡Listo! Tus boletas están emitidas</strong>Te enviamos una copia a ' + esc(S.titular.correo || "tu correo") + '.</div>' +
      S.boletas.map(function (b, i) {
        return '<div class="tr-boleta"><div class="tr-boleta-cab"><strong>' + esc(S.evento.artista || S.evento.nombre) + '</strong><span class="insignia insignia-exito">' + esc(b.estado) + '</span></div>' +
          '<div class="tr-mini">' + esc(S.localidad.nombre) + ' · ' + esc(lugarEvento(S.evento)) + ' · Boleta ' + (i + 1) + ' de ' + S.boletas.length + '</div>' +
          '<div class="tr-qr">▦</div>' +
          '<div class="tr-cod">' + esc(b.codigo) + '</div></div>';
      }).join("") +
      '<button class="btn btn-secundario btn-ancho tr-mt" id="btn-fin">Volver al inicio</button></div>';
    document.getElementById("btn-fin").addEventListener("click", function () { S.compraId = null; S.boletas = null; ir("inicio"); });
  }

  // ============================ VISTA: PERFIL (ver y editar) ============================
  async function vistaPerfil() {
    if (!S.sesion || !S.sesion.token) { abrirAuth("ingreso", function () { ir("perfil"); }); return ir("inicio"); }
    app.innerHTML = '<div class="encabezado-pagina"><span class="etiqueta">Mi cuenta</span><h1>Mi perfil</h1></div><div id="perfil"><p class="tr-mut">Cargando…</p></div>';
    try {
      var d = await api("GET", "/auth/perfil");
      var p = d.perfil;
      S.sesion.perfil = p;
      try { localStorage.setItem("tr-sesion", JSON.stringify(S.sesion)); } catch (e) {}
      var ini = ((p.nombre || p.correo)[0] || "T").toUpperCase();
      document.getElementById("perfil").innerHTML =
        '<div class="tr-perfil-cab"><div class="tr-avatar tr-avatar-lg">' + esc(ini) + '</div><div><h2>' + esc(p.nombre || "Sin nombre") + '</h2><p class="tr-mut">' + esc(p.correo) + '</p></div></div>' +
        '<div class="tr-centro-1"><div class="tarjeta"><h3>Datos personales</h3>' +
          '<div class="tr-campo"><label>Nombre completo</label><input id="pf-nombre" value="' + esc(p.nombre || "") + '"></div>' +
          '<div class="tr-campo"><label>Documento</label><input id="pf-doc" value="' + esc(p.documento || "") + '"></div>' +
          '<div class="tr-campo"><label>Correo (no editable)</label><input value="' + esc(p.correo) + '" disabled></div>' +
          '<div class="tr-nota">🔒 Tu nombre y documento se guardan cifrados con AES-256-GCM. Nadie más los ve en claro.</div>' +
          '<button class="btn btn-primario btn-ancho" id="pf-guardar">Guardar cambios</button></div></div>';
      document.getElementById("pf-guardar").addEventListener("click", async function () {
        var btn = document.getElementById("pf-guardar"); btn.disabled = true; btn.textContent = "Guardando…";
        try {
          var r = await api("PUT", "/auth/perfil", { nombre: document.getElementById("pf-nombre").value.trim(), documento: document.getElementById("pf-doc").value.trim() });
          S.sesion.perfil = r.perfil;
          try { localStorage.setItem("tr-sesion", JSON.stringify(S.sesion)); } catch (e) {}
          pintarCuenta();
          toast("Perfil actualizado", "ok");
        } catch (e) { toast(e.message); }
        finally { btn.disabled = false; btn.textContent = "Guardar cambios"; }
      });
    } catch (err) {
      if (/401|inválid/i.test(err.message)) { cerrarSesion(); abrirAuth("ingreso"); return; }
      document.getElementById("perfil").innerHTML = '<p class="tr-mut">No se pudo cargar tu perfil: ' + esc(err.message) + '</p>';
    }
  }

  // ============================ VISTA: PROMOTOR ============================
  async function vistaPromotor() {
    app.innerHTML = '<div class="encabezado-pagina"><span class="etiqueta">Promotor</span><h1>Resumen de ventas</h1></div><div id="promo"><p class="tr-mut">Cargando métricas…</p></div>';
    try {
      var m = await (await fetch("/metrics")).text();
      var ventas = leerMetrica(m, "ticketright_sales_amount_total") / 100;
      var pagosConf = leerMetrica(m, 'ticketright_payments_total{state="confirmado"}');
      var enFila = leerMetrica(m, "ticketright_waiting_room_size") || leerMetrica(m, "ticketright_admission_queue_size");
      var cat = S.catalogo ? S.catalogo : await api("GET", "/catalogo");
      var eventos = cat.eventos;
      var aforoTotal = 0, dispTotal2 = 0;
      eventos.forEach(function (e) { e.localidades.forEach(function (l) { aforoTotal += l.aforoAutorizado; dispTotal2 += l.disponibles; }); });
      var vendidas = aforoTotal - dispTotal2;
      document.getElementById("promo").innerHTML =
        '<div class="tr-kpis">' +
          kpi("Dinero recaudado", "$" + Math.round(ventas).toLocaleString("es-CO"), "green") +
          kpi("Boletas vendidas", vendidas.toLocaleString("es-CO"), "blue") +
          kpi("Pagos confirmados", pagosConf.toLocaleString("es-CO"), "purple") +
          kpi("Ocupación global", (aforoTotal ? Math.round((vendidas / aforoTotal) * 100) : 0) + "%", "orange") +
        '</div>' +
        '<div class="tarjeta tr-mt"><h3>Ocupación por evento</h3>' +
        eventos.map(function (e) {
          var af = e.localidades.reduce(function (a, l) { return a + l.aforoAutorizado; }, 0);
          var di = e.localidades.reduce(function (a, l) { return a + l.disponibles; }, 0);
          var vend = af - di; var pct = af ? Math.round((vend / af) * 100) : 0;
          return '<div class="tr-disp"><div class="tr-disp-rot"><span>' + emojiEvento(e) + ' ' + esc(e.artista || e.nombre) + ' · ' + esc(e.ciudad) + '</span><span>' + vend.toLocaleString("es-CO") + " / " + af.toLocaleString("es-CO") + ' (' + pct + '%)</span></div>' +
            '<div class="tr-disp-pista"><div class="tr-disp-fill' + (pct >= 90 ? " peligro" : "") + '" style="width:' + pct + '%"></div></div></div>';
        }).join("") + '</div>' +
        '<p class="tr-mini tr-mt">Datos en vivo desde la plataforma (Prometheus + PostgreSQL). Tablero completo en Grafana.</p>';
    } catch (err) { document.getElementById("promo").innerHTML = '<p class="tr-mut">No se pudieron cargar las métricas: ' + esc(err.message) + '</p>'; }
  }

  // ============================ VISTA: OPERACIÓN ============================
  async function vistaOperacion() {
    app.innerHTML = '<div class="encabezado-pagina"><span class="etiqueta">Operación interna</span><h1>Estado operativo</h1></div><div id="op"><p class="tr-mut">Cargando…</p></div>';
    try {
      var m = await (await fetch("/metrics")).text();
      var disc = leerMetrica(m, "ticketright_open_discrepancies");
      var edad = leerMetrica(m, "ticketright_oldest_discrepancy_age_seconds");
      var enCurso = leerMetrica(m, "ticketright_payments_in_flight");
      var vencidas = leerMetrica(m, "ticketright_overdue_reservations");
      var perfil = leerMetrica(m, "ticketright_operational_profile");
      var perfiles = ["Cotidiano", "Preparación", "Pico", "Recuperación", "Emergencia"];
      document.getElementById("op").innerHTML =
        '<div class="tr-kpis">' +
          kpi("Discrepancias abiertas", disc, disc > 0 ? "orange" : "green") +
          kpi("Edad más antigua", Math.round(edad) + "s", edad > 900 ? "red" : "green") +
          kpi("Pagos en curso", enCurso, "blue") +
          kpi("Reservas vencidas", vencidas, vencidas > 0 ? "orange" : "green") +
        '</div>' +
        '<div class="tarjeta tr-mt"><h3>Perfil operativo</h3>' +
        '<div class="fila-datos"><span class="k">Perfil actual</span><span class="v"><span class="insignia insignia-neutro">' + (perfiles[perfil] || "—") + '</span></span></div>' +
        '<p class="tr-mini">El perfil regula la admisión de la fila (back pressure). Se cambia desde <code>/operacion/perfil</code>.</p></div>' +
        '<div class="tarjeta"><h3>Correspondencia dinero ↔ boleta</h3>' +
        '<p class="tr-mut">' + (disc === 0 ? "✅ No hay dinero cobrado sin boleta. La conciliación está al día." : "⚠️ Hay " + disc + " pago(s) confirmado(s) sin boleta; la SAGA los está conciliando.") + '</p></div>';
    } catch (err) { document.getElementById("op").innerHTML = '<p class="tr-mut">Error: ' + esc(err.message) + '</p>'; }
  }

  function kpi(t, v, color) { return '<div class="tr-kpi tr-kpi-' + color + '"><div class="tr-kpi-v">' + v + '</div><div class="tr-kpi-t">' + t + '</div></div>'; }
  function leerMetrica(txt, nombre) {
    var lineas = txt.split("\n");
    for (var i = 0; i < lineas.length; i++) {
      if (lineas[i].indexOf(nombre) === 0) { var p = lineas[i].split(" "); return Number(p[p.length - 1]) || 0; }
    }
    return 0;
  }

  render();
})();
