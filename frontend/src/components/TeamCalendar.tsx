import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PublicHoliday, LeaveRequest } from '../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Users,
  Info,
} from 'lucide-react';

interface TeamCalendarProps {
  initialDepartment?: string;
  onSelectDate?: (dateStr: string) => void;
}

export const TeamCalendar: React.FC<TeamCalendarProps> = ({
  initialDepartment = 'ALL',
  onSelectDate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartment);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDayDetails, setSelectedDayDetails] = useState<{
    date: Date;
    holidays: PublicHoliday[];
    leaves: LeaveRequest[];
  } | null>(null);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const res = await api.get('/leave/team-calendar', {
        params: {
          department: selectedDept !== 'ALL' ? selectedDept : undefined,
          month,
          year,
        },
      });
      setHolidays(res.data.holidays || []);
      setLeaves(res.data.leaves || []);
    } catch (err) {
      console.error('Lỗi tải lịch phòng ban:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, selectedDept]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Bắt đầu từ Thứ 2
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Tạo các ngày trong lưới
  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getHolidaysForDay = (d: Date) => {
    return holidays.filter((h) => isSameDay(parseISO(h.date), d));
  };

  const getLeavesForDay = (d: Date) => {
    return leaves.filter((l) => {
      const start = parseISO(l.startDate);
      const end = parseISO(l.endDate);
      return (
        (d >= start && d <= end) ||
        isSameDay(d, start) ||
        isSameDay(d, end)
      );
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 1. THANH ĐIỀU KHIỂN & BỘ LỌC */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: vi })}
            </h2>
            <p className="text-xs text-slate-500">
              Lịch trực quan theo dõi ngày phép & ngày Lễ toàn công ty
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
          {/* Chọn phòng ban */}
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toàn công ty</option>
              <option value="Kỹ thuật">Phòng Kỹ thuật</option>
              <option value="Nhân sự">Phòng Nhân sự</option>
              <option value="Kinh doanh">Phòng Kinh doanh</option>
            </select>
          </div>

          {/* Điều hướng Tháng */}
          <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-md transition"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition"
            >
              Hôm nay
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-md transition"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. CHÚ THÍCH MÃ MÀU CHUẨN SRS (4 MÀU) */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
        <span className="text-slate-400 font-normal">Quy ước màu sắc:</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
          <span>🟢 Đi làm (Present)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-200"></span>
          <span>🔴 Nghỉ phép (On Leave)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-200"></span>
          <span>🟡 Nghỉ nửa ngày (Half-day)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-200"></span>
          <span>🔵 Ngày Lễ/Tết (Public Holiday)</span>
        </div>
      </div>

      {/* 3. LƯỚI LỊCH THÁNG */}
      <div className="p-4">
        {/* Tiêu đề các thứ trong tuần */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-500 uppercase">
          <div>Thứ 2</div>
          <div>Thứ 3</div>
          <div>Thứ 4</div>
          <div>Thứ 5</div>
          <div>Thứ 6</div>
          <div className="text-rose-500">Thứ 7</div>
          <div className="text-rose-500">Chủ Nhật</div>
        </div>

        {/* Lưới ô ngày */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((d, index) => {
            const isCurrentMonth = isSameMonth(d, monthStart);
            const isToday = isSameDay(d, new Date());
            const dayHolidays = getHolidaysForDay(d);
            const dayLeaves = getLeavesForDay(d);
            const hasHoliday = dayHolidays.length > 0;
            const hasLeaves = dayLeaves.length > 0;

            return (
              <div
                key={index}
                onClick={() => {
                  setSelectedDayDetails({
                    date: d,
                    holidays: dayHolidays,
                    leaves: dayLeaves,
                  });
                  if (onSelectDate) {
                    onSelectDate(format(d, 'yyyy-MM-dd'));
                  }
                }}
                className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  !isCurrentMonth
                    ? 'bg-slate-50/50 border-slate-100 opacity-40'
                    : hasHoliday
                    ? 'bg-blue-50/50 border-blue-200 hover:border-blue-400'
                    : hasLeaves
                    ? 'bg-amber-50/20 border-slate-200 hover:border-slate-400'
                    : 'bg-white border-slate-200 hover:border-blue-300'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                {/* Header ngày */}
                <div className="flex justify-between items-start">
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center -ml-0.5 -mt-0.5'
                        : hasHoliday
                        ? 'text-blue-700'
                        : isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {format(d, 'd')}
                  </span>

                  {/* Icon chỉ báo */}
                  {hasHoliday && (
                    <span className="w-2 h-2 rounded-full bg-blue-500" title="Ngày Lễ/Tết"></span>
                  )}
                </div>

                {/* Nội dung ngày (Lễ/Tết & Nghỉ phép) */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {/* Badge Ngày Lễ/Tết */}
                  {dayHolidays.map((h) => (
                    <div
                      key={h.id}
                      className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-semibold rounded truncate"
                      title={h.name}
                    >
                      🔵 {h.name}
                    </div>
                  ))}

                  {/* Danh sách nhân viên nghỉ */}
                  {dayLeaves.slice(0, 2).map((l) => {
                    const isHalfDay = l.leaveUnit === 'MORNING' || l.leaveUnit === 'AFTERNOON';
                    return (
                      <div
                        key={l.id}
                        className={`px-1.5 py-0.5 text-[10px] font-medium rounded truncate flex items-center space-x-1 ${
                          isHalfDay
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                        title={`${l.user?.fullName} (${l.leaveUnit}) - ${l.reason}`}
                      >
                        <span>{isHalfDay ? '🟣' : '🔴'}</span>
                        <span className="truncate">{l.user?.fullName}</span>
                      </div>
                    );
                  })}

                  {dayLeaves.length > 2 && (
                    <div className="text-[9px] font-semibold text-slate-500 text-right pr-1">
                      +{dayLeaves.length - 2} người nữa
                    </div>
                  )}
                </div>

                {/* Trạng thái nếu không có ai nghỉ và không phải ngày lễ */}
                {!hasHoliday && !hasLeaves && isCurrentMonth && (
                  <div className="text-[10px] text-emerald-600 font-medium flex items-center space-x-1 opacity-60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="hidden sm:inline">Đi làm</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MODAL CHI TIẾT KHI CLICK VÀO MỘT NGÀY */}
      {selectedDayDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Chi tiết ngày {format(selectedDayDetails.date, 'dd/MM/yyyy')}
                </h3>
                <p className="text-xs text-slate-500 capitalize">
                  {format(selectedDayDetails.date, 'EEEE', { locale: vi })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Ngày Lễ */}
            {selectedDayDetails.holidays.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-1">
                  🔵 Ngày Lễ / Tết Quốc Gia
                </span>
                {selectedDayDetails.holidays.map((h) => (
                  <div key={h.id} className="text-sm font-semibold text-blue-900">
                    {h.name}
                    {h.description && (
                      <p className="text-xs font-normal text-blue-700 mt-0.5">{h.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Danh sách người nghỉ */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Tình hình nhân sự vắng mặt ({selectedDayDetails.leaves.length})
              </span>
              {selectedDayDetails.leaves.length === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-medium">
                  🟢 Tất cả nhân sự trong phòng ban có mặt đi làm đầy đủ.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedDayDetails.leaves.map((l) => (
                    <div
                      key={l.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{l.user?.fullName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                            l.leaveUnit === 'FULL_DAY'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {l.leaveUnit === 'FULL_DAY' ? '🔴 Cả ngày' : '🟡 Nửa ngày'}
                        </span>
                      </div>
                      <p className="text-slate-500">
                        Phòng {l.user?.department} • {l.user?.position || 'Nhân viên'}
                      </p>
                      <p className="text-slate-700 italic">"{l.reason}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
