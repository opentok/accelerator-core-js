# Accelerator Core Javascript CHANGELOG
All notable changes to this project will be documented in this file.

--------------------------------------
#### [2.0.0]
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


#### [1.0.0]

Official release

