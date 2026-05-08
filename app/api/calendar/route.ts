import { NextResponse } from 'next/server';
import { fetchCalendarEvents } from '@/lib/caldav';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // 1. 캘린더 이벤트 가져오기 (제한 없이 전체 로드)
    const rawEvents = await fetchCalendarEvents(email, password);
    
    // 2. AI 분석 대신 안정성을 위해 원본 데이터를 그대로 반환
    // (이미 lib/caldav.ts에서 getCategoryByTitle로 분류하고 있음)
    return NextResponse.json({ events: rawEvents });
  } catch (error: any) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: error.message || 'iCloud 연결에 실패했습니다.' },
      { status: 500 }
    );
  }
}
