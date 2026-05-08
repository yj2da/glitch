import { NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/calendar-write';

export async function POST(request: Request) {
  try {
    const { email, password, glitch } = await request.json();
    
    // 현재 시간으로부터 1시간 뒤에 시작하는 일정으로 설정
    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 1);
    startDate.setMinutes(0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const result = await createCalendarEvent(email, password, {
      title: `[GLITCH] ${glitch.title}`,
      description: glitch.description,
      startDate,
      endDate,
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: error.message || '일정 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}
