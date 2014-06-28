var _      = require('lodash'),
    sh     = require('shelljs'),
    fs     = require('fs'),
    path   = require('path'),
    moment = require('moment');
             require('tinycolor');

// We will open the file with their defined editor, or with the 'open' command
// by default.
var EDITOR = process.env.EDITOR || 'open';

/**
 * Convenience function for logging to the terminal.
 * @return {undefined}
 */
function log(message) {
  console.constructor.prototype.log.call(console, message);
}

/**
 * Convenience function for logging an error to the terminal.
 * @return {undefined}
 */
function error(message) {
  console.constructor.prototype.error.call(console, message);
}

/**
 * Helper to check if a variable is numeric.
 *
 * @example
 * isNumeric(123)     // true
 * isNumeric('123')   // true
 * isNumeric('foo')   // false
 * isNumeric('10px')  // false
 *
 * @returns {bool}
 */
function isNumeric(num) {
 return !isNaN(num);
}

/**
 * Posts constructor. Sets the path to the markdown files that represent the
 * blog.
 *
 * @constructor
 *
 * @return {undefined}
 */
function Posts(POSTS_PATH) {
  this.path = POSTS_PATH;
  this.files = sh.ls(this.path).reverse();
}

/**
 * Add prototype methods.
 */
_.extend(Posts.prototype, {

  new: function(args) {

    // Title is required
    if (!args.length || args[0] === '') {
      error([ "",
        "Error:".red + " You must provide a post title.",
        "Example:\n    post new Awesome post title", ""
      ].join("\n"));
      process.exit(1);
    }

    var date     = moment().format('YYYY-MM-DD'),
        title    = args.join('-').toLowerCase().replace(/\s/g, '-'),
        filename = date + '-' + title + '.md';

    log('Creating ' + filename.green);

    // sh.exec([
    //   EDITOR,
    //   this.path + '/' + filename
    // ].join(' '));
  },

  edit: function(args) {

    // Search criteria is required
    if (!args.length || args[0] === '') {
      error([ "",
        "Error: No title.".red,
        "Usage:".grey + " post edit Some Post Title",
        "       post edit some-post-title",
        "       post edit 2", ""
      ].join("\n"));
      process.exit(1);
    }

    var post,
        query,
        err;

    // If passed a number, treat it as an index. Subtract one, because the list
    // view uses a base index of 1 to be intuitive, thus it would be
    // unintuitive to use the index provided as is. If this is unclear, run
    // `post list` to see what I mean.
    if (args.length === 1 && isNumeric(args[0])) {
      post = this.files[Number(args[0]) - 1];

    // If non numeric, or more than one arg passed, search query.
    } else {
      query = args.join('-').toLowerCase().replace(/\s/g, '-'),
      post = _.select(this.files, function(fileName) {
        return fileName.indexOf(query) !== -1;
      });
    }

    if (_.isUndefined(post) || !post.length) {
      error("Not found:".yellow + " No file matched your query.");
      process.exit(1);
    } else if (_.isArray(post) && post.length > 1) {
      err = [ "", "Error:".red + " Multiple files matched your query:" ];
      _.each(post, function(p) {
        var index  = p.indexOf(query),
            length = query.length;

        // Build string with colored query highlighted
        err.push([
          "    * ".yellow,
          p.slice(0, index),
          p.slice(index, index + length).bgYellow.black,
          p.slice(index + length)
        ].join(''));
      });
      error(err.join("\n"));
      process.exit(1);
    }


    post = _.isArray(post) ? post[0] : post;

    log('Editing: '.green + post);

    sh.exec([
      process.env.EDITOR || 'open',
      this.path + '/' + post
    ].join(' '));
  },

  /**
   * List all posts in this.path.
   * @return {undefined}
   */
  list: function(args) {
    log('Showing ' + this.files.length.toString().blue + ' posts:');

    var files = this.files,
        query;

    if (args) {
      query = args.join('-').toLowerCase().replace(/\s/g, '-'),
      files = _.select(files, function(fileName) {
        fileName.indexOf(query) !== -1;
      });
    }

    if (_.isEmpty(files)) {
      error("Not found:".yellow + " No file matched your query.");
      process.exit(1);
    }

    _.each(this.files, function(fileName, i) {
      var date  = fileName.slice(0, 10),
          title = fileName.replace(/\d{4}-\d{2}-\d{2}-/g, '');

      log([
        i+1 + '.',               // i.
        ('('+ date +')').yellow, // (YYYY-MM-DD)
        title.slice(0, -3)       // post-title.md
      ].join(' '));
    });
  },

  /**
   * This is a very rudimentary function to push changes to github. This will
   * clearly only work for github pages at the moment.
   *
   * @todo Allow custom deploy commands to be defined in the config file.
   * @return {undefined}
   */
  publish: function() {
    var pwd = sh.pwd();

    sh.cd(this.path);
    sh.exec('git push');
    sh.cd(pwd);
  },

  /**
   * Open the posts directory in the finder.
   *
   * @todo Not sure whether or not this will work on linux/windows, but going
   * with it anyway.
   * @return {undefined}
   */
  finder: function() {
    sh.exec('open ' + this.path);
  },

  /**
   * Cd into the _posts directory from anywhere.
   * @return {undefined}
   */
  cd: function() {
    sh.cd(this.path);
  }

});

module.exports = Posts;
