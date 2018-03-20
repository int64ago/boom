#!/usr/bin/env node

const updateNotifier = require('update-notifier')
const chalk = require('chalk')
const boom = require('./src/index')
const pkg = require('./package')

updateNotifier({ pkg }).notify()

const args = process.argv.slice(2)
if (args[0] && (args[0] === '-v' || args[0] === '--version')) {
  console.log(pkg.version)
  process.exit()
}

boom(() => {
  const message = '\nDeployed successfully!'
  console.log(`${chalk.green(message)}`)
})
