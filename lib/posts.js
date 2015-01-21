var _ = require('lodash'),
    sh = require('shelljs'),
    fs = require('fs'),
    path = require('path'),
    moment = require('moment');
require('tinycolor');

// We will open the file with their defined editor, or with the 'open' command
// by default.
var EDITOR = process.env.EDITOR || 'open';

function getDate(format) {
    return moment().format(format);
}
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
    var index = str.indexOf(query),
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
 * Executes the given command in the given directory
 * @param command
 * @param dir
 */
function execute(command, dir) {
    var pwd = sh.pwd();

    sh.cd(dir);
    sh.exec(command);
    sh.cd(pwd);
}
/**
 * wrapper for git stuff
 * @param dir
 * @constructor
 */
function Git(dir) {
    var self = this;
    self.dir = dir;
    self.execute = function (command, args) {
        if (args !== undefined) {
            execute('git ' + command + ' "' + args + '"', self.dir);
        }
        else {
            execute('git ' + command, self.dir);
        }

    };
    self.add = function (file) {
        log('adding file '.green + file);
        self.execute('add', file);
    };
    self.commit = function (file, action) {
        log('commiting file '.green + file);
        self.execute('commit -am', file + ' ' + action + ' by post.js');
    };

    self.push = function () {
        log('pushing'.green);
        self.execute('push')
    }
}

/**
 * Posts constructor. Sets the path to the markdown files that represent the
 * blog.
 *
 * @constructor
 */
function Posts(config) {
    this.config = config;
    this.posts = path.resolve(config.source, '_posts');
    this.drafts = path.resolve(config.source, '_drafts');
    var posts = sh.ls(this.posts).reverse();
    var drafts = sh.ls(this.drafts).reverse();
    var select = function (fileName) {
        return fileName.indexOf('.md') !== -1;
    };
    this.files = {
        posts: _.select(posts, select),
        drafts: _.select(drafts, select)
    };
    this.git = new Git(config.source);
}

/**
 * Strips the date from a filename
 * @param fileName
 * @returns {XML|string|void}
 */
function getTitle(fileName) {
    return fileName.replace(/\d{4}-\d{2}-\d{2}-/g, '');
}

/**
 * Creates a post in the given folder
 * @param args
 * @param folder
 * @param post
 */
function create(args, folder, post) {
    // Title is required
    if (!args.length || args[0] === '') {
        error(["",
            "Error:".red + " You must provide a post title.",
            "Example:\n    post new Awesome post title", ""
        ].join("\n"));
        process.exit(1);
    }

    var date = getDate(post.config.date),
        title = hyphenate(args),
        filename = date + '-' + title + '.md',
        filepath = post.config.source + '/' + folder + '/' + filename,
        data = [
            '---',
            'title: ' + args.join(' ')
        ];
    //add settings from ~/.postrc
    _.each(post.config.post, function (value, key) {
        data.push([key + ': ' + value]);
    });
    data.push(['---']);

    try {
        fs.writeFileSync(filepath, data.join("\n"));
    } catch (e) {
        error(e.message);
        process.exit(1);
    }
    log('Created: ' + filename.green);
    post.git.add(filepath);
    post.git.commit(filepath, 'added');
    execute(EDITOR + ' ' + filepath, post.config.source);
}

/**
 * Add prototype methods.
 */
_.extend(Posts.prototype, {
    draft: function (args) {
        create(args, '_drafts', this);
    },
    new: function (args) {
        create(args, '_posts', this)
    },

    edit: function (args) {

        // Search criteria is required
        if (!args.length || args[0] === '') {
            error(["",
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
            post = this.files.posts[Number(args[0]) - 1];

            // If non numeric, or more than one arg passed, search query.
        } else {
            query = hyphenate(args);
            post = _.select(this.files.posts, function (fileName) {
                return fileName.indexOf(query) !== -1;
            });
        }

        if (_.isUndefined(post) || !post.length) {
            error("Not found:".yellow + " No file matched your query.");
            process.exit(1);
        } else if (_.isArray(post) && post.length > 1) {
            err = ["", "Error:".red + " Multiple files matched your query:"];
            _.each(post, function (p) {
                err.push(highlight(p, query));
            });
            error(err.join("\n"));
            process.exit(1);
        }


        post = _.isArray(post) ? post[0] : post;

        log('Editing: '.green + post);
        execute([
            process.env.EDITOR || 'open',
            this.posts + '/' + post
        ].join(' '), this.config.source);
    },

    /**
     * List all posts in this.posts.
     */
    list: function () {
        log('Showing ' + this.files.posts.length.toString().blue + ' posts:');

        _.each(this.files.posts, function (fileName, i) {
            var date = fileName.slice(0, 10),
                title = getTitle(fileName);

            log([
                i + 1 + '.',               // i.
                ('(' + date + ')').yellow, // (YYYY-MM-DD)
                title.slice(0, -3)       // post-title.md
            ].join(' '));
        });
    },

    find: function (args) {
        if (_.isEmpty(args)) {
            error("Error: ".red + "No search terms provided.");
            process.exit(1);
        }

        var query = hyphenate(args),
            files = _.select(this.files.posts, function (fileName) {
                return fileName.indexOf(query) !== -1;
            }),
            results = [];

        if (_.isEmpty(files)) {
            error("Not found:".yellow + " No file matched your query.");
            process.exit(1);
        }

        log('Showing ' + files.length.toString().blue + ' matching post(s):');

        _.each(files, function (fileName) {
            results.push(highlight(fileName, query));
        });

        log(results.join("\n"));
    },
    /**
     * Finds the draft you want to publish, and moves it from _drafts to _posts
     * @param args
     * @param config
     */
    publish: function (args, config) {
        var self = this;
        if (_.isEmpty(args)) {
            error("Error: ".red + "No search terms provided.");
            process.exit(1);
        }

        var query = hyphenate(args),
            files = _.select(this.files.drafts, function (fileName) {
                return fileName.indexOf(query) !== -1;
            });


        if (_.isEmpty(files)) {
            error("Not found:".yellow + " No file matched your query.");
            process.exit(1);
        }
        log("Moving the following files to _posts: \n" + files.join("\n"));

        _.each(files, function (file) {
            var title = getTitle(file),
                newfileName = getDate(self.config.date) + '-' + title,
                filepath = self.posts + '/' + newfileName;
            fs.rename(self.drafts + '/' + file, self.posts + '/' + newfileName);
            self.git.add(filepath);
        });
        self.git.commit(files.join(' '), 'moved from _drafts to _posts');
        if (self.config.hasOwnProperty('pushOnPublish')) {
            if (self.config.pushOnPublish) {
                self.push();
            }
        }
    },

    /**
     * This is a very rudimentary function to push changes to github. This will
     * clearly only work for github pages at the moment.
     *
     * @todo Allow custom deploy commands to be defined in the config file.
     */
    push: function () {
        this.git.push();
    },

    /**
     * Open the posts directory in the finder.
     *
     * @todo Not sure whether or not this will work on linux/windows, but going
     * with it anyway.
     */
    finder: function () {
        sh.exec('open ' + this.posts);
    },

    /**
     * A shortcut for opening the post image directly in finder for easily adding
     * images that will be uploaded the next time you publish.
     */
    image: function () {
        var image_path = path.resolve(this.posts, '..', 'public/images');
        sh.exec('open ' + image_path);
    },

    /**
     * Echo the posts directory to the console.
     */
    dir: function () {
        log(this.posts);
    }

});

module.exports = Posts;
