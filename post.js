#!/usr/bin/env node

var _     = require('lodash'),
    cli   = require('commander'),
    fs    = require('fs'),
    path  = require('path'),
    Posts = require('./lib/posts.js');

/**
 * Utility functions.
 */
var utils = {

  /**
   * Exit with an error message, and set the exit status code to 1.
   * @param {string} message
   * @return {undefined}
   */
  errorOut: function(message) {
    console.error(message);
    process.exit(1);
  }

};

/**
 * Define the home directory on either windows or Unix.
 */
var HOME = process.env.HOME || process.env.USERPROFILE,
    config;

/**
 * Read the config file. If no file present, error out.
 */
try {
  config = JSON.parse(fs.readFileSync(HOME + "/.postrc"));
} catch (e) {
  utils.errorOut(e.message);
}

/**
 * Setup the the posts path and initialize the a new Posts object that will
 * allow us to interact with everything.
 */
var POSTS_PATH = path.resolve(config.source, '_posts'),
    posts      = new Posts(POSTS_PATH);

/**
 * Grab the command that was passed, as well as any additional arguments for
 * that command and store them in variables for later.
 */
var command = process.argv[2],
    args    = _.rest(process.argv, 3);

// Set up command line interface
cli
  .version('0.0.1')
  .parse(process.argv);

switch (command) {

  // Create new post
  case 'new':
  case 'create':
    posts.new(args);
    break;

  // Display all posts
  case 'show-all':
  case 'finder':
    posts.finder();
    break;

  // Cd into the posts directory
  case 'cd':
    posts.cd();
    break;

  // Display all posts
  case 'list':
    posts.list();
    break;

  // Search posts (like 'list', but filtered)
  case 'search':
  case 'find':
    posts.find(args);
    break;

  // Edit post
  case 'edit':
  case 'open':
    posts.edit(args);
    break;

  // Display help
  default:
    utils.errorOut("That's not a command...");
}
