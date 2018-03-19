const { homedir } = require('os');
const { readFileSync } = require('fs');
const { exec } = require('child_process');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const ui = new inquirer.ui.BottomBar();

const { DAILY } = require('./constant');

// cache
let remoteVersions = null;

class Spin {
  constructor(text) {
    this.loader = [
      chalk.yellow(`/ ${text}...`),
      chalk.yellow(`| ${text}...`),
      chalk.yellow(`\\ ${text}...`),
      chalk.yellow(`- ${text}...`),
    ];
    let i = 4;
    this.timer = setInterval(() => {
      ui.updateBottomBar(this.loader[i++ % 4]);
    }, 100);
  }

  close() {
    clearInterval(this.timer);
    ui.updateBottomBar('');
  }
}

// 1.2.3 -> 1.2.4
// type: patch/minor/major
const _increaseVersion = (version, type = 'patch') => {
  const pos = ['major', 'minor', 'patch'][type] || 2;
  const vers = version.split('.').map(d => +d);
  vers[pos] += 1;
  return vers.join('.');
}

const _getMaxVersion = (versions) => {
  versions.sort((x, y) => {
    const xs = x.split('.').map(d => +d);
    const ys = y.split('.').map(d => +d);

    if (xs[0] === ys[0]) {
      if (xs[1] === ys[1]) {
        return ys[2] - xs[2];
      }
      return ys[1] - xs[1];
    }
    return ys[0] - xs[0];
  });
  return versions[0];
}

// type: tags/heads
const _getRemoteVersions = (type = 'tags') => {
  const prefix = type === 'heads' ? 'daily' : 'publish';
  return new Promise((resolve, reject) => {
    if (remoteVersions && remoteVersions.length !== 0) {
      return resolve(remoteVersions);
    }
    const spin = new Spin('Checking remote version');
    exec(`git ls-remote --${type}`, { cwd: process.cwd() }, (err, stdout) => {
      spin.close();
      remoteVersions = [];
      if (err) return reject(err);

      const reg = new RegExp(`${prefix}\/(\\d+\\.\\d+\\.\\d+)`, 'g');
      let match, versions = [];
      while ((match = reg.exec(stdout.trim())) != null) {
        if (match && match[1]) versions.push(match[1]);
      }

      remoteVersions = versions;
      return resolve(versions);
    });
  });
}

const validateVersion = (version) => {
  return /^\d+\.\d+\.\d+$/.test(version);
}

const _push = (version, isDaily) => {
  return new Promise((resolve, reject) => {
    let cmd = '', branchTag = '';
    if (isDaily) {
      cmd = `git push origin HEAD:daily/${version} --force`;
      branchTag = `daily/${version}`;
    } else {
      cmd = `git tag publish/${version} && git push origin publish/${version}`;
      branchTag = `publish/${version}`;
    }

    const spin = new Spin(`Pushing ${branchTag} and building (be patient)`);
    exec(cmd, { cwd: process.cwd() }, (err, stdout, stderr) => {
      if (err) {
        spin.close();
        return reject(err);
      }
      spin.close();
      return resolve();
    });
  });
}

const deploy = (version, env) => {
  const isDaily = env === DAILY;
  return _getRemoteVersions().then(versions => {
    if (!isDaily && !!~versions.indexOf(version)) {
      return Promise.reject(`The version [${version}] is already existing, try another`);
    }
    return _push(version, isDaily);
  });
}


const getFixedVersion = (_default) => {
  try {
    const config = path.join(homedir(), '.boom', 'version');
    const version = readFileSync(config, 'utf-8').trim();
    return validateVersion(version) ? version : _default;
  } catch(e) {
    return _default;
  }
}

const getCurrentVersion = () => {
  return new Promise((resolve, reject) => {
    exec('git rev-parse --abbrev-ref HEAD', { cwd: process.cwd() }, (err, stdout) => {
      if (err) return reject(err);
      const match = /^daily\/(\d+\.\d+\.\d+)$/.exec(stdout.trim());
      if (match && match[1]) return resolve(match[1]);
      return reject(`The format of branch (${stdout}) is wrong, should like this: daily/x.y.z`);
    });
  });
}

const getLatestVersion = () => {
  return _getRemoteVersions().then(versions => {
    if (versions.length === 0) {
      return Promise.reject('No version in remote, please use Custom Version');
    }
    return _increaseVersion(_getMaxVersion(versions));
  });
}

const checkRemoteMaster = (remote = 'origin') => {
  const cmd = `git fetch ${remote} master -q`
    + ' && '
    + `git rev-list --left-right HEAD...${remote}/master --count`;
  return new Promise((resolve, reject) => {
    const spin = new Spin('Checking merge status');
    exec(cmd, { cwd: process.cwd() }, (err, stdout) => {
      spin.close();
      if (err) return reject(err);
      const diff = stdout.trim().split('\t');
      if (diff && !(+diff[1])) return resolve();
      return reject('The current branch is behind the master, please merge at first');
    });
  });
}

const sleep = (timeout = 0) => {
  return new Promise((resolve) => {
    const spin = new Spin('Wait a moment');
    setTimeout(() => {
      spin.close();
      resolve();
    }, timeout);
  });
}

module.exports = {
  sleep,
  deploy,
  validateVersion,
  getCurrentVersion,
  getFixedVersion,
  getLatestVersion,
  checkRemoteMaster,
};