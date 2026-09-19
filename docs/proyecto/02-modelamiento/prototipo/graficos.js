// Gráficas del prototipo, con fallback: usan Chart.js si el CDN cargó, y si no
// (sin internet en el momento de sustentar), dibujan una versión equivalente en SVG/CSS
// hecha a mano. Nunca dependen de que la librería externa esté disponible.
(function () {
  function motorListo(callback) {
    if (window.__chartDecidido) { callback(window.__chartOk); return; }
    window.addEventListener("load", function () {
      window.__chartOk = typeof window.Chart !== "undefined";
      window.__chartDecidido = true;
      callback(window.__chartOk);
    });
  }

  function colorVar(nombre) {
    return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  }

  // ---------- Embudo de conversión ----------
  function embudoFallback(el, pasos) {
    var maximo = pasos[0].valor;
    var html = "";
    pasos.forEach(function (p) {
      html += '<div class="embudo-paso"><span>' + p.etiqueta + '</span>' +
        '<div class="pista"><div class="relleno" data-ancho="' + Math.round((p.valor / maximo) * 100) + '"></div></div>' +
        '<span class="cifra">' + p.valor.toLocaleString("es-CO") + "</span></div>";
    });
    el.innerHTML = html;
    requestAnimationFrame(function () {
      setTimeout(function () {
        el.querySelectorAll(".relleno").forEach(function (r) { r.style.width = r.getAttribute("data-ancho") + "%"; });
      }, 30);
    });
    console.info("TicketRight: Chart.js no disponible, usando respaldo SVG/CSS para el embudo.");
  }

  function embudoChartJs(el, pasos) {
    var canvas = document.createElement("canvas");
    el.appendChild(canvas);
    new Chart(canvas, {
      type: "bar",
      data: {
        labels: pasos.map(function (p) { return p.etiqueta; }),
        datasets: [{ data: pasos.map(function (p) { return p.valor; }), backgroundColor: colorVar("--color-primary"), borderRadius: 6 }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: colorVar("--color-border") }, ticks: { color: colorVar("--color-text-muted") } },
          y: { grid: { display: false }, ticks: { color: colorVar("--color-text") } }
        }
      }
    });
  }

  window.dibujarEmbudo = function (idContenedor, pasos) {
    var el = document.getElementById(idContenedor);
    if (!el) return;
    motorListo(function (ok) { ok ? embudoChartJs(el, pasos) : embudoFallback(el, pasos); });
  };

  // ---------- Tendencia (sparkline / línea) ----------
  function tendenciaFallback(el, etiquetas, valores) {
    var ancho = 600, alto = 120, margen = 8;
    var minimo = Math.min.apply(null, valores), maximo = Math.max.apply(null, valores);
    var rango = maximo - minimo || 1;
    var paso = (ancho - margen * 2) / (valores.length - 1);
    var puntos = valores.map(function (v, i) {
      var x = margen + i * paso;
      var y = alto - margen - ((v - minimo) / rango) * (alto - margen * 2);
      return x + "," + y;
    });
    var area = "M" + margen + "," + alto + " L" + puntos.join(" L") + " L" + (ancho - margen) + "," + alto + " Z";
    var svg = '<div class="sparkline-envoltorio"><svg viewBox="0 0 ' + ancho + " " + alto + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="grad-tendencia" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + colorVar("--color-primary") + '" stop-opacity="0.35"/>' +
      '<stop offset="100%" stop-color="' + colorVar("--color-primary") + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#grad-tendencia)" stroke="none"/>' +
      '<polyline points="' + puntos.join(" ") + '" fill="none" stroke="' + colorVar("--color-primary") + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      "</svg></div>";
    el.innerHTML = svg;
    console.info("TicketRight: Chart.js no disponible, usando respaldo SVG/CSS para la tendencia.");
  }

  function tendenciaChartJs(el, etiquetas, valores) {
    var canvas = document.createElement("canvas");
    el.appendChild(canvas);
    new Chart(canvas, {
      type: "line",
      data: {
        labels: etiquetas,
        datasets: [{
          data: valores, borderColor: colorVar("--color-primary"), backgroundColor: colorVar("--color-primary-soft"),
          fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: colorVar("--color-text-muted") } },
          y: { grid: { color: colorVar("--color-border") }, ticks: { color: colorVar("--color-text-muted") } }
        }
      }
    });
  }

  window.dibujarTendencia = function (idContenedor, etiquetas, valores) {
    var el = document.getElementById(idContenedor);
    if (!el) return;
    motorListo(function (ok) { ok ? tendenciaChartJs(el, etiquetas, valores) : tendenciaFallback(el, etiquetas, valores); });
  };

  // ---------- Mapa de calor de ocupación (siempre hecho a mano: no necesita librería) ----------
  window.dibujarMapaCalor = function (idContenedor, columnas, celdas) {
    var el = document.getElementById(idContenedor);
    if (!el) return;
    el.style.gridTemplateColumns = "repeat(" + columnas + ", 1fr)";
    var html = "";
    celdas.forEach(function (intensidad, i) {
      var color;
      if (intensidad < 0.5) color = mezclar(colorVar("--color-calor-fria"), colorVar("--color-calor-media"), intensidad / 0.5);
      else color = mezclar(colorVar("--color-calor-media"), colorVar("--color-calor-alta"), (intensidad - 0.5) / 0.5);
      html += '<div class="celda" style="background:' + color + '" title="Ocupación ' + Math.round(intensidad * 100) + '%"></div>';
    });
    el.innerHTML = html;
  };

  function hexARgb(hex) {
    hex = hex.replace("#", "");
    return [parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16)];
  }
  function mezclar(colorA, colorB, t) {
    var a = hexARgb(colorA), b = hexARgb(colorB);
    var r = Math.round(a[0] + (b[0] - a[0]) * t);
    var g = Math.round(a[1] + (b[1] - a[1]) * t);
    var bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return "rgb(" + r + "," + g + "," + bl + ")";
  }
})();
