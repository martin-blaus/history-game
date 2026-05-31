export type Phase = "placing" | "correct" | "wrong" | "gameover" | "complete";
export type GapStyle = "idle" | "dragover" | "correct" | "wrong" | "good";

export const GAP_STYLES: Record<
  GapStyle,
  { line: string; text: string; bg: string; label: string }
> = {
  idle: {
    line: "border-border group-hover:border-ar-blue",
    text: "text-text-tertiary group-hover:text-ar-blue",
    bg: "",
    label: "+",
  },
  dragover: {
    line: "border-ar-blue",
    text: "text-ar-blue font-bold",
    bg: "bg-ar-blue/15",
    label: "↓",
  },
  correct: {
    line: "border-success",
    text: "text-success font-bold",
    bg: "bg-success/10",
    label: "✓",
  },
  wrong: {
    line: "border-danger",
    text: "text-danger font-bold",
    bg: "bg-danger/10",
    label: "✗",
  },
  good: {
    line: "border-ar-gold",
    text: "text-ar-gold font-bold",
    bg: "bg-ar-gold/10",
    label: "✓",
  },
};
