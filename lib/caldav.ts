import { DAVClient } from 'tsdav';
import ICAL from 'ical.js';

export const getCalendarClient = (email?: string, password?: string) => {
  return new DAVClient({
    serverUrl: 'https://caldav.icloud.com',
    credentials: {
      username: email || process.env.APPLE_ID || '',
      password: password || process.env.APPLE_APP_SPECIFIC_PASSWORD || '',
    },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  });
};

// 단순 키워드 기반 분류 로직 (서버측에서도 처리 가능하도록 분리)
const getCategoryByTitle = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('공부') || t.includes('시험') || t.includes('과제') || t.includes('강의') || t.includes('학원') || t.includes('스터디')) return '공부';
  if (t.includes('운동') || t.includes('헬스') || t.includes('축구') || t.includes('야구') || t.includes('러닝') || t.includes('테니스')) return '운동';
  if (t.includes('회의') || t.includes('미팅') || t.includes('업무') || t.includes('출근') || t.includes('마감') || t.includes('프로젝트')) return '업무';
  if (t.includes('휴식') || t.includes('여행') || t.includes('카페') || t.includes('영화') || t.includes('데이트') || t.includes('노래방') || t.includes('소라')) return '휴식';
  if (t.includes('독서') || t.includes('세미나') || t.includes('교육') || t.includes('발표')) return '자기계발';
  return '기타';
};

export async function fetchCalendarEvents(email?: string, password?: string) {
  try {
    const client = getCalendarClient(email, password);
    await client.login();
    
    const calendars = await client.fetchCalendars();
    if (!calendars || calendars.length === 0) return [];

    console.log(`[서버 로그] 총 ${calendars.length}개의 캘린더 발견. 모든 일정 수집 시작...`);

    // 모든 필터를 제거하고 서버의 모든 이벤트를 가져옴 (사용자가 "다 떴다"고 했던 그 방식)
    const allEventsPromises = calendars.map(async (calendar) => {
      try {
        const objects = await client.fetchCalendarObjects({ calendar });
        console.log(`[서버 로그] ${calendar.displayName}: ${objects.length}개 수집`);
        return objects;
      } catch (err) {
        return [];
      }
    });

    const results = await Promise.all(allEventsPromises);
    const flatEvents = results.flat();

    const mappedEvents = flatEvents.map(event => {
      try {
        const icsData = event.data as string;
        if (!icsData) return null;

        const jcalData = ICAL.parse(icsData);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');

        return vevents.map(vevent => {
          const eventObj = new ICAL.Event(vevent);
          const start = eventObj.startDate ? eventObj.startDate.toJSDate() : null;
          const end = eventObj.endDate ? eventObj.endDate.toJSDate() : null;
          const summary = eventObj.summary || '제목 없음';

          if (!start) return null;

          return {
            title: summary,
            start: start.toISOString(),
            end: (end || new Date(start.getTime() + 3600000)).toISOString(),
            allDay: eventObj.startDate?.isDate || false,
            calendarName: event.calendar?.displayName || '기본',
            category: getCategoryByTitle(summary) // 서버에서 미리 카테고리 계산
          };
        });
      } catch (e) {
        return null;
      }
    });

    const finalEvents = mappedEvents.flat().filter(e => e !== null);
    console.log(`[서버 로그] 총 ${finalEvents.length}개의 일정을 화면으로 보냅니다.`);
    
    return finalEvents;
  } catch (error: any) {
    console.error('[서버 로그] 연동 실패:', error);
    throw error;
  }
}
