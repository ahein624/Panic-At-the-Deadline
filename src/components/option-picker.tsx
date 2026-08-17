"use client";

import { CSSProperties, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type OptionValue = string | number;

type OptionPickerProps<T extends OptionValue> = {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  showLabel?: boolean;
};

export function OptionPicker<T extends OptionValue>({ label, value, options, onChange, showLabel = true }: OptionPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  function openMenu() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    let rect = trigger.getBoundingClientRect();
    const desiredHeight = Math.min(options.length * 42 + 10, 210);
    const availableBelow = window.innerHeight - rect.bottom - 14;
    const editor = trigger.closest<HTMLElement>(".task-editor");
    if (editor && availableBelow < desiredHeight && editor.scrollHeight > editor.clientHeight) {
      editor.scrollTop += desiredHeight - availableBelow;
      rect = trigger.getBoundingClientRect();
    }
    setMenuStyle({
      left: rect.left,
      top: rect.bottom + 6,
      width: rect.width,
      maxHeight: Math.max(40, window.innerHeight - rect.bottom - 14),
    });
    setOpen(true);
  }

  function toggleMenu() {
    if (open) setOpen(false);
    else openMenu();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu();
    }
  }

  useEffect(() => {
    if (!open) return;

    function closeFromOutside(event: PointerEvent) {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    }
    function closeFromEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function closeAfterLayoutChange() {
      setOpen(false);
    }

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    window.addEventListener("resize", closeAfterLayoutChange);
    window.addEventListener("scroll", closeAfterLayoutChange, true);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
      window.removeEventListener("resize", closeAfterLayoutChange);
      window.removeEventListener("scroll", closeAfterLayoutChange, true);
    };
  }, [open]);

  return <div className={open ? "option-picker open" : "option-picker"} ref={wrapperRef}>
    {showLabel && <span className="option-picker-label" id={labelId}>{label}</span>}
    <button
      type="button"
      className="option-picker-trigger"
      ref={triggerRef}
      aria-label={showLabel ? undefined : label}
      aria-labelledby={showLabel ? labelId : undefined}
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={toggleMenu}
      onKeyDown={handleTriggerKeyDown}
    >
      <span>{selected.label}</span><span className="option-picker-chevron" aria-hidden="true">⌄</span>
    </button>
    {open && createPortal(
      <div className="option-picker-menu" ref={menuRef} role="listbox" aria-label={label} style={menuStyle}>
        {options.map((option) => <button
          type="button"
          role="option"
          aria-selected={option.value === value}
          className={option.value === value ? "selected" : undefined}
          key={option.value}
          onClick={() => { onChange(option.value); setOpen(false); triggerRef.current?.focus(); }}
        ><span>{option.label}</span><span aria-hidden="true">{option.value === value ? "✓" : ""}</span></button>)}
      </div>,
      document.body,
    )}
  </div>;
}
