var sh = require('shelljs');
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var assign = require('lodash.assign');
var forEach = require('lodash.foreach');
var filter = require('lodash.filter');
var isUndefined = require('lodash.isundefined');
var isArray = require('lodash.isarray');
var isEmpty = require('lodash.isempty');
require('tinycolor');

// We will open the file with their defined editor, or with the 'open' command
// by default.
var EDITOR = process.env.EDITOR || 'open';

/**
 * Convenience function for logging to the terminal.
 */
function log(message) {
  console.constructor.prototype.log.call(console, message);
}

/**
 * Convenience function for logging an error to the terminal.
 */
function error(message) {
  console.constructor.prototype.error.call(console, message);
}

/**
 * Strip all whitespace by replacing it with dashes. This function takes a word
 * list as an array and converts it into a usable string.
 * @returns {string}
 */
function hyphenate(args) {
  return args.join('-')
    .trim()                         // Trim leading/trailing whitespace
    .toLowerCase()                  // Lowercase everything
    .replace(/\s/g, '-')            // Whitspace -> '-'
    .replace(/&/g, 'and')           // & -> 'and'
    .replace(/[^a-z0-9-]+/gi, ''); // Strip invalid shit
}

/**
 * Highlight the first occurance of query within str. This wraps the correct
 * portion of the string in color for output in the terminal.
 *
 * @see tinycolor package
 * @return {string}
 */
function highlight(str, query) {
  var index  = str.indexOf(query),
      length = query.length;

  return [
    "* ".yellow,
    str.slice(0, index),
    str.slice(index, index + length).bgYellow.black,
    str.slice(index + length)
  ].join('');
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
 */
function Posts(POSTS_PATH) {
  var files = sh.ls(POSTS_PATH).reverse();
  this.path = POSTS_PATH;
  this.files = filter(files, function(fileName) {
    return fileName.indexOf('.md') !== -1; // Only return md files
  });
}

/**
 * Add prototype methods.
 */
assign(Posts.prototype, {

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
        title    = hyphenate(args),
        filename = date + '-' + title + '.md',
        filepath = this.path + '/' + filename,
        data     = [
          "---",
          "layout: post",
          'title: "' + args.join(' ') + '"',
          "comments: true",
          "---"
        ].join("\n");

    try {
      fs.writeFileSync(filepath, data);
    } catch (e) {
      error(e.message);
      process.exit(1);
    }

    log('Created: ' + filename.green);

    sh.exec( EDITOR + ' ' + filepath );
  },

  edit: function(args) {

    // Search criteria is required
    if (!args.length || args[0] === '') {
      error([ "",
        "Error: No title.".red,
        "Usage:",
        "       post edit Some Post Title",
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
      query = hyphenate(args),
      post = filter(this.files, function(fileName) {
        return fileName.indexOf(query) !== -1;
      });
    }

    if (isUndefined(post) || !post.length) {
      error("Not found:".yellow + " No file matched your query.");
      process.exit(1);
    } else if (isArray(post) && post.length > 1) {
      err = [ "", "Error:".red + " Multiple files matched your query:" ];
      forEach(post, function(p) {
        err.push(highlight(p, query));
      });
      error(err.join("\n"));
      process.exit(1);
    }


    post = isArray(post) ? post[0] : post;

    log('Editing: '.green + post);

    sh.exec([
      process.env.EDITOR || 'open',
      this.path + '/' + post
    ].join(' '));
  },

  /**
   * List all posts in this.path.
   */
  list: function() {
    log('Showing ' + this.files.length.toString().blue + ' posts:');

    forEach(this.files, function(fileName, i) {
      var date  = fileName.slice(0, 10),
          title = fileName.replace(/\d{4}-\d{2}-\d{2}-/g, '');

      log([
        i+1 + '.',               // i.
        ('('+ date +')').yellow, // (YYYY-MM-DD)
        title.slice(0, -3)       // post-title.md
      ].join(' '));
    });
  },

  find: function(args) {
    if (isEmpty(args)) {
      error("Error: ".red + "No search terms provided.");
      process.exit(1);
    }

    var query = hyphenate(args),
        files = filter(this.files, function(fileName) {
          return fileName.indexOf(query) !== -1;
        }),
        results = [];

    if (isEmpty(files)) {
      error("Not found:".yellow + " No file matched your query.");
      process.exit(1);
    }

    log('Showing ' + files.length.toString().blue + ' matching post(s):');

    forEach(files, function(fileName) {
      results.push(highlight(fileName, query));
    });

    log(results.join("\n"));
  },

  /**
   * This is a very rudimentary function to push changes to github. This will
   * clearly only work for github pages at the moment.
   *
   * @todo Allow custom deploy commands to be defined in the config file.
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
   */
  finder: function() {
    sh.exec('open ' + this.path);
  },

  /**
   * A shortcut for opening the post image directly in finder for easily adding
   * images that will be uploaded the next time you publish.
   */
  image: function() {
    var image_path = path.resolve(this.path, '..', 'public/images');
    sh.exec('open ' + image_path);
  },

  /**
   * Echo the posts directory to the console.
   */
  dir: function() {
    log(this.path);
  }

});

module.exports = Posts;
