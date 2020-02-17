
import suncalc from 'suncalc'
import dateFormat from 'dateformat'

export const getRecords=(date) => {

    const priorDate = new Date()
    priorDate.setDate(date.getDate() - 1)

    const dateSun = suncalc.getTimes(date, 43.884054, -72.285053)
    const priorDaySun = suncalc.getTimes(priorDate, 43.884054, -72.285053)

    const prettyDate = dateFormat(date, 'mm-dd-yyyy')
    const prettyPriorDate = dateFormat(priorDate, 'mm-dd-yyyy')

    return [
        { name: `${prettyPriorDate}_to_${prettyDate}_overnight`, start: priorDaySun.sunset.getTime(), end: dateSun.sunrise.getTime() },
        { name: `${prettyDate}_sunrise`, start: dateSun.sunrise.getTime() - (30 * 60 * 1000), end: dateSun.sunrise.getTime() + (180 * 60 * 1000) },
        { name: `${prettyDate}_full_day`, start: dateSun.sunrise.getTime() - (30 * 60 * 1000), end: dateSun.sunset.getTime() + (30 * 60 * 1000) },
        { name: `${prettyDate}_sunset`, start: dateSun.sunset.getTime() - (180 * 60 * 1000), end: dateSun.sunset.getTime() + (30 * 60 * 1000) }
    ]

}
