import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { WebtoonProject, Character, Episode, Panel, ProjectStatus, Genre, ArtStyle, TargetAudience } from '@/types';
import { db } from '@/services/storage/db';
import { v4 as uuidv4 } from 'uuid';

export interface CreateProjectData {
  title: string;
  genre: string;
  targetAudience: string;
  mood: string[];
  briefConcept: string;
  artStyle: string;
  episodeCount: number;
}

export interface ProjectProgress {
  planning: number;
  characters: number;
  storyboard: number;
  images: number;
  overall: number;
}

interface ProjectState {
  projects: WebtoonProject[];
  currentProject: WebtoonProject | null;
  isLoading: boolean;
  error: string | null;

  loadProjects: () => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<WebtoonProject>;
  updateProject: (id: string, updates: Partial<WebtoonProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string | null) => Promise<void>;
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<void>;

  addCharacter: (projectId: string, character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Character>;
  updateCharacter: (projectId: string, characterId: string, updates: Partial<Character>) => Promise<void>;
  deleteCharacter: (projectId: string, characterId: string) => Promise<void>;

  addEpisode: (projectId: string, episode: Omit<Episode, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Episode>;
  updateEpisode: (projectId: string, episodeId: string, updates: Partial<Episode>) => Promise<void>;
  deleteEpisode: (projectId: string, episodeId: string) => Promise<void>;

  addPanel: (episodeId: string, panel: Omit<Panel, 'id'>) => Promise<Panel>;
  updatePanel: (episodeId: string, panelId: string, updates: Partial<Panel>) => Promise<void>;
  deletePanel: (episodeId: string, panelId: string) => Promise<void>;
  reorderPanels: (episodeId: string, panelIds: string[]) => Promise<void>;

  getProjectProgress: (projectId: string) => ProjectProgress;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    immer((set, get) => ({
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,

      loadProjects: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const projects = await db.projects.toArray();
          set((state) => {
            state.projects = projects.sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = '프로젝트 로딩 실패';
            state.isLoading = false;
          });
        }
      },

      createProject: async (data) => {
        const now = new Date();
        const newProject: WebtoonProject = {
          id: uuidv4(),
          title: data.title,
          genre: data.genre as Genre,
          subGenres: [],
          targetAudience: data.targetAudience as TargetAudience,
          mood: data.mood,
          briefConcept: data.briefConcept,
          artStyle: data.artStyle as ArtStyle,
          episodeCount: data.episodeCount,
          status: 'draft',
          characters: [],
          episodes: [],
          styleGuide: {
            colorPalette: [],
            lineWeight: 'medium',
            shadingStyle: 'cel',
            characterProportions: 'semi-realistic',
            backgroundDetail: 'moderate',
            effectsStyle: '',
            anchorPrompt: '',
          },
          costTracking: {
            totalAPIcalls: 0,
            imageGenerations: 0,
            textGenerations: 0,
            cachedResults: 0,
            estimatedCost: 0,
            savingsFromCache: 0,
          },
          createdAt: now,
          updatedAt: now,
          version: 1,
        };

        await db.projects.add(newProject);
        set((state) => {
          state.projects.unshift(newProject);
          state.currentProject = newProject;
        });

        return newProject;
      },

      updateProject: async (id, updates) => {
        const updatedAt = new Date();
        await db.projects.update(id, { ...updates, updatedAt });

        set((state) => {
          const index = state.projects.findIndex((p) => p.id === id);
          if (index !== -1) {
            Object.assign(state.projects[index], updates, { updatedAt });
          }
          if (state.currentProject?.id === id) {
            Object.assign(state.currentProject, updates, { updatedAt });
          }
        });
      },

      deleteProject: async (id) => {
        await db.projects.delete(id);
        await db.characters.where('projectId').equals(id).delete();
        await db.episodes.where('projectId').equals(id).delete();

        set((state) => {
          state.projects = state.projects.filter((p) => p.id !== id);
          if (state.currentProject?.id === id) {
            state.currentProject = null;
          }
        });
      },

      setCurrentProject: async (id) => {
        if (!id) {
          set((state) => {
            state.currentProject = null;
          });
          return;
        }

        const project = await db.projects.get(id);
        if (project) {
          const characters = await db.characters.where('projectId').equals(id).toArray();
          const episodes = await db.episodes.where('projectId').equals(id).toArray();

          for (const episode of episodes) {
            const panels = await db.panels.where('episodeId').equals(episode.id).toArray();
            episode.panels = panels.sort((a, b) => a.panelNumber - b.panelNumber);
          }

          project.characters = characters;
          project.episodes = episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

          set((state) => {
            state.currentProject = project;
          });
        }
      },

      updateProjectStatus: async (id, status) => {
        await get().updateProject(id, { status });
      },

      addCharacter: async (projectId, characterData) => {
        const now = new Date();
        const character: Character = {
          ...characterData,
          id: uuidv4(),
          projectId,
          createdAt: now,
          updatedAt: now,
        };

        await db.characters.add(character);

        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (project) {
            project.characters.push(character);
          }
          if (state.currentProject?.id === projectId) {
            state.currentProject.characters.push(character);
          }
        });

        return character;
      },

      updateCharacter: async (projectId, characterId, updates) => {
        const updatedAt = new Date();
        await db.characters.update(characterId, { ...updates, updatedAt });

        set((state) => {
          const updateInProject = (project: WebtoonProject) => {
            const charIndex = project.characters.findIndex((c) => c.id === characterId);
            if (charIndex !== -1) {
              Object.assign(project.characters[charIndex], updates, { updatedAt });
            }
          };

          const project = state.projects.find((p) => p.id === projectId);
          if (project) updateInProject(project);
          if (state.currentProject?.id === projectId) updateInProject(state.currentProject);
        });
      },

      deleteCharacter: async (projectId, characterId) => {
        await db.characters.delete(characterId);

        set((state) => {
          const deleteFromProject = (project: WebtoonProject) => {
            project.characters = project.characters.filter((c) => c.id !== characterId);
          };

          const project = state.projects.find((p) => p.id === projectId);
          if (project) deleteFromProject(project);
          if (state.currentProject?.id === projectId) deleteFromProject(state.currentProject);
        });
      },

      addEpisode: async (projectId, episodeData) => {
        const now = new Date();
        const episode: Episode = {
          ...episodeData,
          id: uuidv4(),
          projectId,
          createdAt: now,
          updatedAt: now,
        };

        await db.episodes.add(episode);

        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (project) {
            project.episodes.push(episode);
            project.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
          }
          if (state.currentProject?.id === projectId) {
            state.currentProject.episodes.push(episode);
            state.currentProject.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
          }
        });

        return episode;
      },

      updateEpisode: async (projectId, episodeId, updates) => {
        const updatedAt = new Date();
        await db.episodes.update(episodeId, { ...updates, updatedAt });

        set((state) => {
          const updateInProject = (project: WebtoonProject) => {
            const epIndex = project.episodes.findIndex((e) => e.id === episodeId);
            if (epIndex !== -1) {
              Object.assign(project.episodes[epIndex], updates, { updatedAt });
            }
          };

          const project = state.projects.find((p) => p.id === projectId);
          if (project) updateInProject(project);
          if (state.currentProject?.id === projectId) updateInProject(state.currentProject);
        });
      },

      deleteEpisode: async (projectId, episodeId) => {
        await db.episodes.delete(episodeId);
        await db.panels.where('episodeId').equals(episodeId).delete();

        set((state) => {
          const deleteFromProject = (project: WebtoonProject) => {
            project.episodes = project.episodes.filter((e) => e.id !== episodeId);
          };

          const project = state.projects.find((p) => p.id === projectId);
          if (project) deleteFromProject(project);
          if (state.currentProject?.id === projectId) deleteFromProject(state.currentProject);
        });
      },

      addPanel: async (episodeId, panelData) => {
        const panel: Panel = {
          ...panelData,
          id: uuidv4(),
        };

        await db.panels.add(panel);

        set((state) => {
          if (state.currentProject) {
            const episode = state.currentProject.episodes.find((e) => e.id === episodeId);
            if (episode) {
              episode.panels.push(panel);
              episode.panels.sort((a, b) => a.panelNumber - b.panelNumber);
            }
          }
        });

        return panel;
      },

      updatePanel: async (episodeId, panelId, updates) => {
        await db.panels.update(panelId, updates);

        set((state) => {
          if (state.currentProject) {
            const episode = state.currentProject.episodes.find((e) => e.id === episodeId);
            if (episode) {
              const panelIndex = episode.panels.findIndex((p) => p.id === panelId);
              if (panelIndex !== -1) {
                Object.assign(episode.panels[panelIndex], updates);
              }
            }
          }
        });
      },

      deletePanel: async (episodeId, panelId) => {
        await db.panels.delete(panelId);

        set((state) => {
          if (state.currentProject) {
            const episode = state.currentProject.episodes.find((e) => e.id === episodeId);
            if (episode) {
              episode.panels = episode.panels.filter((p) => p.id !== panelId);
            }
          }
        });
      },

      reorderPanels: async (episodeId, panelIds) => {
        const updates = panelIds.map((id, index) =>
          db.panels.update(id, { panelNumber: index + 1 })
        );
        await Promise.all(updates);

        set((state) => {
          if (state.currentProject) {
            const episode = state.currentProject.episodes.find((e) => e.id === episodeId);
            if (episode) {
              episode.panels.forEach((panel) => {
                const newIndex = panelIds.indexOf(panel.id);
                if (newIndex !== -1) {
                  panel.panelNumber = newIndex + 1;
                }
              });
              episode.panels.sort((a, b) => a.panelNumber - b.panelNumber);
            }
          }
        });
      },

      getProjectProgress: (projectId) => {
        const { currentProject, projects } = get();
        const project =
          currentProject?.id === projectId
            ? currentProject
            : projects.find((p) => p.id === projectId);

        if (!project) {
          return { planning: 0, characters: 0, storyboard: 0, images: 0, overall: 0 };
        }

        const planning = project.planning ? 100 : 0;

        const mainCharacters = project.characters.filter(
          (c) => c.role === 'protagonist' || c.role === 'antagonist'
        );
        const characters = Math.min(100, (mainCharacters.length / 2) * 100);

        const totalPanels = project.episodes.reduce((sum, ep) => sum + ep.panels.length, 0);
        const targetPanels = project.episodeCount * 20;
        const storyboard = Math.min(100, (totalPanels / targetPanels) * 100);

        const panelsWithImages = project.episodes.reduce(
          (sum, ep) => sum + ep.panels.filter((p) => p.generatedImage).length,
          0
        );
        const images = totalPanels > 0 ? (panelsWithImages / totalPanels) * 100 : 0;

        const overall = planning * 0.15 + characters * 0.15 + storyboard * 0.3 + images * 0.4;

        return {
          planning: Math.round(planning),
          characters: Math.round(characters),
          storyboard: Math.round(storyboard),
          images: Math.round(images),
          overall: Math.round(overall),
        };
      },
    })),
    {
      name: 'webtoon-forge-project',
      partialize: (state) => ({
        projects: state.projects.map((p) => ({
          ...p,
          characters: [],
          episodes: [],
        })),
      }),
    }
  )
);
