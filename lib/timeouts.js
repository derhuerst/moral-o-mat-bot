'use strict'

const persistTimeouts = require('persistent-timeout')

const setupTimeouts = (db, onTimeout) => {
	const timeouts = persistTimeouts(db, onTimeout)

	// get a DB entry
	const get = (key, cb) => {
		db.get(key, (err, val) => {
			if (err) {
				if (err.notFound) cb(null, null)
				else cb(err)
			} else cb(null, val)
		})
	}

	// store a timer
	const set = (chat, when, cb) => {
		const id = timeouts.timeout(when, chat, (err) => {
			if (err) return cb(err)

			db.put(chat, id, (err) => {
				if (err) cb(err)
				else cb(null, id)
			})
		})
	}

	// store a timer, but check remove an existing
	const put = (chat, when, cb) => {
		const next = () => set(chat, when, cb)

		get(chat, (err, id) => {
			if (err) return cb(err)

			if (id) {
				timeouts.removeTimeout(id, (err) => {
					if (err) cb(err)
					else next()
				})
			} else next()
		})
	}

	// clear a timer, but check if it exists
	const del = (chat, cb) => {
		get(chat, (err, id) => {
			if (err) return cb(err)

			if (id) {
				timeouts.removeTimeout(id, (err) => {
					if (err) cb(err)
					db.del(chat, cb)
				})
			} else cb()
		})
	}

	return {put, del}
}

module.exports = setupTimeouts
