'use strict'

const path = require('path')
const level = require('level')
const setupTimeouts = require('persistent-timeout')
const floor = require('floordate')
const Bot = require('node-telegram-bot-api')
const moralOMat = require('moral-o-mat')

const DB = process.env.DB || path.join(__dirname, 'db')

const TOKEN = process.env.TOKEN
if (!TOKEN) {
	console.error('Missing TOKEN env var.')
	process.exit(1)
}

const hour = 60 * 60 * 1000
const day = 24 * hour

const sendStatement = (user) => {
	timeouts.timeout(tomorrow8am(), user)
	bot.sendMessage(user, 'Guten Morgen! ' + moralOMat())
}

const db = level(DB)
const timeouts = setupTimeouts(db, sendStatement)

const tomorrow8am = () => new Date(+floor(new Date(), 'day') + day + 8 * hour)

const bot = new Bot(TOKEN, {polling: true})

bot.on('message', (msg) => {
	const user = msg.chat.id
	if (!msg.text) return
	const text = msg.text.trim()

	if (text === '/stop') {
		db.get(user, (err, id) => {
			if (err) return bot.sendMessage(user, 'Oops! ' + err.message)
			if (!id) return bot.sendMessage(user, 'Oops! No timer found.')

			timeouts.removeTimeout(id, (err) => {
				if (err) return bot.sendMessage(user, 'Oops! ' + err.message)

				bot.sendMessage(user, 'Okay, Message angekommen…')
			})
		})
	} else if (text === '/start') {
		bot.sendMessage(user, 'Happy Birthday! 🎉')
		const id = timeouts.timeout(tomorrow8am(), user, (err) => {
			if (err) return bot.sendMessage(user, 'Oops! ' + err.message)

			db.put(user, id, (err) => {
				if (err) return bot.sendMessage(user, 'Oops! ' + err.message)

				bot.sendMessage(user, 'Okay, werde dir morgen um 8 was schicken.')
			})
		})
	} else if (text === '/moral') {
		bot.sendMessage(user, moralOMat())
	}
})
