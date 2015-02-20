'use strict';

var exec = require('child_process').exec;
var _ = require('lodash');
var Q = require('q');
var which = require('which');
var chalk = require('chalk');
var figures = require('figures');
var semver = require('semver');
var shelljs = require('shelljs');

module.exports = {

  results: [],

  gitInstalled: false,
  gruntInstalled: false,
  rubyInstalled: false,

  run: function (cb) {
    Q.fcall(this.checkNodeVersion.bind(this))
    .then(this.checkGit.bind(this))
    .then(this.checkGitConnection.bind(this))
    .then(this.checkYeoman.bind(this))
    .then(this.checkGrunt.bind(this))
    .then(this.checkGruntCli.bind(this))
    .then(this.checkBower.bind(this))
    .then(this.checkRuby.bind(this))
    .then(this.checkCompass.bind(this))
    .then(this.checkGulp.bind(this))
    .then(this.checkJava.bind(this))
    .then(this.checkMaven.bind(this))
    .then(function () {
      this.showResults();
      this.handleCallback(cb);
    }.bind(this))
    .catch(function (error) {
      console.error(chalk.red('Error: rff-doctor was aborted unexpectedly!'));
      this.handleCallback(cb, error);
    }.bind(this))
    .done();
  },

  log: function (name, status, description, hint, error) {
    var mark;
    hint = hint || '';
    error = error || null;
    switch (status) {
      case 'ok':
        mark = chalk.green(figures.tick);
        break;
      case 'ng':
        mark = chalk.red(figures.cross);
        break;
      case 'skipped':
        mark = chalk.red(figures.line);
        break;
    }
    this.results.push({name: name, status: status, description: description, hint: hint, error: error});
    this.print(mark + ' ' + description, ' ');
    if (error) {
      this.print(chalk.red(error.toString().trim()), '     ');
    }
    if (hint !== '') {
      this.print(chalk.gray(hint), '     ');
    }
  },

  print: function (string, indent) {
    indent = indent || '';
    string = indent + string.replace(/\n/g, '\n' + indent);
    console.log(string);
  },

  showResults: function () {
    var warningCount = _.filter(this.results, {status: 'ng'}).length;
    var skipCount = _.filter(this.results, {status: 'skipped'}).length;
    var warningMessage = '';
    if (warningCount === 0) {
      console.log(chalk.green('\nYour system is ready!'));
      return;
    }
    warningMessage = '\nDetected ' + warningCount + ((warningCount === 1) ? ' warning.' : ' warnings.');
    if (skipCount !== 0) {
      warningMessage += ' Skipped ' + skipCount + ((skipCount === 1) ? ' test.' : ' tests.');
    }
    console.error(chalk.red(warningMessage));
  },

  handleCallback: function (cb, error) {
    if (typeof cb !== 'function') {
      return;
    }
    error = error || null;
    cb(error, this.results);
  },

  checkNodeVersion: function () {
    var d = Q.defer();
    var name = 'nodeVersion';
    exec('node --version', function (error, stdout) {
      if (error) {
        this.log(
          name,
          'ng',
          'Node.js is not installed correctly.',
          'You can install Node.js from here.\n' +
          'http://nodejs.org/',
           error
        );
        d.resolve();
        return;
      }
      var installedVer = semver.clean(stdout.trim());
      if (!semver.satisfies(installedVer, '>=0.10.0')) {
        this.log(
          name,
          'ng',
          'Your Node.js is outdated.',
          'You have installed Node.js v' + installedVer + '.\n' +
          'Upgrade it to v0.10.0 or higher.\n' +
          'http://nodejs.org/'
        );
        d.resolve();
        return;
      }
      this.log(name, 'ok', 'You have installed supported version of Node.js.');
      d.resolve();
    }.bind(this));
    return d.promise;
  },

  checkGit: function () {
    var d = Q.defer();
    var name = 'git';
    which('git', function (error, p) {
      if (error) {
        this.log(
          name,
          'ng',
          'Git is not found on your computer.',
          '1. Install Git.\n' +
          '   http://git-scm.com/\n' +
          '2. Set the installation directory to PATH if you haven\'t.',
          error
        );
        d.resolve();
        return;
      }
      this.gitInstalled = true;
      this.log(name, 'ok', 'Git is installed.');
      d.resolve();
    }.bind(this));
    return d.promise;
  },

  checkGitConnection: function () {
    var d = Q.defer();
    var name = 'gitConnection';
    if (!this.gitInstalled) {
      this.log(name, 'skipped', 'Skip Git connection test.');
      return;
    }
    exec('git ls-remote git://github.com/octocat/Spoon-Knife.git HEAD', {timeout: 15000}, function (error) {
      if (error) {
        this.log(
          name,
          'ng',
          'Failed to connect to "git://github.com".',
          '1. Check the Internet connection.\n' +
          '2. If you are using HTTP proxy, try this command:\n' +
          '     $ git config --global url."https://".insteadOf git://',
          error
        );
        d.resolve();
        return;
      }
      this.log(name, 'ok', 'Successfully connected to "git://github.com".');
      d.resolve();
    }.bind(this));
    return d.promise;
  },

  checkYeoman: function () {
    var d = Q.defer();
    var name = 'yeoman';
    which('yo', function (error, p) {
      if (error) {
        this.log(
          name,
          'ng',
          'Yeoman is not found on your computer.',
          'Install Yeoman using npm command:\n' +
          '  $ npm install -g yo',
          error
        );
        d.resolve();
        return;
      }
      this.log(name, 'ok', 'Yeoman is installed.');
      d.resolve();
    }.bind(this));
    return d.promise;
  },

  checkGrunt: function () {
    var d = Q.defer();
    var name = 'grunt';
    which('grunt', function (error, p) {
      if (error) {
        this.log(
          name,
          'ng',
          'Grunt is not found on your computer.',
          'Install Grunt CLI using npm command:\n' +
          '  $ npm install -g grunt-cli',
          error
        );
        d.resolve();
        return;
      }
      this.gruntInstalled = true;
      this.log(name, 'ok', 'Grunt is installed.');
      d.resolve();
    }.bind(this));
    return d.promise;
  },

  checkGruntCli: function () {
    var d = Q.defer();
    var name = 'gruntCli';
    if (!this.gruntInstalled) {
      this.log(name, 'skipped', 'Skip Grunt CLI test.');
      return;
    }
    exec('grunt --version', function (error, stdout) {
      if (error) {
        this.log(
          name,
          'ng',
          'Your Grunt is not installed correctly.',
          'Install Grunt CLI using npm command:\n' +
          '  $ npm install -g grunt-cli',
          error
        );
        d.resolve();
        return;
      }
      if (stdout.indexOf('grunt-cli') === -1) {
        this.log(
          name,
          'ng',
          'grunt-cli is not found.',
          'Your Grunt might be old version.\n' +
          'If you have installed Grunt ver. -0.3, run:\n' +
          '  $ npm uninstall -g grunt\n\n' +
          'And then, install Grunt CLI:\n' +
          '  $ npm install -g grunt-cli'
        );
      }
      this.log(name, 'ok', 'You can use Grunt CLI.');
      d.resolve();
    }.bind(this));
    return d.promise;
  },

  checkGulp: function () {
    var d = Q.defer();
    var name = 'gulp';
    which('gulp', function (error, p) {
      if (error) {
        this.log(
          name,
          'ng',
          'Gulp is not found on your computer.',
          'Install gulp using npm command:\n' +
          '  $ npm install -g gulp',
          error
        );
        d.resolve();
        return;
      }
      this.gulpInstalled = true;
      this.log(name, 'ok', 'Gulp is installed.');
      d.resolve();
    }.bind(this));
    return d.promise;
  },

  checkBower: function () {
    var d = Q.defer();
    var name = 'bower';
    which('bower', function (error, p) {
      if (error) {
        this.log(
          name,
          'ng',
          'Bower is not found on your computer.',
          'Install Bower using npm command:\n' +
          '  $ npm install -g bower',
          error
        );
        d.resolve();
        return;
      }
      this.log(name, 'ok', 'Bower is installed.');
      d.resolve();
    }.bind(this));
    return d.promise;
  },

  checkRuby: function () {
    var d = Q.defer();
    var name = 'ruby';
    which('ruby', function (error, p) {
      if (error) {
        this.log(
          name,
          'ng',
          'Ruby is not found on your computer.',
          '1. Install Ruby.\n' +
          '   https://www.ruby-lang.org/\n' +
          '2. Set the installation directory to PATH if you haven\'t.',
          error
        );
        d.resolve();
        return;
      }
      this.rubyInstalled = true;
      this.log(name, 'ok', 'Ruby is installed.');
      d.resolve();
    }.bind(this));
    return d.promise;
  },

  checkCompass: function () {
    var d = Q.defer();
    var name = 'compass';
    if (!this.rubyInstalled) {
      this.log(name, 'skipped', 'Skip Compass installation test.');
      return;
    }
    which('compass', function (error, p) {
      if (error) {
        this.log(
          name,
          'ng',
          'Compass is not found on your computer.',
          '1. Install Compass using gem:\n' +
          '     $ gem install compass\n' +
          '2. Set the installation directory to PATH if you haven\'t.',
          error
        );
        d.resolve();
        return;
      }
      this.log(name, 'ok', 'Compass is installed.');
      d.resolve();
    }.bind(this));
    return d.promise;
  },

  checkJava: function () {
    var d = Q.defer();
    var name = 'java';
    which('javac', function (error, p) {
      if (error) {
        this.log(
          name,
          'ng',
          'JDK is not found on your computer.',
          '1. Install JDK.\n' +
          '   http://www.oracle.com/technetwork/java/javase/downloads/index.html/\n' +
          '2. Set the installation directory to PATH if you haven\'t.',
          error
        );
        d.resolve();
        return;
      }
      this.javaInstalled = true;
      this.log(name, 'ok', 'JDK is installed.');
      d.resolve();
    }.bind(this));
    return d.promise;
  },

  checkMaven: function () {
    var d = Q.defer();
    var name = 'maven';
    if (!this.javaInstalled) {
      this.log(name, 'skipped', 'Skip Maven installation test.');
      return;
    }
    which('mvn', function (error, p) {
      if (error) {
        this.log(
          name,
          'ng',
          'Maven is not found on your computer.',
          '1. Install Maven.\n' +
          '   http://maven.apache.org/\n' +
          '2. Set the installation directory to PATH if you haven\'t.',
          error
        );
        d.resolve();
        return;
      }
      if (!shelljs.env.M2_HOME) {
        this.log(
          name,
          'ng',
          'M2_HOME environment variable is not defined on your computer.',
          'Set M2_HOME to the installation directory where you have installed Maven.',
          error
        );
        return;
      }
      this.mavenInstalled = true;
      this.log(name, 'ok', 'Maven is installed.');
      d.resolve();
    }.bind(this));
    return d.promise;
  },


};
