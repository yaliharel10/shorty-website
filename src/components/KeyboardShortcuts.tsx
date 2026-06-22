"use client";

import { useEffect } from "react";
import { Modal } from "@/components/Modal";

type KeyboardShortcutsProps = {
  open: boolean;
  onClose: () => void;
};

const SHORTCUTS = [
  { keys: ["F"], description: "Focus search" },
  { keys: ["Esc"], description: "Close player or dialog" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
];

export function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="sm">
      <ul className="space-y-3">
        {SHORTCUTS.map(({ keys, description }) => (
          <li key={description} className="flex items-center justify-between gap-4">
            <span className="text-sm text-[#bbb]">{description}</span>
            <div className="flex gap-1">
              {keys.map((key) => (
                <kbd
                  key={key}
                  className="rounded border border-[#333] bg-[#1a1a1a] px-2 py-1 font-mono text-xs text-[#ccc]"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export function useKeyboardShortcuts(onOpen: () => void) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "?" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onOpen]);
}
