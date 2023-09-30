import * as weaver from 'https://www.unpkg.com/weaver-engine@1.0.9/src/index.web.js';

let canvas = document.getElementById('canvas');

let game = new weaver.Game(canvas);
let cube = new weaver.GameObject(0, 0, 0, 10, 10, 10);
game.add(cube);
game.start();