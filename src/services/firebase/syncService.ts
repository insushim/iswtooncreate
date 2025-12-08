import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { db as localDb } from '@/services/storage/db';
import type { WebtoonProject, Character, Episode } from '@/types';

// Firestore에 저장할 때 Date를 Timestamp로 변환
const toFirestoreData = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (data instanceof Date) return Timestamp.fromDate(data);
  if (data instanceof Map) return Object.fromEntries(data);
  if (Array.isArray(data)) return data.map(toFirestoreData);
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = toFirestoreData(data[key]);
    }
    return result;
  }
  return data;
};

// Firestore에서 가져올 때 Timestamp를 Date로 변환
const fromFirestoreData = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (data instanceof Timestamp) return data.toDate();
  if (Array.isArray(data)) return data.map(fromFirestoreData);
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = fromFirestoreData(data[key]);
    }
    return result;
  }
  return data;
};

export class SyncService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // 프로젝트 업로드 (로컬 → 클라우드)
  async uploadProject(project: WebtoonProject): Promise<void> {
    const firestore = getFirebaseDb();
    if (!firestore) throw new Error('Firebase not initialized');

    const batch = writeBatch(firestore);

    // 프로젝트 기본 정보 저장 (characters, episodes 제외)
    const projectRef = doc(firestore, 'users', this.userId, 'projects', project.id);
    const projectData = toFirestoreData({
      ...project,
      characters: [], // 별도 컬렉션에 저장
      episodes: [], // 별도 컬렉션에 저장
      syncedAt: serverTimestamp(),
    });
    batch.set(projectRef, projectData);

    await batch.commit();

    // 캐릭터 저장
    for (const character of project.characters) {
      const charRef = doc(firestore, 'users', this.userId, 'projects', project.id, 'characters', character.id);
      await setDoc(charRef, toFirestoreData(character));
    }

    // 에피소드 저장
    for (const episode of project.episodes) {
      const epRef = doc(firestore, 'users', this.userId, 'projects', project.id, 'episodes', episode.id);
      await setDoc(epRef, toFirestoreData(episode));
    }
  }

  // 프로젝트 다운로드 (클라우드 → 로컬)
  async downloadProject(projectId: string): Promise<WebtoonProject | null> {
    const firestore = getFirebaseDb();
    if (!firestore) throw new Error('Firebase not initialized');

    const projectRef = doc(firestore, 'users', this.userId, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) return null;

    const projectData = fromFirestoreData(projectSnap.data()) as WebtoonProject;

    // 캐릭터 로드
    const charsQuery = collection(firestore, 'users', this.userId, 'projects', projectId, 'characters');
    const charsSnap = await getDocs(charsQuery);
    projectData.characters = charsSnap.docs.map((doc) => fromFirestoreData(doc.data()) as Character);

    // 에피소드 로드
    const epsQuery = collection(firestore, 'users', this.userId, 'projects', projectId, 'episodes');
    const epsSnap = await getDocs(epsQuery);
    projectData.episodes = epsSnap.docs.map((doc) => fromFirestoreData(doc.data()) as Episode);

    return projectData;
  }

  // 모든 프로젝트 목록 가져오기 (클라우드)
  async getCloudProjects(): Promise<{ id: string; title: string; updatedAt: Date }[]> {
    const firestore = getFirebaseDb();
    if (!firestore) throw new Error('Firebase not initialized');

    const projectsRef = collection(firestore, 'users', this.userId, 'projects');
    const projectsSnap = await getDocs(projectsRef);

    return projectsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      };
    });
  }

  // 전체 동기화 (로컬 → 클라우드)
  async syncToCloud(): Promise<{ uploaded: number; errors: string[] }> {
    const projects = await localDb.projects.toArray();
    let uploaded = 0;
    const errors: string[] = [];

    for (const project of projects) {
      try {
        // 캐릭터와 에피소드 로드
        const characters = await localDb.characters.where('projectId').equals(project.id).toArray();
        const episodes = await localDb.episodes.where('projectId').equals(project.id).toArray();

        // 패널도 로드
        for (const episode of episodes) {
          const panels = await localDb.panels.where('episodeId').equals(episode.id).toArray();
          episode.panels = panels;
        }

        const fullProject = {
          ...project,
          characters,
          episodes,
        };

        await this.uploadProject(fullProject);
        uploaded++;
      } catch (error: any) {
        errors.push(`${project.title}: ${error.message}`);
      }
    }

    return { uploaded, errors };
  }

  // 전체 동기화 (클라우드 → 로컬)
  async syncFromCloud(): Promise<{ downloaded: number; errors: string[] }> {
    const cloudProjects = await this.getCloudProjects();
    let downloaded = 0;
    const errors: string[] = [];

    for (const cloudProject of cloudProjects) {
      try {
        const fullProject = await this.downloadProject(cloudProject.id);
        if (!fullProject) continue;

        // 로컬에 저장
        await localDb.projects.put({
          ...fullProject,
          characters: [],
          episodes: [],
        });

        // 캐릭터 저장
        for (const character of fullProject.characters) {
          await localDb.characters.put(character);
        }

        // 에피소드 저장
        for (const episode of fullProject.episodes) {
          const { panels, ...episodeData } = episode;
          await localDb.episodes.put(episodeData as Episode);

          // 패널 저장
          if (panels) {
            for (const panel of panels) {
              await localDb.panels.put(panel);
            }
          }
        }

        downloaded++;
      } catch (error: any) {
        errors.push(`${cloudProject.title}: ${error.message}`);
      }
    }

    return { downloaded, errors };
  }

  // 프로젝트 삭제 (클라우드)
  async deleteCloudProject(projectId: string): Promise<void> {
    const firestore = getFirebaseDb();
    if (!firestore) throw new Error('Firebase not initialized');

    // 서브컬렉션 삭제
    const charsRef = collection(firestore, 'users', this.userId, 'projects', projectId, 'characters');
    const charsSnap = await getDocs(charsRef);
    for (const doc of charsSnap.docs) {
      await deleteDoc(doc.ref);
    }

    const epsRef = collection(firestore, 'users', this.userId, 'projects', projectId, 'episodes');
    const epsSnap = await getDocs(epsRef);
    for (const doc of epsSnap.docs) {
      await deleteDoc(doc.ref);
    }

    // 프로젝트 삭제
    await deleteDoc(doc(firestore, 'users', this.userId, 'projects', projectId));
  }
}
