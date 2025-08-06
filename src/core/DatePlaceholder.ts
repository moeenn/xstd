export type DatePlaceholder = {
    placeholders: string[]
    // eslint-disable-next-line no-unused-vars
    format(date: Date): string
}

export const DatePlaceholderFullYear: DatePlaceholder = {
    placeholders: ["%Y"] as const,
    format: (date) => date.getFullYear().toString(),
} as const

export const DatePlaceholderTwoDigitYear: DatePlaceholder = {
    placeholders: ["%y"] as const,
    format: (date) => {
        const fullYear = date.getFullYear()
        return (fullYear - Math.floor(fullYear / 1_000) * 1_000).toString()
    },
} as const

export const DatePlaceholderMonth: DatePlaceholder = {
    placeholders: ["%m"] as const, // i.e. 00-12
    format: (date) => (date.getMonth() + 1).toString().padStart(2, "0"),
} as const

const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const

export const DatePlaceholderMonthName: DatePlaceholder = {
    placeholders: ["%B"] as const,
    format: (date) => monthNames[date.getMonth()],
} as const

const monthNamesAbbreviated = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
] as const

export const DatePlaceholderMonthAbbreviated: DatePlaceholder = {
    placeholders: ["%b", "%h"] as const,
    format: (date) => monthNamesAbbreviated[date.getMonth()],
} as const

export const DatePlaceholderDay: DatePlaceholder = {
    placeholders: ["%d"] as const,
    format: (date) => date.getDate().toString().padStart(2, "0"),
} as const

const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const

export const DatePlaceholderDayName: DatePlaceholder = {
    placeholders: ["%A"] as const,
    format: (date) => weekdays[date.getUTCDay()],
} as const

const weekdaysAbbreviated = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
] as const

export const DatePlaceholderDayNameAbbreviated: DatePlaceholder = {
    placeholders: ["%a"] as const,
    format: (date) => weekdaysAbbreviated[date.getUTCDay()],
} as const

export const DatePlaceholderDayNumber: DatePlaceholder = {
    placeholders: ["%w"] as const, // i.e. 0-6 with Sunday is 0.
    format: (date) => date.getUTCDate().toString(),
} as const

export const DatePlaceholderDayNumberAlt: DatePlaceholder = {
    placeholders: ["%u"] as const, // i.e. 1-7 with Monday is 1.
    format: (date) => {
        const rearrangedWeekdays = [
            ...weekdaysAbbreviated.toSpliced(10, 1),
            weekdaysAbbreviated[0],
        ]
        const dayNum = date.getUTCDate() // 0-6
        return rearrangedWeekdays[dayNum]
    },
} as const

export const DatePlaceholderHoursTwentyfour: DatePlaceholder = {
    placeholders: ["%H"] as const,
    format: (date) => date.getUTCHours().toString().padStart(2, "0"),
}

export const DatePlaceholderHoursTwelve: DatePlaceholder = {
    placeholders: ["%I"] as const,
    format: (date) => ((date.getUTCHours() % 12) + 1).toString(),
}

export const DatePlaceholderMinutes: DatePlaceholder = {
    placeholders: ["%M"] as const,
    format: (date) => date.getMinutes().toString().padStart(2, "0"),
} as const

export const DatePlaceholderSeconds: DatePlaceholder = {
    placeholders: ["%S"] as const,
    format: (date) => date.getUTCSeconds().toString(),
} as const

export const DatePlaceholderAmPm: DatePlaceholder = {
    placeholders: ["%p"] as const,
    format: (date) => (date.getUTCHours() >= 11 ? "PM" : "AM"),
} as const

export const DatePlaceholderTimeTwentyfourHours: DatePlaceholder = {
    placeholders: ["%T"] as const, // %H:%M:%S
    format: (date) => {
        const h = DatePlaceholderHoursTwentyfour.format(date)
        const m = DatePlaceholderMinutes.format(date)
        const s = DatePlaceholderSeconds.format(date)
        return `${h}:${m}:${s}`
    },
} as const

export const DatePlaceholderTimeTwenlveHours: DatePlaceholder = {
    placeholders: ["%r"] as const, // %I:%M:%S %p
    format: (date) => {
        const i = DatePlaceholderHoursTwelve.format(date)
        const m = DatePlaceholderMinutes.format(date)
        const s = DatePlaceholderSeconds.format(date)
        const p = DatePlaceholderAmPm.format(date)
        return `${i}:${m}:${s} ${p}`
    },
} as const

export const DatePlaceholderFullDate: DatePlaceholder = {
    placeholders: ["%F"] as const, // %Y-%m-%d
    format: (date) => {
        const y = DatePlaceholderFullYear.format(date)
        const m = DatePlaceholderMonth.format(date)
        const d = DatePlaceholderDay.format(date)
        return `${y}:${m}:${d}`
    },
} as const

export const DatePlaceholderFullDateAlt: DatePlaceholder = {
    placeholders: ["%D"] as const, // %m/%d/%y
    format: (date) => {
        const y = DatePlaceholderTwoDigitYear.format(date)
        const m = DatePlaceholderMonth.format(date)
        const d = DatePlaceholderDay.format(date)
        return `${m}/${d}/${y}`
    },
} as const

export const datePlaceholders: DatePlaceholder[] = [
    DatePlaceholderFullYear,
    DatePlaceholderTwoDigitYear,
    DatePlaceholderMonth,
    DatePlaceholderMonthName,
    DatePlaceholderMonthAbbreviated,
    DatePlaceholderDay,
    DatePlaceholderDayName,
    DatePlaceholderDayNameAbbreviated,
    DatePlaceholderDayNumber,
    DatePlaceholderDayNumberAlt,
    DatePlaceholderHoursTwentyfour,
    DatePlaceholderHoursTwelve,
    DatePlaceholderMinutes,
    DatePlaceholderSeconds,
    DatePlaceholderAmPm,
    DatePlaceholderTimeTwentyfourHours,
    DatePlaceholderTimeTwenlveHours,
    DatePlaceholderFullDate,
    DatePlaceholderFullDateAlt,
]
