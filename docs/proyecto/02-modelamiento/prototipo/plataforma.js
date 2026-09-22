/*
 * Plataforma funcional de TicketRight — SPA que reproduce el flujo del prototipo
 * (fan-eventos → fan-evento → fila → selección → reserva → datos → pago → boleta) pero
 * CONECTADA A LAS APIS REALES: fila en Redis, reserva/pago/emisión por la SAGA, catálogo
 * desde PostgreSQL. La arquitectura opera por detrás; el usuario ve un producto de venta
 * de boletas. También incluye las vistas de Promotor y Operación con datos reales.
 */
(function () {
  "use strict";

  var FAN = "88888888-8888-4888-8888-888888888888";
  var H = { "content-type": "application/json", "x-fan-id": FAN, "user-agent": "Mozilla/5.0 TicketRight" };

  // Estado de la sesión de compra en curso.
  var S = {
    catalogo: null, evento: null, localidad: null, cantidad: 1,
    token: null, turnoId: null, compraId: null, reservaId: null,
    pagoId: null, total: 0, venceEn: null, titular: {},
  };

  var app = document.getElementById("app");
  var toastEl = document.getElementById("toast");

  // ---- utilidades ----
  function money(cent) { return "$" + Math.round(cent / 100).toLocaleString("es-CO"); }
  function toast(msg, tipo) {
    toastEl.textContent = msg;
    toastEl.className = "tr-toast " + (tipo || "err") + " on";
    setTimeout(function () { toastEl.className = "tr-toast"; }, 3800);
  }
  async function api(m, ruta, cuerpo) {
    var r = await fetch(ruta, { method: m, headers: H, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
    var t = await r.text(); var d = t ? JSON.parse(t) : {};
    if (!r.ok) throw new Error((d && d.mensaje) || (m + " " + ruta + " → " + r.status));
    return d;
  }
  var EMOJI = { "Concierto de demostración": "🎸", default: "🎫" };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // ================= NAVEGACIÓN =================
  var rutas = {
    "eventos": vistaEventos,
    "evento": vistaEvento,
    "fila": vistaFila,
    "seleccion": vistaSeleccion,
    "reserva": vistaReserva,
    "datos": vistaDatos,
    "pago": vistaPago,
    "boleta": vistaBoleta,
    "promotor": vistaPromotor,
    "operacion": vistaOperacion,
  };

  function ir(ruta) { location.hash = "#/" + ruta; }
  function render() {
    var ruta = (location.hash.replace("#/", "") || "eventos").split("?")[0];
    var fn = rutas[ruta] || vistaEventos;
    marcarNav(ruta);
    fn();
  }
  window.addEventListener("hashchange", render);

  function marcarNav(ruta) {
    document.querySelectorAll(".tr-nav a").forEach(function (a) {
      a.classList.toggle("on", a.dataset.ruta === ruta || (ruta === "evento" && a.dataset.ruta === "eventos"));
    });
  }

  // ================= VISTA: EVENTOS (catálogo real) =================
  async function vistaEventos() {
    app.innerHTML = '<div class="tr-hero"><span class="etiqueta">Los eventos más esperados</span>' +
      '<h1>Vive lo que no te quieres perder</h1>' +
      '<div class="tr-buscador"><input id="q" placeholder="Busca un evento, artista o lugar"><button class="btn btn-primario">Buscar</button></div>' +
      '<div class="tr-cats"><span class="tr-cat on">Todos</span><span class="tr-cat">Conciertos</span><span class="tr-cat">Festivales</span><span class="tr-cat">Teatro</span><span class="tr-cat">Deporte</span></div></div>' +
      '<h2 class="tr-h2">Eventos disponibles</h2><div class="tr-grid" id="grid"><p class="tr-mut">Cargando catálogo…</p></div>';
    try {
      S.catalogo = await api("GET", "/catalogo");
      var grid = document.getElementById("grid");
      grid.innerHTML = S.catalogo.eventos.map(function (e) {
        var desde = Math.min.apply(null, e.localidades.map(function (l) { return l.precioCentavos; }));
        var totalDisp = e.localidades.reduce(function (a, l) { return a + l.disponibles; }, 0);
        return '<div class="tr-card" data-ev="' + e.eventoId + '">' +
          '<div class="tr-portada"><span class="insignia insignia-exito">Venta abierta</span><span class="emoji">' + (EMOJI[e.nombre] || EMOJI.default) + '</span></div>' +
          '<div class="cuerpo"><h3>' + e.nombre + '</h3><p class="lugar">Movistar Arena, Bogotá · sáb. 21 de marzo, 8:00 p.m.</p>' +
          '<p class="tr-demanda">🔥 ' + totalDisp.toLocaleString("es-CO") + ' boletas disponibles</p>' +
          '<div class="pie"><span class="precio">Desde ' + money(desde) + '</span><span class="btn btn-primario btn-sm">Ver evento</span></div></div></div>';
      }).join("");
      grid.querySelectorAll(".tr-card").forEach(function (c) {
        c.addEventListener("click", function () { S.evento = S.catalogo.eventos.find(function (e) { return e.eventoId === c.dataset.ev; }); ir("evento"); });
      });
    } catch (err) { document.getElementById("grid").innerHTML = '<p class="tr-mut">No se pudo cargar el catálogo: ' + err.message + '</p>'; }
  }

  // ================= VISTA: DETALLE DE EVENTO =================
  function vistaEvento() {
    if (!S.evento) return ir("eventos");
    var e = S.evento;
    var desde = Math.min.apply(null, e.localidades.map(function (l) { return l.precioCentavos; }));
    app.innerHTML =
      '<a class="tr-volver" href="#/eventos">← Volver a eventos</a>' +
      '<div class="tr-detalle"><div class="tr-detalle-portada"><span class="emoji">' + (EMOJI[e.nombre] || EMOJI.default) + '</span></div>' +
      '<div class="tr-detalle-info"><span class="etiqueta">Concierto · Alta demanda</span><h1>' + e.nombre + '</h1>' +
      '<p class="tr-mut">Movistar Arena, Bogotá · sábado 21 de marzo, 8:00 p.m.</p>' +
      '<div class="fila-datos"><span class="k">Apertura de puertas</span><span class="v">6:00 p.m.</span></div>' +
      '<div class="fila-datos"><span class="k">Precio desde</span><span class="v">' + money(desde) + '</span></div>' +
      '<div class="fila-datos"><span class="k">Localidades</span><span class="v">' + e.localidades.length + ' zonas</span></div>' +
      '<button class="btn btn-primario btn-ancho tr-mt" id="comprar">Comprar boletas</button>' +
      '<p class="tr-mini tr-mt">Al comprar entrarás a una fila virtual que asegura una venta justa para todos.</p></div></div>';
    document.getElementById("comprar").addEventListener("click", function () { ir("fila"); });
  }

  // ================= VISTA: FILA (sala de espera real, Redis) =================
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

  // ================= VISTA: SELECCIÓN DE LOCALIDAD (mapa + disponibilidad real) =================
  function vistaSeleccion() {
    if (!S.token || !S.evento) return ir("eventos");
    S.cantidad = 1; S.localidad = S.evento.localidades[0];
    var locs = S.evento.localidades;
    app.innerHTML =
      '<div class="encabezado-pagina"><span class="etiqueta">Turno admitido · elige tu localidad</span><h1>Elige tu localidad</h1></div>' +
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

  function mapaRecinto(locs) {
    // Un anillo por localidad (hasta 4), color según disponibilidad.
    var colores = function (l) {
      if (l.disponibles <= 0) return ["var(--color-danger-soft)", "var(--color-danger)"];
      if (l.disponibles < l.aforoAutorizado * 0.15) return ["var(--color-warning-soft)", "var(--color-warning)"];
      return ["var(--color-primary-soft)", "var(--color-primary)"];
    };
    var svg = '<svg viewBox="0 0 600 300" width="100%">' +
      '<rect x="220" y="12" width="160" height="40" rx="4" fill="var(--color-bg)" stroke="var(--color-text-muted)"/>' +
      '<text x="300" y="37" text-anchor="middle" fill="var(--color-text-muted)" style="font:700 12px sans-serif">ESCENARIO</text>';
    var y = 70;
    locs.forEach(function (l, i) {
      var c = colores(l);
      svg += '<g class="tr-zona" data-loc="' + l.localidadId + '" style="cursor:pointer">' +
        '<rect x="70" y="' + y + '" width="460" height="44" rx="8" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="2"/>' +
        '<text x="90" y="' + (y + 27) + '" fill="' + c[1] + '" style="font:700 15px sans-serif">' + l.nombre + '</text>' +
        '<text x="510" y="' + (y + 27) + '" text-anchor="end" fill="' + c[1] + '" style="font:600 13px sans-serif">' + (l.disponibles > 0 ? l.disponibles.toLocaleString("es-CO") + " disp." : "Agotado") + '</text>' +
        '</g>';
      y += 54;
    });
    return svg + "</svg>";
  }

  function pintarPanelLoc() {
    var l = S.localidad;
    var vendido = l.aforoAutorizado - l.disponibles;
    var pct = Math.round((vendido / l.aforoAutorizado) * 100);
    document.getElementById("panel-loc").innerHTML =
      '<h3>' + l.nombre + '</h3>' +
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
      '<div class="tr-bt-info"><span class="tr-mut">' + S.cantidad + (S.cantidad === 1 ? " boleta · " : " boletas · ") + l.nombre + '</span>' +
      '<span class="tr-bt-cifra">' + money(S.total) + '</span></div>' +
      '<button class="btn btn-primario" id="btn-reservar">Reservar</button>';
    document.getElementById("btn-reservar").addEventListener("click", reservar);
  }

  // ================= RESERVA (real) =================
  async function reservar() {
    var btn = document.getElementById("btn-reservar");
    btn.disabled = true; btn.textContent = "Reservando…";
    try {
      var c = await api("POST", "/compras", { fanId: FAN, tokenAdmision: S.token, localidadId: S.localidad.localidadId, cantidad: S.cantidad });
      S.compraId = c.compraId; S.reservaId = c.reservaId; S.total = c.totalCentavos; S.venceEn = c.venceEn;
      ir("reserva");
    } catch (err) {
      toast(err.message); btn.disabled = false; btn.textContent = "Reservar";
    }
  }

  // ================= VISTA: RESERVA (temporizador real de 10 min) =================
  var relojInterval = null;
  function vistaReserva() {
    if (!S.compraId) return ir("eventos");
    var l = S.localidad;
    var nominal = l.precioCentavos * S.cantidad;
    var servicio = Math.round(nominal * 0.12);
    var para = S.total - nominal - servicio;
    app.innerHTML =
      '<div class="encabezado-pagina"><span class="etiqueta">Tu reserva</span><h1>' + S.cantidad + ' boleta' + (S.cantidad > 1 ? "s" : "") + ' — ' + l.nombre + '</h1></div>' +
      '<div class="tr-centro-2"><div class="tarjeta tr-txt-centro"><div class="etiqueta">Tu inventario está reservado por</div>' +
        '<div class="tr-anillo"><svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="none" stroke="var(--color-border)" stroke-width="10"/>' +
        '<circle id="anillo" cx="80" cy="80" r="70" fill="none" stroke="var(--color-primary)" stroke-width="10" stroke-linecap="round" stroke-dasharray="439.8" stroke-dashoffset="0" transform="rotate(-90 80 80)"/>' +
        '<text id="reloj" x="80" y="88" text-anchor="middle" style="font:700 26px sans-serif;fill:var(--color-text)">10:00</text></svg></div>' +
        '<p class="tr-mut">Si no completas el pago dentro de este tiempo, tu reserva se libera automáticamente.</p></div>' +
      '<div class="tarjeta"><h3>Resumen</h3>' +
        '<div class="fila-datos"><span class="k">' + S.cantidad + ' x ' + l.nombre + ' (' + money(l.precioCentavos) + ' c/u)</span><span class="v">' + money(nominal) + '</span></div>' +
        '<div class="fila-datos"><span class="k">Cargo por servicio</span><span class="v">' + money(servicio) + '</span></div>' +
        (para > 0 ? '<div class="fila-datos"><span class="k">Contribución parafiscal</span><span class="v">' + money(para) + '</span></div>' : '') +
        '<div class="fila-datos"><span class="k"><strong>Total</strong></span><span class="v"><strong>' + money(S.total) + '</strong></span></div>' +
        '<button class="btn btn-primario btn-ancho tr-mt" id="btn-continuar">Continuar</button>' +
        '<a class="tr-cancelar" id="btn-cancelar">Cancelar reserva</a></div></div>';
    document.getElementById("btn-continuar").addEventListener("click", function () { ir("datos"); });
    document.getElementById("btn-cancelar").addEventListener("click", function () { S.compraId = null; ir("eventos"); });
    // Temporizador real basado en venceEn del backend.
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
      anillo.style.stroke = frac < 0.34 ? "var(--color-danger)" : frac < 0.6 ? "var(--color-warning)" : "var(--color-primary)";
      if (rest <= 0) clearInterval(relojInterval);
    }, 1000);
  }

  // ================= VISTA: DATOS DEL TITULAR =================
  function vistaDatos() {
    if (!S.compraId) return ir("eventos");
    app.innerHTML =
      '<a class="tr-volver" href="#/reserva">← Volver a la reserva</a>' +
      '<div class="encabezado-pagina"><span class="etiqueta">Confirma al titular</span><h1>¿A nombre de quién van las boletas?</h1></div>' +
      '<div class="tr-centro-1"><div class="tarjeta">' +
        '<div class="tr-campo"><label>Nombre completo</label><input id="d-nombre" value="Quinnie Villa"></div>' +
        '<div class="tr-campo"><label>Correo electrónico</label><input id="d-correo" value="quinn.villa@ejemplo.com"></div>' +
        '<div class="tr-campo"><label>Documento</label><input id="d-doc" value="1020304050"></div>' +
        '<div class="tr-nota">🔒 Tus datos se cifran (AES-256) y solo se usan para emitir tu boleta nominal. No se comparten sin tu consentimiento.</div>' +
        '<button class="btn btn-primario btn-ancho" id="btn-datos">Ir a pagar</button></div></div>';
    document.getElementById("btn-datos").addEventListener("click", function () {
      S.titular = { nombre: document.getElementById("d-nombre").value, correo: document.getElementById("d-correo").value };
      ir("pago");
    });
  }

  // ================= VISTA: PAGO (real, SAGA) =================
  function vistaPago() {
    if (!S.compraId) return ir("eventos");
    app.innerHTML =
      '<div class="encabezado-pagina"><span class="etiqueta">Pago · ' + money(S.total) + '</span><h1>Completa tu pago</h1></div>' +
      '<div class="tr-centro-1"><div class="tarjeta" id="pago-form">' +
        '<div class="tr-campo"><label>Medio de pago</label><select id="p-medio"><option value="tarjeta">Tarjeta de crédito o débito</option><option value="pse">PSE</option><option value="billetera">Billetera digital</option></select></div>' +
        '<div class="tr-campo"><label>Número de tarjeta</label><input id="p-num" value="4242 4242 4242 4242"></div>' +
        '<div class="tr-campo"><label>Nombre del titular</label><input id="p-tit" value="' + (S.titular.nombre || "") + '"></div>' +
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

  // ================= VISTA: BOLETA EMITIDA =================
  function vistaBoleta() {
    if (!S.boletas) return ir("eventos");
    app.innerHTML =
      '<div class="tr-centro-1"><div class="alerta alerta-exito"><strong>¡Listo! Tus boletas están emitidas</strong>Te enviamos una copia a ' + (S.titular.correo || "tu correo") + '.</div>' +
      S.boletas.map(function (b, i) {
        return '<div class="tr-boleta"><div class="tr-boleta-cab"><strong>' + S.evento.nombre + '</strong><span class="insignia insignia-exito">' + b.estado + '</span></div>' +
          '<div class="tr-mini">' + S.localidad.nombre + ' · Boleta ' + (i + 1) + ' de ' + S.boletas.length + '</div>' +
          '<div class="tr-qr">▦</div>' +
          '<div class="tr-cod">' + b.codigo + '</div></div>';
      }).join("") +
      '<button class="btn btn-secundario btn-ancho tr-mt" id="btn-fin">Volver a los eventos</button></div>';
    document.getElementById("btn-fin").addEventListener("click", function () { S.compraId = null; S.boletas = null; ir("eventos"); });
  }

  // ================= VISTA: PROMOTOR (métricas reales) =================
  async function vistaPromotor() {
    app.innerHTML = '<div class="encabezado-pagina"><span class="etiqueta">Promotor</span><h1>Resumen de ventas</h1></div><div id="promo"><p class="tr-mut">Cargando métricas…</p></div>';
    try {
      var m = await (await fetch("/metrics")).text();
      var ventas = leerMetrica(m, "ticketright_sales_amount_total") / 100;
      var boletas = leerMetrica(m, 'ticketright_ticket_state_transitions_total{state="emitida"}') || leerMetricaSuma(m, "ticketright_ticket_state_transitions_total");
      var pagosConf = leerMetrica(m, 'ticketright_payments_total{state="confirmado"}');
      var cat = await api("GET", "/catalogo");
      var ev = cat.eventos[0];
      var aforoTotal = ev.localidades.reduce(function (a, l) { return a + l.aforoAutorizado; }, 0);
      var dispTotal = ev.localidades.reduce(function (a, l) { return a + l.disponibles; }, 0);
      var vendidas = aforoTotal - dispTotal;
      document.getElementById("promo").innerHTML =
        '<div class="tr-kpis">' +
          kpi("Dinero vendido", "$" + Math.round(ventas).toLocaleString("es-CO"), "green") +
          kpi("Boletas vendidas", vendidas.toLocaleString("es-CO"), "blue") +
          kpi("Pagos confirmados", pagosConf.toLocaleString("es-CO"), "purple") +
          kpi("Ocupación", Math.round((vendidas / aforoTotal) * 100) + "%", "orange") +
        '</div>' +
        '<div class="tarjeta tr-mt"><h3>Ocupación por localidad</h3>' +
        ev.localidades.map(function (l) {
          var vend = l.aforoAutorizado - l.disponibles; var pct = Math.round((vend / l.aforoAutorizado) * 100);
          return '<div class="tr-disp"><div class="tr-disp-rot"><span>' + l.nombre + '</span><span>' + vend.toLocaleString("es-CO") + " / " + l.aforoAutorizado.toLocaleString("es-CO") + ' (' + pct + '%)</span></div>' +
            '<div class="tr-disp-pista"><div class="tr-disp-fill' + (pct >= 90 ? " peligro" : "") + '" style="width:' + pct + '%"></div></div></div>';
        }).join("") + '</div>' +
        '<p class="tr-mini tr-mt">Datos en vivo desde la plataforma. Tablero completo en Grafana.</p>';
    } catch (err) { document.getElementById("promo").innerHTML = '<p class="tr-mut">No se pudieron cargar las métricas: ' + err.message + '</p>'; }
  }

  // ================= VISTA: OPERACIÓN (discrepancias reales) =================
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
    } catch (err) { document.getElementById("op").innerHTML = '<p class="tr-mut">Error: ' + err.message + '</p>'; }
  }

  function kpi(t, v, color) { return '<div class="tr-kpi tr-kpi-' + color + '"><div class="tr-kpi-v">' + v + '</div><div class="tr-kpi-t">' + t + '</div></div>'; }
  function leerMetrica(txt, nombre) {
    var lineas = txt.split("\n");
    for (var i = 0; i < lineas.length; i++) {
      if (lineas[i].indexOf(nombre) === 0) { var p = lineas[i].split(" "); return Number(p[p.length - 1]) || 0; }
    }
    return 0;
  }
  function leerMetricaSuma(txt, prefijo) {
    return txt.split("\n").filter(function (l) { return l.indexOf(prefijo) === 0; })
      .reduce(function (a, l) { var p = l.split(" "); return a + (Number(p[p.length - 1]) || 0); }, 0);
  }

  render();
})();
