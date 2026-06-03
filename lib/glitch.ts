import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function generateGlitchSuggestions(events: any[], options?: { difficulty?: string, category?: string, goal?: string }) {
  if (!process.env.GEMINI_API_KEY && !openai) {
    console.warn("AI API keys are missing. Returning default suggestions.");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    return [
      { id: '1', title: '명상과 휴식', description: '바쁜 일정 사이에 15분간의 명상을 추가해보세요.', category: '취미/운동', recommendedDate: tomorrow.toISOString() },
      { id: '2', title: '새로운 산책로', description: '평소 가던 길 대신 새로운 길로 산책해보세요.', category: '취미/운동', recommendedDate: tomorrow.toISOString() }
    ];
  }

  const { difficulty = '보통', category = '전체', goal = '전체' } = options || {};
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const limitedEvents = events.slice(0, 50);
  const stats = limitedEvents.reduce((acc: any, curr: any) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});
  const statsString = Object.entries(stats).map(([k, v]) => `${k}: ${v}개`).join(', ');

  const prompt = `현재 시간: ${now}
    당신의 현재 일정 통계입니다: [${statsString}]
    당신의 현재 목표는 [${goal}]입니다. 이 목표에 부합하면서도, 당신의 일상을 'Comfort Zone'에서 벗어나게 할 만한 아주 귀엽고 창의적인 활동 3가지를 제안해주세요.
    사용자가 파스텔톤의 예쁜 일상을 보낼 수 있도록 다정하고 친근한 말투로 제목과 설명을 작성해주세요.
    
    설정값:
    - 목표: ${goal}
    - 난이도: ${difficulty} (쉬움: 소소한 변화, 보통: 적당한 도전, 어려움: 확실한 탈출)
    - 선호 카테고리: ${category} (전체 또는 특정 카테고리)

    각 제안에 대해 추천 날짜와 시간(ISO 8601 형식)도 함께 제안해주세요. 추천 날짜는 현재 시간 이후여야 하며, 사용자의 일정 통계를 고려하여 비어있을 법한 시간을 선택하세요.
    
    카테고리: ['과제/공부', '수업/강의', '식사/약속', '취미/운동', '기타']
    출력 형식: JSON 배열 [{"title": "제목", "description": "설명", "category": "카테고리", "recommendedDate": "YYYY-MM-DDTHH:mm:ss"}]
    JSON만 출력하세요.`;

  try {
    let response;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        const result = await model.generateContent(prompt);
        response = await result.response;
        break;
      } catch (err: any) {
        attempts++;
        if (attempts < maxAttempts && (err.message?.includes('503') || err.message?.includes('high demand'))) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw err;
      }
    }

    if (!response) throw new Error('Failed to get response from Gemini');

    let resultText = response.text().trim();
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();    
    const suggestions = JSON.parse(resultText);
    return suggestions.map((s: any, index: number) => ({
      ...s,
      id: `glitch-${Date.now()}-${index}`
    }));
  } catch (error: any) {
    console.error('Gemini API Error:', error.message);
    
    // Fallback logic
    const fallbackModels = ["gemini-3-flash-preview", "gemini-3.1-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];
    for (const modelName of fallbackModels) {
      try {
        console.log(`Trying fallback model: ${modelName}`);
        const fallbackModel = genAI.getGenerativeModel({ model: modelName });
        const result = await fallbackModel.generateContent(prompt);
        const response = await result.response;
        let resultText = response.text().trim();
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(resultText).map((s: any, index: number) => ({ ...s, id: `glitch-${Date.now()}-${index}` }));
      } catch (e: any) {
        console.error(`Fallback to ${modelName} failed:`, e.message);
        continue;
      }
    }

    // Last resort: OpenAI
    if (openai) {
      try {
        console.log('Gemini failed. Trying OpenAI...');
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a creative routine injector." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
        const content = completion.choices[0].message.content;
        if (content) {
          const parsed = JSON.parse(content);
          const array = Array.isArray(parsed) ? parsed : (parsed.suggestions || Object.values(parsed)[0]);
          return array.map((s: any, index: number) => ({ ...s, id: `glitch-${Date.now()}-${index}` }));
        }
      } catch (e: any) {
        console.error('OpenAI fallback failed:', e.message);
      }
    }

    return [
      { id: 'f1', title: '디지털 디톡스', description: '1시간 동안 전자기기 없이 책을 읽으세요.', category: '기타' },
      { id: 'f2', title: '새로운 음식 도전', description: '안 먹어본 음식을 먹어보세요.', category: '식사/약속' }
    ];
  }
}
