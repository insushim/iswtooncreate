import { geminiService } from '../gemini/GeminiService';
import type { Episode, Panel, Character } from '@/types';

export interface StoryFlowAnalysis {
  pacing: 'too-fast' | 'good' | 'too-slow';
  pacingDetails: string;
  plotHoles: string[];
  emotionalFlow: { score: number; details: string };
  tensionCurve: number[];
  suggestions: string[];
  strengths: string[];
}

export interface CharacterConsistencyReport {
  characters: {
    name: string;
    consistencyScore: number;
    issues: string[];
  }[];
  overallScore: number;
  suggestions: string[];
}

export interface PacingAnalysis {
  averageDialoguesPerPanel: number;
  fullPanelRatio: number;
  actionPanelRatio: number;
  pacing: string;
  recommendations: string[];
}

export interface ReaderPrediction {
  engagement: number;
  emotionalResponse: string[];
  shareability: number;
  cliffhangerEffect: number;
  expectedComments: string[];
}

interface DialogueSample {
  characterName: string;
  text: string;
  episodeNumber: number;
}

class StoryAnalyzerClass {
  async analyzeStoryFlow(episodes: Episode[]): Promise<StoryFlowAnalysis> {
    const prompt = `
      다음 웹툰 에피소드들의 스토리 흐름을 분석해주세요.

      에피소드 정보:
      ${episodes
        .map(
          (ep) => `
        에피소드 ${ep.episodeNumber}: ${ep.title}
        요약: ${ep.summary}
        주요 이벤트: ${ep.keyEvents.join(', ')}
        감정 흐름: ${ep.emotionalArc}
      `
        )
        .join('\n')}

      다음 항목을 분석해주세요:
      1. 페이싱 (too-fast / good / too-slow)
      2. 플롯 홀 (논리적 불일치나 미해결 복선)
      3. 감정 흐름의 자연스러움
      4. 긴장감 곡선
      5. 개선 제안

      JSON 형식으로 응답해주세요:
      {
        "pacing": "good",
        "pacingDetails": "설명",
        "plotHoles": ["플롯홀1", "플롯홀2"],
        "emotionalFlow": { "score": 8, "details": "설명" },
        "tensionCurve": [에피소드별 긴장도 1-10],
        "suggestions": ["제안1", "제안2"],
        "strengths": ["장점1", "장점2"]
      }
    `;

    const response = await geminiService.generateText(prompt, {
      temperature: 0.3,
      useCache: true,
    });

    return this.parseAnalysisResponse(response);
  }

  async checkCharacterConsistency(
    characters: Character[],
    episodes: Episode[]
  ): Promise<CharacterConsistencyReport> {
    const dialogues = this.extractDialogues(episodes);

    const prompt = `
      캐릭터 일관성을 분석해주세요.

      캐릭터 설정:
      ${characters
        .map(
          (c) => `
        ${c.name}:
        - 성격: ${c.personality.join(', ')}
        - 말투: ${c.speechPattern.formality}, ${c.speechPattern.speechHabits.join(', ')}
        - 말버릇: ${c.speechPattern.catchphrase || '없음'}
      `
        )
        .join('\n')}

      대사 샘플:
      ${dialogues
        .slice(0, 50)
        .map((d) => `${d.characterName}: "${d.text}"`)
        .join('\n')}

      분석 항목:
      1. 각 캐릭터의 말투 일관성 (1-10)
      2. 성격과 대사의 일치도
      3. 비일관적인 대사 예시
      4. 개선 제안

      JSON 형식으로 응답해주세요:
      {
        "characters": [
          { "name": "캐릭터명", "consistencyScore": 8, "issues": ["문제점1"] }
        ],
        "overallScore": 8,
        "suggestions": ["제안1"]
      }
    `;

    const response = await geminiService.generateText(prompt, {
      temperature: 0.3,
    });

    try {
      return JSON.parse(response);
    } catch {
      return {
        characters: [],
        overallScore: 0,
        suggestions: ['분석을 완료할 수 없습니다.'],
      };
    }
  }

  analyzePacing(panels: Panel[]): PacingAnalysis {
    const panelSizes = panels.map((p) => p.size);
    const dialogueCounts = panels.map((p) => p.dialogues.length);
    const actionPanels = panels.filter((p) =>
      p.characters.some(
        (c) => c.action.includes('action') || c.pose.includes('dynamic')
      )
    ).length;

    const averageDialoguesPerPanel =
      dialogueCounts.reduce((a, b) => a + b, 0) / panels.length || 0;
    const fullPanelRatio =
      panelSizes.filter((s) => s === 'full' || s === 'large').length / panels.length || 0;
    const actionPanelRatio = actionPanels / panels.length || 0;

    return {
      averageDialoguesPerPanel,
      fullPanelRatio,
      actionPanelRatio,
      pacing: this.determinePacing(averageDialoguesPerPanel, fullPanelRatio),
      recommendations: this.generatePacingRecommendations(
        averageDialoguesPerPanel,
        fullPanelRatio
      ),
    };
  }

  async predictReaderResponse(episode: Episode): Promise<ReaderPrediction> {
    const prompt = `
      다음 웹툰 에피소드의 독자 반응을 예측해주세요.

      제목: ${episode.title}
      요약: ${episode.summary}
      주요 이벤트: ${episode.keyEvents.join(', ')}
      엔딩 훅: ${episode.endingHook}

      예측 항목:
      1. 몰입도 (1-10)
      2. 예상 감정 반응 (배열)
      3. 공유/추천 가능성 (1-10)
      4. 클리프행어 효과 (1-10)
      5. 댓글 예상 키워드

      JSON 형식으로 응답해주세요:
      {
        "engagement": 8,
        "emotionalResponse": ["감동", "설렘", "궁금함"],
        "shareability": 7,
        "cliffhangerEffect": 9,
        "expectedComments": ["다음화 언제요", "심장아파"]
      }
    `;

    const response = await geminiService.generateText(prompt, {
      temperature: 0.5,
    });

    try {
      return JSON.parse(response);
    } catch {
      return {
        engagement: 5,
        emotionalResponse: [],
        shareability: 5,
        cliffhangerEffect: 5,
        expectedComments: [],
      };
    }
  }

  private extractDialogues(episodes: Episode[]): DialogueSample[] {
    const dialogues: DialogueSample[] = [];

    for (const episode of episodes) {
      for (const panel of episode.panels) {
        for (const dialogue of panel.dialogues) {
          if (dialogue.characterName && dialogue.type === 'speech') {
            dialogues.push({
              characterName: dialogue.characterName,
              text: dialogue.text,
              episodeNumber: episode.episodeNumber,
            });
          }
        }
      }
    }

    return dialogues;
  }

  private parseAnalysisResponse(response: string): StoryFlowAnalysis {
    try {
      return JSON.parse(response);
    } catch {
      return {
        pacing: 'good',
        pacingDetails: response,
        plotHoles: [],
        emotionalFlow: { score: 7, details: '' },
        tensionCurve: [],
        suggestions: [],
        strengths: [],
      };
    }
  }

  private determinePacing(avgDialogues: number, fullPanelRatio: number): string {
    if (avgDialogues > 4 || fullPanelRatio < 0.1) return 'too-slow';
    if (avgDialogues < 1.5 && fullPanelRatio > 0.4) return 'too-fast';
    return 'good';
  }

  private generatePacingRecommendations(
    avgDialogues: number,
    fullPanelRatio: number
  ): string[] {
    const recommendations: string[] = [];

    if (avgDialogues > 4) {
      recommendations.push(
        '대사가 많습니다. 일부를 나레이션이나 시각적 표현으로 대체해보세요.'
      );
    }
    if (avgDialogues < 1.5) {
      recommendations.push(
        '대사가 적습니다. 캐릭터 간 상호작용을 늘려보세요.'
      );
    }
    if (fullPanelRatio > 0.4) {
      recommendations.push(
        '큰 패널이 많습니다. 소규모 패널로 세부 묘사를 추가해보세요.'
      );
    }
    if (fullPanelRatio < 0.1) {
      recommendations.push(
        '임팩트 있는 장면에 큰 패널을 사용해보세요.'
      );
    }

    return recommendations;
  }
}

export const storyAnalyzer = new StoryAnalyzerClass();
