import { useState } from 'react';
import { IconButton } from './IconButton';

const DESKTOP_SHORTCUTS = [
  'Space + drag — pan',
  'Right-drag — pan',
  'Scroll — zoom',
  'Enter — finish shape',
  'Annotation — arrow target, then label',
  'Del — delete selection',
  'Trees: B-01… · Bushes: S-01…',
  'Ctrl+Z / Ctrl+Shift+Z — undo / redo',
];

const TOUCH_SHORTCUTS = [
  'Pan tool or two-finger pinch — move & zoom',
  'Done — finish polygon or path',
  'Settings — project name & layers',
  'Props — edit selection',
  'Menu — save, export, upload',
];

export function CanvasShortcuts() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`canvas-shortcuts ${open ? 'canvas-shortcuts-open' : ''}`}>
      <IconButton
        icon="help"
        label={open ? 'Hide shortcuts' : 'Show shortcuts'}
        className="canvas-shortcuts-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      />
      {open && (
        <div className="canvas-shortcuts-card" role="region" aria-label="Keyboard shortcuts">
          <strong className="canvas-shortcuts-title">Shortcuts</strong>
          <ul className="shortcuts-list shortcuts-desktop">
            {DESKTOP_SHORTCUTS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <ul className="shortcuts-list shortcuts-touch">
            {TOUCH_SHORTCUTS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
