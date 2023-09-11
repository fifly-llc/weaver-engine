import { Game, GameObject } from 'https://cdn.jsdelivr.net/npm/weaver-engine@latest/src/index.js';

let canvas = document.createElement('canvas');
canvas = document.body.appendChild(canvas);
canvas.style = "width: 100%; height: 100%; border: none; background-color: white;";

let game = new Game(canvas);
let cube = new GameObject(0, 0, 0, 10, 10, 10);
game.add(cube);
game.start();