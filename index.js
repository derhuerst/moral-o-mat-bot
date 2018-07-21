'use strict'

const Bot = require('telegraf')
const escape = require('js-string-escape')
const moralOMat = require('moral-o-mat')
const through = require('through2')
const level = require('level')
const floor = require('floordate')
const {format: formatUrl} = require('url')

const watching = require('./lib/watching')
const on8am = require('./lib/on-8-am')

const TOKEN = process.env.TOKEN
if (!TOKEN) {
	console.error('Missing TOKEN env var.')
	process.exit(1)
}

const logErr = (err) => {
	if (process.env.NODE_ENV === 'dev') console.error(err)
	else console.error(err && err.message || (err + ''))
}

const helpMsg = `\
\`/moral\` – Schickt eine einzelne Moral.
\`/start\` – Wird dir jeden Morgen eine Moral schicken.
\`/stop\` – Damit aufhören.`
const errMsg = `\
Shit! Irgendwas stimmt hier nicht. Bitte probier das noch mal.`

const bot = new Bot(TOKEN)
bot.telegram.getMe().then(({username}) => {
	bot.options.username = username
})

bot.use(async (ctx, next) => {
	if (!ctx.chat || !ctx.chat.id) return null
	ctx.user = ctx.chat.id

	const t0 = Date.now()
	await next(ctx)
	const d = Date.now() - t0

	const msg = ctx.message
	console.info([
		d + 'ms',
		msg && msg.date || '[unknown date]',
		ctx.user,
		msg && msg.text && escape(msg.text.slice(0, 30)) || '[no message]'
	].join(' '))
})

bot.command('/moral', ctx => ctx.reply(moralOMat()))

bot.command('/start', async (ctx) => {
	try {
		await watching.add(ctx.user)
		await ctx.reply('Okay, werde dir morgen um 8 was schicken.')
	} catch (err) {
		logErr(err)
		await ctx.reply(errMsg)
	}
})
bot.command('/stop', async (ctx) => {
	try {
		await watching.del(ctx.user)
		await ctx.reply('Okay, Message angekommen…')
	} catch (err) {
		logErr(err)
		await ctx.reply(errMsg)
	}
})

bot.use(ctx => ctx.replyWithMarkdown(helpMsg))

on8am(() => {
	const msg = moralOMat()
	let receivers = 0

	watching.all()
	.pipe(through.obj((user, _, cb) => {
		receivers++
		bot.telegram.sendMessage(user, msg)
		.then(() => cb())
		.catch(cb)
	}))
	.on('data', () => {})
	.once('finish', () => {
		console.info(`Notified ${receivers} people about ${beer.name}.`)
	})
	.once('error', logErr)
})

if (process.env.NODE_ENV === 'dev') {
	console.info('using polling')

	bot.telegram.deleteWebhook()
	.then(() => bot.startPolling())
	.catch(logErr)
} else {
	console.info('using web hook')

	const WEB_HOOK_HOST = process.env.WEB_HOOK_HOST
	if (!WEB_HOOK_HOST) {
		console.error('Missing WEB_HOOK_HOST env var.')
		process.exit(1)
	}
	const WEB_HOOK_PATH = process.env.WEB_HOOK_PATH
	if (!WEB_HOOK_PATH) {
		console.error('Missing WEB_HOOK_PATH env var.')
		process.exit(1)
	}
	const WEB_HOOK_PORT = process.env.WEB_HOOK_PORT && parseInt(process.env.WEB_HOOK_PORT)
	if (!WEB_HOOK_PORT) {
		console.error('Missing WEB_HOOK_PORT env var.')
		process.exit(1)
	}

	bot.webhookReply = false
	bot.telegram.setWebhook(formatUrl({
		protocol: 'https',
		host: WEB_HOOK_HOST,
		pathname: WEB_HOOK_PATH
	}))
	bot.startWebhook(WEB_HOOK_PATH, null, WEB_HOOK_PORT)
}

bot.catch(console.error)
