'use client';

import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, List, CheckCircle2, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import 'react-big-calendar/lib/css/react-big-calendar.css';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

const categoryStyles: Record<string, { bg: string, border: string, text: string, shadow: string }> = {
  '과제/공부': { bg: '#FAF5FF', border: '#D8B4FE', text: '#9333EA', shadow: 'rgba(216, 180, 254, 0.3)' },
  '수업/강의': { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', shadow: 'rgba(191, 219, 254, 0.3)' },
  '식사/약속': { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A', shadow: 'rgba(187, 247, 208, 0.3)' },
  '취미/운동': { bg: '#FFF7ED', border: '#FDBA74', text: '#EA580C', shadow: 'rgba(253, 186, 116, 0.3)' },
  '기타': { bg: '#F8FAFC', border: '#CBD5E1', text: '#475569', shadow: 'rgba(203, 213, 225, 0.3)' },
};

const CustomToolbar = (toolbar: any) => {
  const goToBack = () => { toolbar.onNavigate('PREV'); };
  const goToNext = () => { toolbar.onNavigate('NEXT'); };
  const goToCurrent = () => { toolbar.onNavigate('TODAY'); };
  const label = () => {
    const date = toolbar.date;
    return (
      <span className="text-xl font-bold text-slate-900">
        {date.getFullYear()}년 {date.getMonth() + 1}월
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
      <div className="flex items-center gap-4">
        <button onClick={goToCurrent} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">오늘</button>
        <div className="flex items-center gap-1">
          <button onClick={goToBack} className="p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><ChevronLeft size={20} /></button>
          <button onClick={goToNext} className="p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><ChevronRight size={20} /></button>
        </div>
        {label()}
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl">
        {[
          { id: Views.MONTH, label: '월', icon: LayoutGrid },
          { id: Views.WEEK, label: '주', icon: CalendarIcon },
          { id: Views.DAY, label: '일', icon: List },
        ].map((viewOption) => (
          <button key={viewOption.id} onClick={() => toolbar.onView(viewOption.id)} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all", toolbar.view === viewOption.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <viewOption.icon size={16} />
            {viewOption.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const EventComponent = ({ event }: any) => {
  const style = categoryStyles[event.category] || categoryStyles['기타'];
  return (
    <div className="px-2 h-full flex items-center">
      <div className="text-[11px] font-bold leading-none truncate" style={{ color: style.text }}>{event.title}</div>
    </div>
  );
};

interface CalendarViewProps {
  events: any[];
  currentDate: Date;
  onNavigate: (date: Date) => void;
  categoryMap: Record<string, string>;
  onClassify: (title: string, category: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, currentDate, onNavigate, categoryMap, onClassify }) => {
  const [view, setView] = useState<View>(Views.MONTH);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  const getCategory = (title: string): string => {
    // 1. Check manual mapping first (exact title match)
    if (categoryMap[title]) return categoryMap[title];

    // 2. Check if title contains any mapped keywords
    for (const [key, cat] of Object.entries(categoryMap)) {
      if (title.includes(key)) return cat;
    }

    // 3. Fallback to keyword-based detection
    const t = title.toLowerCase();
    if (t.includes('과제') || t.includes('공부') || t.includes('시험') || t.includes('학습')) return '과제/공부';
    if (t.includes('수업') || t.includes('강의') || t.includes('세미나') || t.includes('특강')) return '수업/강의';
    if (t.includes('식사') || t.includes('약속') || t.includes('미팅') || t.includes('회식')) return '식사/약속';
    if (t.includes('취미') || t.includes('운동') || t.includes('헬스') || t.includes('요가') || t.includes('게임')) return '취미/운동';
    return '기타';
  };

  const handleClassify = (category: string) => {
    if (!selectedEvent) return;
    onClassify(selectedEvent.title, category);
    setIsClassifying(false);
    setSelectedEvent(null);
  };

  const formattedEvents = events.map(event => {
    const category = getCategory(event.title);
    return {
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
      category: category
    };
  });

  const eventPropGetter = (event: any) => {
    const style = categoryStyles[event.category] || categoryStyles['기타'];
    return {
      className: "hover:scale-[1.02] transition-transform duration-200 cursor-pointer",
      style: {
        backgroundColor: style.bg,
        borderLeft: `3px solid ${style.border}`,
        borderRadius: '6px',
        display: 'block',
        boxShadow: `0 2px 4px ${style.shadow}`,
        margin: '1px 2px',
        borderTop: 'none', borderRight: 'none', borderBottom: 'none'
      }
    };
  };

  return (
    <div className="h-[750px] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-100 overflow-hidden flex flex-col relative">
      <style jsx global>{`
        .rbc-calendar { font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; }
        .rbc-month-view { border: none !important; padding: 10px; }
        .rbc-month-header { margin-bottom: 10px; }
        .rbc-header { border: none !important; color: #94a3b8 !important; font-size: 12px !important; font-weight: 700 !important; text-transform: uppercase; padding: 10px 0 !important; }
        .rbc-day-bg { border: none !important; background-color: transparent !important; }
        .rbc-month-row { border: none !important; overflow: visible !important; flex: 1 0 0 !important; }
        .rbc-date-cell { padding: 8px !important; text-align: center !important; font-size: 13px !important; font-weight: 500 !important; color: #64748b !important; }
        .rbc-off-range-bg { background-color: transparent !important; opacity: 0.3; }
        .rbc-today { background-color: transparent !important; }
        .rbc-today .rbc-button-link { background: #1e293b !important; color: white !important; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; box-shadow: 0 4px 10px rgba(30, 41, 59, 0.3); }
        
        /* Month View Specifics */
        .rbc-month-view .rbc-event { padding: 0 !important; background: none !important; height: 24px !important; margin-bottom: 2px !important; }
        .rbc-month-view .rbc-month-row { border: none !important; overflow: visible !important; flex: 1 0 0 !important; }
        .rbc-month-view .rbc-row-content { z-index: 2 !important; height: 95px !important; overflow: hidden !important; }
        
        /* Week/Day View Specifics */
        .rbc-time-view { border: none !important; background: white !important; border-radius: 24px !important; }
        .rbc-time-header { border-bottom: 1px solid #f1f5f9 !important; padding-right: 0 !important; }
        .rbc-time-header-content { border-left: 1px solid #f1f5f9 !important; }
        .rbc-allday-cell { min-height: 80px !important; }
        .rbc-time-content { border: none !important; border-top: 1px solid #f1f5f9 !important; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .rbc-time-content::-webkit-scrollbar { width: 6px; }
        .rbc-time-content::-webkit-scrollbar-track { background: transparent; }
        .rbc-time-content::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; border: 2px solid transparent; }
        
        .rbc-time-slot { border-top: 1px solid #f8fafc !important; }
        .rbc-timeslot-group { border-bottom: 1px solid #f1f5f9 !important; min-height: 64px !important; }
        
        /* Time Grid Events */
        .rbc-time-view .rbc-event { border: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.02) !important; padding: 8px 12px !important; display: flex !important; flex-direction: column !important; justify-content: flex-start !important; border-radius: 12px !important; border-left: 4px solid currentColor !important; }
        .rbc-time-view .rbc-event-label { font-size: 9px !important; font-weight: 800 !important; opacity: 0.5; margin-bottom: 3px; }
        .rbc-time-view .rbc-event-content { font-size: 11px !important; font-weight: 800 !important; line-height: 1.4 !important; }

        /* Fix Today Header in Week View */
        .rbc-header.rbc-today { background-color: #f8faff !important; font-weight: 900 !important; }
        .rbc-header.rbc-today > span { color: #1e293b !important; }

        .rbc-show-more { background: #f8fafc !important; color: #64748b !important; font-size: 10px !important; font-weight: 800 !important; border-radius: 6px !important; padding: 2px 8px !important; margin-left: 4px !important; transition: all 0.2s; }
        .rbc-show-more:hover { background: #f1f5f9 !important; color: #1e293b !important; }
        
        /* Popup Styling */
        .rbc-overlay { background-color: white !important; border-radius: 20px !important; border: 1px solid #f1f5f9 !important; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15) !important; padding: 12px !important; z-index: 100 !important; }
        .rbc-overlay-header { display: none !important; }
        .rbc-overlay .rbc-event { margin-bottom: 6px !important; height: 24px !important; }
        
        /* Shared */
        .rbc-row-segment { padding: 1px !important; }
      `}</style>
      <Calendar
        localizer={localizer}
        events={formattedEvents}
        date={currentDate}
        view={view}
        onNavigate={onNavigate}
        onView={setView}
        eventPropGetter={eventPropGetter}
        onSelectEvent={(event) => { setSelectedEvent(event); setIsClassifying(true); }}
        startAccessor="start"
        endAccessor="end"
        style={{ flex: 1 }}
        views={['month', 'week', 'day']}
        components={{ event: EventComponent, toolbar: CustomToolbar }}
        culture="ko-KR"
        popup={true}
        allDayMaxRows={2}
        messages={{
          next: "다음", previous: "이전", today: "오늘", month: "월", week: "주", day: "일", agenda: "일정",
          showMore: (total) => `+${total}개 더보기`,
        }}
      />
      {/* Category Legend at the bottom */}
      <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30 flex justify-center gap-6">
        {Object.entries(categoryStyles).map(([name, style]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.text }}></span>
            <span className="text-[11px] font-bold text-slate-500">{name}</span>
          </div>
        ))}
      </div>

      {/* Classification Modal */}
      {isClassifying && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <Info className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">일정 종류 구분</h3>
                <p className="text-sm text-slate-500 font-medium leading-none mt-1">이 일정은 어떤 종류인가요?</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl mb-8 border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">SELECTED EVENT</span>
              <p className="text-slate-800 font-black text-lg">"{selectedEvent.title}"</p>
            </div>

            <div className="space-y-3 mb-8">
              {Object.entries(categoryStyles).map(([name, style]) => (
                <button
                  key={name}
                  onClick={() => handleClassify(name)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: style.text }}></span>
                    <span className="font-bold text-slate-700">{name}</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-indigo-200 group-hover:text-indigo-600 transition-colors" />
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 text-center font-bold px-4">
              ✨ 선택한 종류에 따라 <span className="text-indigo-600">앞으로 같은 이름의 모든 일정</span>이 자동으로 통일되어 표시됩니다.
            </p>

            <button 
              onClick={() => setIsClassifying(false)}
              className="w-full mt-6 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
