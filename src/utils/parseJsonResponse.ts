/**
 * Gemini API 응답에서 JSON을 안전하게 파싱합니다.
 * Gemini가 ```json 코드 블록으로 감싸서 응답하는 경우를 처리합니다.
 * 잘린 JSON도 복구를 시도합니다.
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

  // 먼저 정상 파싱 시도
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // 파싱 실패시 복구 시도
    console.warn('JSON parsing failed, attempting recovery...');
    return repairAndParseJson<T>(jsonStr);
  }
}

/**
 * 잘린 JSON을 복구하여 파싱합니다.
 */
function repairAndParseJson<T>(jsonStr: string): T {
  let repaired = jsonStr;

  // 끝에 있는 불완전한 문자열 제거
  // 예: "text": "some incomplete 로 끝나는 경우
  const lastQuoteIndex = repaired.lastIndexOf('"');
  const lastColonIndex = repaired.lastIndexOf(':');

  // 마지막 완전한 속성을 찾기
  if (lastQuoteIndex > lastColonIndex) {
    // 문자열 값이 불완전할 수 있음
    const beforeQuote = repaired.substring(0, lastQuoteIndex);
    const secondLastQuote = beforeQuote.lastIndexOf('"');

    // 키-값 쌍에서 값이 시작되었는지 확인
    const colonAfterKey = beforeQuote.lastIndexOf(':');
    if (colonAfterKey > secondLastQuote) {
      // 불완전한 문자열 값, 이전 완전한 항목까지 자르기
      const lastCompleteComma = beforeQuote.lastIndexOf(',');
      const lastOpenBrace = beforeQuote.lastIndexOf('{');
      const lastOpenBracket = beforeQuote.lastIndexOf('[');

      const cutPoint = Math.max(lastCompleteComma, lastOpenBrace, lastOpenBracket);
      if (cutPoint > 0) {
        repaired = repaired.substring(0, cutPoint + 1);
      }
    }
  }

  // 열린 괄호 카운트
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (const char of repaired) {
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '[') openBrackets++;
    if (char === ']') openBrackets--;
  }

  // 끝에 불완전한 쉼표 제거
  repaired = repaired.replace(/,\s*$/, '');

  // 닫히지 않은 괄호 닫기
  while (openBrackets > 0) {
    repaired += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    repaired += '}';
    openBraces--;
  }

  try {
    return JSON.parse(repaired);
  } catch (e) {
    // 더 공격적인 복구: 마지막 완전한 배열 항목 찾기
    const match = repaired.match(/^(\{[\s\S]*"(?:characters|episodes|acts)":\s*\[[\s\S]*\})\s*,?\s*(?:\{[^}]*)?$/);
    if (match) {
      try {
        // 배열을 닫고 객체를 닫기
        let partial = match[1];
        if (!partial.endsWith(']')) partial += ']';
        if (!partial.endsWith('}')) partial += '}';
        return JSON.parse(partial);
      } catch {}
    }

    // 최후의 수단: 원래 오류 던지기
    throw new Error(`JSON 파싱 실패: AI 응답이 불완전합니다. 다시 시도해주세요.`);
  }
}
