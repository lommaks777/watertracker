import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
const STORAGE_KEY = "water_tracker_v1";

function pad(n) {
  return n < 10 ? `0${n}` : String(n);
}

function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${pad(m)}-${pad(day)}`;
}

function formatDateLabel(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${pad(d)}.${pad(m)}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { goalMl: 2000, history: {} };
    const parsed = JSON.parse(raw);
    if (typeof parsed.goalMl !== "number") parsed.goalMl = 2000;
    if (!parsed.history || typeof parsed.history !== "object") parsed.history = {};
    return parsed;
  } catch (e) {
    return { goalMl: 2000, history: {} };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ===== ГЛАВНЫЙ КОМПОНЕНТ =====
export default function WaterTrackerApp() {
  const [state, setState] = useState(loadState);
  const [customMl, setCustomMl] = useState(300);
  const [goalInput, setGoalInput] = useState(+(state.goalMl / 1000).toFixed(1));

  const todayKey = localDateKey();
  const today = state.history[todayKey] || { totalMl: 0, entries: [] };

  // Сохранение в localStorage при каждом изменении
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Инициализация записи за сегодня, если её нет
  useEffect(() => {
    setState((prev) => {
      if (prev.history[todayKey]) return prev;
      const history = { ...prev.history, [todayKey]: { totalMl: 0, entries: [] } };
      return { ...prev, history };
    });
    // чистка очень старых записей (> 400 дней)
    setState((prev) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 400);
      const keep = {};
      Object.entries(prev.history).forEach(([k, v]) => {
        const [y, m, d] = k.split("-").map(Number);
        const dt = new Date(y, m - 1, d);
        if (dt >= cutoff) keep[k] = v;
      });
      return { ...prev, history: keep };
    });
  }, []);

  const pct = Math.min(100, Math.round((today.totalMl / state.goalMl) * 100));
  const remaining = Math.max(0, state.goalMl - today.totalMl);

  function add(amountMl) {
    if (!amountMl || amountMl <= 0) return;
    setState((prev) => {
      const history = { ...prev.history };
      const day = history[todayKey] ? { ...history[todayKey] } : { totalMl: 0, entries: [] };
      day.totalMl += amountMl;
      day.entries = [...day.entries, { amountMl, ts: Date.now() }];
      history[todayKey] = day;
      return { ...prev, history };
    });
  }

  function undo() {
    setState((prev) => {
      const history = { ...prev.history };
      const day = history[todayKey];
      if (!day || !day.entries.length) return prev;
      const last = day.entries[day.entries.length - 1];
      const newEntries = day.entries.slice(0, -1);
      history[todayKey] = {
        totalMl: Math.max(0, day.totalMl - last.amountMl),
        entries: newEntries,
      };
      return { ...prev, history };
    });
  }

  function resetToday() {
    setState((prev) => ({ ...prev, history: { ...prev.history, [todayKey]: { totalMl: 0, entries: [] } } }));
  }

  function updateGoalLiters(liters) {
    const ml = Math.max(0, Math.round(liters * 1000));
    setState((prev) => ({ ...prev, goalMl: ml }));
  }

  // История для графика (последние 14 дней)
  const chartData = useMemo(() => {
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = localDateKey(d);
      const rec = state.history[k];
      out.push({
        key: k,
        label: formatDateLabel(k),
        total: rec ? Math.round(rec.totalMl / 100) / 10 : 0, // литры, округление до 0.1
      });
    }
    return out;
  }, [state.history]);

  // Красивый прогресс-кольцо через conic-gradient
  const ringStyle = {
    background: `conic-gradient(currentColor ${pct * 3.6}deg, rgba(0,0,0,0.08) 0)`,
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-sky-50 to-white text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            💧 Трекер воды
          </h1>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span className="text-sm text-slate-500">Цель:</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={goalInput}
                onChange={(e) => setGoalInput(Number(e.target.value))}
                onBlur={() => updateGoalLiters(goalInput)}
                className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <span className="text-sm text-slate-600">л/день</span>
            </div>

            <button
              onClick={resetToday}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-100"
              title="Сбросить сегодняшний прогресс"
            >
              Сбросить день
            </button>
          </div>
        </header>

        {/* Summary Card */}
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="relative h-24 w-24 shrink-0">
                <div
                  className="absolute inset-0 rounded-full text-sky-500"
                  style={ringStyle}
                />
                <div className="absolute inset-2 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold">{pct}%</div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">выполнено</div>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="text-sm text-slate-500">Сегодня выпито</div>
                <div className="mt-1 text-2xl font-bold">
                  {(today.totalMl / 1000).toFixed(2)} л <span className="text-slate-400 text-base">({today.totalMl} мл)</span>
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Осталось: <span className="font-semibold">{(remaining / 1000).toFixed(2)} л</span>
                </div>

                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick add */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[200, 250, 300, 330, 500, 700].map((v) => (
                <button
                  key={v}
                  onClick={() => add(v)}
                  className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
                >
                  +{v} мл
                </button>
              ))}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1">
                <input
                  type="number"
                  min="1"
                  value={customMl}
                  onChange={(e) => setCustomMl(Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <button
                  onClick={() => add(customMl)}
                  className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Добавить
                </button>
                <button
                  onClick={undo}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Отменить
                </button>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">История за 14 дней</h2>
              <div className="text-sm text-slate-500">Показано в литрах</div>
            </div>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" interval={1} />
                  <YAxis width={40} />
                  <Tooltip formatter={(v) => `${v} л`} labelFormatter={(l) => `День: ${l}`} />
                  <ReferenceLine y={Math.round(state.goalMl / 100) / 10} stroke="#94a3b8" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="total" dot={false} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Серая пунктирная линия — ваша ежедневная цель ({(state.goalMl / 1000).toFixed(1)} л)
            </div>
          </div>
        </section>

        {/* Today entries */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Записи за сегодня</h2>
          {today.entries.length === 0 ? (
            <p className="mt-2 text-slate-500 text-sm">Пока что записей нет. Добавьте первую воду сегодня 👆</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {today.entries
                .slice()
                .reverse()
                .map((e, idx) => {
                  const t = new Date(e.ts);
                  const time = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
                  return (
                    <li key={idx} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-700 text-sm font-semibold">💧</span>
                        <div>
                          <div className="text-sm font-medium">{e.amountMl} мл</div>
                          <div className="text-xs text-slate-500">{time}</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {(e.amountMl / 1000).toFixed(2)} л
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </section>

        {/* Export / Import */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Резервная копия</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={() => {
                const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `water-tracker-backup-${todayKey}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Экспорт JSON
            </button>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              Импорт JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const parsed = JSON.parse(String(reader.result));
                      if (!parsed || typeof parsed !== "object") throw new Error("Некорректный файл");
                      setState(parsed);
                    } catch (err) {
                      alert("Не удалось импортировать файл: " + (err?.message || err));
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-500">Данные хранятся локально в вашем браузере (localStorage).</p>
        </section>

        {/* Footer */}
        <footer className="mt-8 pb-4 text-center text-xs text-slate-400">
          Сделано с заботой о вас • Подсказка: добавляйте воду сразу после питья ✨
        </footer>
      </div>
    </div>
  );
}
