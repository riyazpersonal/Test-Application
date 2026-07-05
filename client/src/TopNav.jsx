import { useEffect, useRef, useState } from "react";
import { Globe, PaintBucket, MessageSquare, Lock, LogOut, Check } from "lucide-react";
import { THEMES, useTheme } from "./ThemeContext.jsx";
import { openSupportChat } from "./support.js";

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

export function PillButton({ icon, children, onClick, active, danger, chevron }) {
  return (
    <button
      type="button"
      className={`pill${active ? " pill-active" : ""}${danger ? " pill-danger" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
      {chevron && <span className="chevron">▾</span>}
    </button>
  );
}

function LanguageMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="menu-wrap" ref={ref}>
      <PillButton icon={<Globe size={15} />} onClick={() => setOpen((o) => !o)} chevron>
        English
      </PillButton>
      {open && (
        <div className="menu-panel">
          <div className="menu-item menu-item-active">
            <Check size={13} /> English
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { themeKey, setThemeKey } = useTheme();
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="menu-wrap" ref={ref}>
      <PillButton icon={<PaintBucket size={15} />} onClick={() => setOpen((o) => !o)} active={open} chevron>
        Theme
      </PillButton>
      {open && (
        <div className="menu-panel">
          {Object.entries(THEMES).map(([key, t]) => (
            <div
              key={key}
              className={`menu-item${key === themeKey ? " menu-item-active" : ""}`}
              onClick={() => {
                setThemeKey(key);
                setOpen(false);
              }}
            >
              <span className="dot" style={{ background: t.dot }} />
              {t.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopNav({ onChangeAccessCode, onLogout }) {
  function openSupportDesk() {
    openSupportChat(onChangeAccessCode);
  }

  return (
    <nav className="topnav">
      <LanguageMenu />
      <ThemeMenu />
      <PillButton icon={<MessageSquare size={15} />} onClick={openSupportDesk}>
        Support Desk
      </PillButton>
      <PillButton
        icon={<Lock size={15} />}
        onClick={() => onChangeAccessCode("Change Access Code isn't wired to an API yet.")}
      >
        Change Access Code
      </PillButton>
      <PillButton icon={<LogOut size={15} />} danger onClick={onLogout}>
        Logout Session
      </PillButton>
    </nav>
  );
}
