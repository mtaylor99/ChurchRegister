using ChurchRegister.Database.Entities;

namespace ChurchRegister.Tests.Builders;

/// <summary>
/// Fluent builder for creating EventAttendance test data with sensible defaults.
/// Usage: AttendanceRecordBuilder.AnAttendanceRecord().ForEvent(1).OnDate(DateTime.Now).WithAttendance(45).Build()
/// </summary>
public class AttendanceRecordBuilder
{
    private int _eventId = 1;
    private DateTime _date = DateTime.UtcNow.Date;
    private int _attendance = 35;

    private AttendanceRecordBuilder()
    {
    }

    public static AttendanceRecordBuilder AnAttendanceRecord() => new();

    public AttendanceRecordBuilder ForEvent(int eventId)
    {
        _eventId = eventId;
        return this;
    }

    public AttendanceRecordBuilder OnDate(DateTime date)
    {
        _date = date.Date; // Ensure time component is removed
        return this;
    }

    public AttendanceRecordBuilder WithAttendance(int attendance)
    {
        _attendance = attendance;
        return this;
    }

    // Convenience methods
    public AttendanceRecordBuilder Today()
    {
        _date = DateTime.UtcNow.Date;
        return this;
    }

    public AttendanceRecordBuilder Yesterday()
    {
        _date = DateTime.UtcNow.Date.AddDays(-1);
        return this;
    }

    public AttendanceRecordBuilder LastSunday()
    {
        var today = DateTime.UtcNow.Date;
        var daysSinceSunday = ((int)today.DayOfWeek + 7) % 7;
        _date = today.AddDays(-daysSinceSunday - (daysSinceSunday == 0 ? 7 : 0));
        return this;
    }

    public AttendanceRecordBuilder ThisSunday()
    {
        var today = DateTime.UtcNow.Date;
        var daysSinceSunday = ((int)today.DayOfWeek + 7) % 7;
        _date = today.AddDays(daysSinceSunday == 0 ? 0 : 7 - daysSinceSunday);
        return this;
    }

    public AttendanceRecordBuilder ThisWeek()
    {
        _date = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek);
        return this;
    }

    public AttendanceRecordBuilder LastWeek()
    {
        _date = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek - 7);
        return this;
    }

    public AttendanceRecordBuilder ThisMonth()
    {
        _date = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        return this;
    }

    public AttendanceRecordBuilder LastMonth()
    {
        var lastMonth = DateTime.UtcNow.AddMonths(-1);
        _date = new DateTime(lastMonth.Year, lastMonth.Month, 1);
        return this;
    }

    public AttendanceRecordBuilder LowAttendance()
    {
        _attendance = 15;
        return this;
    }

    public AttendanceRecordBuilder AverageAttendance()
    {
        _attendance = 35;
        return this;
    }

    public AttendanceRecordBuilder HighAttendance()
    {
        _attendance = 75;
        return this;
    }

    public AttendanceRecordBuilder NoAttendance()
    {
        _attendance = 0;
        return this;
    }

    public EventAttendance Build()
    {
        return new EventAttendance
        {
            EventId = _eventId,
            Date = _date,
            Attendance = _attendance
        };
    }
}
