// Generated by CoffeeScript 1.12.4

/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
var DEVICE_SSH_PORT, Promise, RdtDockerUtils, SpinnerPromise, buildRsyncCommand, path, ref, shell, shellwords, startContainerAfterErrorSpinner, startContainerSpinner, stopContainerSpinner;

path = require('path');

Promise = require('bluebird');

shellwords = require('shellwords');

shell = require('../shell');

RdtDockerUtils = require('../docker-utils');

SpinnerPromise = require('resin-cli-visuals').SpinnerPromise;

buildRsyncCommand = require('../rsync').buildRsyncCommand;

ref = require('../utils'), startContainerSpinner = ref.startContainerSpinner, stopContainerSpinner = ref.stopContainerSpinner, startContainerAfterErrorSpinner = ref.startContainerAfterErrorSpinner;

DEVICE_SSH_PORT = 22222;


/**
 * @summary Run rsync on a local resinOS device
 * @function sync
 *
 * @param {Object} options - options
 * @param {String} options.deviceIp - Destination device ip/host
 * @param {String} options.baseDir - Project base dir
 * @param {String} options.appName - Application container name
 * @param {String} options.destination - Sync destination folder in container
 * @param {String} [options.before] - Action to execute locally before sync
 * @param {String} [options.after] - Action to execute locally after sync
 * @param {String} [options.progress=false] - Show progress
 * @param {String} [options.verbose=false] - Show progress
 * @param {String} [options.skipGitignore=false] - Skip .gitignore parsing
 * @param {String} [options.ignore] - rsync ignore list
 *
 * @returns {}
 * @throws Exception on error
 *
 * @example
 * sync()
 */

exports.sync = function(arg) {
  var after, appName, baseDir, before, destination, deviceIp, docker, ignore, progress, ref1, ref2, ref3, ref4, skipGitignore, verbose;
  ref1 = arg != null ? arg : {}, deviceIp = ref1.deviceIp, baseDir = ref1.baseDir, appName = ref1.appName, destination = ref1.destination, before = ref1.before, after = ref1.after, progress = (ref2 = ref1.progress) != null ? ref2 : false, verbose = (ref3 = ref1.verbose) != null ? ref3 : false, skipGitignore = (ref4 = ref1.skipGitignore) != null ? ref4 : false, ignore = ref1.ignore;
  if (destination == null) {
    throw new Error("'destination' is a required sync option");
  }
  if (deviceIp == null) {
    throw new Error("'deviceIp' is a required sync option");
  }
  if (appName == null) {
    throw new Error("'app-name' is a required sync option");
  }
  docker = new RdtDockerUtils(deviceIp);
  return Promise["try"](function() {
    if (before != null) {
      return shell.runCommand(before, baseDir);
    }
  }).then(function() {
    return docker.containerRootDir(appName, deviceIp, DEVICE_SSH_PORT).then(function(containerRootDirLocation) {
      var command, rsyncDestination, syncOptions;
      rsyncDestination = path.join(containerRootDirLocation, destination);
      syncOptions = {
        username: 'root',
        host: deviceIp,
        port: DEVICE_SSH_PORT,
        progress: progress,
        ignore: ignore,
        skipGitignore: skipGitignore,
        verbose: verbose,
        source: baseDir,
        destination: shellwords.escape(rsyncDestination),
        rsyncPath: "mkdir -p \"" + rsyncDestination + "\" && nsenter --target $(cat /var/run/docker.pid) --mount rsync"
      };
      command = buildRsyncCommand(syncOptions);
      return docker.checkForRunningContainer(appName).then(function(isContainerRunning) {
        if (!isContainerRunning) {
          throw new Error("Container must be running before attempting 'sync' action");
        }
        return new SpinnerPromise({
          promise: shell.runCommand(command, baseDir),
          startMessage: "Syncing to " + destination + " on '" + appName + "'...",
          stopMessage: "Synced " + destination + " on '" + appName + "'."
        });
      });
    }).then(function() {
      return stopContainerSpinner(docker.stopContainer(appName));
    }).then(function() {
      return startContainerSpinner(docker.startContainer(appName));
    }).then(function() {
      if (after != null) {
        return shell.runCommand(after, baseDir);
      }
    })["catch"](function(err) {
      return startContainerAfterErrorSpinner(docker.startContainer(appName))["catch"](function(err) {
        return console.log('Could not start application container', err);
      })["finally"](function() {
        throw err;
      });
    });
  });
};
