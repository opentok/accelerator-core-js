# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]



---

## [2.0.0]

`Core` is now a constructor, meaning that multiple instances may be used simultaneously within a single application.  Previously, `core` was initialized in the following manner:
```
const otCore = require('opentok-accelerator-core');
otCore.init(options);
```

In `2.0`, this becomes:
```
const Core = require('opentok-accelerator-core');
const otCore = new Core(options);
```

---

## [1.0.0]

Official release

[unreleased]: https://github.com/michaeljolley/vscode-twitch-themer/compare/2.0.0...HEAD
[2.0.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/1.0.0...2.0.0
[1.0.0]: https://github.com/michaeljolley/vscode-twitch-themer/compare/3239c8e...1.0.0