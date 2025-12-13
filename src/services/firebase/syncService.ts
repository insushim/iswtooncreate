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
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { getFirebaseDb, getFirebaseStorage } from './config';
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

  // 이미지를 Firebase Storage에 업로드하고 URL 반환
  private async uploadImage(projectId: string, imageId: string, base64Data: string): Promise<string | null> {
    try {
      const storage = getFirebaseStorage();
      if (!storage) return null;

      const imageRef = ref(storage, `users/${this.userId}/projects/${projectId}/images/${imageId}.png`);

      // base64 데이터에서 data:image/png;base64, 부분 제거
      const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

      await uploadString(imageRef, base64Content, 'base64', {
        contentType: 'image/png',
      });

      const downloadUrl = await getDownloadURL(imageRef);
      return downloadUrl;
    } catch (error) {
      console.error('[SyncService] Image upload failed:', error);
      return null;
    }
  }

  // Firebase Storage에서 이미지 다운로드
  private async downloadImage(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('[SyncService] Image download failed:', error);
      return null;
    }
  }

  // 이미지 데이터를 URL로 변환 (업로드 후 URL 저장)
  private async processImagesForUpload(obj: any, projectId: string): Promise<any> {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      const results = [];
      for (const item of obj) {
        results.push(await this.processImagesForUpload(item, projectId));
      }
      return results;
    }

    const result: any = {};
    for (const key in obj) {
      if (key === 'generatedImage' && obj[key]?.imageData) {
        // 이미지를 Storage에 업로드하고 URL로 대체
        const imageId = obj[key].id || `img-${Date.now()}`;
        const imageUrl = await this.uploadImage(projectId, imageId, obj[key].imageData);

        result[key] = {
          id: obj[key].id,
          resolution: obj[key].resolution,
          generatedAt: obj[key].generatedAt,
          fromCache: obj[key].fromCache,
          cost: obj[key].cost,
          imageUrl: imageUrl, // URL로 저장
        };
      } else if (key === 'imageData' && typeof obj[key] === 'string' && obj[key].startsWith('data:')) {
        // 캐릭터 이미지 등 직접 imageData 필드
        const parentId = obj.id || `img-${Date.now()}`;
        const imageUrl = await this.uploadImage(projectId, parentId, obj[key]);
        result['imageUrl'] = imageUrl;
        // imageData는 제외
      } else {
        result[key] = await this.processImagesForUpload(obj[key], projectId);
      }
    }
    return result;
  }

  // 이미지 URL을 다시 base64로 변환 (다운로드 시)
  private async processImagesForDownload(obj: any): Promise<any> {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      const results = [];
      for (const item of obj) {
        results.push(await this.processImagesForDownload(item));
      }
      return results;
    }

    const result: any = { ...obj };

    // generatedImage의 imageUrl을 imageData로 변환
    if (result.generatedImage?.imageUrl) {
      const imageData = await this.downloadImage(result.generatedImage.imageUrl);
      if (imageData) {
        result.generatedImage = {
          ...result.generatedImage,
          imageData: imageData,
        };
        delete result.generatedImage.imageUrl;
      }
    }

    // 캐릭터 등의 imageUrl을 imageData로 변환
    if (result.imageUrl && !result.imageData) {
      const imageData = await this.downloadImage(result.imageUrl);
      if (imageData) {
        result.imageData = imageData;
      }
      delete result.imageUrl;
    }

    // 중첩 객체 처리
    for (const key in result) {
      if (typeof result[key] === 'object' && result[key] !== null && key !== 'generatedImage') {
        result[key] = await this.processImagesForDownload(result[key]);
      }
    }

    return result;
  }

  // 프로젝트 업로드 (로컬 → 클라우드)
  async uploadProject(project: WebtoonProject): Promise<void> {
    const firestore = getFirebaseDb();
    if (!firestore) throw new Error('Firebase not initialized');

    console.log('[SyncService] Uploading project with images:', project.title);

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

    // 캐릭터 저장 (이미지를 Storage에 업로드)
    for (const character of project.characters) {
      const charRef = doc(firestore, 'users', this.userId, 'projects', project.id, 'characters', character.id);
      const charData = await this.processImagesForUpload(character, project.id);
      await setDoc(charRef, toFirestoreData(charData));
    }

    // 에피소드 저장 (패널 이미지를 Storage에 업로드)
    for (const episode of project.episodes) {
      const epRef = doc(firestore, 'users', this.userId, 'projects', project.id, 'episodes', episode.id);
      const epData = await this.processImagesForUpload(episode, project.id);
      await setDoc(epRef, toFirestoreData(epData));
      console.log('[SyncService] Uploaded episode:', episode.episodeNumber, 'panels:', episode.panels?.length);
    }

    console.log('[SyncService] Upload complete:', project.title);
  }

  // 프로젝트 다운로드 (클라우드 → 로컬)
  async downloadProject(projectId: string): Promise<WebtoonProject | null> {
    const firestore = getFirebaseDb();
    if (!firestore) throw new Error('Firebase not initialized');

    console.log('[SyncService] Downloading project:', projectId);

    const projectRef = doc(firestore, 'users', this.userId, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) return null;

    const projectData = fromFirestoreData(projectSnap.data()) as WebtoonProject;

    // 캐릭터 로드 (이미지 다운로드)
    const charsQuery = collection(firestore, 'users', this.userId, 'projects', projectId, 'characters');
    const charsSnap = await getDocs(charsQuery);
    const characters = [];
    for (const docSnap of charsSnap.docs) {
      const charData = fromFirestoreData(docSnap.data());
      const charWithImages = await this.processImagesForDownload(charData);
      characters.push(charWithImages as Character);
    }
    projectData.characters = characters;

    // 에피소드 로드 (패널 이미지 다운로드)
    const epsQuery = collection(firestore, 'users', this.userId, 'projects', projectId, 'episodes');
    const epsSnap = await getDocs(epsQuery);
    const episodes = [];
    for (const docSnap of epsSnap.docs) {
      const epData = fromFirestoreData(docSnap.data());
      const epWithImages = await this.processImagesForDownload(epData);
      episodes.push(epWithImages as Episode);
      console.log('[SyncService] Downloaded episode:', epWithImages.episodeNumber, 'panels:', epWithImages.panels?.length);
    }
    projectData.episodes = episodes;

    console.log('[SyncService] Download complete:', projectData.title);
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
