import { useState } from "react";
import { DECKS } from "../data/index";
import type { Deck, HistoryEvent } from "../data/types";
import { formatYear } from "./utils";

function generateDeckFile(deck: Deck): string {
  return JSON.stringify(deck, null, 2) + "\n";
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-bg border border-border text-text-primary text-sm focus:border-ar-blue";
const btnPrimary =
  "px-4 py-2 rounded-lg bg-ar-blue hover:bg-ar-blue-dark text-white text-sm font-medium cursor-pointer border-none transition-colors";
const btnSecondary =
  "px-4 py-2 rounded-lg border border-border bg-transparent text-text-secondary text-sm cursor-pointer hover:text-text-primary transition-colors";

const SAVE_BTN_CLS: Record<"idle" | "saved" | "error", string> = {
  idle: "bg-ar-blue hover:bg-ar-blue-dark",
  saved: "bg-success",
  error: "bg-danger",
};

function EventDraftFields({
  draft,
  onChange,
}: {
  draft: HistoryEvent;
  onChange: (d: HistoryEvent) => void;
}) {
  return (
    <>
      <input
        className={inputCls}
        placeholder="Nombre del evento"
        value={draft.event}
        onChange={e => onChange({ ...draft, event: e.target.value })}
      />
      <div className="flex gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-tertiary">Año (negativo = a.C.)</label>
          <input
            className={`${inputCls} w-36`}
            type="number"
            value={draft.year}
            onChange={e => onChange({ ...draft, year: Number(e.target.value) })}
          />
        </div>
      </div>
      <textarea
        className={`${inputCls} resize-y`}
        rows={3}
        placeholder="Descripción (opcional)"
        value={draft.context}
        onChange={e => onChange({ ...draft, context: e.target.value })}
      />
      <input
        className={inputCls}
        placeholder="URL de imagen (opcional)"
        value={draft.image ?? ""}
        onChange={e => onChange({ ...draft, image: e.target.value || undefined })}
      />
    </>
  );
}

function AddRowForm({
  onAdd,
  onCancel,
}: {
  onAdd: (ev: HistoryEvent) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<HistoryEvent>({
    event: "",
    year: 2024,
    context: "",
  });

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-ar-blue bg-bg-secondary">
      <EventDraftFields draft={draft} onChange={setDraft} />
      <div className="flex gap-2">
        <button
          className={btnPrimary}
          onClick={() => { if (draft.event.trim()) onAdd(draft); }}
        >
          Agregar
        </button>
        <button className={btnSecondary} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function EventRow({
  index,
  event,
  total,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  index: number;
  event: HistoryEvent;
  total: number;
  onSave: (updated: HistoryEvent) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<HistoryEvent>(event);

  if (editing) {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-xl border border-ar-blue bg-bg-secondary">
        <EventDraftFields draft={draft} onChange={setDraft} />
        <div className="flex gap-2">
          <button
            className={btnPrimary}
            onClick={() => { onSave(draft); setEditing(false); }}
          >
            Guardar
          </button>
          <button
            className={btnSecondary}
            onClick={() => { setDraft(event); setEditing(false); }}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-bg-card border border-border">
      <span className="text-xs text-text-tertiary w-8 shrink-0 text-center font-mono">
        {index + 1}
      </span>
      <span className="flex-1 text-sm text-text-primary leading-snug min-w-0">{event.event}</span>
      <span className="text-xs text-ar-blue font-semibold w-20 shrink-0 text-right whitespace-nowrap">
        {formatYear(event.year)}
      </span>
      <span
        className="text-xs text-text-tertiary w-48 shrink-0 truncate hidden md:block"
        title={event.context}
      >
        {event.context || <span className="italic opacity-50">—</span>}
      </span>
      <span className="text-xs text-text-tertiary w-6 shrink-0 text-center">
        {event.image ? "🖼" : "—"}
      </span>
      <div className="flex gap-0.5 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-text-tertiary hover:text-text-secondary disabled:opacity-20 disabled:cursor-default transition-colors bg-transparent border-none cursor-pointer text-xs px-1 py-0.5"
          title="Subir"
        >
          ▲
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="text-text-tertiary hover:text-text-secondary disabled:opacity-20 disabled:cursor-default transition-colors bg-transparent border-none cursor-pointer text-xs px-1 py-0.5"
          title="Bajar"
        >
          ▼
        </button>
        <button
          onClick={() => setEditing(true)}
          className="text-text-tertiary hover:text-ar-blue transition-colors bg-transparent border-none cursor-pointer text-sm px-1 py-0.5"
          title="Editar"
        >
          ✏️
        </button>
        <button
          onClick={() => {
            if (window.confirm(`¿Eliminar "${event.event}"?`)) onDelete();
          }}
          className="text-text-tertiary hover:text-danger transition-colors bg-transparent border-none cursor-pointer text-sm px-1 py-0.5"
          title="Eliminar"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function AdminDeckEditor({ deck, onBack }: { deck: Deck; onBack: () => void }) {
  const [events, setEvents] = useState<HistoryEvent[]>(() => [...deck.events]);
  const [puzzleSize, setPuzzleSize] = useState<number>(deck.puzzleSize ?? 6);
  const [showAddRow, setShowAddRow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  function updateEvent(idx: number, updated: HistoryEvent) {
    setEvents(prev => prev.map((e, i) => (i === idx ? updated : e)));
  }

  function deleteEvent(idx: number) {
    setEvents(prev => prev.filter((_, i) => i !== idx));
  }

  function moveEvent(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= events.length) return;
    setEvents(prev => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function addEvent(ev: HistoryEvent) {
    setEvents(prev => [...prev, ev]);
    setShowAddRow(false);
  }

  async function saveToFile() {
    setSaving(true);
    try {
      const content = generateDeckFile({ ...deck, events, puzzleSize });
      const res = await fetch("/api/save-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId: deck.id, content }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
    setSaving(false);
    setTimeout(() => setSaveStatus("idle"), 2500);
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[800px] mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={onBack}
            className="bg-transparent border-none cursor-pointer text-text-secondary text-sm p-0 hover:text-text-primary transition-colors shrink-0"
          >
            ← Mazos
          </button>
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">{deck.emoji}</span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-text-primary m-0 leading-tight truncate">
                {deck.name}
              </h2>
              <p className="text-xs text-text-tertiary m-0">{events.length} eventos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs text-text-tertiary whitespace-nowrap">Por partida:</label>
            <input
              type="number"
              min={2}
              max={events.length}
              value={puzzleSize}
              onChange={e => setPuzzleSize(Math.max(2, Number(e.target.value)))}
              className="w-14 px-2 py-1 rounded-lg bg-bg border border-border text-text-primary text-sm text-center focus:border-ar-blue"
            />
          </div>
          <button
            onClick={saveToFile}
            disabled={saving}
            className={`shrink-0 px-4 py-2 rounded-xl border-none text-sm font-semibold cursor-pointer transition-colors text-white ${SAVE_BTN_CLS[saveStatus]} ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {saving ? "Guardando…" : saveStatus === "saved" ? "¡Guardado!" : saveStatus === "error" ? "Error" : "Guardar en archivo"}
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 mb-1.5">
          <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider w-8 shrink-0 text-center">#</span>
          <span className="flex-1 text-xs font-bold text-text-tertiary uppercase tracking-wider">Evento</span>
          <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider w-20 shrink-0 text-right">Año</span>
          <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider w-48 shrink-0 hidden md:block">Descripción</span>
          <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider w-6 shrink-0 text-center">Img</span>
          <span className="w-24 shrink-0" />
        </div>

        <div className="flex flex-col gap-1.5 mb-3">
          {events.map((ev, i) => (
            <EventRow
              key={ev.event}
              index={i}
              event={ev}
              total={events.length}
              onSave={updated => updateEvent(i, updated)}
              onDelete={() => deleteEvent(i)}
              onMoveUp={() => moveEvent(i, -1)}
              onMoveDown={() => moveEvent(i, 1)}
            />
          ))}
        </div>

        {showAddRow ? (
          <AddRowForm
            onAdd={addEvent}
            onCancel={() => setShowAddRow(false)}
          />
        ) : (
          <button
            onClick={() => setShowAddRow(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-border text-text-tertiary text-sm hover:text-text-secondary hover:border-text-secondary transition-colors cursor-pointer bg-transparent"
          >
            + Agregar evento
          </button>
        )}
      </div>
    </div>
  );
}

function AdminDeckList({ onSelect, onBack }: { onSelect: (deck: Deck) => void; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[600px] mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="bg-transparent border-none cursor-pointer text-text-secondary text-sm font-medium p-0 hover:text-text-primary transition-colors"
          >
            ← Inicio
          </button>
          <h2 className="flex-1 text-center text-base font-bold text-text-primary m-0">Admin</h2>
          <span className="w-14" />
        </div>

        <p className="text-sm text-text-tertiary mb-5">
          Seleccioná un mazo para ver y editar sus eventos.
        </p>

        <div className="flex flex-col gap-3">
          {DECKS.map(deck => (
            <button
              key={deck.id}
              onClick={() => onSelect(deck)}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-border bg-bg-card hover:border-ar-blue transition-all cursor-pointer text-left"
            >
              <span className="text-3xl">{deck.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-text-primary">{deck.name}</div>
                <div className="text-xs text-text-tertiary mt-0.5">
                  {deck.events.length} eventos · {deck.puzzleSize ?? 6} por partida
                </div>
              </div>
              <span className="text-text-tertiary text-lg">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminScreen({ onBack }: { onBack: () => void }) {
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  if (selectedDeck) {
    return <AdminDeckEditor deck={selectedDeck} onBack={() => setSelectedDeck(null)} />;
  }

  return <AdminDeckList onSelect={setSelectedDeck} onBack={onBack} />;
}
