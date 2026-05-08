import { NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/calendar-write';

export async function POST(request: Request) {
  try {
    const { email, password, glitch, startDate: customStartDate } = await request.json();
    
    const startDate = customStartDate ? new Date(customStartDate) : new Date();
    if (!customStartDate) {
      startDate.setHours(startDate.getHours() + 1);
      startDate.setMinutes(0, 0, 0);
    }

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
