import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateGlitchSuggestions(events: any[]) {
  if (!process.env.GEMINI_API_KEY) {
    return [
      { id: '1', title: '낯선 카페 가기', description: '한 번도 가보지 않은 카페에서 30분간 책을 읽어보세요.', category: '탐구' },
      { id: '2', title: '새로운 경로로 퇴근', description: '평소와 완전히 다른 길이나 교통수단으로 귀가해보세요.', category: '모험심' }
    ];
  }

  const stats = events.reduce((acc: any, curr: any) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const statsString = Object.entries(stats).map(([k, v]) => `${k}: ${v}회`).join(', ');

  const prompt = `
    사용자의 일정 통계입니다: [${statsString}]
    사용자의 'Comfort Zone(안전지대)'을 깨뜨리고 새로운 성장을 자극할 수 있는 
    'Glitch(의도적인 오류/도전)' 과제 3개를 제안해주세요.
    
    제안 카테고리: ['대화', '모험심', '취향', '탐구', '지적호기심']
    응답 형식: JSON 배열 [{"title": "과제명", "description": "상세설명", "category": "카테고리"}]
    한국어로 응답하고 순수 JSON 데이터만 출력하세요.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let resultText = response.text().trim();
    
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const suggestions = JSON.parse(resultText);

    return suggestions.map((s: any, index: number) => ({
      ...s,
      id: `glitch-${Date.now()}-${index}`
    }));
  } catch (error) {
    console.error('Gemini Glitch 생성 오류 (기본 과제 반환):', error);
    return [
      { id: '1', title: '낯선 카페 가기', description: '한 번도 가보지 않은 카페에서 30분간 책을 읽어보세요.', category: '탐구' },
      { id: '2', title: '새로운 경로로 퇴근', description: '평소와 완전히 다른 길이나 교통수단으로 귀가해보세요.', category: '모험심' }
    ];
  }
}
