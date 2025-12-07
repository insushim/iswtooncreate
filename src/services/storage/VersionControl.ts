import localforage from 'localforage';

interface VersionSnapshot {
  id: string;
  projectId: string;
  version: number;
  description: string;
  data: any;
  createdAt: Date;
}

export class VersionControl {
  private store: LocalForage;
  private maxVersionsPerProject: number = 20;

  constructor() {
    this.store = localforage.createInstance({
      name: 'webtoon-forge-versions',
      storeName: 'version_snapshots',
    });
  }

  async createSnapshot(
    projectId: string,
    data: any,
    description: string = ''
  ): Promise<VersionSnapshot> {
    // Get existing versions for this project
    const versions = await this.getProjectVersions(projectId);
    const latestVersion = versions.length > 0 ? Math.max(...versions.map((v) => v.version)) : 0;

    const snapshot: VersionSnapshot = {
      id: `${projectId}_v${latestVersion + 1}`,
      projectId,
      version: latestVersion + 1,
      description,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      createdAt: new Date(),
    };

    await this.store.setItem(snapshot.id, snapshot);

    // Clean up old versions if needed
    await this.cleanupOldVersions(projectId);

    return snapshot;
  }

  async getSnapshot(snapshotId: string): Promise<VersionSnapshot | null> {
    return await this.store.getItem<VersionSnapshot>(snapshotId);
  }

  async getProjectVersions(projectId: string): Promise<VersionSnapshot[]> {
    const versions: VersionSnapshot[] = [];

    await this.store.iterate<VersionSnapshot, void>((value) => {
      if (value.projectId === projectId) {
        versions.push(value);
      }
    });

    return versions.sort((a, b) => b.version - a.version);
  }

  async getLatestVersion(projectId: string): Promise<VersionSnapshot | null> {
    const versions = await this.getProjectVersions(projectId);
    return versions.length > 0 ? versions[0] : null;
  }

  async restoreVersion(snapshotId: string): Promise<any | null> {
    const snapshot = await this.getSnapshot(snapshotId);
    if (snapshot) {
      return snapshot.data;
    }
    return null;
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    await this.store.removeItem(snapshotId);
  }

  async deleteProjectVersions(projectId: string): Promise<void> {
    const versions = await this.getProjectVersions(projectId);
    for (const version of versions) {
      await this.store.removeItem(version.id);
    }
  }

  async compareVersions(
    snapshotId1: string,
    snapshotId2: string
  ): Promise<{
    added: string[];
    removed: string[];
    modified: string[];
  }> {
    const snapshot1 = await this.getSnapshot(snapshotId1);
    const snapshot2 = await this.getSnapshot(snapshotId2);

    if (!snapshot1 || !snapshot2) {
      return { added: [], removed: [], modified: [] };
    }

    const keys1 = new Set(Object.keys(this.flattenObject(snapshot1.data)));
    const keys2 = new Set(Object.keys(this.flattenObject(snapshot2.data)));

    const added = [...keys2].filter((k) => !keys1.has(k));
    const removed = [...keys1].filter((k) => !keys2.has(k));
    const modified = [...keys1].filter((k) => {
      if (!keys2.has(k)) return false;
      const flat1 = this.flattenObject(snapshot1.data);
      const flat2 = this.flattenObject(snapshot2.data);
      return flat1[k] !== flat2[k];
    });

    return { added, removed, modified };
  }

  private async cleanupOldVersions(projectId: string): Promise<void> {
    const versions = await this.getProjectVersions(projectId);

    if (versions.length > this.maxVersionsPerProject) {
      const toDelete = versions.slice(this.maxVersionsPerProject);
      for (const version of toDelete) {
        await this.store.removeItem(version.id);
      }
    }
  }

  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key in obj) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, this.flattenObject(obj[key], newKey));
      } else {
        result[newKey] = JSON.stringify(obj[key]);
      }
    }

    return result;
  }
}

export const versionControl = new VersionControl();
