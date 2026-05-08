'use client';

import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer, Components, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'ko-KR': ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// 카테고리별 색상 정의 (부드러운 파스텔 톤)
const categoryStyles: Record<string, { bg: string, border: string, text: string }> = {
  '공부': { bg: '#F3E8FF', border: '#A855F7', text: '#6B21A8' },      // Pastel Purple
  '운동': { bg: '#FFEDD5', border: '#F97316', text: '#9A3412' },      // Pastel Orange
  '업무': { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },      // Pastel Blue
  '휴식': { bg: '#DCFCE7', border: '#22C55E', text: '#166534' },      // Pastel Green
  '자기계발': { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' },   // Pastel Indigo
  '기타': { bg: '#E0F2FE', border: '#0EA5E9', text: '#075985' },      // Pastel Sky Blue
};

// 단순 키워드 기반 분류 로직
const getCategoryByTitle = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('공부') || t.includes('시험') || t.includes('과제') || t.includes('강의') || t.includes('학원') || t.includes('스터디')) return '공부';
  if (t.includes('운동') || t.includes('헬스') || t.includes('축구') || t.includes('야구') || t.includes('러닝') || t.includes('테니스')) return '운동';
  if (t.includes('회의') || t.includes('미팅') || t.includes('업무') || t.includes('출근') || t.includes('마감') || t.includes('프로젝트')) return '업무';
  if (t.includes('휴식') || t.includes('여행') || t.includes('카페') || t.includes('영화') || t.includes('데이트') || t.includes('노래방') || t.includes('소라')) return '휴식';
  if (t.includes('독서') || t.includes('세미나') || t.includes('교육') || t.includes('발표')) return '자기계발';
  return '기타';
};

const EventComponent = ({ event }: any) => {
  const style = categoryStyles[event.category] || categoryStyles['기타'];
  return (
    <div className="px-2 py-1 h-full overflow-hidden">
      <div className="text-[11px] font-bold leading-tight truncate" style={{ color: style.text }}>
        <span className="opacity-60 mr-1">[{event.category}]</span>
        {event.title}
      </div>
    </div>
  );
};

interface CalendarViewProps {
  events: any[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  const [date, setDate] = useState(new Date(2026, 4, 8)); // 2026년 5월 8일로 설정
  const [view, setView] = useState<View>(Views.MONTH);

  const formattedEvents = events.map(event => {
    const category = getCategoryByTitle(event.title);
    return {
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
      category: category
    };
  });

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const handleSelectEvent = (event: any) => {
    alert(`📅 일정 상세 정보:\n\n유형: ${event.category}\n제목: ${event.title}\n시작: ${event.start.toLocaleString('ko-KR')}\n종료: ${event.end.toLocaleString('ko-KR')}\n캘린더: ${event.calendarName || '기본'}`);
  };

  const eventPropGetter = (event: any) => {
    const style = categoryStyles[event.category] || categoryStyles['기타'];
    return {
      style: {
        backgroundColor: style.bg,
        borderLeft: `4px solid ${style.border}`,
        borderRadius: '6px',
        display: 'block',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: 'none'
      }
    };
  };

  return (
    <div className="h-[700px] apple-calendar-container bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
      <style jsx global>{`
        .rbc-calendar {
          font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
          color: #1d1d1f;
        }
        .rbc-month-view { border: none !important; }
        .rbc-day-bg { border-left: 1px solid #f5f5f7 !important; }
        .rbc-month-row { border-top: 1px solid #f5f5f7 !important; }
        .rbc-event {
          padding: 0 !important;
          margin: 1px 2px !important;
          border: none !important;
        }
        .rbc-today { background-color: rgba(255, 59, 48, 0.05) !important; }
        .rbc-month-view .rbc-today .rbc-button-link {
          background: #ff3b30;
          color: white !important;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 4px auto;
        }
        .rbc-toolbar {
          padding: 20px;
          background: #fbfbfd;
          border-bottom: 1px solid #d2d2d7;
        }
        .rbc-toolbar button {
          color: #007aff !important;
          border: none !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          cursor: pointer;
        }
        .rbc-toolbar button.rbc-active { background: #e8e8ed !important; border-radius: 6px !important; }
      `}</style>
      <Calendar
        localizer={localizer}
        events={formattedEvents}
        date={date}
        view={view}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventPropGetter}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        components={{ event: EventComponent }}
        culture="ko-KR"
        messages={{
          next: "다음",
          previous: "이전",
          today: "오늘",
          month: "월",
          week: "주",
          day: "일",
          agenda: "일정",
          showMore: (total) => `+${total}개 더 보기`,
        }}
      />
    </div>
  );
};

export default CalendarView;
