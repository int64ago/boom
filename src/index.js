// By Cody 08/23/2017

const chalk = require('chalk')
const co = require('co')

const { deploy, sleep, checkRemoteMaster } = require('./helper')
const {
  chooseEnv,
  chooseType,
  chooseVersion,
  confirm
} = require('./handler')

const { DAILY, PUBLISH } = require('./constant')

function * main () {
  yield checkRemoteMaster()
  const { env } = yield chooseEnv()
  const { type } = yield chooseType(env)
  const { version } = yield chooseVersion[type](env)
  const { isConfirm } = yield confirm({ version, env })
  if (isConfirm) {
    yield deploy(version, DAILY)
    if (env === PUBLISH) {
      yield sleep(5000)
      yield deploy(version, PUBLISH)
    }
  } else {
    throw new Error('Deploy failed!')
  }
}

module.exports = function (callback) {
  co(main).then(() => {
    callback && callback()
  }).catch(err => {
    console.error(`${chalk.red(err.message || err)}`)
    process.exit()
  })
}
