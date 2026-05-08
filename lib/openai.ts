import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// 모델명 수정: 'models/gemini-1.5-flash' 대신 'gemini-1.5-flash' 사용
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function categorizeEvents(events: any[]) {
  if (!process.env.GEMINI_API_KEY || events.length === 0) {
    return events.map(e => ({ ...e, category: '기타' }));
  }

  const eventTitles = events.map(e => e.title).join(', ');
  
  const prompt = `
    다음은 사용자의 일정 제목 목록입니다: [${eventTitles}]
    각 일정을 아래 5가지 카테고리 중 하나로 분류하고 JSON 배열 형태로 응답해주세요.
    카테고리: ['업무', '휴식', '자기계발', '운동', '공부']
    응답 형식: [{"title": "일정제목", "category": "카테고리"}]
    단, 리스트에 없는 제목은 '기타'로 분류해주세요.
    JSON 데이터만 출력하세요. 마크다운 기호 없이 순수 JSON만 출력하세요.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let resultText = response.text().trim();
    
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const categories = JSON.parse(resultText);

    return events.map(event => {
      const found = categories.find((c: any) => c.title === event.title);
      return {
        ...event,
        category: found ? found.category : '기타'
      };
    });
  } catch (error) {
    console.error('Gemini AI 분류 오류 (폴백 모드 전환):', error);
    // AI 실패 시 기본값 반환 (클라이언트에서 키워드 분류함)
    return events.map(e => ({ ...e, category: '기타' }));
  }
}
