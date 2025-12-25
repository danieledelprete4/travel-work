import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import WorkDayModal from "./WorkDayModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Calendar({ month, year, onMonthChange, locations, settings }) {
  const [workDays, setWorkDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkDays();
  }, [month, year]);

  const loadWorkDays = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/workdays`, {
        params: { month: month.toString(), year: year.toString() }
      });
      setWorkDays(response.data);
    } catch (error) {
      console.error("Error loading workdays:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month - 1, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert to Monday = 0
  };

  const handleDayClick = (day) => {
    const dateStr = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    // Ricarica i dati dopo aver chiuso il modal
    setTimeout(() => {
      loadWorkDays();
    }, 100);
  };

  const getWorkDayForDate = (day) => {
    const dateStr = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    return workDays.find(wd => wd.date === dateStr);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square min-h-[80px] sm:min-h-[120px]"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const workDay = getWorkDayForDate(day);
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() + 1 === month && 
                      new Date().getFullYear() === year;

      days.push(
        <div
          key={day}
          data-testid={`calendar-day-${day}`}
          onClick={() => handleDayClick(day)}
          className={`calendar-day aspect-square min-h-[80px] sm:min-h-[120px] p-2 sm:p-3 border rounded-lg cursor-pointer relative ${
            isToday ? "border-blue-500 border-2" : "border-slate-200"
          } ${
            workDay?.city ? "bg-green-50 hover:bg-green-100" : 
            workDay?.status ? "bg-orange-50 hover:bg-orange-100" : 
            "bg-white hover:bg-slate-50"
          }`}
        >
          {/* Day Number */}
          <div className="text-xs sm:text-sm font-bold text-slate-700 mb-1">{day}</div>
          
          {workDay && (
            <div className="space-y-1">
              {workDay.city && (
                <>
                  {/* City Name */}
                  <div className="text-[10px] sm:text-xs font-semibold text-green-700 truncate">
                    {workDay.city}
                  </div>
                  
                  {/* KM - Mobile Only shows this */}
                  <div className="text-[9px] sm:text-xs text-slate-600 flex items-center">
                    <span className="mr-1">🚗</span>
                    <span className="font-medium">{workDay.total_km} km</span>
                  </div>
                  
                  {/* Times - Hidden on very small screens */}
                  <div className="hidden sm:block text-[9px] sm:text-[10px] text-slate-500 space-y-0.5">
                    <div>↗️ {workDay.departure_from_home}</div>
                    <div>↘️ {workDay.return_home}</div>
                  </div>
                </>
              )}
              {workDay.status && (
                <div className="text-[10px] sm:text-xs font-semibold text-orange-700">
                  {workDay.status}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-lg text-slate-600">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={() => onMonthChange("prev")}
          data-testid="prev-month-btn"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Mese precedente"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-lg sm:text-2xl font-bold text-slate-800">
          {monthNames[month - 1]} {year}
        </h2>
        
        <button
          onClick={() => onMonthChange("next")}
          data-testid="next-month-btn"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Mese successivo"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {[
          { short: "L", long: "Lun" },
          { short: "M", long: "Mar" },
          { short: "M", long: "Mer" },
          { short: "G", long: "Gio" },
          { short: "V", long: "Ven" },
          { short: "S", long: "Sab" },
          { short: "D", long: "Dom" }
        ].map((day, idx) => (
          <div key={idx} className="text-center text-[10px] sm:text-sm font-semibold text-slate-600 py-2">
            <span className="sm:hidden">{day.short}</span>
            <span className="hidden sm:inline">{day.long}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-slate-600">Giorno lavorativo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span className="text-slate-600">Riposo/Festivo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white border-2 border-blue-500 rounded"></div>
            <span className="text-slate-600">Oggi</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <WorkDayModal
          date={selectedDate}
          workDay={workDays.find(wd => wd.date === selectedDate)}
          locations={locations}
          settings={settings}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export default Calendar;