import { addDays, format, startOfDay } from "date-fns"

export const OPEN_HOUR = 9
export const CLOSE_HOUR = 21
export const STEP_MINUTES = 30

export const buildTimeOptions = (): string[] => {
    const options: string[] = []

    for (let minutes = OPEN_HOUR * 60; minutes <= CLOSE_HOUR * 60; minutes += STEP_MINUTES) {
        const hours = String(Math.floor(minutes / 60)).padStart(2, "0")
        const mins = String(minutes % 60).padStart(2, "0")
        options.push(`${hours}:${mins}`)
    }

    return options
}

export const toDateTime = (day: Date, time: string): Date => {
    return new Date(`${format(day, "yyyy-MM-dd")}T${time}:00`)
}

export const dayRangeIso = (day: Date): { from: string, to: string } => {
    const start = startOfDay(day)
    return { from: start.toISOString(), to: addDays(start, 1).toISOString() }
}

export const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean => {
    return aStart < bEnd && aEnd > bStart
}