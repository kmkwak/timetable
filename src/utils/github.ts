import { ScheduleData } from '../types/schedule';
import { GITHUB_OWNER, GITHUB_REPO, GITHUB_PATH, GITHUB_TOKEN } from '../config/constants';

interface GitHubContentResponse {
  content: string;
  sha: string;
}

let currentSha: string | null = null;

export async function fetchFromGitHub(): Promise<ScheduleData | null> {
  if (!GITHUB_TOKEN) {
    console.warn('GitHub token not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.status === 404) {
      // 파일이 없으면 새로 생성 예정
      currentSha = null;
      return null;
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data: GitHubContentResponse = await response.json();
    currentSha = data.sha;

    const content = atob(data.content);
    return JSON.parse(content) as ScheduleData;
  } catch (error) {
    console.error('Failed to fetch from GitHub:', error);
    return null;
  }
}

export async function saveToGitHub(scheduleData: ScheduleData): Promise<boolean> {
  if (!GITHUB_TOKEN) {
    console.warn('GitHub token not configured');
    return false;
  }

  try {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(scheduleData, null, 2))));

    const body: Record<string, string> = {
      message: 'Update schedule',
      content,
    };

    if (currentSha) {
      body.sha = currentSha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    currentSha = result.content.sha;
    return true;
  } catch (error) {
    console.error('Failed to save to GitHub:', error);
    return false;
  }
}
