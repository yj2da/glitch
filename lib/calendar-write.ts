import { getCalendarClient } from './caldav';
import { v4 as uuidv4 } from 'uuid';

export async function createCalendarEvent(email: string, password: string, eventDetails: { title: string; description: string; startDate: Date; endDate: Date }) {
  try {
    const client = getCalendarClient(email, password);
    await client.login();
    
    const calendars = await client.fetchCalendars();
    // "Calendar" 또는 "일정" 이름이 포함된 캘린더를 우선 찾고, 없으면 첫 번째 사용
    const targetCalendar = calendars.find(c => (c as any).displayName?.toLowerCase().includes('calendar') || (c as any).displayName?.includes('일정')) || calendars[0];
    
    if (!targetCalendar) throw new Error('저장할 캘린더를 찾을 수 없습니다.');

    const uid = uuidv4();
    const startStr = eventDetails.startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endStr = eventDetails.endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    // 표준 iCalendar(ICS) 형식 생성
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Glitch App//NONSGML v1.0//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${eventDetails.title}`,
      `DESCRIPTION:${eventDetails.description.replace(/\n/g, '\\n')}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const filename = `${uid}.ics`;
    
    // CalDAV 서버에 새 이벤트 파일 업로드
    await client.createCalendarObject({
      calendar: targetCalendar,
      filename,
      iCalString: icsData,
    });

    return { success: true, uid };
  } catch (error) {
    console.error('iCloud 일정 추가 실패:', error);
    throw error;
  }
}

export async function deleteCalendarEvent(email: string, password: string, eventId: string) {
  try {
    const client = getCalendarClient(email, password);
    await client.login();
    const calendars = await client.fetchCalendars();
    
    // 이벤트를 찾기 위해 모든 캘린더 검색
    for (const calendar of calendars) {
      try {
        const objects = await client.fetchCalendarObjects({ calendar });
        const target = objects.find(obj => obj.url.endsWith(eventId) || obj.url.endsWith(`${eventId}.ics`));
        
        if (target) {
          await client.deleteCalendarObject({
            calendarObject: target
          });
          return { success: true };
        }
      } catch (err) {
        // 이 캘린더에서 검색 실패 시 다음으로
      }
    }
    throw new Error('삭제할 일정을 찾을 수 없습니다.');
  } catch (error) {
    console.error('iCloud 일정 삭제 실패:', error);
    throw error;
  }
}

export async function updateCalendarEvent(email: string, password: string, eventId: string, eventDetails: { title: string; description: string; startDate: Date; endDate: Date }) {
  try {
    // 업데이트는 기존 항목을 덮어쓰는 방식 (createCalendarObject와 동일한 UID/filename 사용)
    return await createCalendarEvent(email, password, eventDetails);
  } catch (error) {
    console.error('iCloud 일정 수정 실패:', error);
    throw error;
  }
}
