# boom

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]

A toolkit for CDN deployment.

## Background

There're lots of ways to deploy a backend application, but not for frontend applications.

IMO, we can make things easier by CI:

 - Git push to repository with special **marks**
 - Trigger CI to build and publish to CDN

Here **marks** can be a branch or tag which can also be used to separate different environments. And here we make an assumption:

 - A branch like `daily/x.y.z`: publish to daily environment
 - A tag like `publish/x.y.z`: publish to production environment

The tool is a gadget to do these things better for you. If you have different **marks**, fork & modify as you like.

## Usage

```bash
$ npx @hspkg/boom
```

Or

```bash
$ npm i -g @hspkg/boom
$ boom
```

## License

MIT © [Cody Chan](https://int64ago.org/)


[npm-image]: https://img.shields.io/npm/v/@hspkg/boom.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@hspkg/boom
[downloads-image]: https://img.shields.io/npm/dt/@hspkg/boom.svg?style=flat-square