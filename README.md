# Post

#### A simple command line helper for Jekyll

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

`npm install -g post-jekyll`

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
  "source": "/path/to/jekyll"
}
```

Enjoy.
