import { NextResponse } from 'next/server';
import { generateGlitchSuggestions } from '@/lib/glitch';

export async function POST(request: Request) {
  try {
    const { events, difficulty, category, goal } = await request.json();
    const suggestions = await generateGlitchSuggestions(events, { difficulty, category, goal });
    return NextResponse.json({ suggestions });
  } catch (error: any) {
    return NextResponse.json({ error: 'Glitch 생성 실패' }, { status: 500 });
  }
}
