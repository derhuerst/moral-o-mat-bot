'use strict'

const path = require('path')
const level = require('level')

const p = path.join(__dirname, '..', process.env.DB || 'moral-o-mat-bot.ldb')
const db = level(p)

const add = user => db.put(user, Date.now())
const del = user => db.del(user)
const all = () => db.createKeyStream()

module.exports = {add, del, all}
