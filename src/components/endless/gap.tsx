export function EndlessGap({
  gapIdx,
  canClick,
  line,
  text,
  bg,
  label,
  width,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  gapIdx: number;
  canClick: boolean;
  line: string;
  text: string;
  bg: string;
  label: string;
  width: string;
  onClick: () => void;
  onDragOver: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (e: React.DragEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      data-gap-idx={gapIdx}
      onClick={onClick}
      disabled={!canClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`shrink-0 h-[212px] flex items-center justify-center relative transition-all duration-150 ${
        canClick ? "cursor-pointer group" : "cursor-default"
      } ${width} ${bg}`}
    >
      <div
        className={`absolute inset-y-4 left-1/2 -translate-x-1/2 border-l border-dashed transition-colors duration-150 ${line}`}
      />
      <span
        className={`relative text-2xs bg-bg px-0.5 leading-none ${text}`}
      >
        {label}
      </span>
    </button>
  );
}
