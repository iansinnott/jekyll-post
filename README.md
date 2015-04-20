# Post

#### A simple command line helper for Jekyll

## To do

- Add drafting functionality

`$ post draft <title>` Should create a draft post that will be stored under `drafts`. `$ post publish <title>` to prepend the date to the file and move it to to `_posts`. `$ post unpublish <title>` could be an option as well.

## Usage

Create a post:
`post Some Post Title`

List all posts
`post list`

Edit a post
`post edit [some-post-title]`

Publish your blog
`post publish`

## Installation

If you have npm:

`npm install -g jekyll-post`

If you don't have npm, you will need to install it via [Node](http://nodejs.org/). Either download it from [the Node website](http://nodejs.org/) or install it via the command line. The latter will depend on your system, but here's a guess at what might work for you immediately:

Mac (with Homebrew):

`brew install node`

Ubuntu:

Here's a [great installation article from Digital Ocean.][do]

[do]: https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-an-ubuntu-14-04-server

## Configuration

jekyll-post requires a `.postrc` file in your root directory. This file is necessary to tell jekyll-post where your Jekyll blog is located on your computer. Here's an example of `~/.postrc`:

```
{
  "source": "/path/to/jekyll"
}
```

Enjoy.
