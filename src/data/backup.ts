import { loadAllPatterns, saveUserPatterns } from './storage';
import { getLikes, getSaves, getHistory } from './social';

interface Backup {
  patterns: Pattern[];
  likes: string[];
  saves: string[];
  history: string[];
  exportedAt: string;
}

import type { Pattern } from '../types';

export async function exportBackup(): Promise<void> {
  const backup: Backup = {
    patterns: await loadAllPatterns(),
    likes: await getLikes(),
    saves: await getSaves(),
    history: await getHistory(),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `silkweave-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const backup: Backup = JSON.parse(reader.result as string);
        if (!backup.patterns || !backup.likes || !backup.saves) {
          resolve(false);
          return;
        }
        // Restore all data
        await saveUserPatterns(backup.patterns);
        localStorage.setItem('silkweave-likes', JSON.stringify(backup.likes));
        localStorage.setItem('silkweave-saves', JSON.stringify(backup.saves));
        localStorage.setItem('silkweave-history', JSON.stringify(backup.history));
        resolve(true);
      } catch {
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}
