import moment from 'moment'

export function formatDate(data) {
	const date = moment(data)
	const dayNamesInKo = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
	const dayName = dayNamesInKo[date.day()]
	const hour = date.format('HH')
	return `${date.format(`YYYY.MM.DD`)} ${dayName} ${date.format('HH:mm:ss')}`
	// return moment(data).format('YYYY.MM.DD dddd')
}