"use strict";
const { useState, useMemo, useEffect, useRef } = React;
/* ============================== TOKENS — misma colorigrafía que David Productivity ============================== */
const C = {
    bg: '#FFFFFF', panel: '#FFFDFB', panelSoft: '#F6E9DC', line: '#EADBC8',
    ink: '#3A2A22', muted: '#8B7360',
    persimmon: '#DD6549', gold: '#E3A03D', plum: '#7C3F52',
    green: '#6E9B5E', greenBg: 'rgba(110,155,94,0.15)',
    orange: '#C1702E', orangeBg: 'rgba(193,112,46,0.16)',
    red: '#A8402C', redBg: 'rgba(168,64,44,0.14)',
    blue: '#3E76A6', blueBg: 'rgba(62,118,166,0.15)',
    purple: '#7B5EA0', purpleBg: 'rgba(123,94,160,0.15)',
};
const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
function Portal({ children }) { return ReactDOM.createPortal(children, document.body); }
function usePersistentState(key, initialValue) {
    const fullKey = `misFinanzas_${key}`;
    const [state, setState] = useState(() => {
        try {
            const raw = localStorage.getItem(fullKey);
            return raw !== null ? JSON.parse(raw) : initialValue;
        }
        catch (e) {
            return initialValue;
        }
    });
    useEffect(() => { try {
        localStorage.setItem(fullKey, JSON.stringify(state));
    }
    catch (e) { } }, [state]);
    return [state, setState];
}
/* ============================== UTILIDADES ============================== */
const pad2 = n => String(n).padStart(2, '0');
const todayStr = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const uid = () => Math.random().toString(36).slice(2, 9);
const money = (n) => `$${Math.round(n || 0).toLocaleString('en-US')}`;
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function monthNameFor(year, month) { return new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }); }
function getMonthGridCellsFor(year, month) {
    const first = new Date(year, month, 1);
    const startWeekday = (first.getDay() + 6) % 7;
    const total = daysInMonth(year, month);
    const cells = [];
    for (let i = 0; i < startWeekday; i++)
        cells.push(null);
    for (let d = 1; d <= total; d++)
        cells.push(d);
    return cells;
}
function weekdayShort(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short' });
}
function getVal(entry) { return typeof entry === 'object' && entry !== null ? (entry.monto || 0) : (entry || 0); }
function getNota(entry) { return (typeof entry === 'object' && entry !== null) ? (entry.nota || '') : ''; }
function sumMonth(map, year, month) {
    let total = 0;
    Object.keys(map || {}).forEach(iso => {
        const [y, m] = iso.split('-').map(Number);
        if (y === year && (m - 1) === month)
            total += getVal(map[iso]);
    });
    return total;
}
function sumAll(map) { return Object.keys(map || {}).reduce((s, iso) => s + getVal(map[iso]), 0); }
function monthsWithData(maps) {
    const set = new Set();
    maps.forEach(m => Object.keys(m || {}).forEach(iso => {
        const [y, mo] = iso.split('-').map(Number);
        set.add(`${y}-${pad2(mo)}`);
    }));
    return Array.from(set).sort().reverse();
}
/* ============================== ICONOS ============================== */
function Icon({ path, size = 20, strokeWidth = 2 }) {
    return React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" }, path);
}
const ChevronLeft = (p) => React.createElement(Icon, { ...p, path: React.createElement("path", { d: "M15 6l-6 6 6 6" }) });
const ChevronRight = (p) => React.createElement(Icon, { ...p, path: React.createElement("path", { d: "M9 6l6 6-6 6" }) });
const ChevronDown = (p) => React.createElement(Icon, { ...p, path: React.createElement("path", { d: "M6 9l6 6 6-6" }) });
const Plus = (p) => React.createElement(Icon, { ...p, path: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M12 5v14" }),
        React.createElement("path", { d: "M5 12h14" })) });
const X = (p) => React.createElement(Icon, { ...p, path: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M18 6 6 18" }),
        React.createElement("path", { d: "M6 6l12 12" })) });
const TrendUp = (p) => React.createElement(Icon, { ...p, path: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M3 17l6-6 4 4 8-8" }),
        React.createElement("path", { d: "M15 7h6v6" })) });
const TrendDown = (p) => React.createElement(Icon, { ...p, path: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M3 7l6 6 4-4 8 8" }),
        React.createElement("path", { d: "M15 17h6v-6" })) });
const DollarIcon = (p) => React.createElement(Icon, { ...p, path: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M12 2v20" }),
        React.createElement("path", { d: "M17 6.5c0-2-2-3-5-3s-5 1.3-5 3.3c0 4 10 2 10 6.2 0 2-2 3.3-5 3.3s-5-1-5-3" })) });
function PiggyImg({ size = 20 }) {
    return React.createElement("img", { src: window.__PIGGY_DATA_URI__, width: size, height: size, style: { display: 'block', objectFit: 'contain' }, alt: "Finanzas" });
}
const FolderIcon = (p) => React.createElement(Icon, { ...p, path: React.createElement("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" }) });
const Pencil = (p) => React.createElement(Icon, { ...p, path: React.createElement("path", { d: "M12.9 3.1a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L6.7 17.3 3 18l.7-3.7Z" }) });
const Trash = (p) => React.createElement(Icon, { ...p, path: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M4 7h16" }),
        React.createElement("path", { d: "M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" }),
        React.createElement("path", { d: "M6 7l1 13.5A1.5 1.5 0 0 0 8.5 22h7a1.5 1.5 0 0 0 1.5-1.5L18 7" })) });
/* ============================== LOGO ============================== */
function LogoImg({ size = 38, style }) {
    return React.createElement("img", { src: window.__LOGO_DATA_URI__, width: size, height: size, alt: "Mis Finanzas", style: { display: 'block', borderRadius: Math.round(size * 0.22), boxShadow: '0 2px 6px rgba(58,42,34,0.18)', ...style } });
}
/* ============================== PRIMITIVOS ============================== */
function Card({ children, style }) {
    return React.createElement("div", { style: { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 20, padding: 18, boxShadow: '0 1px 2px rgba(58,42,34,0.04)', ...style } }, children);
}
function Btn({ children, onClick, variant = 'primary', style, disabled }) {
    const base = { borderRadius: 999, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, border: '1px solid transparent', display: 'inline-flex', alignItems: 'center', gap: 6 };
    const variants = {
        primary: { background: C.green, color: '#fff' },
        ghost: { background: 'transparent', borderColor: C.line, color: C.ink },
        soft: { background: C.panelSoft, borderColor: C.line, color: C.ink },
    };
    return React.createElement("button", { disabled: disabled, onClick: onClick, style: { ...base, ...variants[variant], ...style } }, children);
}
function ScreenHeader({ title, onBack, right }) {
    return (React.createElement("div", { style: { position: 'sticky', top: 0, zIndex: 5, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', borderBottom: `1px solid ${C.line}`, padding: '14px 18px', paddingTop: 'calc(14px + env(safe-area-inset-top))', display: 'flex', alignItems: 'center', gap: 12 } },
        React.createElement("button", { onClick: onBack, style: { width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.line}`, background: C.panel, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } },
            React.createElement(ChevronLeft, { size: 18 })),
        React.createElement("h1", { className: "mf-display", style: { fontSize: 'clamp(17px,2.4vw,21px)', fontWeight: 700, flex: 1, minWidth: 0 } }, title),
        right));
}
function FullScreen({ children, z = 50 }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }, []);
    return (React.createElement(Portal, null,
        React.createElement("div", { style: {
                position: 'fixed', inset: 0, zIndex: z, background: C.bg, overflowY: 'auto', overflowX: 'hidden',
                transform: mounted ? 'translateY(0)' : 'translateY(24px)', opacity: mounted ? 1 : 0,
                transition: 'transform 420ms cubic-bezier(.2,.9,.25,1), opacity 360ms ease',
            } }, children)));
}
/* ============================== GAUGE circular de dinero ============================== */
function MoneyGauge({ ganado, gastado, size = 150, stroke = 13 }) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    const total = ganado + gastado;
    const arcLen = c * 0.75;
    const ganadoLen = total > 0 ? (ganado / total) * arcLen : 0;
    const gastadoLen = total > 0 ? arcLen - ganadoLen : 0;
    return (React.createElement("div", { style: { position: 'relative', width: size, height: size, flexShrink: 0 } },
        React.createElement("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}` },
            React.createElement("g", { transform: `rotate(135 ${size / 2} ${size / 2})` },
                React.createElement("circle", { cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: C.line, strokeWidth: stroke, strokeDasharray: `${arcLen} ${c}`, strokeLinecap: "round" }),
                React.createElement("circle", { cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: C.green, strokeWidth: stroke, strokeDasharray: `${ganadoLen} ${c}`, strokeLinecap: "round", style: { transition: 'stroke-dasharray 700ms cubic-bezier(.2,.9,.25,1)' } }),
                React.createElement("circle", { cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: C.orange, strokeWidth: stroke, strokeDasharray: `${gastadoLen} ${c}`, strokeDashoffset: -ganadoLen, strokeLinecap: "round", style: { transition: 'stroke-dasharray 700ms cubic-bezier(.2,.9,.25,1), stroke-dashoffset 700ms cubic-bezier(.2,.9,.25,1)' } }))),
        React.createElement("div", { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 8 } },
            React.createElement("span", { style: { fontSize: 9.5, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' } }, "Ganado"),
            React.createElement("span", { className: "mf-mono", style: { fontSize: 'clamp(16px,3vw,20px)', fontWeight: 700, color: C.green, lineHeight: 1.15 } }, money(ganado)),
            React.createElement("span", { style: { fontSize: 9.5, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 } }, "Gastado"),
            React.createElement("span", { className: "mf-mono", style: { fontSize: 'clamp(13px,2.4vw,16px)', fontWeight: 700, color: C.orange, lineHeight: 1.15 } }, money(gastado)))));
}
/* ============================== CALENDARIO DE GASTOS (home) ============================== */
function dayGastoColor(total) {
    if (total > 60)
        return { fg: C.red, bg: C.redBg };
    if (total >= 25)
        return { fg: C.orange, bg: C.orangeBg };
    return { fg: C.green, bg: C.greenBg };
}
function dailyGastoTotal(gastosFijos, gastosVariados, iso) {
    return getVal(gastosFijos.renta[iso]) + getVal(gastosFijos.comida[iso]) + getVal(gastosFijos.gasolina[iso]) + getVal(gastosFijos.membresias[iso]) + getVal(gastosVariados[iso]);
}
function GastosCalendar({ gastosFijos, gastosVariados }) {
    const now = new Date();
    const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
    const [selected, setSelected] = useState(null);
    const cells = getMonthGridCellsFor(view.year, view.month);
    const today = todayStr();
    return (React.createElement("div", null,
        React.createElement("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } },
            React.createElement("button", { onClick: () => { setSelected(null); setView(v => { const m = v.month - 1; return m < 0 ? { year: v.year - 1, month: 11 } : { ...v, month: m }; }); }, style: { width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.line}`, background: C.panelSoft, color: C.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
                React.createElement(ChevronLeft, { size: 14 })),
            React.createElement("p", { className: "mf-display", style: { fontSize: 13, fontWeight: 600, textTransform: 'capitalize' } }, monthNameFor(view.year, view.month)),
            React.createElement("button", { onClick: () => { setSelected(null); setView(v => { const m = v.month + 1; return m > 11 ? { year: v.year + 1, month: 0 } : { ...v, month: m }; }); }, style: { width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.line}`, background: C.panelSoft, color: C.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
                React.createElement(ChevronRight, { size: 14 }))),
        React.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 } }, DAY_LETTERS.map(l => React.createElement("div", { key: l, style: { textAlign: 'center', fontSize: 9, color: C.muted, fontWeight: 600 } }, l))),
        React.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 } }, cells.map((d, i) => {
            if (!d)
                return React.createElement("div", { key: i });
            const iso = `${view.year}-${pad2(view.month + 1)}-${pad2(d)}`;
            const isFuture = iso > today;
            const total = dailyGastoTotal(gastosFijos, gastosVariados, iso);
            const c = isFuture ? { fg: C.muted, bg: C.panelSoft } : dayGastoColor(total);
            const isToday = iso === today;
            return (React.createElement("button", { key: i, onClick: () => setSelected({ iso, total }), style: {
                    aspectRatio: '1/1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    background: c.bg, color: c.fg, fontSize: 10.5, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', border: isToday ? `1.5px solid ${C.plum}` : '1.5px solid transparent',
                } }, d));
        })),
        selected && (React.createElement("div", { style: { marginTop: 12, padding: '10px 12px', background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 12, fontSize: 12, color: C.ink } },
            React.createElement("b", { style: { textTransform: 'capitalize' } }, weekdayShort(selected.iso)),
            ", ",
            selected.iso.split('-')[2],
            " de ",
            monthNameFor(view.year, view.month),
            " \u2014 gastaste ",
            React.createElement("span", { className: "mf-mono" }, money(selected.total)))),
        React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.line}` } }, [{ c: C.green, t: 'Menos de $25' }, { c: C.orange, t: '$25 a $60' }, { c: C.red, t: 'Más de $60' }].map((r, i) => (React.createElement("div", { key: i, style: { display: 'flex', alignItems: 'center', gap: 6 } },
            React.createElement("div", { style: { width: 10, height: 10, borderRadius: 3, background: r.c } }),
            React.createElement("span", { style: { fontSize: 10.5, color: C.ink } }, r.t)))))));
}
/* ============================== PANTALLA DE INICIO ============================== */
function InicioScreen({ ingresos, gastosFijos, gastosVariados, inversiones, saldoAjuste }) {
    const now = new Date();
    const ganadoTotal = sumAll(ingresos.aquafeel) + sumAll(ingresos.cosmetica) + sumAll(ingresos.generales);
    const gastadoTotal = sumAll(gastosFijos.renta) + sumAll(gastosFijos.comida) + sumAll(gastosFijos.gasolina) + sumAll(gastosFijos.membresias) + sumAll(gastosVariados);
    const invertidoTotal = sumAll(inversiones);
    const saldo = saldoAjuste + ganadoTotal - gastadoTotal - invertidoTotal;
    const ingresosMes = sumMonth(ingresos.aquafeel, now.getFullYear(), now.getMonth()) + sumMonth(ingresos.cosmetica, now.getFullYear(), now.getMonth()) + sumMonth(ingresos.generales, now.getFullYear(), now.getMonth());
    const gastadoMes = sumMonth(gastosFijos.renta, now.getFullYear(), now.getMonth()) + sumMonth(gastosFijos.comida, now.getFullYear(), now.getMonth()) + sumMonth(gastosFijos.gasolina, now.getFullYear(), now.getMonth()) + sumMonth(gastosFijos.membresias, now.getFullYear(), now.getMonth()) + sumMonth(gastosVariados, now.getFullYear(), now.getMonth());
    const saldoBajo = saldo < 50000;
    const ingresoBajo = ingresosMes < 10000;
    return (React.createElement("div", { style: { maxWidth: 960, margin: '0 auto', padding: '20px 18px 100px', paddingTop: 'calc(20px + env(safe-area-inset-top))' } },
        React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 } },
            React.createElement(LogoImg, { size: 36 }),
            React.createElement("div", null,
                React.createElement("p", { className: "mf-mono", style: { fontSize: 10, letterSpacing: '0.14em', color: C.green } }, "DAVID FINANZAS"),
                React.createElement("h1", { className: "mf-display", style: { fontSize: 'clamp(18px,3vw,22px)', fontWeight: 700 } }, "Hola, David"))),
        React.createElement("div", { style: { display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 18 } },
            React.createElement(Card, { style: { flex: '1 1 220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } },
                React.createElement("p", { className: "mf-display", style: { fontSize: 13.5, fontWeight: 600, alignSelf: 'flex-start', marginBottom: 10 } }, "Este mes"),
                React.createElement(MoneyGauge, { ganado: ingresosMes, gastado: gastadoMes })),
            React.createElement(Card, { style: { flex: '1 1 280px' } },
                React.createElement("p", { className: "mf-display", style: { fontSize: 13.5, fontWeight: 600, marginBottom: 10 } }, "Calendario de gastos"),
                React.createElement(GastosCalendar, { gastosFijos: gastosFijos, gastosVariados: gastosVariados }))),
        React.createElement(Card, { style: { borderColor: saldoBajo ? C.gold : C.green, background: saldoBajo ? 'rgba(227,160,61,0.08)' : 'rgba(110,155,94,0.08)', marginBottom: 14 } },
            React.createElement("p", { style: { fontSize: 13.5, lineHeight: 1.6, color: C.ink } },
                "David, tu saldo actual es de ",
                React.createElement("b", { className: "mf-mono" }, money(saldo)),
                ". Vamos a aumentarlo, que t\u00FA s\u00ED puedes.",
                saldoBajo
                    ? ' Es rarísimo esta cantidad, porque tu saldo siempre está en más de $50,000.'
                    : ' ¡Así se hace, sigue así!')),
        React.createElement(Card, { style: { borderColor: ingresoBajo ? C.gold : C.green, background: ingresoBajo ? 'rgba(227,160,61,0.08)' : 'rgba(110,155,94,0.08)' } },
            React.createElement("p", { style: { fontSize: 13.5, lineHeight: 1.6, color: C.ink } },
                "David, este mes solo hemos ganado ",
                React.createElement("b", { className: "mf-mono" }, money(ingresosMes)),
                ".",
                ingresoBajo
                    ? ' Para el próximo mes hay que aumentarlo, lo cual es raro porque tú siempre ganas $10,000 o más por mes.'
                    : ' ¡Vas muy bien este mes, sigue empujando!'))));
}
/* ============================== LISTA DE DÍAS POR CATEGORÍA ============================== */
function DayRow({ iso, isToday, entry, needsNota, onSetMonto, onSetNota, accent }) {
    const monto = getVal(entry);
    const nota = getNota(entry);
    return (React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', borderBottom: `1px solid ${C.line}`, background: isToday ? 'rgba(110,155,94,0.08)' : 'transparent', borderRadius: isToday ? 10 : 0 } },
        React.createElement("div", { style: { width: 44, flexShrink: 0 } },
            React.createElement("p", { className: "mf-mono", style: { fontSize: 9.5, color: isToday ? C.green : C.muted, fontWeight: isToday ? 700 : 500, textTransform: 'capitalize' } }, weekdayShort(iso)),
            React.createElement("p", { className: "mf-mono", style: { fontSize: 12, color: isToday ? C.green : C.ink, fontWeight: 700 } }, Number(iso.split('-')[2]))),
        React.createElement("div", { style: { position: 'relative', flex: needsNota ? '0 1 90px' : '1 1 auto' } },
            React.createElement("span", { style: { position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 12.5 } }, "$"),
            React.createElement("input", { type: "number", inputMode: "decimal", value: monto || '', placeholder: "0", onChange: e => onSetMonto(iso, e.target.value === '' ? 0 : Number(e.target.value)), style: { width: '100%', background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 9, padding: '7px 9px 7px 18px', color: accent, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 12.5, outline: 'none' } })),
        needsNota && (React.createElement("input", { type: "text", value: nota, placeholder: "\u00BFEn qu\u00E9 fue?", onChange: e => onSetNota(iso, e.target.value), style: { flex: 1, minWidth: 0, background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 9, padding: '7px 10px', color: C.ink, fontFamily: 'Poppins, sans-serif', fontSize: 12, outline: 'none' } }))));
}
function CategoryDayList({ label, data, needsNota, onSetMonto, onSetNota, accent = C.green, year, month }) {
    const [open, setOpen] = useState(false);
    const total = sumMonth(data, year, month);
    const total_days = daysInMonth(year, month);
    const today = todayStr();
    return (React.createElement("div", { style: { border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden', background: C.panel } },
        React.createElement("button", { onClick: () => setOpen(o => !o), style: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px', background: 'transparent', border: 'none', cursor: 'pointer' } },
            React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: C.ink } }, label),
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                React.createElement("span", { className: "mf-mono", style: { fontSize: 13, fontWeight: 700, color: accent } }, money(total)),
                React.createElement("span", { style: { transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', color: C.muted, display: 'flex' } },
                    React.createElement(ChevronDown, { size: 16 })))),
        open && (React.createElement("div", { style: { padding: '4px 12px 12px', maxHeight: 340, overflowY: 'auto' } }, Array.from({ length: total_days }, (_, i) => i + 1).map(d => {
            const iso = `${year}-${pad2(month + 1)}-${pad2(d)}`;
            return React.createElement(DayRow, { key: iso, iso: iso, isToday: iso === today, entry: data[iso], needsNota: needsNota, accent: accent, onSetMonto: (iso, v) => onSetMonto(iso, v), onSetNota: (iso, v) => onSetNota(iso, v) });
        })))));
}
/* ============================== GRÁFICA: DÍA DE LA SEMANA QUE MÁS SE GASTA ============================== */
function WeekdaySpendChart({ gastosFijos, gastosVariados, year, month }) {
    const sums = [0, 0, 0, 0, 0, 0, 0];
    const addMap = (map) => Object.keys(map || {}).forEach(iso => {
        const [y, m, d] = iso.split('-').map(Number);
        if (y === year && (m - 1) === month) {
            const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
            sums[dow] += getVal(map[iso]);
        }
    });
    addMap(gastosFijos.comida);
    addMap(gastosFijos.gasolina);
    addMap(gastosVariados);
    const max = Math.max(1, ...sums);
    const maxIdx = sums.indexOf(Math.max(...sums));
    return (React.createElement("div", null,
        React.createElement("p", { style: { fontSize: 11.5, color: C.muted, marginBottom: 10 } }, "Comida, gasolina y gastos variados \u2014 por d\u00EDa de la semana"),
        React.createElement("div", { style: { display: 'flex', alignItems: 'flex-end', gap: 8, height: 70 } }, sums.map((v, i) => (React.createElement("div", { key: i, style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 } },
            React.createElement("div", { style: { width: '100%', maxWidth: 26, borderRadius: 4, background: i === maxIdx && v > 0 ? C.red : C.green, height: `${Math.max(5, (v / max) * 60)}px`, transition: 'height 400ms ease' } }),
            React.createElement("span", { style: { fontSize: 9.5, color: C.muted, fontWeight: 600 } }, DAY_LETTERS[i])))))));
}
/* ============================== CONFIRMAR ELIMINACIÓN (escribir "eliminar") ============================== */
function ConfirmDeleteModal({ message, onConfirm, onClose }) {
    const [text, setText] = useState('');
    const ok = text.trim().toLowerCase() === 'eliminar';
    return (React.createElement(Portal, null,
        React.createElement("div", { onClick: onClose, style: { position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(58,42,34,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 } },
            React.createElement("div", { onClick: e => e.stopPropagation(), style: { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, width: '100%', maxWidth: 400 } },
                React.createElement("p", { className: "mf-display", style: { fontSize: 16, fontWeight: 700, marginBottom: 6 } }, "\u00BFSeguro que deseas eliminar esto?"),
                React.createElement("p", { style: { fontSize: 12.5, color: C.muted, marginBottom: 12 } },
                    message,
                    " Si deseas eliminarlo, escribe la palabra ",
                    React.createElement("b", null, "eliminar"),
                    " abajo."),
                React.createElement("input", { autoFocus: true, type: "text", value: text, onChange: e => setText(e.target.value), onKeyDown: e => e.key === 'Enter' && ok && onConfirm(), placeholder: "eliminar", style: { width: '100%', background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: '10px 13px', color: C.ink, outline: 'none', fontFamily: 'Poppins, sans-serif', fontSize: 14, marginBottom: 14 } }),
                React.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: 8 } },
                    React.createElement("button", { onClick: onClose, style: { borderRadius: 999, padding: '9px 16px', fontSize: 13, fontWeight: 600, background: 'transparent', border: `1px solid ${C.line}`, color: C.ink, cursor: 'pointer' } }, "Cancelar"),
                    React.createElement("button", { disabled: !ok, onClick: onConfirm, style: { borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 600, background: C.red, border: 'none', color: '#fff', cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : 0.4 } }, "Eliminar"))))));
}
/* ============================== DONUT: DISTRIBUCIÓN DEL MES ============================== */
function DistribucionRow({ row, onClearGroup }) {
    const [revealed, setRevealed] = useState(false);
    const [confirming, setConfirming] = useState(false);
    return (React.createElement("div", { onClick: () => row.value > 0 && setRevealed(r => !r), style: { display: 'flex', alignItems: 'center', gap: 7, cursor: row.value > 0 ? 'pointer' : 'default' } },
        React.createElement("div", { style: { width: 11, height: 11, borderRadius: 3, background: row.color, flexShrink: 0 } }),
        React.createElement("span", { style: { fontSize: 12.5 } },
            row.label,
            ": ",
            React.createElement("b", { className: "mf-mono" }, money(row.value))),
        revealed && row.value > 0 && (React.createElement("button", { onClick: (e) => { e.stopPropagation(); setConfirming(true); }, title: `Borrar todo lo de ${row.label}`, style: { width: 20, height: 20, borderRadius: '50%', border: `1px solid ${C.line}`, background: C.panelSoft, color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
            React.createElement(Trash, { size: 10 }))),
        confirming && (React.createElement(ConfirmDeleteModal, { message: `Vas a borrar todo lo registrado en "${row.label}" de este mes.`, onClose: () => setConfirming(false), onConfirm: () => { onClearGroup(row.key); setConfirming(false); setRevealed(false); } }))));
}
function DistribucionDonut({ ingresos, gastos, inversiones, onClearGroup }) {
    const total = Math.max(1, ingresos + gastos + inversiones);
    const segs = [{ v: ingresos, c: C.green }, { v: gastos, c: C.orange }, { v: inversiones, c: C.blue }];
    const size = 150, stroke = 22, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
    let acc = 0;
    const rows = [
        { key: 'ingresos', label: 'Ingresos', color: C.green, value: ingresos },
        { key: 'gastos', label: 'Gastos', color: C.orange, value: gastos },
        { key: 'inversiones', label: 'Invertido', color: C.blue, value: inversiones },
    ];
    return (React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' } },
        React.createElement("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: { flexShrink: 0 } },
            React.createElement("g", { transform: `rotate(-90 ${size / 2} ${size / 2})` }, segs.map((s, i) => {
                const frac = s.v / total;
                const dash = frac * circ;
                const el = React.createElement("circle", { key: i, cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: s.c, strokeWidth: stroke, strokeDasharray: `${dash} ${circ - dash}`, strokeDashoffset: -acc });
                acc += dash;
                return el;
            }))),
        React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 } }, rows.map(row => React.createElement(DistribucionRow, { key: row.key, row: row, onClearGroup: onClearGroup })))));
}
/* ============================== TRANSACCIONES ============================== */
function buildTransactions({ ingresos, gastosFijos, gastosVariados, inversiones }) {
    const list = [];
    const push = (map, tipo, categoria, origen) => Object.keys(map || {}).forEach(iso => {
        const monto = getVal(map[iso]);
        if (monto > 0)
            list.push({ id: `${origen}-${iso}`, fecha: iso, tipo, categoria, origen, monto, nota: getNota(map[iso]) });
    });
    push(ingresos.aquafeel, 'ingreso', 'Aquafeel', 'aquafeel');
    push(ingresos.cosmetica, 'ingreso', 'Cosmética', 'cosmetica');
    push(ingresos.generales, 'ingreso', 'Generales', 'generales');
    push(gastosFijos.renta, 'gasto', 'Renta', 'renta');
    push(gastosFijos.comida, 'gasto', 'Comida', 'comida');
    push(gastosFijos.gasolina, 'gasto', 'Gasolina', 'gasolina');
    push(gastosFijos.membresias, 'gasto', 'Membresías', 'membresias');
    push(gastosVariados, 'gasto', 'Gasto variado', 'variados');
    push(inversiones, 'inversion', 'Inversión', 'inversion');
    return list.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
function TransaccionRow({ t, onDelete }) {
    const [revealed, setRevealed] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const color = t.tipo === 'ingreso' ? C.green : t.tipo === 'inversion' ? C.blue : C.orange;
    const sign = t.tipo === 'ingreso' ? '+' : '-';
    return (React.createElement("div", { onClick: () => onDelete && setRevealed(r => !r), style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 4px', borderBottom: `1px solid ${C.line}`, gap: 10, cursor: onDelete ? 'pointer' : 'default' } },
        React.createElement("div", { style: { minWidth: 0 } },
            React.createElement("p", { style: { fontSize: 13.5, fontWeight: 500, color: C.ink } },
                t.categoria,
                t.nota ? ` · ${t.nota}` : ''),
            React.createElement("p", { className: "mf-mono", style: { fontSize: 10.5, color: C.muted, textTransform: 'capitalize' } },
                weekdayShort(t.fecha),
                " ",
                t.fecha)),
        React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 } },
            React.createElement("span", { className: "mf-mono", style: { fontSize: 14, fontWeight: 700, color } },
                sign,
                money(t.monto)),
            revealed && onDelete && (React.createElement("button", { onClick: (e) => { e.stopPropagation(); setConfirming(true); }, title: "Eliminar transacci\u00F3n", style: { width: 24, height: 24, borderRadius: '50%', border: `1px solid ${C.line}`, background: C.panelSoft, color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
                React.createElement(Trash, { size: 11 })))),
        confirming && (React.createElement(ConfirmDeleteModal, { message: `Vas a borrar "${t.categoria}" del ${t.fecha}.`, onClose: () => setConfirming(false), onConfirm: () => { onDelete(t.origen, t.fecha); setConfirming(false); } }))));
}
function TransaccionesScreen({ data, onDelete, onBack }) {
    const all = useMemo(() => buildTransactions(data), [data]);
    return (React.createElement(FullScreen, { z: 55 },
        React.createElement(ScreenHeader, { title: "Todas las transacciones", onBack: onBack }),
        React.createElement("div", { style: { maxWidth: 720, margin: '0 auto', padding: '16px 18px 60px' } }, all.length === 0 ? React.createElement("p", { style: { color: C.muted, fontSize: 13 } }, "A\u00FAn no hay transacciones.") : all.map(t => React.createElement(TransaccionRow, { key: t.id, t: t, onDelete: onDelete })))));
}
/* ============================== REPORTES (archivo de INGRESOS por mes) ============================== */
function ReportesIngresosScreen({ ingresos, onBack }) {
    const now = new Date();
    const [selected, setSelected] = useState(null);
    const months = monthsWithData([ingresos.aquafeel, ingresos.cosmetica, ingresos.generales]).filter(k => k !== `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`);
    return (React.createElement(FullScreen, { z: 60 },
        React.createElement(ScreenHeader, { title: "Reportes de ingresos", onBack: () => (selected ? setSelected(null) : onBack()) }),
        React.createElement("div", { style: { maxWidth: 720, margin: '0 auto', padding: '16px 18px 60px' } }, !selected ? (months.length === 0 ? React.createElement("p", { style: { color: C.muted, fontSize: 13 } }, "Todav\u00EDa no hay meses cerrados.") : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 10 } }, months.map(key => {
            const [y, m] = key.split('-').map(Number);
            const aq = sumMonth(ingresos.aquafeel, y, m - 1), co = sumMonth(ingresos.cosmetica, y, m - 1), ge = sumMonth(ingresos.generales, y, m - 1);
            return (React.createElement("button", { key: key, onClick: () => setSelected({ year: y, month: m - 1 }), style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px 16px', cursor: 'pointer' } },
                React.createElement("div", null,
                    React.createElement("p", { className: "mf-display", style: { fontSize: 14.5, fontWeight: 600, textTransform: 'capitalize' } }, monthNameFor(y, m - 1)),
                    React.createElement("p", { style: { fontSize: 11.5, color: C.muted } },
                        "Total ganado: ",
                        React.createElement("b", { className: "mf-mono" }, money(aq + co + ge)))),
                React.createElement(ChevronRight, { size: 16, color: C.green })));
        })))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
            React.createElement("p", { className: "mf-display", style: { fontSize: 17, fontWeight: 700, textTransform: 'capitalize' } }, monthNameFor(selected.year, selected.month)),
            React.createElement(Card, null,
                React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between' } },
                    React.createElement("span", null, "Aquafeel"),
                    React.createElement("b", { className: "mf-mono", style: { color: C.green } }, money(sumMonth(ingresos.aquafeel, selected.year, selected.month))))),
            React.createElement(Card, null,
                React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between' } },
                    React.createElement("span", null, "Cosm\u00E9tica"),
                    React.createElement("b", { className: "mf-mono", style: { color: C.green } }, money(sumMonth(ingresos.cosmetica, selected.year, selected.month))))),
            React.createElement(Card, null,
                React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
                    React.createElement("span", null, "Generales"),
                    React.createElement("b", { className: "mf-mono", style: { color: C.green } }, money(sumMonth(ingresos.generales, selected.year, selected.month)))),
                Object.keys(ingresos.generales).filter(iso => { const [y, m] = iso.split('-').map(Number); return y === selected.year && (m - 1) === selected.month && getVal(ingresos.generales[iso]) > 0; }).sort().map(iso => (React.createElement("div", { key: iso, style: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted, padding: '4px 0', borderTop: `1px solid ${C.line}` } },
                    React.createElement("span", null,
                        iso.split('-')[2],
                        " \u2014 ",
                        getNota(ingresos.generales[iso]) || 'sin nota'),
                    React.createElement("span", { className: "mf-mono" }, money(getVal(ingresos.generales[iso]))))))))))));
}
/* ============================== REGISTRO DE GASTOS MENSUALES ============================== */
function RegistroGastosScreen({ gastosFijos, gastosVariados, onBack }) {
    const now = new Date();
    const [selected, setSelected] = useState(null);
    const months = monthsWithData([gastosFijos.renta, gastosFijos.comida, gastosFijos.gasolina, gastosFijos.membresias, gastosVariados]).filter(k => k !== `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`);
    const CATS = [['renta', 'Renta', gastosFijos.renta], ['comida', 'Comida', gastosFijos.comida], ['gasolina', 'Gasolina', gastosFijos.gasolina], ['membresias', 'Membresías', gastosFijos.membresias], ['variados', 'Gastos variados', gastosVariados]];
    return (React.createElement(FullScreen, { z: 60 },
        React.createElement(ScreenHeader, { title: "Registro de gastos mensuales", onBack: () => (selected ? setSelected(null) : onBack()) }),
        React.createElement("div", { style: { maxWidth: 720, margin: '0 auto', padding: '16px 18px 60px' } }, !selected ? (months.length === 0 ? React.createElement("p", { style: { color: C.muted, fontSize: 13 } }, "Todav\u00EDa no hay meses cerrados.") : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 10 } }, months.map(key => {
            const [y, m] = key.split('-').map(Number);
            const total = CATS.reduce((s, [, , map]) => s + sumMonth(map, y, m - 1), 0);
            return (React.createElement("button", { key: key, onClick: () => setSelected({ year: y, month: m - 1 }), style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px 16px', cursor: 'pointer' } },
                React.createElement("div", null,
                    React.createElement("p", { className: "mf-display", style: { fontSize: 14.5, fontWeight: 600, textTransform: 'capitalize' } }, monthNameFor(y, m - 1)),
                    React.createElement("p", { style: { fontSize: 11.5, color: C.muted } },
                        "Total gastado: ",
                        React.createElement("b", { className: "mf-mono" }, money(total)))),
                React.createElement(ChevronRight, { size: 16, color: C.green })));
        })))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
            React.createElement("p", { className: "mf-display", style: { fontSize: 17, fontWeight: 700, textTransform: 'capitalize' } }, monthNameFor(selected.year, selected.month)),
            CATS.map(([key, label, map]) => (React.createElement(Card, { key: key },
                React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 } },
                    React.createElement("span", { style: { fontWeight: 600 } }, label),
                    React.createElement("b", { className: "mf-mono", style: { color: C.orange } }, money(sumMonth(map, selected.year, selected.month)))),
                Object.keys(map).filter(iso => { const [y, m] = iso.split('-').map(Number); return y === selected.year && (m - 1) === selected.month && getVal(map[iso]) > 0; }).sort().map(iso => (React.createElement("div", { key: iso, style: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted, padding: '4px 0', borderTop: `1px solid ${C.line}` } },
                    React.createElement("span", null,
                        iso.split('-')[2],
                        getNota(map[iso]) ? ` — ${getNota(map[iso])}` : ''),
                    React.createElement("span", { className: "mf-mono" }, money(getVal(map[iso]))))))))))))));
}
/* ============================== REGISTRO DE INVERSIONES ============================== */
function RegistroInversionesScreen({ inversiones, onBack }) {
    const now = new Date();
    const [selected, setSelected] = useState(null);
    const months = monthsWithData([inversiones]).filter(k => k !== `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`);
    return (React.createElement(FullScreen, { z: 60 },
        React.createElement(ScreenHeader, { title: "Registro de inversiones", onBack: () => (selected ? setSelected(null) : onBack()) }),
        React.createElement("div", { style: { maxWidth: 720, margin: '0 auto', padding: '16px 18px 60px' } }, !selected ? (months.length === 0 ? React.createElement("p", { style: { color: C.muted, fontSize: 13 } }, "Todav\u00EDa no hay meses cerrados.") : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 10 } }, months.map(key => {
            const [y, m] = key.split('-').map(Number);
            return (React.createElement("button", { key: key, onClick: () => setSelected({ year: y, month: m - 1 }), style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px 16px', cursor: 'pointer' } },
                React.createElement("div", null,
                    React.createElement("p", { className: "mf-display", style: { fontSize: 14.5, fontWeight: 600, textTransform: 'capitalize' } }, monthNameFor(y, m - 1)),
                    React.createElement("p", { style: { fontSize: 11.5, color: C.muted } },
                        "Total invertido: ",
                        React.createElement("b", { className: "mf-mono" }, money(sumMonth(inversiones, y, m - 1))))),
                React.createElement(ChevronRight, { size: 16, color: C.green })));
        })))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
            React.createElement("p", { className: "mf-display", style: { fontSize: 17, fontWeight: 700, textTransform: 'capitalize' } }, monthNameFor(selected.year, selected.month)),
            React.createElement(Card, null, Object.keys(inversiones).filter(iso => { const [y, m] = iso.split('-').map(Number); return y === selected.year && (m - 1) === selected.month && getVal(inversiones[iso]) > 0; }).sort().map(iso => (React.createElement("div", { key: iso, style: { display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: C.ink, padding: '6px 0', borderTop: `1px solid ${C.line}` } },
                React.createElement("span", null,
                    iso.split('-')[2],
                    getNota(inversiones[iso]) ? ` — ${getNota(inversiones[iso])}` : ''),
                React.createElement("span", { className: "mf-mono", style: { color: C.blue, fontWeight: 700 } }, money(getVal(inversiones[iso]))))))))))));
}
/* ============================== PANTALLA: INGRESOS ============================== */
function IngresosScreen({ ingresos, setIngresos, onBack }) {
    const now = new Date();
    const [showReportes, setShowReportes] = useState(false);
    const setMonto = (cat) => (iso, v) => setIngresos(prev => ({ ...prev, [cat]: { ...prev[cat], [iso]: cat === 'generales' ? { ...(typeof prev[cat][iso] === 'object' ? prev[cat][iso] : {}), monto: v } : v } }));
    const setNota = (cat) => (iso, v) => setIngresos(prev => ({ ...prev, [cat]: { ...prev[cat], [iso]: { ...(typeof prev[cat][iso] === 'object' ? prev[cat][iso] : { monto: getVal(prev[cat][iso]) }), nota: v } } }));
    return (React.createElement(FullScreen, { z: 55 },
        React.createElement(ScreenHeader, { title: "Ingresos", onBack: onBack, right: React.createElement("button", { onClick: () => setShowReportes(true), style: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(110,155,94,0.12)', border: `1px solid ${C.green}`, borderRadius: 999, padding: '6px 12px', cursor: 'pointer', color: C.green, flexShrink: 0 } },
                React.createElement(FolderIcon, { size: 13, strokeWidth: 2.3 }),
                React.createElement("span", { style: { fontSize: 11.5, fontWeight: 600 } }, "Reportes")) }),
        React.createElement("div", { style: { maxWidth: 720, margin: '0 auto', padding: '18px 18px 60px', display: 'flex', flexDirection: 'column', gap: 12 } },
            React.createElement(CategoryDayList, { label: "Ingresos Aquafeel", data: ingresos.aquafeel, needsNota: false, onSetMonto: setMonto('aquafeel'), onSetNota: setNota('aquafeel'), accent: C.green, year: now.getFullYear(), month: now.getMonth() }),
            React.createElement(CategoryDayList, { label: "Ingresos Cosm\u00E9tica", data: ingresos.cosmetica, needsNota: false, onSetMonto: setMonto('cosmetica'), onSetNota: setNota('cosmetica'), accent: C.green, year: now.getFullYear(), month: now.getMonth() }),
            React.createElement(CategoryDayList, { label: "Ingresos Generales", data: ingresos.generales, needsNota: true, onSetMonto: setMonto('generales'), onSetNota: setNota('generales'), accent: C.green, year: now.getFullYear(), month: now.getMonth() })),
        showReportes && React.createElement(ReportesIngresosScreen, { ingresos: ingresos, onBack: () => setShowReportes(false) })));
}
/* ============================== PANTALLA: GASTOS ============================== */
function GastosScreen({ gastosFijos, setGastosFijos, gastosVariados, setGastosVariados, onBack }) {
    const now = new Date();
    const [showRegistro, setShowRegistro] = useState(false);
    const [fijosOpen, setFijosOpen] = useState(false);
    const setFijoMonto = (cat, needsNota) => (iso, v) => setGastosFijos(prev => ({ ...prev, [cat]: { ...prev[cat], [iso]: needsNota ? { ...(typeof prev[cat][iso] === 'object' ? prev[cat][iso] : {}), monto: v } : v } }));
    const setFijoNota = (cat) => (iso, v) => setGastosFijos(prev => ({ ...prev, [cat]: { ...prev[cat], [iso]: { ...(typeof prev[cat][iso] === 'object' ? prev[cat][iso] : { monto: getVal(prev[cat][iso]) }), nota: v } } }));
    const setVariadoMonto = (iso, v) => setGastosVariados(prev => ({ ...prev, [iso]: { ...(typeof prev[iso] === 'object' ? prev[iso] : {}), monto: v } }));
    const setVariadoNota = (iso, v) => setGastosVariados(prev => ({ ...prev, [iso]: { ...(typeof prev[iso] === 'object' ? prev[iso] : { monto: getVal(prev[iso]) }), nota: v } }));
    return (React.createElement(FullScreen, { z: 55 },
        React.createElement(ScreenHeader, { title: "Gastos", onBack: onBack, right: React.createElement("button", { onClick: () => setShowRegistro(true), style: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(110,155,94,0.12)', border: `1px solid ${C.green}`, borderRadius: 999, padding: '6px 12px', cursor: 'pointer', color: C.green, flexShrink: 0 } },
                React.createElement(FolderIcon, { size: 13, strokeWidth: 2.3 }),
                React.createElement("span", { style: { fontSize: 11.5, fontWeight: 600 } }, "Registro")) }),
        React.createElement("div", { style: { maxWidth: 720, margin: '0 auto', padding: '18px 18px 60px', display: 'flex', flexDirection: 'column', gap: 12 } },
            React.createElement("div", { style: { border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden', background: C.panel } },
                React.createElement("button", { onClick: () => setFijosOpen(o => !o), style: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 15px', background: 'transparent', border: 'none', cursor: 'pointer' } },
                    React.createElement("span", { style: { fontSize: 14.5, fontWeight: 700, color: C.ink } }, "Gastos Fijos"),
                    React.createElement("span", { style: { transform: fijosOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', color: C.muted, display: 'flex' } },
                        React.createElement(ChevronDown, { size: 16 }))),
                fijosOpen && (React.createElement("div", { style: { padding: '0 12px 14px', display: 'flex', flexDirection: 'column', gap: 10 } },
                    React.createElement(CategoryDayList, { label: "Renta", data: gastosFijos.renta, needsNota: false, onSetMonto: setFijoMonto('renta', false), onSetNota: setFijoNota('renta'), accent: C.orange, year: now.getFullYear(), month: now.getMonth() }),
                    React.createElement(CategoryDayList, { label: "Comida", data: gastosFijos.comida, needsNota: true, onSetMonto: setFijoMonto('comida', true), onSetNota: setFijoNota('comida'), accent: C.orange, year: now.getFullYear(), month: now.getMonth() }),
                    React.createElement(CategoryDayList, { label: "Gasolina", data: gastosFijos.gasolina, needsNota: false, onSetMonto: setFijoMonto('gasolina', false), onSetNota: setFijoNota('gasolina'), accent: C.orange, year: now.getFullYear(), month: now.getMonth() }),
                    React.createElement(CategoryDayList, { label: "Membres\u00EDas", data: gastosFijos.membresias, needsNota: false, onSetMonto: setFijoMonto('membresias', false), onSetNota: setFijoNota('membresias'), accent: C.orange, year: now.getFullYear(), month: now.getMonth() })))),
            React.createElement(CategoryDayList, { label: "Gastos Variados", data: gastosVariados, needsNota: true, onSetMonto: setVariadoMonto, onSetNota: setVariadoNota, accent: C.orange, year: now.getFullYear(), month: now.getMonth() }),
            React.createElement(Card, null,
                React.createElement(WeekdaySpendChart, { gastosFijos: gastosFijos, gastosVariados: gastosVariados, year: now.getFullYear(), month: now.getMonth() }))),
        showRegistro && React.createElement(RegistroGastosScreen, { gastosFijos: gastosFijos, gastosVariados: gastosVariados, onBack: () => setShowRegistro(false) })));
}
/* ============================== PANTALLA: INVERTIDO ============================== */
function InvertidoScreen({ inversiones, setInversiones, onBack }) {
    const now = new Date();
    const [showRegistro, setShowRegistro] = useState(false);
    const setMonto = (iso, v) => setInversiones(prev => ({ ...prev, [iso]: { ...(typeof prev[iso] === 'object' ? prev[iso] : {}), monto: v } }));
    const setNota = (iso, v) => setInversiones(prev => ({ ...prev, [iso]: { ...(typeof prev[iso] === 'object' ? prev[iso] : { monto: getVal(prev[iso]) }), nota: v } }));
    return (React.createElement(FullScreen, { z: 55 },
        React.createElement(ScreenHeader, { title: "Invertido", onBack: onBack, right: React.createElement("button", { onClick: () => setShowRegistro(true), style: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(110,155,94,0.12)', border: `1px solid ${C.green}`, borderRadius: 999, padding: '6px 12px', cursor: 'pointer', color: C.green, flexShrink: 0 } },
                React.createElement(FolderIcon, { size: 13, strokeWidth: 2.3 }),
                React.createElement("span", { style: { fontSize: 11.5, fontWeight: 600 } }, "Registro")) }),
        React.createElement("div", { style: { maxWidth: 720, margin: '0 auto', padding: '18px 18px 60px' } },
            React.createElement(CategoryDayList, { label: "Inversiones", data: inversiones, needsNota: true, onSetMonto: setMonto, onSetNota: setNota, accent: C.blue, year: now.getFullYear(), month: now.getMonth() })),
        showRegistro && React.createElement(RegistroInversionesScreen, { inversiones: inversiones, onBack: () => setShowRegistro(false) })));
}
/* ============================== PANTALLA: MIS FINANZAS (panel principal) ============================== */
function FinanceStatCard({ label, value, sub, Icon, accent, onClick }) {
    return (React.createElement("button", { onClick: onClick, style: { textAlign: 'left', width: '100%', background: C.panel, border: `1px solid ${C.line}`, borderRadius: 20, padding: 18, cursor: 'pointer' } },
        React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } },
            React.createElement("div", null,
                React.createElement("p", { style: { fontSize: 10.5, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 } }, label),
                React.createElement("p", { className: "mf-mono", style: { fontSize: 'clamp(20px,3.4vw,26px)', fontWeight: 700, color: C.ink } }, value),
                sub && React.createElement("p", { style: { fontSize: 11, color: C.muted, marginTop: 4 } }, sub)),
            React.createElement("div", { style: { color: accent } },
                React.createElement(Icon, { size: 20 })))));
}
function MisFinanzasScreen({ data, saldoAjuste, setSaldoAjuste, appStartMonth, onDeleteEntry, onClearGroup, onBack, onOpen }) {
    const now = new Date();
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const { ingresos, gastosFijos, gastosVariados, inversiones } = data;
    const currentMonthKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    const canShowComparison = currentMonthKey > appStartMonth;
    const ingresosMes = sumMonth(ingresos.aquafeel, now.getFullYear(), now.getMonth()) + sumMonth(ingresos.cosmetica, now.getFullYear(), now.getMonth()) + sumMonth(ingresos.generales, now.getFullYear(), now.getMonth());
    const gastosMes = sumMonth(gastosFijos.renta, now.getFullYear(), now.getMonth()) + sumMonth(gastosFijos.comida, now.getFullYear(), now.getMonth()) + sumMonth(gastosFijos.gasolina, now.getFullYear(), now.getMonth()) + sumMonth(gastosFijos.membresias, now.getFullYear(), now.getMonth()) + sumMonth(gastosVariados, now.getFullYear(), now.getMonth());
    const invertidoMes = sumMonth(inversiones, now.getFullYear(), now.getMonth());
    const saldoMes = saldoAjuste + ingresosMes - gastosMes - invertidoMes;
    const ingresosPrev = sumMonth(ingresos.aquafeel, prevDate.getFullYear(), prevDate.getMonth()) + sumMonth(ingresos.cosmetica, prevDate.getFullYear(), prevDate.getMonth()) + sumMonth(ingresos.generales, prevDate.getFullYear(), prevDate.getMonth());
    const gastosPrev = sumMonth(gastosFijos.renta, prevDate.getFullYear(), prevDate.getMonth()) + sumMonth(gastosFijos.comida, prevDate.getFullYear(), prevDate.getMonth()) + sumMonth(gastosFijos.gasolina, prevDate.getFullYear(), prevDate.getMonth()) + sumMonth(gastosFijos.membresias, prevDate.getFullYear(), prevDate.getMonth()) + sumMonth(gastosVariados, prevDate.getFullYear(), prevDate.getMonth());
    const invertidoPrev = sumMonth(inversiones, prevDate.getFullYear(), prevDate.getMonth());
    const saldoPrev = saldoAjuste + ingresosPrev - gastosPrev - invertidoPrev;
    const pctChange = (canShowComparison && saldoPrev !== 0) ? Math.round(((saldoMes - saldoPrev) / Math.abs(saldoPrev)) * 100) : null;
    const [editingSaldo, setEditingSaldo] = useState(false);
    const [saldoInput, setSaldoInput] = useState('');
    const startEdit = () => { setSaldoInput(String(Math.round(saldoMes))); setEditingSaldo(true); };
    const confirmEdit = () => {
        const nuevo = Number(saldoInput) || 0;
        setSaldoAjuste(prev => prev + (nuevo - saldoMes)); // ajusta el offset para que el saldo mostrado sea exactamente lo que escribiste
        setEditingSaldo(false);
    };
    const [screen, setScreen] = useState(null);
    const [showTransacciones, setShowTransacciones] = useState(false);
    const allTx = useMemo(() => buildTransactions(data), [data]);
    return (React.createElement(FullScreen, null,
        React.createElement(ScreenHeader, { title: "Mis Finanzas", onBack: onBack }),
        React.createElement("div", { style: { maxWidth: 640, margin: '0 auto', padding: '18px 18px 80px' } },
            React.createElement("p", { style: { fontSize: 12, color: C.muted, marginBottom: 14, textTransform: 'capitalize' } }, monthNameFor(now.getFullYear(), now.getMonth())),
            React.createElement(Card, { style: { marginBottom: 16 } },
                React.createElement("p", { style: { fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 } }, "Saldo actual"),
                editingSaldo ? (React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
                    React.createElement("div", { style: { position: 'relative', flex: '1 1 160px' } },
                        React.createElement("span", { style: { position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 26, color: C.muted } }, "$"),
                        React.createElement("input", { autoFocus: true, type: "number", inputMode: "decimal", value: saldoInput, onChange: e => setSaldoInput(e.target.value), onKeyDown: e => e.key === 'Enter' && confirmEdit(), className: "mf-mono", style: { width: '100%', border: 'none', borderBottom: `2px solid ${C.green}`, padding: '2px 2px 2px 20px', fontSize: 'clamp(28px,6vw,40px)', fontWeight: 700, color: C.ink, outline: 'none', background: 'transparent' } })),
                    React.createElement(Btn, { onClick: confirmEdit }, "Guardar"),
                    React.createElement(Btn, { variant: "ghost", onClick: () => setEditingSaldo(false) }, "Cancelar"))) : (React.createElement("div", { style: { display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' } },
                    React.createElement("span", { className: "mf-mono", style: { fontSize: 'clamp(30px,6vw,42px)', fontWeight: 700, color: C.ink } }, money(saldoMes)),
                    pctChange !== null && (React.createElement("span", { style: { display: 'flex', alignItems: 'center', gap: 3, color: pctChange >= 0 ? C.green : C.red, fontWeight: 600, fontSize: 13 } },
                        pctChange >= 0 ? React.createElement(TrendUp, { size: 14 }) : React.createElement(TrendDown, { size: 14 }),
                        " ",
                        Math.abs(pctChange),
                        "% vs mes anterior")),
                    React.createElement("button", { onClick: startEdit, title: "Editar saldo", style: { width: 30, height: 30, borderRadius: '50%', border: `1px solid ${C.line}`, background: C.panelSoft, color: C.green, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
                        React.createElement(Pencil, { size: 13 }))))),
            React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 } },
                React.createElement(FinanceStatCard, { label: "Ingresos", value: money(ingresosMes), sub: "Este mes", Icon: TrendUp, accent: C.green, onClick: () => setScreen('ingresos') }),
                React.createElement(FinanceStatCard, { label: "Gastos", value: money(gastosMes), sub: ingresosMes ? `${Math.round((gastosMes / ingresosMes) * 100)}% de ingresos` : '', Icon: TrendDown, accent: C.orange, onClick: () => setScreen('gastos') }),
                React.createElement(FinanceStatCard, { label: "Invertido", value: money(invertidoMes), sub: ingresosMes ? `${Math.round((invertidoMes / ingresosMes) * 100)}% de ingresos` : '', Icon: DollarIcon, accent: C.blue, onClick: () => setScreen('invertido') })),
            React.createElement(Card, { style: { marginBottom: 16 } },
                React.createElement("p", { className: "mf-display", style: { fontSize: 15, fontWeight: 700, marginBottom: 14 } }, "Distribuci\u00F3n del mes"),
                React.createElement(DistribucionDonut, { ingresos: ingresosMes, gastos: gastosMes, inversiones: invertidoMes, onClearGroup: onClearGroup })),
            React.createElement(Card, null,
                React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 } },
                    React.createElement("p", { className: "mf-display", style: { fontSize: 15, fontWeight: 700 } }, "\u00DAltimas transacciones"),
                    React.createElement(Plus, { size: 18, color: C.green })),
                allTx.slice(0, 5).map(t => React.createElement(TransaccionRow, { key: t.id, t: t, onDelete: onDeleteEntry })),
                allTx.length === 0 && React.createElement("p", { style: { color: C.muted, fontSize: 13, padding: '10px 0' } }, "A\u00FAn no hay transacciones."),
                allTx.length > 0 && React.createElement(Btn, { onClick: () => setShowTransacciones(true), style: { width: '100%', justifyContent: 'center', marginTop: 12 } }, "Ver todas"))),
        screen === 'ingresos' && React.createElement(IngresosScreen, { ingresos: ingresos, setIngresos: onOpen.setIngresos, onBack: () => setScreen(null) }),
        screen === 'gastos' && React.createElement(GastosScreen, { gastosFijos: gastosFijos, setGastosFijos: onOpen.setGastosFijos, gastosVariados: gastosVariados, setGastosVariados: onOpen.setGastosVariados, onBack: () => setScreen(null) }),
        screen === 'invertido' && React.createElement(InvertidoScreen, { inversiones: inversiones, setInversiones: onOpen.setInversiones, onBack: () => setScreen(null) }),
        showTransacciones && React.createElement(TransaccionesScreen, { data: data, onDelete: onDeleteEntry, onBack: () => setShowTransacciones(false) })));
}
/* ============================== MENÚ FLOTANTE ============================== */
const FOLDER_ITEMS = [{ id: 'finanzas', label: 'Finanzas', Icon: PiggyImg }];
function ProductivityFab({ onOpenFinanzas }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState(() => ({ x: window.innerWidth - 52, y: window.innerHeight - 96 }));
    const dragging = useRef(false), dragged = useRef(false), start = useRef({ x: 0, y: 0, px: 0, py: 0 });
    const fabSize = 60;
    const clamp = (x, y) => ({ x: Math.min(Math.max(x, fabSize / 2 + 6), window.innerWidth - fabSize / 2 - 6), y: Math.min(Math.max(y, fabSize / 2 + 6), window.innerHeight - fabSize / 2 - 6) });
    const onDown = (e) => { dragging.current = true; dragged.current = false; const p = e.touches ? e.touches[0] : e; start.current = { x: p.clientX, y: p.clientY, px: pos.x, py: pos.y }; };
    const onMove = (e) => {
        if (!dragging.current)
            return;
        if (e.cancelable)
            e.preventDefault();
        const p = e.touches ? e.touches[0] : e;
        const dx = p.clientX - start.current.x, dy = p.clientY - start.current.y;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6)
            dragged.current = true;
        if (dragged.current)
            setPos(clamp(start.current.px + dx, start.current.py + dy));
    };
    const onUp = () => { if (dragging.current && !dragged.current)
        setOpen(o => !o); dragging.current = false; };
    useEffect(() => {
        const mv = (e) => onMove(e), up = () => onUp();
        window.addEventListener('mousemove', mv);
        window.addEventListener('mouseup', up);
        window.addEventListener('touchmove', mv, { passive: false });
        window.addEventListener('touchend', up);
        return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', mv); window.removeEventListener('touchend', up); };
    });
    const flipUp = pos.y > window.innerHeight / 2;
    const flipLeft = pos.x > window.innerWidth - 140;
    const radius = 78, n = FOLDER_ITEMS.length;
    const actions = { finanzas: onOpenFinanzas };
    return (React.createElement(React.Fragment, null,
        open && React.createElement("div", { onClick: () => setOpen(false), style: { position: 'fixed', inset: 0, zIndex: 39, background: 'rgba(58,42,34,0.14)' } }),
        React.createElement("div", { style: { position: 'fixed', left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)', zIndex: 40 } },
            FOLDER_ITEMS.map((item, i) => {
                const spread = n > 1 ? 34 : 0;
                const angleDeg = (flipUp ? 90 : -90) + (flipLeft ? 1 : -1) * (i - (n - 1) / 2) * spread;
                const rad = angleDeg * Math.PI / 180;
                const tx = open ? Math.cos(rad) * radius : 0, ty = open ? -Math.sin(rad) * radius : 0;
                const Ico = item.Icon;
                return (React.createElement("button", { key: item.id, onClick: () => { setOpen(false); actions[item.id] && actions[item.id](); }, style: {
                        position: 'absolute', width: 48, height: 48, left: 0, top: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        border: `1.5px solid ${C.line}`, background: C.panel, color: C.green, boxShadow: '0 8px 20px rgba(58,42,34,0.16)',
                        transform: `translate(${tx - 24}px, ${ty - 24}px) scale(${open ? 1 : 0.3})`, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
                        transition: `transform 360ms cubic-bezier(.34,1.56,.64,1) ${open ? i * 40 : 0}ms, opacity 240ms ease ${open ? i * 40 : 0}ms`,
                    } },
                    React.createElement(Ico, { size: 20, strokeWidth: 2 })));
            }),
            open && FOLDER_ITEMS.map((item, i) => {
                const spread = n > 1 ? 34 : 0;
                const angleDeg = (flipUp ? 90 : -90) + (flipLeft ? 1 : -1) * (i - (n - 1) / 2) * spread;
                const rad = angleDeg * Math.PI / 180;
                const tx = Math.cos(rad) * radius, ty = -Math.sin(rad) * radius;
                return React.createElement("span", { key: item.id + 'l', style: { position: 'absolute', left: tx, top: ty + (ty < 0 ? -32 : 26), transform: 'translateX(-50%)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: C.ink, whiteSpace: 'nowrap', pointerEvents: 'none', background: C.panel, padding: '2px 7px', borderRadius: 999, border: `1px solid ${C.line}` } }, item.label);
            }),
            React.createElement("button", { onMouseDown: open ? undefined : onDown, onTouchStart: open ? undefined : onDown, onClick: open ? () => setOpen(false) : undefined, title: "Men\u00FA", style: {
                    width: fabSize, height: fabSize, borderRadius: '50%', border: 'none', cursor: open ? 'pointer' : 'grab',
                    background: `linear-gradient(135deg, #A9CE97, ${C.green})`, boxShadow: '0 10px 24px rgba(110,155,94,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', userSelect: 'none', touchAction: 'none',
                    transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 280ms ease',
                } }, open ? React.createElement(X, { size: 22 }) : React.createElement(DollarIcon, { size: 24, strokeWidth: 2.2 })))));
}
/* ============================== APP ============================== */
function App() {
    const [ingresos, setIngresos] = usePersistentState('ingresos', { aquafeel: {}, cosmetica: {}, generales: {} });
    const [gastosFijos, setGastosFijos] = usePersistentState('gastosFijos', { renta: {}, comida: {}, gasolina: {}, membresias: {} });
    const [gastosVariados, setGastosVariados] = usePersistentState('gastosVariados', {});
    const [inversiones, setInversiones] = usePersistentState('inversiones', {});
    const [saldoAjuste, setSaldoAjuste] = usePersistentState('saldoAjuste', 0);
    const [appStartMonth] = usePersistentState('appStartMonth', `${new Date().getFullYear()}-${pad2(new Date().getMonth() + 1)}`);
    const [showFinanzas, setShowFinanzas] = useState(false);
    const data = { ingresos, gastosFijos, gastosVariados, inversiones };
    const removeDay = (setter, key, fecha) => setter(prev => { const next = { ...prev, [key]: { ...prev[key] } }; delete next[key][fecha]; return next; });
    const deleteEntry = (origen, fecha) => {
        if (origen === 'aquafeel' || origen === 'cosmetica' || origen === 'generales')
            removeDay(setIngresos, origen, fecha);
        else if (origen === 'renta' || origen === 'comida' || origen === 'gasolina' || origen === 'membresias')
            removeDay(setGastosFijos, origen, fecha);
        else if (origen === 'variados')
            setGastosVariados(prev => { const next = { ...prev }; delete next[fecha]; return next; });
        else if (origen === 'inversion')
            setInversiones(prev => { const next = { ...prev }; delete next[fecha]; return next; });
    };
    const clearGroup = (group) => {
        if (group === 'ingresos')
            setIngresos({ aquafeel: {}, cosmetica: {}, generales: {} });
        else if (group === 'gastos') {
            setGastosFijos({ renta: {}, comida: {}, gasolina: {}, membresias: {} });
            setGastosVariados({});
        }
        else if (group === 'inversiones')
            setInversiones({});
    };
    return (React.createElement("div", { style: { minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', background: C.bg, color: C.ink, fontFamily: 'Poppins, sans-serif', position: 'relative' } },
        React.createElement("style", null, `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
        html, body { overflow-x: hidden; max-width: 100vw; }
        .mf-display{ font-family:'Poppins', sans-serif; font-weight:800; color:${C.ink}; letter-spacing:-0.01em; }
        .mf-mono{ font-family:'JetBrains Mono', monospace; }
        input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }
        input[type=number]{ -moz-appearance:textfield; }
      `),
        React.createElement(InicioScreen, { ingresos: ingresos, gastosFijos: gastosFijos, gastosVariados: gastosVariados, inversiones: inversiones, saldoAjuste: saldoAjuste }),
        React.createElement(ProductivityFab, { onOpenFinanzas: () => setShowFinanzas(true) }),
        showFinanzas && (React.createElement(MisFinanzasScreen, { data: data, saldoAjuste: saldoAjuste, setSaldoAjuste: setSaldoAjuste, appStartMonth: appStartMonth, onDeleteEntry: deleteEntry, onClearGroup: clearGroup, onBack: () => setShowFinanzas(false), onOpen: { setIngresos, setGastosFijos, setGastosVariados, setInversiones } }))));
}
document.getElementById('root').dataset.appMounted = 'true';
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App, null));
