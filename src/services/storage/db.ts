import Dexie, { Table } from 'dexie';
import type { WebtoonProject, Character, Episode, Panel } from '@/types';

export class WebtoonForgeDB extends Dexie {
  projects!: Table<WebtoonProject>;
  characters!: Table<Character>;
  episodes!: Table<Episode>;
  panels!: Table<Panel>;

  constructor() {
    super('WebtoonForgeDB');

    this.version(1).stores({
      projects: 'id, title, status, genre, createdAt, updatedAt',
      characters: 'id, projectId, name, role, createdAt',
      episodes: 'id, projectId, episodeNumber, status, createdAt',
      panels: 'id, episodeId, panelNumber, status',
    });
  }
}

export const db = new WebtoonForgeDB();

// Database utilities
export const dbUtils = {
  // Clear all data
  async clearAll(): Promise<void> {
    await db.projects.clear();
    await db.characters.clear();
    await db.episodes.clear();
    await db.panels.clear();
  },

  // Export database as JSON
  async exportData(): Promise<string> {
    const projects = await db.projects.toArray();
    const characters = await db.characters.toArray();
    const episodes = await db.episodes.toArray();
    const panels = await db.panels.toArray();

    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: { projects, characters, episodes, panels },
    }, null, 2);
  },

  // Import database from JSON
  async importData(jsonString: string): Promise<void> {
    const { data } = JSON.parse(jsonString);

    await db.transaction('rw', [db.projects, db.characters, db.episodes, db.panels], async () => {
      if (data.projects) await db.projects.bulkPut(data.projects);
      if (data.characters) await db.characters.bulkPut(data.characters);
      if (data.episodes) await db.episodes.bulkPut(data.episodes);
      if (data.panels) await db.panels.bulkPut(data.panels);
    });
  },

  // Get database size estimation
  async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { usage: 0, quota: 0 };
  },
};
