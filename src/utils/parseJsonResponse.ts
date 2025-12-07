/**
 * Gemini API 응답에서 JSON을 안전하게 파싱합니다.
 * Gemini가 ```json 코드 블록으로 감싸서 응답하는 경우를 처리합니다.
 */
export function parseJsonResponse<T = any>(response: string): T {
  let jsonStr = response.trim();

  // ```json 또는 ``` 코드 블록 제거
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }

  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  jsonStr = jsonStr.trim();

  return JSON.parse(jsonStr);
}
