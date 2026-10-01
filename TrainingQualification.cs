using System;
using System.Linq;
using System.Text.Json.Nodes;

namespace PWADC.SecurityOperationsSuite;

internal static class FacilityCalendar
{
    public static string Today() => TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("America/Chicago")).ToString("yyyy-MM-dd");
}

internal static class TrainingQualification
{
    public static JsonObject? LatestEffective(JsonArray events, string type, string asOf = "9999-12-31")
    {
        var rows = events.OfType<JsonObject>().ToArray();
        return rows.Where(x => x["type"]?.ToString() == type && string.CompareOrdinal(x["date"]?.ToString() ?? "", asOf) <= 0 &&
            !rows.Any(v => v["type"]?.ToString() == "void" && v["reference"]?.ToString() == x["id"]?.ToString()))
            .OrderBy(x => x["at"]?.ToString(), StringComparer.Ordinal).LastOrDefault();
    }
    public static JsonObject? CurrentSignoff(JsonObject assignment, JsonObject requirement, string asOf)
    {
        if (assignment["status"]?.ToString() != "active" || requirement["active"]?.ToString() == "false") return null;
        JsonArray events = assignment["events"] as JsonArray ?? new();
        var sign = LatestEffective(events, "signoff", asOf);
        if (sign == null) return null;
        foreach (string type in new[] { "record", "retrain" })
        {
            var later = LatestEffective(events, type, asOf);
            if (later != null && string.CompareOrdinal(later["at"]?.ToString(), sign["at"]?.ToString()) >= 0) return null;
        }
        int days = int.TryParse(requirement["renewalDays"]?.ToString(), out int value) ? value : 0;
        if (!DateTime.TryParseExact(sign["date"]?.ToString(), "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var date)) return null;
        if (days > 0 && string.CompareOrdinal(date.AddDays(days).ToString("yyyy-MM-dd"), asOf) < 0) return null;
        return sign;
    }
}
