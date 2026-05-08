import { getCalendarClient } from './caldav';
import { v4 as uuidv4 } from 'uuid';

export async function createCalendarEvent(email: string, password: string, eventDetails: { title: string; description: string; startDate: Date; endDate: Date }) {
  try {
    const client = getCalendarClient(email, password);
    await client.login();
    
    const calendars = await client.fetchCalendars();
    // "Calendar" 또는 "일정" 이름이 포함된 캘린더를 우선 찾고, 없으면 첫 번째 사용
    const targetCalendar = calendars.find(c => c.displayName?.toLowerCase().includes('calendar') || c.displayName?.includes('일정')) || calendars[0];
    
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
      iCalendarData: icsData,
    });

    return { success: true, uid };
  } catch (error) {
    console.error('iCloud 일정 추가 실패:', error);
    throw error;
  }
}
