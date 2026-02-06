import { ScheduleListData } from '../types/schedule';

// GitHub 설정
const GITHUB_OWNER = 'kmkwak';
const GITHUB_REPO = 'timetable';
const GITHUB_PATH = 'data/schedules.json';
const TOKEN_STORAGE_KEY = 'timetable_github_token';

// 간단한 난독화 (복사-붙여넣기 방지)
function obfuscate(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const base64 = btoa(String.fromCharCode(...bytes));
  const reversed = base64.split('').reverse().join('');
  return `tt_${reversed}_tt`;
}

function deobfuscate(text: string): string {
  if (!text.startsWith('tt_') || !text.endsWith('_tt')) {
    return text; // 이전 버전 호환 (난독화 안 된 토큰)
  }
  const reversed = text.slice(3, -3);
  const base64 = reversed.split('').reverse().join('');
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// 토큰 관리
export function getGitHubToken(): string {
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  if (!stored) return '';
  try {
    return deobfuscate(stored);
  } catch {
    return '';
  }
}

export function setGitHubToken(token: string): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, obfuscate(token));
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function isGitHubTokenConfigured(): boolean {
  return !!getGitHubToken();
}

// 공개 읽기 (토큰 없이)
export async function fetchFromGitHub(): Promise<ScheduleListData | null> {
  try {
    // 토큰이 있으면 인증 요청, 없으면 공개 요청
    const token = getGitHubToken();
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers.Authorization = `token ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,
      { headers }
    );

    if (!response.ok) {
      // 파일이 없거나 에러면 null 반환 (로컬 스토리지 사용하도록)
      return null;
    }

    const data = await response.json();
    // UTF-8 디코딩 (한글 지원)
    const binaryString = atob(data.content);
    const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
    const content = new TextDecoder().decode(bytes);
    return JSON.parse(content) as ScheduleListData;
  } catch (error) {
    console.error('GitHub fetch error:', error);
    return null;
  }
}

export async function saveToGitHub(data: ScheduleListData): Promise<boolean> {
  const token = getGitHubToken();
  if (!token) return false;

  try {
    // 먼저 현재 파일의 SHA를 가져옴 (업데이트를 위해 필요)
    let sha: string | undefined;
    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      }
    } catch {
      // 파일이 없으면 새로 생성
    }

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update timetable data',
          content,
          sha,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('GitHub save error:', error);
    return false;
  }
}
