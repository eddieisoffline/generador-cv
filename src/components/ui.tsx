/** Small building blocks shared by the screens: dialogs, menus and fields. */

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";

// ── Dialog ───────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

/** A native <dialog>: focus trapping, Escape and the backdrop come for free. */
export function Modal({ open, title, onClose, closeLabel, children, footer, wide = false }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`cv-dialog${wide ? " cv-dialog--wide" : ""}`}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {open && (
        <>
          <div className="cv-dialog__head">
            <h2 id={titleId} className="cv-display cv-display--sm">{title}</h2>
            <button type="button" className="cv-btn cv-btn--ghost cv-btn--icon cv-btn--sm" aria-label={closeLabel} onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>
          <div className="cv-dialog__body">{children}</div>
          {footer && <div className="cv-dialog__foot">{footer}</div>}
        </>
      )}
    </dialog>
  );
}

// ── Menu ─────────────────────────────────────────────────────────────────────

export interface MenuItem {
  label: string;
  icon: IconName;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface MenuProps {
  label: string;
  items: MenuItem[];
  trigger: (props: { "aria-expanded": boolean; "aria-haspopup": "menu"; onClick: () => void }) => ReactNode;
  align?: "left" | "right";
}

export function Menu({ label, items, trigger, align = "right" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    list.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const close = () => {
    setOpen(false);
    root.current?.querySelector<HTMLButtonElement>("button")?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const buttons = [...(list.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  };

  return (
    <div className="cv-menu" ref={root} onKeyDown={onKeyDown}>
      {trigger({ "aria-expanded": open, "aria-haspopup": "menu", onClick: () => setOpen((value) => !value) })}
      {open && (
        <div ref={list} className={`cv-menu__list${align === "left" ? " cv-menu__list--left" : ""}`} role="menu" aria-label={label}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`cv-menu__item${item.danger ? " cv-menu__item--danger" : ""}`}
              disabled={item.disabled}
              onClick={() => {
                close();
                item.onSelect();
              }}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Controls ─────────────────────────────────────────────────────────────────

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="cv-toggle">
      <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: IconName }[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="cv-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={option.value === value} onClick={() => onChange(option.value)}>
          {option.icon && <Icon name={option.icon} />}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Callout({ tone, icon, title, children }: { tone: "info" | "success" | "danger"; icon: IconName; title?: string; children: ReactNode }) {
  return (
    <div className={`cv-callout cv-callout--${tone}`} role={tone === "danger" ? "alert" : undefined}>
      <Icon name={icon} />
      <div>
        {title && <p className="cv-callout__title">{title}</p>}
        <p className="cv-callout__text">{children}</p>
      </div>
    </div>
  );
}

// ── Fields ───────────────────────────────────────────────────────────────────

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
  autoComplete?: string;
  hint?: string;
}

export function TextField({ label, value, onChange, placeholder, type = "text", autoComplete = "off", hint }: TextFieldProps) {
  const id = useId();
  return (
    <div className="cv-field">
      <label className="cv-field__label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="cv-input"
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        spellCheck={type === "text"}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <p className="cv-field__hint">{hint}</p>}
    </div>
  );
}

export function AreaField({ label, value, onChange, placeholder, rows = 3 }: Omit<TextFieldProps, "type" | "autoComplete"> & { rows?: number }) {
  const id = useId();
  return (
    <div className="cv-field">
      <label className="cv-field__label" htmlFor={id}>{label}</label>
      <textarea id={id} className="cv-input" rows={rows} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

const parseLines = (text: string) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const sameLines = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * One item per line. The draft keeps blank lines while typing (so Enter makes
 * a new line); the profile only receives the non-empty ones.
 */
export function LinesField({ label, value, onChange, placeholder }: Omit<TextFieldProps, "onChange" | "value" | "type" | "autoComplete"> & {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(() => value.join("\n"));
  if (!sameLines(parseLines(draft), value)) {
    // The list changed from outside (an import, a moved entry): show it.
    setDraft(value.join("\n"));
  }
  return (
    <div className="cv-field">
      <label className="cv-field__label" htmlFor={id}>{label}</label>
      <textarea
        id={id}
        className="cv-input"
        rows={Math.max(3, Math.min(8, value.length + 1))}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => {
          setDraft(event.target.value);
          const lines = parseLines(event.target.value);
          if (!sameLines(lines, value)) onChange(lines);
        }}
      />
    </div>
  );
}
