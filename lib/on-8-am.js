'use strict'

const floor = require('floordate')

const hour = 60 * 60 * 1000
const day = 24 * hour
const tomorrow8am = () => +floor(new Date(), 'day') + day + 8 * hour

const on8am = (cb) => {
	setTimeout(() => {
		setTimeout(tomorrow8am() - Date.now())
		cb()
	}, tomorrow8am() - Date.now())
}

module.exports = on8am
