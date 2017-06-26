'use strict'

const day = 24 * 60 * 60 * 1000

const watchers = {} // todo: persistence

const start = (user, cb) => {
	watchers[user] = setInterval(cb, day)
}

const stop = (user) => {
	clearInterval(watchers[user])
	watchers[user] = null
}

module.exports = {start, stop}
