# Post

#### A simple command line helper for Jekyll

## Usage

__Create draft:__

`$ post draft <title>` Should create a draft post that will be stored under `drafts`. `$ post publish <title>` to prepend the date to the file and move it to to `_posts`. `$ post unpublish <title>` could be an option as well.


__Create a post:__

`post [new|create] Some Post Title`

__Create a draft:__

`post draft Some Post Title`


__Publish a draft:__

`post publish Post Title To Publish`

__List all posts__

`post list`

__Edit a post__

`post edit [some-post-title]`

__Push your blog to GitHub__

`post push`

## Installation

If you have npm:

clone this repo and run
`npm install -g /path/to/post-jekyll`

If you don't have npm, you will need to install it via [Node](http://nodejs.org/). Either download it from [the Node website](http://nodejs.org/) or install it via the command line. The latter will depend on your system, but here's a guess at what might work for you immediately:

Mac (with Homebrew):

`brew install node`

Ubuntu:

Here's a [great installation article from Digital Ocean.][do]

[do]: https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-an-ubuntu-14-04-server

## Configuration

jekyll-post supports a `.postrc` file in your root directory. This file is necessary to tell jekyll-post where your Jekyll blog is located. Here's an example of `~/.postrc`:

```
{
  "source": "/path/to/jekyll",
  "date": "YYYY-MM-DD", //your date format,
  "post":{ //default block to include in your post
  	"layout":"post",
  	"author": "your name",
  	"categories": ""
  },
   "pushOnPublish": true //if set to false, it won't directly push when you publish a draft
}
```

Enjoy.
