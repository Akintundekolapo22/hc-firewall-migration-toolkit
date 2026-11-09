// Local-only storage. Nothing is ever sent over the network.
import { migrate, newState } from './logic.js';

const KEY = 'hc-firewall-migration-planner:v1';

export function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return newState();
    return migrate(JSON.parse(raw));
  } catch {
    return newState();
  }
}

export function saveLocal(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false; // private window or storage blocked: the app still works for this session
  }
}

export function clearLocal() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function downloadText(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try { resolve(migrate(JSON.parse(String(r.result)))); }
      catch (e) { reject(e instanceof SyntaxError ? new Error('This file could not be read. Is it a planner save file?') : e); }
    };
    r.onerror = () => reject(new Error('The file could not be opened.'));
    r.readAsText(file);
  });
}
