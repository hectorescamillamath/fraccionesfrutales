/* ============================================================================
   ARCHIVO: script.js
   PROPÓSITO GENERAL: Lógica matemática, generación de gráficos SVG de frutas
   fraccionadas, explicaciones paso a paso, modo práctica y feedback.

   ESTRUCTURA:
     1. CONFIG ............ parámetros personalizables (límites, colores, textos)
     2. FRUITS ............ catálogo de frutas (colores y decoraciones)
     3. Utilidades ........ gcd, mcm, simplificación, HTML de fracciones
     4. Gráficos SVG ...... dibujo de la fruta cortada en N sectores
     5. Figuras y pasos ... render de figuras y tarjetas explicativas
     6. Explicaciones ..... pasos por operación (suma, resta, ×, ÷)
     7. Modo Exploración
     8. Modo Práctica
     9. Interfaz general .. selector de fruta, pestañas, confeti, init

   CÓDIGO DE ESTADOS DE TROZO (usado en los arreglos "states"):
     'e' vacío (sin colorear)        'a' fracción A / resultado (color fruta)
     'b' fracción B (azul)           'c' sobrante en división (morado)
     'g' fantasma (parte no tomada)  'x' trozo que se quita (tachado)
   ============================================================================ */
'use strict';


/* ----------------------------------------------------------------------------
   BLOQUE 1: CONFIG
   PROPÓSITO: Centralizar todo lo que un docente puede querer ajustar.
   PUNTOS DE EDICIÓN:
     - MAX_DENOMINATOR / MAX_NUMERATOR: límites de las entradas en Exploración.
     - MAX_ANSWER_DENOMINATOR: denominador máximo al cortar la fruta-respuesta.
     - MAX_FRUITS_SHOWN: máximo de frutas enteras dibujadas por figura.
     - OPERAND_COLOR_B / THIRD_COLOR: colores de la fracción B y del sobrante.
     - SIZES: tamaños (px) de las frutas según cuántas haya en pantalla.
     - PRAISES / RETRY_MESSAGES / HINTS: mensajes de felicitación, ánimo y pistas.
     - LEVELS: niveles del modo práctica (operaciones y denominadores).
     - CONFETTI_ENABLED / CONFETTI_COUNT: lluvia de confeti al acertar.
   ---------------------------------------------------------------------------- */
const CONFIG = {
  MAX_DENOMINATOR: 12,
  MAX_NUMERATOR: 24,
  MAX_ANSWER_DENOMINATOR: 60,
  MAX_FRUITS_SHOWN: 8,

  OPERAND_COLOR_B: '#2f80ed',
  THIRD_COLOR: '#8e44ad',
  CUT_COLOR: '#ffffff',

  SIZES: { single: 170, few: 130, many: 96 },

  CONFETTI_ENABLED: true,
  CONFETTI_COUNT: 28,

  PRAISES: [
    '¡Excelente! 🎉', '¡Muy bien hecho! 🌟', '¡Eres un crack de las fracciones! 🍉',
    '¡Perfecto! 👏', '¡Correcto! Sigue así 🚀', '¡Fantástico trabajo! 🍊'
  ],
  RETRY_MESSAGES: [
    '¡Casi! Inténtalo otra vez 💪', 'Todavía no, pero vas bien 🙂',
    'Revisa tus trozos y vuelve a intentarlo 🔍', '¡No te rindas, tú puedes! 🌈'
  ],
  HINTS: {
    '+': 'Para sumar, los trozos deben ser del mismo tamaño. Si los denominadores son distintos, busca un denominador común.',
    '-': 'Para restar, primero iguala los denominadores y luego resta los numeradores (los trozos que quitas).',
    '×': 'Multiplicar es «tomar una parte de otra parte»: multiplica numeradores entre sí y denominadores entre sí.',
    '÷': 'Dividir pregunta «¿cuántas veces cabe?». Prueba invertir la segunda fracción y multiplicar.'
  },

  /* Niveles del modo práctica.
     sameDen: true (mismo denominador) | false (distintos) | 'random'
     denominators: lista de denominadores posibles (mínimo 2 valores distintos y todos ≥ 2). */
  LEVELS: {
    facil:   { label: '🌱 Fácil: suma y resta (mismo denominador)', ops: ['+', '-'], sameDen: true,  denominators: [2, 3, 4, 5, 6, 8, 10] },
    medio:   { label: '🌿 Medio: suma y resta (distinto denominador)', ops: ['+', '-'], sameDen: false, denominators: [2, 3, 4, 5, 6, 8] },
    experto: { label: '🌳 Experto: multiplicar y dividir', ops: ['×', '÷'], sameDen: 'random', denominators: [2, 3, 4, 5, 6] },
    mixto:   { label: '🏆 Reto: todas las operaciones', ops: ['+', '-', '×', '÷'], sameDen: 'random', denominators: [2, 3, 4, 5, 6, 8] }
  }
};

/* Símbolos y nombres de las operaciones (no suele editarse). */
const OPS = {
  '+': { symbol: '+', name: 'suma' },
  '-': { symbol: '−', name: 'resta' },
  '×': { symbol: '×', name: 'multiplicación' },
  '÷': { symbol: '÷', name: 'división' }
};


/* ----------------------------------------------------------------------------
   BLOQUE 2: FRUITS (catálogo de frutas)
   PROPÓSITO: Describir cómo se dibuja cada fruta. El menú visual se crea solo.
   PUNTOS DE EDICIÓN: Para AGREGAR una fruta copia una entrada y cambia:
     name (nombre), emoji, rind (cáscara), pith (capa intermedia opcional),
     flesh (pulpa sin colorear), main (color de los trozos coloreados),
     edge (borde de cada trozo), decor ('apple' | 'orange' | null) y los
     extras opcionales seeds (semillas) o pepperoni (pizza).
   ---------------------------------------------------------------------------- */
const FRUITS = {
  manzana: { name: 'Manzana', emoji: '🍎', rind: '#9b1c1c', pith: null,      flesh: '#fff3dc', main: '#e53935', edge: '#7a1212', decor: 'apple' },
  naranja: { name: 'Naranja', emoji: '🍊', rind: '#e67e00', pith: '#fff7e6', flesh: '#ffe8b3', main: '#ff9800', edge: '#b35f00', decor: 'orange' },
  sandia:  { name: 'Sandía',  emoji: '🍉', rind: '#1b7f3b', pith: '#dff3c8', flesh: '#ffe3e8', main: '#ff4d6d', edge: '#9d1c37', seeds: true },
  limon:   { name: 'Limón',   emoji: '🍋', rind: '#c9a800', pith: '#fffbe6', flesh: '#fffbd0', main: '#f2d21b', edge: '#a38b00' },
  pizza:   { name: 'Pizza',   emoji: '🍕', rind: '#b5651d', pith: null,      flesh: '#fde9b5', main: '#f6a21e', edge: '#8a4a12', pepperoni: true }
};


/* ----------------------------------------------------------------------------
   Estado global de la aplicación (no se edita; solo se usa internamente).
   ---------------------------------------------------------------------------- */
const state = {
  fruit: 'manzana',
  mode: 'explore',
  problem: null,      // último problema resuelto en Exploración
  steps: [],          // pasos de Exploración
  result: null,       // resultado de Exploración
  revealed: 0,        // cuántos pasos están visibles
  practice: {
    problem: null, solved: false, attempts: 0, counted: false, clean: true,
    solutionVisible: false, fruits: 1, selected: [],
    score: { correct: 0, total: 0, streak: 0 }
  }
};

const $ = (sel, root = document) => root.querySelector(sel);


/* ----------------------------------------------------------------------------
   BLOQUE 3: Utilidades matemáticas y de formato
   PROPÓSITO: Cálculos básicos (mcd, mcm, simplificar), generación de números
   al azar y HTML de fracciones apiladas para los textos.
   PUNTOS DE EDICIÓN: Normalmente ninguno.
   ---------------------------------------------------------------------------- */
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a, b) => (a / gcd(a, b)) * b;
const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/* Simplifica n/d. Devuelve {n, d, g} donde g es el divisor común usado. */
function simplify(n, d) {
  if (n === 0) return { n: 0, d: 1, g: d };
  const g = gcd(n, d);
  return { n: n / g, d: d / g, g };
}

/* Crea el arreglo de estados: seq([['a',3],['e',2]]) → ['a','a','a','e','e'] */
function seq(spec) {
  const out = [];
  spec.forEach(([s, c]) => { for (let i = 0; i < c; i++) out.push(s); });
  return out;
}

/* HTML de una fracción apilada. Si el denominador es 1 se muestra el entero. */
function frac(n, d) {
  if (d === 1) return `<span class="whole">${n}</span>`;
  return `<span class="frac"><span class="sr-only">${n} sobre ${d}</span>` +
         `<span class="num" aria-hidden="true">${n}</span>` +
         `<span class="den" aria-hidden="true">${d}</span></span>`;
}

/* Número mixto en HTML (p. ej. 1 3/4) o '' si no aplica. */
function mixedHTML(n, d) {
  const q = Math.floor(n / d), r = n % d;
  if (d > 1 && q >= 1 && r > 0) return `<span class="whole">${q}</span> ${frac(r, d)}`;
  return '';
}

/* Expresión completa de un problema: "1/2 + 1/3". */
function expressionHTML(p) {
  if (p.op === 'ver') return frac(p.n1, p.d1);
  return `${frac(p.n1, p.d1)}<span class="op-inline">${OPS[p.op].symbol}</span>${frac(p.n2, p.d2)}`;
}

/* Resultado con su simplificación y número mixto, en HTML. */
function resultHTML(res) {
  const s = simplify(res.n, res.d);
  let html = frac(res.n, res.d);
  if (res.n > 0 && s.g > 1 && res.d > 1) html += ` = ${frac(s.n, s.d)}`;
  const m = mixedHTML(s.n, s.d);
  if (m) html += ` = ${m}`;
  return html;
}


/* ----------------------------------------------------------------------------
   BLOQUE 4: Gráficos SVG de la fruta cortada
   PROPÓSITO: Dibujar una fruta circular dividida en N sectores iguales.
     - Cada sector es un <path> de arco circular.
     - Los sectores coloreados "saltan" un poco hacia fuera y proyectan
       sombra (efecto de corte).
     - Líneas de corte: majorEvery marca cada cuántos cortes la línea es
       sólida (corte original); las demás son punteadas (cortes nuevos).
   PUNTOS DE EDICIÓN: Radios (R, RIND), distancia del salto (POP), grosor de
   líneas, y los extras (semillas, pepperoni, hojas).
   ---------------------------------------------------------------------------- */
let svgUid = 0;

const polar = (c, r, a) => [c + r * Math.cos(a), c + r * Math.sin(a)];
const fmt = x => Math.round(x * 100) / 100;

/* Estilo de relleno según el estado del trozo. */
function sliceStyle(st, F) {
  switch (st) {
    case 'a': return { fill: F.main, pop: true };
    case 'b': return { fill: CONFIG.OPERAND_COLOR_B, pop: true };
    case 'c': return { fill: CONFIG.THIRD_COLOR, pop: true };
    case 'g': return { fill: F.flesh, overlay: F.main, overlayOpacity: 0.3 };
    case 'x': return { fill: F.flesh, overlay: F.main, overlayOpacity: 0.15, cross: true, dashed: true };
    default:  return { fill: F.flesh };
  }
}

/* Trayectoria de un sector circular (o círculo completo si N = 1). */
function slicePathD(C, R, a0, a1, N) {
  if (N === 1) {
    return `M ${C - R} ${C} A ${R} ${R} 0 1 1 ${C + R} ${C} A ${R} ${R} 0 1 1 ${C - R} ${C} Z`;
  }
  const [x0, y0] = polar(C, R, a0);
  const [x1, y1] = polar(C, R, a1);
  return `M ${C} ${C} L ${fmt(x0)} ${fmt(y0)} A ${R} ${R} 0 0 1 ${fmt(x1)} ${fmt(y1)} Z`;
}

/* Devuelve el texto SVG completo de UNA fruta.
   opts: fruitKey, den, states[], size, majorEvery, interactive, pulseIndex,
         ariaLabel, decorative */
function buildFruitSVG(opts) {
  const { fruitKey, den, states = [], size = CONFIG.SIZES.single, majorEvery = 1,
          interactive = false, pulseIndex = -1, ariaLabel = '', decorative = false } = opts;
  const F = FRUITS[fruitKey];
  const uid = ++svgUid;
  const C = 100, R = 80, RIND = 89, POP = 7;
  const N = Math.max(1, den);
  const thin = N > 24;
  let body = '';

  /* Cáscara y capa intermedia */
  body += `<circle cx="${C}" cy="${C}" r="${RIND}" fill="${F.rind}"/>`;
  if (F.pith) body += `<circle cx="${C}" cy="${C}" r="${R + 4}" fill="${F.pith}"/>`;

  /* Decoraciones superiores */
  if (F.decor === 'apple') {
    body += `<path d="M100 16 Q97 6 104 2" stroke="#5d3a1a" stroke-width="5" fill="none" stroke-linecap="round"/>` +
            `<path d="M104 8 C112 2 124 4 128 10 C120 16 110 14 104 8Z" fill="#43a047"/>`;
  } else if (F.decor === 'orange') {
    body += `<path d="M100 14 C108 4 120 4 126 10 C118 18 108 18 100 14Z" fill="#43a047"/>`;
  }

  /* Sectores */
  for (let i = 0; i < N; i++) {
    const a0 = -Math.PI / 2 + (2 * Math.PI * i) / N;
    const a1 = -Math.PI / 2 + (2 * Math.PI * (i + 1)) / N;
    const mid = (a0 + a1) / 2;
    const st = states[i] || 'e';
    const s = sliceStyle(st, F);
    const pop = s.pop && N > 1;
    const dx = pop ? Math.cos(mid) * POP : 0;
    const dy = pop ? Math.sin(mid) * POP : 0;
    const d = slicePathD(C, R, a0, a1, N);
    const filled = st !== 'e';

    let g = `<g class="slice${interactive ? ' clickable' : ''}${i === pulseIndex ? ' pulse' : ''}" data-i="${i}"`;
    if (pop) g += ` style="transform:translate(${fmt(dx)}px,${fmt(dy)}px)" filter="url(#sh${uid})"`;
    if (interactive) {
      g += ` tabindex="0" role="button" aria-pressed="${filled}" aria-label="Trozo ${i + 1} de ${N}, ${filled ? 'coloreado' : 'sin colorear'}"`;
    }
    g += '>';

    if (s.overlay) {
      g += `<path d="${d}" fill="${s.fill}"/><path d="${d}" fill="${s.overlay}" fill-opacity="${s.overlayOpacity}"/>`;
    } else {
      g += `<path d="${d}" fill="${s.fill}"/>`;
    }
    g += `<path d="${d}" fill="none" stroke="${s.dashed ? F.main : F.edge}" stroke-opacity="${s.dashed ? 0.8 : 0.35}" stroke-width="1"${s.dashed ? ' stroke-dasharray="4 3"' : ''}/>`;

    /* Líneas de corte (sólidas = corte original; punteadas = corte nuevo) */
    if (N > 1) {
      [i, i + 1].forEach(b => {
        const ang = -Math.PI / 2 + (2 * Math.PI * b) / N;
        const [lx, ly] = polar(C, R, ang);
        const major = b % majorEvery === 0 || b === N;
        g += `<line x1="${C}" y1="${C}" x2="${fmt(lx)}" y2="${fmt(ly)}" stroke="${CONFIG.CUT_COLOR}" ` +
             (major ? `stroke-width="${thin ? 1.5 : 3}" stroke-linecap="round"`
                    : `stroke-width="${thin ? 1 : 1.8}" stroke-dasharray="5 4" stroke-opacity=".9"`) + '/>';
      });
    }

    /* Extras: semillas y pepperoni */
    if (N > 1) {
      if (F.seeds && N <= 16) {
        const [sx, sy] = polar(C, R * 0.6, mid);
        g += `<ellipse cx="${fmt(sx)}" cy="${fmt(sy)}" rx="3.4" ry="1.8" fill="#2b1b17" transform="rotate(${fmt((mid * 180) / Math.PI)} ${fmt(sx)} ${fmt(sy)})"/>`;
      }
      if (F.pepperoni && N <= 24) {
        const r = Math.min(10, R * 0.62 * Math.sin(Math.PI / N) * 0.75);
        if (r >= 2.5) {
          const [px, py] = polar(C, R * 0.62, mid);
          g += `<circle cx="${fmt(px)}" cy="${fmt(py)}" r="${fmt(r)}" fill="#c62828" stroke="#7f0000" stroke-width="1"/>`;
        }
      }
    }

    /* Cruz de "se quita" */
    if (s.cross) {
      const [qx, qy] = N > 1 ? polar(C, R * 0.58, mid) : [C, C];
      const k = N > 1 ? Math.min(8, R * 0.58 * Math.sin(Math.PI / N) * 0.7) : 14;
      if (k >= 2) {
        g += `<path d="M${fmt(qx - k)} ${fmt(qy - k)} L${fmt(qx + k)} ${fmt(qy + k)} M${fmt(qx + k)} ${fmt(qy - k)} L${fmt(qx - k)} ${fmt(qy + k)}" stroke="#c92a2a" stroke-width="3" stroke-linecap="round"/>`;
      }
    }

    g += '</g>';
    body += g;
  }

  const aria = decorative ? 'aria-hidden="true"' : `role="${interactive ? 'group' : 'img'}" aria-label="${ariaLabel}"`;
  return `<svg class="fruit-svg${interactive ? ' interactive' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}" ${aria}>` +
         `<defs><filter id="sh${uid}" filterUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">` +
         `<feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".35"/></filter></defs>` +
         body + '</svg>';
}

/* Convierte el SVG en un elemento DOM y conecta los clics (modo interactivo). */
function fruitElement(opts) {
  const wrap = document.createElement('div');
  wrap.className = 'fruit-wrap';
  wrap.innerHTML = buildFruitSVG(opts);
  if (opts.interactive && opts.onToggle) {
    wrap.querySelectorAll('.slice').forEach(el => {
      const idx = Number(el.dataset.i);
      const act = () => opts.onToggle(idx);
      el.addEventListener('click', act);
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
      });
    });
  }
  return wrap;
}


/* ----------------------------------------------------------------------------
   BLOQUE 5: Figuras (frutas + pie de foto) y tarjetas de pasos
   PROPÓSITO: Una "figura" agrupa 1 o más frutas enteras con su fracción.
   Si el numerador supera al denominador se dibujan varias frutas.
   Una figura es: { den, states[], majorEvery?, caption?, op? }.
   PUNTOS DE EDICIÓN: Textos del aviso de "demasiadas frutas".
   ---------------------------------------------------------------------------- */
function figureElement(fig) {
  const box = document.createElement('div');
  box.className = 'figure';
  const den = fig.den, states = fig.states || [];
  let last = -1;
  states.forEach((s, i) => { if (s && s !== 'e') last = i; });
  const needed = Math.max(1, Math.ceil((last + 1) / den));
  const fruits = document.createElement('div');
  fruits.className = 'fruits';

  if (needed > CONFIG.MAX_FRUITS_SHOWN) {
    fruits.innerHTML = `<p class="too-many">🍽️ ¡Son ${needed} frutas! Son demasiadas para dibujarlas, pero el cálculo sigue siendo válido.</p>`;
  } else {
    const size = needed <= 1 ? CONFIG.SIZES.single : needed <= 3 ? CONFIG.SIZES.few : CONFIG.SIZES.many;
    for (let f = 0; f < needed; f++) {
      const chunk = Array.from({ length: den }, (_, i) => states[f * den + i] || 'e');
      const colored = chunk.filter(s => s !== 'e').length;
      fruits.appendChild(fruitElement({
        fruitKey: state.fruit, den, states: chunk, size, majorEvery: fig.majorEvery || 1,
        ariaLabel: `${FRUITS[state.fruit].name} ${f + 1} de ${needed}, dividida en ${den} partes, ${colored} con color`
      }));
    }
  }
  box.appendChild(fruits);
  if (fig.caption) {
    const cap = document.createElement('div');
    cap.className = 'figure-caption';
    cap.innerHTML = fig.caption;
    box.appendChild(cap);
  }
  return box;
}

/* Dibuja una lista de figuras con sus símbolos (+, −, ×, ÷, =) entre ellas. */
function renderFigures(container, figs) {
  figs.forEach(fig => {
    if (fig.op) {
      const op = document.createElement('span');
      op.className = 'op-symbol';
      op.textContent = fig.op;
      container.appendChild(op);
    }
    container.appendChild(figureElement(fig));
  });
}

/* Tarjeta de un paso explicativo: {title, text, figures[]} */
function stepElement(step, index) {
  const art = document.createElement('article');
  art.className = 'step';
  art.innerHTML = `<header class="step-header"><span class="step-badge">${index + 1}</span><h3>${step.title}</h3></header>` +
                  `<p class="step-text">${step.text}</p>`;
  if (step.figures && step.figures.length) {
    const row = document.createElement('div');
    row.className = 'figure-row';
    renderFigures(row, step.figures);
    art.appendChild(row);
  }
  return art;
}


/* ----------------------------------------------------------------------------
   BLOQUE 6: Explicaciones paso a paso por operación
   PROPÓSITO: Convertir un problema {n1,d1,op,n2,d2} en una lista de pasos
   {title, text, figures} y un resultado {n, d}.
   PUNTOS DE EDICIÓN: Los textos pedagógicos (en español) de cada paso.
   ---------------------------------------------------------------------------- */

/* Pasos finales comunes: resultado y simplificación automática. */
function finalSteps(n, d, showResult = true) {
  const out = [];
  const s = simplify(n, d);
  if (showResult) {
    const q = Math.floor(n / d), r = n % d;
    let text;
    if (n === 0) {
      text = 'El resultado es <b>0</b>: no queda ningún trozo coloreado.';
    } else {
      text = `El resultado es ${frac(n, d)}.`;
      if (d > 1 && q >= 1 && r > 0) {
        text += ` Es más de una fruta: ${q} entera${q > 1 ? 's' : ''} y ${frac(r, d)} más (número mixto: ${mixedHTML(n, d)}).`;
      } else if (d > 1 && q >= 1 && r === 0) {
        text += ` Equivale a ${q} fruta${q > 1 ? 's' : ''} entera${q > 1 ? 's' : ''}.`;
      }
    }
    out.push({ title: '¡Tenemos el resultado!', text,
      figures: [{ den: d, states: seq([['a', n]]), caption: frac(n, d) }] });
  }
  if (n > 0 && d > 1) {
    if (s.g > 1) {
      out.push({
        title: 'Simplificamos la fracción',
        text: `El máximo común divisor de ${n} y ${d} es <b>${s.g}</b>. Juntamos cada ${s.g} trozos pequeños en 1 trozo grande (las líneas sólidas marcan los grupos). Dividimos arriba y abajo entre ${s.g}: ${frac(n, d)} = ${frac(s.n, s.d)}. ¡Es la misma cantidad de fruta!`,
        figures: [
          { den: d, states: seq([['a', n]]), majorEvery: s.g, caption: `${frac(n, d)}<br><small>grupos de ${s.g}</small>` },
          { op: '=', den: s.d, states: seq([['a', s.n]]), caption: frac(s.n, s.d) }
        ]
      });
    } else {
      out.push({
        title: '¿Se puede simplificar?',
        text: `El máximo común divisor de ${n} y ${d} es 1, así que ${frac(n, d)} ya es una fracción irreducible. ¡Está en su forma más simple!`,
        figures: []
      });
    }
  }
  return out;
}

/* Solo ver una fracción */
function explainView(p) {
  const { n1: n, d1: d } = p;
  let text = d === 1
    ? `La fruta se queda entera (1 parte) y coloreamos <b>${n}</b>.`
    : `Cortamos la fruta en <b>${d}</b> partes iguales (el denominador) y coloreamos <b>${n}</b> de ellas (el numerador). Cada trozo vale ${frac(1, d)} de fruta.`;
  if (n > d) text += ` Como ${n} es mayor que ${d}, necesitamos más de una fruta.`;
  const steps = [{ title: 'Cortamos y coloreamos', text, figures: [{ den: d, states: seq([['a', n]]), caption: frac(n, d) }] }];
  return { steps: steps.concat(finalSteps(n, d, false)), result: { n, d } };
}

/* Suma y resta (igual o distinto denominador, con mínimo común denominador) */
function explainAddSub(p) {
  const isAdd = p.op === '+';
  const sym = OPS[p.op].symbol;
  const verb = isAdd ? 'sumar' : 'restar';
  const same = p.d1 === p.d2;
  const steps = [];

  steps.push({
    title: 'Miramos las dos fracciones',
    text: same
      ? `Las dos fracciones tienen el mismo denominador (<b>${p.d1}</b>): los trozos de ambas frutas son del mismo tamaño, así que podemos ${verb} directamente.`
      : `Los denominadores son distintos (<b>${p.d1}</b> y <b>${p.d2}</b>): los trozos tienen <b>distinto tamaño</b>, así que todavía no podemos ${verb}. Primero hay que cortarlos para que todos queden iguales.`,
    figures: [
      { den: p.d1, states: seq([['a', p.n1]]), caption: frac(p.n1, p.d1) },
      { op: sym, den: p.d2, states: seq([['b', p.n2]]), caption: frac(p.n2, p.d2) }
    ]
  });

  let a = p.n1, b = p.n2, D = p.d1;
  if (!same) {
    const L = lcm(p.d1, p.d2), k1 = L / p.d1, k2 = L / p.d2;
    steps.push({
      title: 'Buscamos el mínimo común denominador',
      text: `El mínimo común múltiplo de ${p.d1} y ${p.d2} es <b>${L}</b>. Ese será el nuevo denominador: cortaremos las dos frutas en ${L} partes iguales.`,
      figures: []
    });
    steps.push({
      title: `Convertimos ${frac(p.n1, p.d1)} a ${L}avos`,
      text: k1 === 1
        ? `${frac(p.n1, p.d1)} ya tiene denominador ${L}: no hay que cortar nada.`
        : `Cortamos cada trozo en <b>${k1}</b> partes iguales (líneas punteadas). Multiplicamos arriba y abajo por ${k1}: ${frac(p.n1, p.d1)} = ${frac(p.n1 * k1, L)}. ¡Misma cantidad de fruta, trozos más pequeños!`,
      figures: [
        { den: p.d1, states: seq([['a', p.n1]]), caption: frac(p.n1, p.d1) },
        { op: '=', den: L, states: seq([['a', p.n1 * k1]]), majorEvery: k1, caption: frac(p.n1 * k1, L) }
      ]
    });
    steps.push({
      title: `Convertimos ${frac(p.n2, p.d2)} a ${L}avos`,
      text: k2 === 1
        ? `${frac(p.n2, p.d2)} ya tiene denominador ${L}: no hay que cortar nada.`
        : `Cortamos cada trozo en <b>${k2}</b> partes iguales. Multiplicamos arriba y abajo por ${k2}: ${frac(p.n2, p.d2)} = ${frac(p.n2 * k2, L)}.`,
      figures: [
        { den: p.d2, states: seq([['b', p.n2]]), caption: frac(p.n2, p.d2) },
        { op: '=', den: L, states: seq([['b', p.n2 * k2]]), majorEvery: k2, caption: frac(p.n2 * k2, L) }
      ]
    });
    a = p.n1 * k1; b = p.n2 * k2; D = L;
  }

  const resN = isAdd ? a + b : a - b;
  if (isAdd) {
    steps.push({
      title: 'Juntamos los trozos',
      text: `Ahora todos los trozos valen ${frac(1, D)}. Juntamos ${a} trozos con ${b} trozos: ${a} + ${b} = ${resN}. El denominador no cambia: ${frac(a, D)} + ${frac(b, D)} = ${frac(resN, D)}. (Si una fruta se llena, seguimos con la siguiente.)`,
      figures: [{ den: D, states: seq([['a', a], ['b', b]]), caption: frac(resN, D) }]
    });
  } else {
    steps.push({
      title: 'Quitamos los trozos',
      text: `Tenemos ${a} trozos y quitamos ${b} (los tachados): ${a} − ${b} = ${resN}. El denominador no cambia: ${frac(a, D)} − ${frac(b, D)} = ${frac(resN, D)}.`,
      figures: [{ den: D, states: seq([['a', resN], ['x', b]]), caption: frac(resN, D) }]
    });
  }
  return { steps: steps.concat(finalSteps(resN, D)), result: { n: resN, d: D } };
}

/* Multiplicación: "tomar una parte de otra parte" */
function explainMultiply(p) {
  let A = { n: p.n1, d: p.d1 }, B = { n: p.n2, d: p.d2 };
  let swapped = false;
  if (B.n > B.d && A.n <= A.d) { [A, B] = [B, A]; swapped = true; }
  const res = { n: p.n1 * p.n2, d: p.d1 * p.d2 };
  const steps = [];

  /* Caso especial: ambos factores > 1, no se puede dibujar "parte de parte" */
  if (B.n > B.d) {
    steps.push({
      title: 'Multiplicamos numeradores y denominadores',
      text: `Los dos factores son mayores que 1 (más de una fruta), así que no podemos «tomar una parte de la otra» dibujando trozos. Usamos la regla: ${frac(p.n1, p.d1)} × ${frac(p.n2, p.d2)} = ${frac(p.n1 * p.n2, p.d1 * p.d2)} (numerador × numerador y denominador × denominador).`,
      figures: [
        { den: p.d1, states: seq([['a', p.n1]]), caption: frac(p.n1, p.d1) },
        { op: '×', den: p.d2, states: seq([['b', p.n2]]), caption: frac(p.n2, p.d2) }
      ]
    });
    return { steps: steps.concat(finalSteps(res.n, res.d)), result: res };
  }

  steps.push({
    title: '¿Qué significa multiplicar fracciones?',
    text: `${frac(p.n1, p.d1)} × ${frac(p.n2, p.d2)} significa «tomar ${frac(B.n, B.d)} <b>de</b> ${frac(A.n, A.d)}».` +
          (swapped ? ' Como el orden no cambia el resultado, empezamos con la fracción mayor para poder tomar una parte de ella.' : '') +
          ` Empezamos con la cantidad ${frac(A.n, A.d)}.`,
    figures: [{ den: A.d, states: seq([['a', A.n]]), caption: frac(A.n, A.d) }]
  });

  if (B.d === 1) {
    steps.push({
      title: B.n === 1 ? 'Multiplicar por 1' : 'Multiplicar por 0',
      text: B.n === 1 ? 'Multiplicar por 1 deja la fruta igual: tomamos todo.' : 'Multiplicar por 0 significa no tomar nada: no queda fruta.',
      figures: []
    });
    return { steps: steps.concat(finalSteps(res.n, res.d)), result: res };
  }

  const D = A.d * B.d;
  steps.push({
    title: `Cortamos cada trozo en ${B.d} partes`,
    text: `Vamos a tomar partes de cada trozo coloreado, así que cortamos <b>cada trozo</b> en ${B.d} partes iguales (líneas punteadas). La fruta ahora tiene ${A.d} × ${B.d} = <b>${D}</b> trozos pequeños y hay ${A.n} × ${B.d} = ${A.n * B.d} coloreados.`,
    figures: [{ den: D, states: seq([['a', A.n * B.d]]), majorEvery: B.d, caption: frac(A.n * B.d, D) }]
  });

  const take = [];
  for (let g = 0; g < A.n; g++) for (let k = 0; k < B.d; k++) take.push(k < B.n ? 'b' : 'g');
  steps.push({
    title: `Tomamos ${B.n} de cada ${B.d} partes`,
    text: `De <b>cada</b> trozo coloreado tomamos ${B.n} de las ${B.d} partes (las azules). Las partes claras se quedan sin tomar.`,
    figures: [{ den: D, states: take, majorEvery: B.d, caption: `${B.n} de cada ${B.d}` }]
  });

  steps.push({
    title: 'Contamos los trozos azules',
    text: `Hay ${A.n} × ${B.n} = <b>${A.n * B.n}</b> trozos azules y cada uno vale ${frac(1, D)}, porque ${A.d} × ${B.d} = ${D}. Entonces ${frac(p.n1, p.d1)} × ${frac(p.n2, p.d2)} = ${frac(res.n, res.d)}.`,
    figures: [{ den: D, states: take.map(s => (s === 'b' ? 'b' : 'e')), caption: frac(A.n * B.n, D) }]
  });

  return { steps: steps.concat(finalSteps(res.n, res.d)), result: res };
}

/* División: "¿cuántas veces cabe la segunda en la primera?" */
function explainDivide(p) {
  const L = lcm(p.d1, p.d2), k1 = L / p.d1, k2 = L / p.d2;
  const a = p.n1 * k1, c = p.n2 * k2;
  const res = { n: p.n1 * p.d2, d: p.d1 * p.n2 };
  const steps = [];

  steps.push({
    title: '¿Qué significa dividir fracciones?',
    text: `${frac(p.n1, p.d1)} ÷ ${frac(p.n2, p.d2)} pregunta: «¿cuántas veces cabe ${frac(p.n2, p.d2)} dentro de ${frac(p.n1, p.d1)}?».`,
    figures: [
      { den: p.d1, states: seq([['a', p.n1]]), caption: frac(p.n1, p.d1) },
      { op: '÷', den: p.d2, states: seq([['b', p.n2]]), caption: frac(p.n2, p.d2) }
    ]
  });

  steps.push({
    title: 'Usamos trozos del mismo tamaño',
    text: p.d1 === p.d2
      ? `Las dos fracciones ya tienen denominador ${L}: los trozos son iguales.`
      : `Para comparar necesitamos trozos iguales: usamos el denominador común <b>${L}</b>. ${frac(p.n1, p.d1)} = ${frac(a, L)} y ${frac(p.n2, p.d2)} = ${frac(c, L)}.`,
    figures: [
      { den: L, states: seq([['a', a]]), majorEvery: k1, caption: frac(a, L) },
      { op: '÷', den: L, states: seq([['b', c]]), majorEvery: k2, caption: frac(c, L) }
    ]
  });

  const groupStates = [];
  for (let i = 0; i < a; i++) {
    const g = Math.floor(i / c);
    const complete = (g + 1) * c <= a;
    groupStates.push(!complete ? 'c' : g % 2 === 0 ? 'a' : 'b');
  }
  const q = Math.floor(a / c), r = a % c;
  let detail;
  if (a === 0) detail = 'No hay fruta que repartir: caben 0 grupos.';
  else if (r === 0) detail = `Caben exactamente <b>${q}</b> grupo${q > 1 ? 's' : ''}.`;
  else if (q === 0) detail = `No cabe ni un grupo completo: solo cabe ${frac(a, c)} de grupo (zona morada).`;
  else detail = `Caben <b>${q}</b> grupo${q > 1 ? 's' : ''} completo${q > 1 ? 's' : ''} y sobran ${r} trozos, que son ${frac(r, c)} de un grupo (en morado).`;
  steps.push({
    title: 'Formamos grupos y contamos',
    text: `Ahora todo se mide en trozos de ${frac(1, L)}: tenemos ${a} trozos y formamos grupos de ${c} trozos (cada grupo tiene un color distinto). ${detail} Por eso ${a} ÷ ${c} = ${frac(a, c)}.`,
    figures: [{ den: L, states: groupStates, caption: `grupos de ${c}` }]
  });

  steps.push({
    title: 'El atajo: invertir y multiplicar',
    text: `Obtenemos lo mismo con la regla corta: dividir es multiplicar por la fracción invertida. ${frac(p.n1, p.d1)} ÷ ${frac(p.n2, p.d2)} = ${frac(p.n1, p.d1)} × ${frac(p.d2, p.n2)} = ${frac(res.n, res.d)}.`,
    figures: []
  });

  return { steps: steps.concat(finalSteps(res.n, res.d)), result: res };
}

/* Punto de entrada: elige la explicación según la operación. */
function buildExplanation(p) {
  switch (p.op) {
    case 'ver': return explainView(p);
    case '+': case '-': return explainAddSub(p);
    case '×': return explainMultiply(p);
    case '÷': return explainDivide(p);
    default: return { steps: [], result: { n: 0, d: 1 } };
  }
}

/* Resultado numérico (sin pasos), usado para comprobar respuestas. */
function computeAnswer(p) {
  switch (p.op) {
    case '+': return { n: p.n1 * p.d2 + p.n2 * p.d1, d: p.d1 * p.d2 };
    case '-': return { n: p.n1 * p.d2 - p.n2 * p.d1, d: p.d1 * p.d2 };
    case '×': return { n: p.n1 * p.n2, d: p.d1 * p.d2 };
    default:  return { n: p.n1 * p.d2, d: p.d1 * p.n2 };
  }
}


/* ----------------------------------------------------------------------------
   BLOQUE 7: MODO EXPLORACIÓN
   PROPÓSITO: Leer y validar las fracciones, mostrar vista previa en vivo y
   revelar la solución paso a paso (botones Siguiente / Mostrar todo / Reiniciar).
   PUNTOS DE EDICIÓN: Mensajes de error en validateFraction / validateProblem.
   ---------------------------------------------------------------------------- */
function readInt(id) {
  const raw = $('#' + id).value.trim();
  return raw === '' ? NaN : Number(raw);
}

function readExploreProblem() {
  return { n1: readInt('n1'), d1: readInt('d1'), op: $('#operation').value, n2: readInt('n2'), d2: readInt('d2') };
}

function validateFraction(n, d, label) {
  if (!Number.isInteger(n) || !Number.isInteger(d)) return `${label}: escribe números enteros en el numerador y el denominador.`;
  if (d < 1) return `${label}: el denominador debe ser al menos 1 (no se puede cortar en 0 partes).`;
  if (d > CONFIG.MAX_DENOMINATOR) return `${label}: el denominador puede ser como máximo ${CONFIG.MAX_DENOMINATOR}.`;
  if (n < 0) return `${label}: el numerador no puede ser negativo.`;
  if (n > CONFIG.MAX_NUMERATOR) return `${label}: el numerador puede ser como máximo ${CONFIG.MAX_NUMERATOR}.`;
  return null;
}

function validateProblem(p) {
  const eA = validateFraction(p.n1, p.d1, 'Fracción A');
  if (eA) return eA;
  if (p.op === 'ver') return null;
  const eB = validateFraction(p.n2, p.d2, 'Fracción B');
  if (eB) return eB;
  if (p.op === '-' && p.n1 * p.d2 < p.n2 * p.d1) {
    return 'En una resta, la fracción A debe ser mayor o igual que la B: no podemos quitar más fruta de la que hay. ¡Intercambia las fracciones!';
  }
  if (p.op === '÷' && p.n2 === 0) return 'No se puede dividir entre 0: la fracción B debe ser mayor que cero.';
  return null;
}

/* Vista previa en vivo de las fracciones escritas */
function renderPreview() {
  const box = $('#preview');
  box.innerHTML = '';
  const p = readExploreProblem();
  const err = validateFraction(p.n1, p.d1, 'Fracción A') || (p.op === 'ver' ? null : validateFraction(p.n2, p.d2, 'Fracción B'));
  if (err) { box.innerHTML = `<p class="hint">${err}</p>`; return; }
  const figs = [{ den: p.d1, states: seq([['a', p.n1]]), caption: frac(p.n1, p.d1) }];
  if (p.op !== 'ver') figs.push({ op: OPS[p.op].symbol, den: p.d2, states: seq([['b', p.n2]]), caption: frac(p.n2, p.d2) });
  renderFigures(box, figs);
}

/* Muestra u oculta la fracción B según la operación */
function updateOperationUI() {
  $('#group-b').hidden = $('#operation').value === 'ver';
}

/* Dibuja todos los pasos (los no revelados quedan ocultos) */
function renderSteps(container, steps, revealed, banner) {
  container.innerHTML = '';
  steps.forEach((s, i) => {
    const el = stepElement(s, i);
    if (i >= revealed) el.hidden = true;
    container.appendChild(el);
  });
  if (banner) {
    const b = document.createElement('div');
    b.className = 'result-banner';
    b.innerHTML = banner;
    b.hidden = revealed < steps.length;
    container.appendChild(b);
  }
}

function exploreBanner() {
  if (!state.problem || !state.result) return '';
  return `${expressionHTML(state.problem)} <span class="op-inline">=</span> ${resultHTML(state.result)}`;
}

function renderExploreSteps() {
  renderSteps($('#explore-steps'), state.steps, state.revealed, exploreBanner());
  updateStepControls();
}

function updateStepControls() {
  const total = state.steps.length;
  $('#steps-controls').hidden = total === 0;
  $('#next-step').disabled = state.revealed >= total;
  $('#show-all').disabled = state.revealed >= total;
}

function revealNext() {
  if (state.revealed >= state.steps.length) return;
  state.revealed++;
  const kids = $('#explore-steps').children;
  const el = kids[state.revealed - 1];
  if (el) { el.hidden = false; el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  if (state.revealed >= state.steps.length && kids[state.steps.length]) kids[state.steps.length].hidden = false;
  updateStepControls();
}

function onSolve(e) {
  e.preventDefault();
  const p = readExploreProblem();
  const err = validateProblem(p);
  const errBox = $('#explore-error');
  if (err) {
    errBox.textContent = err; errBox.hidden = false;
    state.steps = []; renderExploreSteps();
    return;
  }
  errBox.hidden = true;
  const exp = buildExplanation(p);
  state.problem = p; state.steps = exp.steps; state.result = exp.result;
  state.revealed = Math.min(1, exp.steps.length);
  renderExploreSteps();
}


/* ----------------------------------------------------------------------------
   BLOQUE 8: MODO PRÁCTICA / DESAFÍO
   PROPÓSITO: Generar problemas aleatorios, permitir responder escribiendo la
   fracción y/o coloreando trozos, comprobar con retroalimentación, mostrar la
   solución y llevar el marcador.
   PUNTOS DE EDICIÓN: generateProblem (reglas de los problemas), mensajes en
   CONFIG, y el criterio de racha en checkAnswer().
   ---------------------------------------------------------------------------- */
function generateProblem(levelKey) {
  const lvl = CONFIG.LEVELS[levelKey];
  const op = pick(lvl.ops);
  const dens = lvl.denominators;
  let d1, d2, n1, n2;

  if (op === '+' || op === '-') {
    const same = lvl.sameDen === 'random' ? Math.random() < 0.5 : lvl.sameDen;
    let guard = 0;
    do {
      d1 = pick(dens);
      d2 = same ? d1 : pick(dens);
      if (!same && d2 === d1) continue;
      n1 = randInt(1, d1 - 1);
      n2 = randInt(1, d2 - 1);
      if (op === '-' && n1 * d2 < n2 * d1) { [n1, n2] = [n2, n1]; [d1, d2] = [d2, d1]; }
      guard++;
    } while ((n1 * d2 === n2 * d1 && op === '-') && guard < 50);
  } else {
    d1 = pick(dens); d2 = pick(dens);
    n1 = randInt(1, d1 - 1); n2 = randInt(1, d2 - 1);
  }
  return { n1, d1, op, n2, d2 };
}

function renderProblem() {
  const pr = state.practice, p = pr.problem;
  if (!p) return;
  $('#problem-text').innerHTML = `${expressionHTML(p)} <span class="op-inline">=</span> <span class="qmark">?</span>`;
  const box = $('#problem-figures');
  box.innerHTML = '';
  renderFigures(box, [
    { den: p.d1, states: seq([['a', p.n1]]), caption: frac(p.n1, p.d1) },
    { op: OPS[p.op].symbol, den: p.d2, states: seq([['b', p.n2]]), caption: frac(p.n2, p.d2) }
  ]);
}

function newProblem() {
  const pr = state.practice;
  pr.problem = generateProblem($('#level').value);
  pr.solved = false; pr.attempts = 0; pr.counted = false; pr.clean = true;
  pr.solutionVisible = false; pr.fruits = 1; pr.selected = [];
  $('#ans-n').value = 0; $('#ans-d').value = 2;
  $('#feedback').textContent = ''; $('#feedback').className = 'feedback';
  $('#practice-solution').hidden = true; $('#practice-solution').innerHTML = '';
  $('#next-btn').hidden = true;
  renderProblem();
  answerRefresh();
}

function updateScoreboard() {
  const s = state.practice.score;
  $('#score-correct').textContent = s.correct;
  $('#score-total').textContent = s.total;
  $('#score-streak').textContent = s.streak;
}

function markAttempted() {
  const pr = state.practice;
  if (!pr.counted) { pr.counted = true; pr.score.total++; }
}

function setFeedback(kind, html) {
  const f = $('#feedback');
  f.className = `feedback ${kind}`;
  f.innerHTML = html;
}

/* ---- Fruta-respuesta interactiva ---- */
function getAnswerDen() {
  const v = Number($('#ans-d').value);
  return Number.isInteger(v) && v >= 1 && v <= CONFIG.MAX_ANSWER_DENOMINATOR ? v : null;
}

const countSelected = () => state.practice.selected.filter(Boolean).length;

function answerRefresh(pulseIdx = -1, focusIdx = -1) {
  const pr = state.practice;
  const holder = $('#answer-fruits');
  holder.innerHTML = '';
  const den = getAnswerDen();
  $('#less-fruit').disabled = pr.fruits <= 1;
  $('#more-fruit').disabled = pr.fruits >= CONFIG.MAX_FRUITS_SHOWN;
  if (den === null) {
    $('#ans-n').removeAttribute('max');
    holder.innerHTML = `<p class="hint">Escribe un denominador entre 1 y ${CONFIG.MAX_ANSWER_DENOMINATOR} para cortar la fruta.</p>`;
    return;
  }
  $('#ans-n').max = CONFIG.MAX_FRUITS_SHOWN * den;
  const cap = pr.fruits * den;
  while (pr.selected.length < cap) pr.selected.push(false);
  pr.selected.length = cap;

  const size = pr.fruits <= 1 ? CONFIG.SIZES.single : pr.fruits <= 3 ? CONFIG.SIZES.few : CONFIG.SIZES.many;
  const wrap = document.createElement('div');
  wrap.className = 'fruits';
  for (let f = 0; f < pr.fruits; f++) {
    const states = Array.from({ length: den }, (_, i) => (pr.selected[f * den + i] ? 'a' : 'e'));
    const local = pulseIdx >= f * den && pulseIdx < (f + 1) * den ? pulseIdx - f * den : -1;
    wrap.appendChild(fruitElement({
      fruitKey: state.fruit, den, states, size, interactive: true, pulseIndex: local,
      ariaLabel: `${FRUITS[state.fruit].name} ${f + 1} de ${pr.fruits}, dividida en ${den} partes. Pulsa un trozo para colorearlo.`,
      onToggle: i => toggleSlice(f * den + i)
    }));
  }
  const col = document.createElement('div');
  col.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:100%';
  col.appendChild(wrap);
  const sum = document.createElement('p');
  sum.className = 'answer-summary';
  sum.setAttribute('aria-live', 'polite');
  sum.innerHTML = `Coloreaste <b>${countSelected()}</b> trozo${countSelected() === 1 ? '' : 's'} de ${den}`;
  col.appendChild(sum);
  holder.appendChild(col);

  if (focusIdx >= 0) {
    const f = Math.floor(focusIdx / den), i = focusIdx % den;
    const el = wrap.children[f] && wrap.children[f].querySelector(`.slice[data-i="${i}"]`);
    if (el) el.focus();
  }
}

function toggleSlice(idx) {
  const pr = state.practice;
  pr.selected[idx] = !pr.selected[idx];
  $('#ans-n').value = countSelected();
  answerRefresh(idx, idx);
}

function fillSequential(n, den) {
  const pr = state.practice;
  pr.selected = Array.from({ length: pr.fruits * den }, (_, i) => i < n);
}

function onAnswerNumInput() {
  const pr = state.practice, den = getAnswerDen();
  if (den === null) return;
  let n = parseInt($('#ans-n').value, 10);
  if (!Number.isFinite(n) || n < 0) n = 0;
  n = Math.min(n, CONFIG.MAX_FRUITS_SHOWN * den);
  pr.fruits = Math.max(pr.fruits, Math.ceil(n / den), 1);
  fillSequential(n, den);
  answerRefresh();
}

function onAnswerDenInput() {
  const pr = state.practice, den = getAnswerDen();
  if (den === null) { answerRefresh(); return; }
  let n = parseInt($('#ans-n').value, 10);
  if (!Number.isFinite(n) || n < 0) n = 0;
  n = Math.min(n, CONFIG.MAX_FRUITS_SHOWN * den);
  pr.fruits = Math.max(1, Math.ceil(n / den));
  fillSequential(n, den);
  answerRefresh();
}

function changeFruitCount(delta) {
  const pr = state.practice, den = getAnswerDen();
  if (den === null) return;
  pr.fruits = Math.min(CONFIG.MAX_FRUITS_SHOWN, Math.max(1, pr.fruits + delta));
  answerRefresh();
  $('#ans-n').value = countSelected();
}

function clearAnswer() {
  const pr = state.practice;
  pr.selected = pr.selected.map(() => false);
  $('#ans-n').value = 0;
  answerRefresh();
}

/* ---- Comprobación de la respuesta ---- */
function checkAnswer() {
  const pr = state.practice, p = pr.problem;
  if (pr.solved) { setFeedback('info', '¡Ya resolviste este problema! Pulsa «Siguiente problema» 😊'); return; }
  const n = Number($('#ans-n').value), d = Number($('#ans-d').value);
  if (!Number.isInteger(n) || !Number.isInteger(d) || d < 1 || n < 0) {
    setFeedback('info', 'Escribe una fracción válida (numerador entero y denominador de al menos 1) 🙂');
    return;
  }
  markAttempted();
  const correct = computeAnswer(p);
  const ok = n * correct.d === correct.n * d;

  if (ok) {
    pr.solved = true;
    pr.score.correct++;
    if (pr.clean) pr.score.streak++;
    let msg = pick(CONFIG.PRAISES);
    const s = simplify(n, d);
    if (n > 0 && d > 1 && s.g > 1) {
      msg += `<br><small>Tu respuesta es correcta, pero se puede simplificar: ${frac(n, d)} = ${frac(s.n, s.d)}. ¡Intenta dar la fracción más simple!</small>`;
    } else if (n > 0) {
      msg += `<br><small>${frac(n, d)} está en su forma más simple.</small>`;
    }
    setFeedback('ok', msg);
    $('#next-btn').hidden = false;
    celebrate();
  } else {
    pr.attempts++;
    pr.clean = false;
    pr.score.streak = 0;
    let msg = pick(CONFIG.RETRY_MESSAGES);
    const mine = n / d, right = correct.n / correct.d;
    msg += mine > right ? '<br><small>Tu respuesta es un poco <b>grande</b>.</small>' : '<br><small>Tu respuesta es un poco <b>pequeña</b>.</small>';
    if (pr.attempts >= 2) msg += `<br><small>💡 Pista: ${CONFIG.HINTS[p.op]}</small>`;
    setFeedback('bad', msg);
  }
  updateScoreboard();
}

function showSolution() {
  const pr = state.practice, p = pr.problem;
  markAttempted();
  if (!pr.solved) { pr.clean = false; pr.score.streak = 0; updateScoreboard(); }
  pr.solutionVisible = true;
  const exp = buildExplanation(p);
  const banner = `${expressionHTML(p)} <span class="op-inline">=</span> ${resultHTML(exp.result)}`;
  const box = $('#practice-solution');
  box.hidden = false;
  renderSteps(box, exp.steps, exp.steps.length, banner);
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#next-btn').hidden = false;
}


/* ----------------------------------------------------------------------------
   BLOQUE 9: Interfaz general (fruta, pestañas, confeti, inicialización)
   PROPÓSITO: Construir el selector de frutas, cambiar de modo, refrescar
   gráficos al cambiar de fruta, celebrar aciertos y arrancar la app.
   PUNTOS DE EDICIÓN: Fruta inicial (state.fruit), valores por defecto del
   ejemplo inicial (en init) y símbolos del confeti (celebrate).
   ---------------------------------------------------------------------------- */
function buildFruitSelector() {
  const box = $('#fruit-selector');
  box.innerHTML = '';
  Object.entries(FRUITS).forEach(([key, F]) => {
    const label = document.createElement('label');
    label.className = 'fruit-option';
    label.innerHTML = `<input type="radio" name="fruit" value="${key}"${key === state.fruit ? ' checked' : ''}>` +
      `<span class="fruit-card">${buildFruitSVG({ fruitKey: key, den: 4, states: ['a', 'a', 'a', 'e'], size: 72, decorative: true })}` +
      `<span>${F.emoji} ${F.name}</span></span>`;
    label.querySelector('input').addEventListener('change', () => setFruit(key));
    box.appendChild(label);
  });
}

function applyThemeColors() {
  const root = document.documentElement.style;
  root.setProperty('--color-a', FRUITS[state.fruit].main);
  root.setProperty('--color-b', CONFIG.OPERAND_COLOR_B);
  root.setProperty('--color-c', CONFIG.THIRD_COLOR);
  $('.logo').textContent = FRUITS[state.fruit].emoji;
}

function setFruit(key) {
  state.fruit = key;
  applyThemeColors();
  refreshAll();
}

/* Vuelve a dibujar todo con la fruta actual (sin perder el progreso). */
function refreshAll() {
  renderPreview();
  if (state.steps.length) renderExploreSteps();
  if (state.practice.problem) {
    renderProblem();
    answerRefresh();
    if (state.practice.solutionVisible) showSolutionSilently();
  }
}

function showSolutionSilently() {
  const p = state.practice.problem;
  const exp = buildExplanation(p);
  renderSteps($('#practice-solution'), exp.steps, exp.steps.length,
    `${expressionHTML(p)} <span class="op-inline">=</span> ${resultHTML(exp.result)}`);
}

function setMode(mode) {
  state.mode = mode;
  ['explore', 'practice'].forEach(m => {
    const active = m === mode;
    const tab = $('#tab-' + m);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    $('#panel-' + m).hidden = !active;
  });
  if (mode === 'practice') {
    if (!state.practice.problem) newProblem(); else { renderProblem(); answerRefresh(); }
  }
}

function celebrate() {
  if (!CONFIG.CONFETTI_ENABLED || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = $('#confetti');
  const symbols = [FRUITS[state.fruit].emoji, '⭐', '🎉', '✨'];
  for (let i = 0; i < CONFIG.CONFETTI_COUNT; i++) {
    const s = document.createElement('span');
    s.textContent = pick(symbols);
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDelay = Math.random() * 0.6 + 's';
    s.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
    s.style.fontSize = 1.2 + Math.random() * 1.4 + 'rem';
    layer.appendChild(s);
    setTimeout(() => s.remove(), 4200);
  }
}

function init() {
  /* Límites de las entradas tomados de CONFIG */
  ['n1', 'n2'].forEach(id => { $('#' + id).min = 0; $('#' + id).max = CONFIG.MAX_NUMERATOR; });
  ['d1', 'd2'].forEach(id => { $('#' + id).min = 1; $('#' + id).max = CONFIG.MAX_DENOMINATOR; });
  $('#ans-n').min = 0;
  $('#ans-d').min = 1; $('#ans-d').max = CONFIG.MAX_ANSWER_DENOMINATOR;

  /* Niveles del modo práctica */
  const lvl = $('#level');
  Object.entries(CONFIG.LEVELS).forEach(([k, v]) => {
    const o = document.createElement('option');
    o.value = k; o.textContent = v.label;
    lvl.appendChild(o);
  });

  buildFruitSelector();
  applyThemeColors();

  /* Pestañas (con flechas de teclado) */
  ['explore', 'practice'].forEach(m => {
    const tab = $('#tab-' + m);
    tab.addEventListener('click', () => setMode(m));
    tab.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const other = m === 'explore' ? 'practice' : 'explore';
        setMode(other); $('#tab-' + other).focus();
      }
    });
  });

  /* Exploración */
  $('#explore-form').addEventListener('submit', onSolve);
  ['n1', 'd1', 'n2', 'd2'].forEach(id => $('#' + id).addEventListener('input', renderPreview));
  $('#operation').addEventListener('change', () => { updateOperationUI(); renderPreview(); });
  $('#next-step').addEventListener('click', revealNext);
  $('#show-all').addEventListener('click', () => {
    state.revealed = state.steps.length; renderExploreSteps();
  });
  $('#restart-steps').addEventListener('click', () => {
    state.revealed = Math.min(1, state.steps.length); renderExploreSteps();
    window.scrollTo({ top: $('#explore-form').offsetTop - 20, behavior: 'smooth' });
  });

  /* Práctica */
  $('#new-problem').addEventListener('click', newProblem);
  $('#level').addEventListener('change', newProblem);
  $('#ans-n').addEventListener('input', onAnswerNumInput);
  $('#ans-d').addEventListener('input', onAnswerDenInput);
  $('#more-fruit').addEventListener('click', () => changeFruitCount(1));
  $('#less-fruit').addEventListener('click', () => changeFruitCount(-1));
  $('#clear-answer').addEventListener('click', clearAnswer);
  $('#check-btn').addEventListener('click', checkAnswer);
  $('#solution-btn').addEventListener('click', showSolution);
  $('#next-btn').addEventListener('click', newProblem);

  updateOperationUI();
  renderPreview();
  updateScoreboard();

  /* Ejemplo inicial: 1/2 + 1/3 ya resuelto (primer paso visible) */
  onSolve(new Event('submit'));
}

init();
