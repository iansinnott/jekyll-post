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
  },

  fileNotFound: "No .postrc file found. Please createa a postrc file. Example:" +
                "\n" +
                '    $ echo \'{ "source": "/path/to/jekyll" }\' > ~/.postrc' +
                "\n"

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
  utils.errorOut(utils.fileNotFound);
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


/**
 * Command parser. This switch statement basically acts like a router in a
 * classic web application. The command that's passed via the command line will
 * determine which action is called. All the real business logic lives in
 * lib/posts.js.
 */
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

  // Show the current posts dir
  case 'dir':
    posts.dir();
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

  // Open image directory
  case 'image':
    posts.image();
    break;

  // Edit post
  case 'edit':
  case 'open':
    posts.edit(args);
    break;

  case 'publish':
  case 'push':
    posts.publish();
    break;

  // Display help
  default:
    utils.errorOut("That's not a command...");
}
