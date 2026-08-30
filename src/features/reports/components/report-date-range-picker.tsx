import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/date'
import {
  buildReportDateRange,
  isValidReportDateRange,
  NAMED_REPORT_DATE_RANGE_PRESETS,
  REPORT_DATE_RANGE_PRESET_LABEL,
} from '@/features/reports/utils/report-date-range'
import type { ReportDateRange, ReportDateRangePreset } from '@/features/reports/types/report'

/**
 * Reusable reporting date-range control (Phase 7.1 foundation) — every
 * future report page reuses this one component instead of a per-report
 * date picker (requirement §57). Fully controlled, no internal state: a
 * `custom` edit is emitted to `onChange` immediately even while
 * momentarily invalid (`from > to`), so the inputs never fight the user's
 * typing — validity is a pure, derived read of `value` (shown inline here,
 * and used by the caller to gate the report query itself via
 * `isValidReportDateRange`).
 *
 * Native `<input type="date">` for the custom bounds, same as
 * `OrderFilters`' `fromDate`/`toDate` — no calendar-picker library
 * introduced just for this (requirement §45).
 */
export function ReportDateRangePicker({
  value,
  onChange,
  className,
}: {
  value: ReportDateRange
  onChange: (range: ReportDateRange) => void
  className?: string
}) {
  const isValid = isValidReportDateRange(value)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={value.preset}
          onValueChange={(preset) => onChange(buildReportDateRange(preset as ReportDateRangePreset, value))}
        >
          <SelectTrigger
            className="w-48"
            aria-label="Chọn khoảng thời gian báo cáo"
            data-tour="report-date-range-preset"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NAMED_REPORT_DATE_RANGE_PRESETS.map((preset) => (
              <SelectItem key={preset} value={preset}>
                {REPORT_DATE_RANGE_PRESET_LABEL[preset]}
              </SelectItem>
            ))}
            <SelectItem value="custom">{REPORT_DATE_RANGE_PRESET_LABEL.custom}</SelectItem>
          </SelectContent>
        </Select>

        {value.preset === 'custom' ? (
          <div className="flex flex-wrap items-center gap-2" data-tour="report-date-range-custom">
            <Label htmlFor="report-range-from" className="text-sm text-muted-foreground">
              Từ
            </Label>
            <Input
              id="report-range-from"
              type="date"
              className="w-40"
              value={value.from}
              onChange={(event) => onChange({ preset: 'custom', from: event.target.value, to: value.to })}
            />
            <Label htmlFor="report-range-to" className="text-sm text-muted-foreground">
              đến
            </Label>
            <Input
              id="report-range-to"
              type="date"
              className="w-40"
              value={value.to}
              onChange={(event) => onChange({ preset: 'custom', from: value.from, to: event.target.value })}
            />
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {formatDate(value.from)} – {formatDate(value.to)}
          </span>
        )}
      </div>

      {!isValid && (
        <p role="alert" className="text-sm text-destructive">
          Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
        </p>
      )}
    </div>
  )
}
