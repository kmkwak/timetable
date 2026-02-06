import { ScheduleListData } from '../types/schedule';

// GitHub 설정
const GITHUB_OWNER = 'kmkwak';
const GITHUB_REPO = 'timetable';
const GITHUB_PATH = 'data/schedules.json';
const GITHUB_TOKEN = ''; // GitHub Personal Access Token 입력 (보안상 코드에 직접 입력하지 마세요)

export async function fetchFromGitHub(): Promise<ScheduleListData | null> {
  if (!GITHUB_TOKEN) return null;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
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
  if (!GITHUB_TOKEN) return false;

  try {
    // 먼저 현재 파일의 SHA를 가져옴 (업데이트를 위해 필요)
    let sha: string | undefined;
    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
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
          Authorization: `token ${GITHUB_TOKEN}`,
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

export function isGitHubConfigured(): boolean {
  return !!GITHUB_TOKEN;
}
