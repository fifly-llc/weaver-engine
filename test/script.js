import * as weaver from 'https://unpkg.com/weaver-engine@1.1.2/src/index.web.js';

let canvas = document.getElementById('canvas');

let game = new weaver.Game(canvas, new weaver.Vector3(0, 0, -50));
let cube = new weaver.GameObject(0, 0, 0, 10, 10, 10);
game.add(cube);
game.start();