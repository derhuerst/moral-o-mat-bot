'use strict'

const Bot = require('node-telegram-bot-api')
const moralOMat = require('moral-o-mat')

const watchers = require('./lib/watchers')

const TOKEN = process.env.TOKEN
if (!TOKEN) {
	console.error('Missing TOKEN env var.')
	process.exit(1)
}

const bot = new Bot(TOKEN, {polling: true})

const sendStatement = (user) => () => {
	bot.sendMessage(user, 'Guten Morgen! ' + moralOMat())
}

bot.on('message', (msg) => {
	const user = msg.chat.id
	const text = msg.text.trim()

	if (text === '/stop') {
		watchers.stop(user)
		bot.sendMessage(user, 'Okay, Message angekommen…')
	} else if (text === '/start') {
		watchers.start(user, sendStatement(user))
		bot.sendMessage(user, 'Okay, werde dir was schicken.')
	}
})
