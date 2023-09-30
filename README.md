# Weaver Engine

![npm version](https://img.shields.io/github/package-json/v/fifly-llc/weaver-engine)
![npm downloads](https://img.shields.io/npm/dw/weaver-engine)
![GitHub contributors](https://img.shields.io/github/contributors/fifly-llc/weaver-engine)
![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/w/fifly-llc/weaver-engine)
![GitHub last commit (by committer)](https://img.shields.io/github/last-commit/fifly-llc/weaver-engine)

Weaver Engine is a game engine written in JavaScript designed for use in web games.

## Using Weaver Engine

Your JS:

```js
import * as weaver from 'https://unpkg.com/weaver-engine@1.1.2/src/index.web.js';

let canvas = document.getElementById('canvas');

let game = new weaver.Game(canvas);
let cube = new weaver.GameObject(0, 0, 0, 10, 10, 10);
game.add(cube);
game.start();
```

Your HTML:

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Weaver Engine Example</title>
    </head>

    <body>
        <canvas id="canvas" style="width: 100%; height: 100%; border: none; background-color: white;"></canvas>

        <script type="module" src="script.js"></script>
    </body>
</html>
```
