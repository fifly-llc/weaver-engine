/* This Source Code Form is subject to the terms of the FiFly Redistributable Software License, version 1.0.
 * If a copy of the license was not distributed with this file, You can obtain one at https://fifly.org/FRSL/1.0/. */

class Game {
    constructor(canvas, cameraPos) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.gameObjects = [];
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.particles = []; // Collection to store particles.

        // Initialize the camera.
        this.camera = new Camera(canvas.width, canvas.height, cameraPos);

        // Add key event listeners.
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Define keys for controlling the camera.
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
        };
    }

    // Perform frustum culling for game objects.
    performFrustumCulling() {
        const cameraPlanes = this.camera.calculateFrustumPlanes(); // Calculate the camera's frustum planes.

        this.gameObjects.forEach((gameObject) => {
            const aabb = gameObject.calculateAABB(); // Calculate the AABB of the object.

            // Test if the object's AABB intersects with any frustum plane.
            if (!this.intersectsFrustum(aabb, cameraPlanes)) {
                gameObject.isHidden = true; // Mark the object as hidden.
            } else {
                gameObject.isHidden = false; // Object is potentially visible.
            }
        });
    }

    // Check if an AABB intersects with any frustum plane.
    intersectsFrustum(aabb, frustumPlanes) {
        for (const plane of frustumPlanes) {
            if (!this.intersectsPlaneAABB(plane, aabb)) {
                return false; // No intersection with this plane, object is outside the frustum.
            }
        }
        return true; // Intersects with all planes, object is potentially visible.
    }

    // Check if a plane intersects with an AABB.
    intersectsPlaneAABB(plane, aabb) {
        const normal = plane.normal;
        const d = plane.distance;
        const min = aabb.min;
        const max = aabb.max;

        const p = [
            new Vector3(min.x, min.y, min.z),
            new Vector3(max.x, min.y, min.z),
            new Vector3(min.x, max.y, min.z),
            new Vector3(max.x, max.y, min.z),
            new Vector3(min.x, min.y, max.z),
            new Vector3(max.x, min.y, max.z),
            new Vector3(min.x, max.y, max.z),
            new Vector3(max.x, max.y, max.z),
        ];

        let inside = false;
        let outside = false;

        for (const vertex of p) {
            const distance = normal.dot(vertex) + d;
            if (distance < 0) {
                outside = true;
            } else {
                inside = true;
            }
            if (inside && outside) {
                return true; // Intersects with the plane.
            }
        }

        return false; // No intersection with the plane.
    }

    // Create and add a particle to the system.
    createParticle(x, y, z, velocityX, velocityY, velocityZ, lifetime, color) {
        const particle = new Particle(x, y, z, velocityX, velocityY, velocityZ, lifetime, color);
        this.particles.push(particle);
    }

    // Update and render particles.
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            if (!particle.isAlive()) {
                this.particles.splice(i, 1); // Remove dead particles.
            }
        }
    }

    renderParticles() {
        this.particles.forEach((particle) => {
            particle.render(this.context, this.camera);
        });
    }

    // Handle keydown events.
    handleKeyDown(event) {
        if (event.key in this.keys) {
            event.preventDefault();
            this.keys[event.key] = true;
        }
    }

    // Handle keyup events.
    handleKeyUp(event) {
        if (event.key in this.keys) {
            event.preventDefault();
            this.keys[event.key] = false;
        }
    }

    // Update the camera's position based on key input.
    updateCameraPosition() {
        const cameraSpeed = 2; // Adjust as needed.

        if (this.keys.ArrowUp) {
            this.camera.y -= cameraSpeed;
        }
        if (this.keys.ArrowDown) {
            this.camera.y += cameraSpeed;
        }
        if (this.keys.ArrowLeft) {
            this.camera.x -= cameraSpeed;
        }
        if (this.keys.ArrowRight) {
            this.camera.x += cameraSpeed;
        }
    }

    // Handle mouse and touch input events.
    handleInput() {
        // Mouse input.
        this.canvas.addEventListener('mousedown', (event) => {
            event.preventDefault();
            this.isMouseDown = true;
        });

        document.addEventListener('mouseup', (event) => {
            event.preventDefault();
            this.isMouseDown = false;
        });

        this.canvas.addEventListener('mousemove', (event) => {
            if (this.isMouseDown) {
                event.preventDefault();
            }
        });

        // Touch input.
        this.canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.touchStartPos = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
            };
        });

        this.canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            this.touchStartPos = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
            };
        });
    }

    start() {
        // Start the game loop.
        this.update();
    }

    update() {
        // Update game logic here.
        this.gameObjects.forEach((object) => {
            object.update();
        });

        this.updateParticles(); // Update particles.
        this.updateCameraPosition(); // Update camera pos based on input
        this.render(); // Render GameObjects
        this.renderParticles(); // Render particles.
        requestAnimationFrame(this.update.bind(this));
    }

    render() {
        const { context, canvas, gameObjects, camera } = this;

        context.clearRect(0, 0, canvas.width, canvas.height);

        gameObjects.forEach(gameObject => {
            gameObject.render(context, camera);
            gameObject.renderUI(context, camera);
        });
    }

    add(gameObject) {
        this.gameObjects.push(gameObject);
    }
}

class Asset {
    constructor(type, file) {
        if (type === 'model') {
            if (!file.endsWith('.obj')) return;
            this.fetchFile(file);
        } else if (type === 'audio') {
            this.loadAudio(file);
        } else {
            console.error("Asset type does not exist.");
        }
    }

    async fetchFile(file) {
        const response = await fetch(file);
        const text = await response.text();
        this.file = text;
    }

    loadAudio(file) {
        this.file = Audio(file);
    }
}

class GameObject {
    constructor(x, y, z, width, height, depth) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.width = width;
        this.height = height;
        this.depth = depth;

        this.visible = true;
        this.isMouseDown = false;
        this.touchStartPos = { x: 0, y: 0 };
        this.velocity = new Vector3(0, 0, 0);
        this.acceleration = new Vector3(0, 0, 0);

        this.isUI = false;
        this.text = '';
        this.fontSize = 16;
        this.fontFamily = 'Arial';
        this.textColor = 'white';

        this.vertices = [
            new Vector3(this.x - this.width / 2, this.y - this.height / 2, this.z - this.depth / 2),
            new Vector3(this.x + this.width / 2, this.y - this.height / 2, this.z - this.depth / 2),
            new Vector3(this.x + this.width / 2, this.y + this.height / 2, this.z - this.depth / 2),
            new Vector3(this.x - this.width / 2, this.y + this.height / 2, this.z - this.depth / 2),
            new Vector3(this.x - this.width / 2, this.y - this.height / 2, this.z + this.depth / 2),
            new Vector3(this.x + this.width / 2, this.y - this.height / 2, this.z + this.depth / 2),
            new Vector3(this.x + this.width / 2, this.y + this.height / 2, this.z + this.depth / 2),
            new Vector3(this.x - this.width / 2, this.y + this.height / 2, this.z + this.depth / 2),
        ];

        this.faces = [
            [0, 1, 2],
            [0, 2, 3],
            [4, 5, 6],
            [4, 6, 7],
            [0, 1, 5],
            [0, 5, 4],
            [1, 2, 6],
            [1, 6, 5],
            [2, 3, 7],
            [2, 7, 6],
            [3, 0, 4],
            [3, 4, 7],
        ];
    }

    calculateAABB() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        const halfDepth = this.depth / 2;

        const min = new Vector3(
            this.x - halfWidth,
            this.y - halfHeight,
            this.z - halfDepth
        );

        const max = new Vector3(
            this.x + halfWidth,
            this.y + halfHeight,
            this.z + halfDepth
        );

        return { min, max };
    }

    // Create a UI element with text.
    createUI(text) {
        this.isUI = true;
        this.text = text;
    }

    // Render UI elements and text.
    renderUI(context, camera) {
        if (this.isUI) {
            context.font = `${this.fontSize}px ${this.fontFamily}`;
            context.fillStyle = this.textColor;

            // Calculate screen coordinates for UI elements.
            const screenX = this.x - camera.x + camera.canvasWidth / 2;
            const screenY = this.y - camera.y + camera.canvasHeight / 2;

            context.fillText(this.text, screenX, screenY);
        }
    }

    projectVertex(vertex, camera) {
        // Translate the vertex relative to the camera.
        const translatedX = vertex.x - camera.x;
        const translatedY = vertex.y - camera.y;
        const translatedZ = vertex.z - camera.z;

        // Apply 3D rotations (you may need to convert these to radians).
        const cosX = Math.cos(this.rotationX);
        const sinX = Math.sin(this.rotationX);
        const cosY = Math.cos(this.rotationY);
        const sinY = Math.sin(this.rotationY);
        const cosZ = Math.cos(this.rotationZ);
        const sinZ = Math.sin(this.rotationZ);

        // Perform 3D transformations (rotate, scale, translate).
        const x = translatedX * cosZ * cosY + translatedY * (cosZ * sinY * sinX - sinZ * cosX) + translatedZ * (cosZ * sinY * cosX + sinZ * sinX);
        const y = translatedX * sinZ * cosY + translatedY * (sinZ * sinY * sinX + cosZ * cosX) + translatedZ * (sinZ * sinY * cosX - cosZ * sinX);
        const z = translatedY * cosY * (-sinX) + translatedZ * cosY * cosX;

        // Apply perspective projection (divide by z).
        const perspectiveX = x / z;
        const perspectiveY = y / z;

        // Scale the projected coordinates.
        const scaledX = perspectiveX * this.scale;
        const scaledY = perspectiveY * this.scale;

        // Return the projected 2D coordinates along with the depth (z).
        return {
            x: scaledX + camera.canvasWidth / 2, // Centered on canvas
            y: scaledY + camera.canvasHeight / 2, // Centered on canvas
            depth: z,
        };
    }

    // Update the object's position and physics.
    update() {
        // Apply acceleration to velocity.
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this.velocity.z += this.acceleration.z;

        // Update position based on velocity.
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.z += this.velocity.z;
    }

    // Check collision with another object.
    checkCollision(otherObject) {
        return (
            this.x < otherObject.x + otherObject.width &&
            this.x + this.width > otherObject.x &&
            this.y < otherObject.y + otherObject.height &&
            this.y + this.height > otherObject.y &&
            this.z < otherObject.z + otherObject.depth &&
            this.z + this.depth > otherObject.z
        );
    }

    // Handle collision with another object (e.g., bounce back).
    handleCollision(otherObject) {
        // Simple response: Reverse velocity on the collision axis.
        if (this.checkCollisionX(otherObject)) {
            this.velocity.x *= -1;
        }
        if (this.checkCollisionY(otherObject)) {
            this.velocity.y *= -1;
        }
        if (this.checkCollisionZ(otherObject)) {
            this.velocity.z *= -1;
        }
    }

    // Helper methods to check collision on specific axes.
    checkCollisionX(otherObject) {
        return (
            this.x < otherObject.x + otherObject.width &&
            this.x + this.width > otherObject.x
        );
    }

    checkCollisionY(otherObject) {
        return (
            this.y < otherObject.y + otherObject.height &&
            this.y + this.height > otherObject.y
        );
    }

    checkCollisionZ(otherObject) {
        return (
            this.z < otherObject.z + otherObject.depth &&
            this.z + this.depth > otherObject.z
        );
    }

    // Load and play background music.
    playBackgroundMusic(audioContext, audioFile) {
        const audioElement = new Audio(audioFile);
        const audioSource = audioContext.createMediaElementSource(audioElement);

        // Connect the audio source to the audio context destination (e.g., speakers).
        audioSource.connect(audioContext.destination);

        // Play the background music.
        audioElement.play();
    }

    // Load and play a sound with distance-based attenuation.
    playSoundEffect(audioContext, audioFile, camera) {
        // Calculate the distance between the object and the camera.
        const distance = Math.sqrt(
            Math.pow(this.x - camera.x, 2) +
            Math.pow(this.y - camera.y, 2) +
            Math.pow(this.z - camera.z, 2)
        );

        // Calculate the scaled volume based on distance.
        const scaledVolume = 1 - Math.min(distance / this.maxDistance, 1);

        // If the audio element is not created yet, create it.
        if (!this.audioElement) {
            this.audioElement = new Audio(audioFile);
            const audioSource = audioContext.createMediaElementSource(this.audioElement);
            audioSource.connect(audioContext.destination);
        }

        // Set the volume to the scaled volume.
        this.audioElement.volume = scaledVolume * this.volume;

        // Play the sound.
        this.audioElement.play();
    }

    // Play a global sound effect.
    playGlobalSoundEffect(audioFile) {
        const audioElement = new Audio(audioFile);
        audioElement.play();
    }

    render(context, camera) {
        if (this.visible) {
            const projectedVertices = this.vertices.map((vertex) => this.projectVertex(vertex, camera));

            context.strokeStyle = 'black';
            context.lineWidth = 2;

            for (const faceIndices of this.faces) {
                context.beginPath();
                for (let i = 0; i < faceIndices.length; i++) {
                    const vertex = projectedVertices[faceIndices[i]];
                    const nextVertex = projectedVertices[faceIndices[(i + 1) % faceIndices.length]];
                    context.moveTo(vertex.x, vertex.y);
                    context.lineTo(nextVertex.x, nextVertex.y);
                }
                context.closePath();
                context.stroke();
            }
        }
    }
}

class Camera {
    constructor(canvasWidth, canvasHeight, pos) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.position = pos; // Initialize the camera's position.
        this.target = new Vector3(0, 0, 0); // Initialize the camera target.
        this.up = new Vector3(0, 1, 0); // Initialize the camera's up vector.
    }

    // Calculate the camera's frustum planes.
    calculateFrustumPlanes() {
        const frustumPlanes = [];

        // Extract the camera's view and projection matrices.
        const viewMatrix = this.getViewMatrix();
        const projectionMatrix = this.getProjectionMatrix();

        // Calculate the combined view-projection matrix.
        const viewProjectionMatrix = projectionMatrix.multiply(viewMatrix);

        // Extract the six planes from the view-projection matrix.
        for (let i = 0; i < 6; i++) {
            const row = viewProjectionMatrix.getRow(i).normalize();
            frustumPlanes.push(new Plane(row.x, row.y, row.z, row.w));
        }

        return frustumPlanes;
    }

    // Calculate the camera's view matrix.
    getViewMatrix() {
        const viewMatrix = new Matrix4();

        const eye = new Vector3(this.position.x, this.position.y, this.position.z);
        const center = new Vector3(this.target.x, this.target.y, this.target.z);
        const up = new Vector3(this.up.x, this.up.y, this.up.z);

        viewMatrix.lookAt(eye, center, up);

        return viewMatrix;
    }

    // Calculate the camera's projection matrix.
    getProjectionMatrix() {
        const projectionMatrix = new Matrix4();

        const f = 1.0 / Math.tan(this.fov / 2);
        const nearMinusFar = this.near - this.far;

        projectionMatrix.set(
            f / this.aspectRatio, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (this.far + this.near) / nearMinusFar, -1,
            0, 0, (2 * this.far * this.near) / nearMinusFar, 0
        );

        return projectionMatrix;
    }
}

class Particle {
    constructor(x, y, z, velocityX, velocityY, velocityZ, lifetime, color) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.velocityZ = velocityZ;
        this.lifetime = lifetime; // How long the particle will exist in frames.
        this.color = color; // Color of the particle.
    }

    update() {
        // Update particle position based on velocity.
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.z += this.velocityZ;
        this.lifetime--;

        // Apply gravity or other forces as needed.
        if (!this.y < 0)
            this.velocityY--;
    }

    isAlive() {
        return this.lifetime > 0;
    }

    render(context, camera) {
        // Project and render the particle on the canvas.
        const projectedPos = this.projectPosition(camera);

        context.fillStyle = this.color;
        context.fillRect(projectedPos.x, projectedPos.y, 2, 2); // Render a simple square particle.
    }

    projectPosition(camera) {
        // Translate the position relative to the camera.
        const translatedX = this.x - camera.x;
        const translatedY = this.y - camera.y;
        const translatedZ = this.z - camera.z;

        // Apply perspective projection (divide by z).
        const perspectiveX = translatedX / translatedZ;
        const perspectiveY = translatedY / translatedZ;

        // Scale the projected coordinates.
        const scaledX = perspectiveX * camera.scale;
        const scaledY = perspectiveY * camera.scale;

        // Return the projected 2D coordinates.
        return {
            x: scaledX + camera.canvasWidth / 2, // Centered on canvas
            y: scaledY + camera.canvasHeight / 2, // Centered on canvas
        };
    }
}

class Matrix4 {
    constructor() {
        this.elements = new Float32Array(16);
        this.identity();
    }

    identity() {
        for (let i = 0; i < 16; i++) {
            this.elements[i] = i % 5 === 0 ? 1 : 0;
        }
    }

    set(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44) {
        const e = this.elements;
        e[0] = m11; e[1] = m12; e[2] = m13; e[3] = m14;
        e[4] = m21; e[5] = m22; e[6] = m23; e[7] = m24;
        e[8] = m31; e[9] = m32; e[10] = m33; e[11] = m34;
        e[12] = m41; e[13] = m42; e[14] = m43; e[15] = m44;
    }

    multiply(mat) {
        const product = new Matrix4();
        const a = this.elements;
        const b = mat.elements;
        const c = product.elements;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                c[i * 4 + j] = a[i * 4] * b[j] + a[i * 4 + 1] * b[j + 4] + a[i * 4 + 2] * b[j + 8] + a[i * 4 + 3] * b[j + 12];
            }
        }

        return product;
    }

    lookAt(eye, center, up) {
        const zAxis = Vector3.normalize(Vector3.subtract(eye, center));
        const xAxis = Vector3.normalize(Vector3.cross(up, zAxis));
        const yAxis = Vector3.normalize(Vector3.cross(zAxis, xAxis));

        this.set(
            xAxis.x, xAxis.y, xAxis.z, -Vector3.dot(xAxis, eye),
            yAxis.x, yAxis.y, yAxis.z, -Vector3.dot(yAxis, eye),
            zAxis.x, zAxis.y, zAxis.z, -Vector3.dot(zAxis, eye),
            0, 0, 0, 1
        );
    }

    getRow(row) {
        const e = this.elements;
        return new Vector3(e[row], e[row + 4], e[row + 8]);
    }
}

class Vector3 {
    constructor(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }

    static subtract(v1, v2) {
        return new Vector3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }

    static cross(v1, v2) {
        return new Vector3(
            v1.y * v2.z - v1.z * v2.y,
            v1.z * v2.x - v1.x * v2.z,
            v1.x * v2.y - v1.y * v2.x
        );
    }

    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }

    static normalize(v) {
        const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        return new Vector3(v.x / length, v.y / length, v.z / length);
    }
}

export { Game, GameObject, Particle, Camera, Asset, Vector3, Matrix4 };