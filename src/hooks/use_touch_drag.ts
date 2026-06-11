import { useRef, useState } from "react";

export interface UseTouchDragOptions<S, T> {
  /** Map a touch point to a candidate drop target (game-specific geometry). */
  resolveTarget: (clientX: number, clientY: number) => T | null;
  /** Veto targets, e.g. a hint-pinned card. Applied to both touch and HTML5 paths. */
  canTarget?: (target: T) => boolean;
  /** Commit a drop. */
  onDrop: (source: S, target: T) => void;
  /**
   * When a touch move resolves to no target, keep the previous one instead of
   * clearing it (the sort game keeps the insertion point while the finger is
   * between cards; the endless game clears the gap highlight).
   */
  retainTargetOnMiss?: boolean;
}

export interface TouchDrag<S, T> {
  dragSource: S | null;
  dragTarget: T | null;
  isDragging: boolean;
  /** Shared with HTML5 drag handlers. */
  startDrag: (source: S, initialTarget?: T) => void;
  updateTarget: (target: T | null) => void;
  endDrag: () => void;
  drop: () => void;
  /** Touch handlers. */
  onTouchStart: (e: React.TouchEvent, source: S, initialTarget?: T) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

/**
 * Owns the drag state machine shared by the sort and endless games: source +
 * target state with a ref mirror so `touchend` (and HTML5 `drop`) read the
 * latest target instead of a stale closure. Geometry stays in the caller via
 * `resolveTarget`.
 */
export function useTouchDrag<S, T>({
  resolveTarget,
  canTarget,
  onDrop,
  retainTargetOnMiss = false,
}: UseTouchDragOptions<S, T>): TouchDrag<S, T> {
  type DragState = { source: S; target: T | null } | null;
  const [drag, setDrag] = useState<DragState>(null);
  const dragRef = useRef<DragState>(drag);

  function set(next: DragState) {
    dragRef.current = next;
    setDrag(next);
  }

  function startDrag(source: S, initialTarget?: T) {
    set({ source, target: initialTarget ?? null });
  }

  function updateTarget(target: T | null) {
    const cur = dragRef.current;
    if (!cur) return;
    if (target !== null && canTarget && !canTarget(target)) return;
    if (target === null && retainTargetOnMiss) return;
    if (target === cur.target) return;
    set({ ...cur, target });
  }

  function endDrag() {
    set(null);
  }

  function drop() {
    const cur = dragRef.current;
    set(null);
    if (cur && cur.target !== null) onDrop(cur.source, cur.target);
  }

  function onTouchStart(e: React.TouchEvent, source: S, initialTarget?: T) {
    void e;
    startDrag(source, initialTarget);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragRef.current) return;
    const touch = e.touches[0];
    updateTarget(resolveTarget(touch.clientX, touch.clientY));
  }

  function onTouchEnd() {
    drop();
  }

  return {
    dragSource: drag?.source ?? null,
    dragTarget: drag?.target ?? null,
    isDragging: drag !== null,
    startDrag,
    updateTarget,
    endDrag,
    drop,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
