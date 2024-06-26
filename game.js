let scene, camera, renderer, player, zombies, bullets, gun;
let health = 100;
let score = 0;
let gameStarted = false;

// Movement flags
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

function init() {
    // Set up Three.js scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Create player (camera)
    player = new THREE.Group();
    player.add(camera);
    scene.add(player);
    player.position.set(0, 1.6, 0);

    // Create gun
    createGun();

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Initialize arrays
    zombies = [];
    bullets = [];

    // Set up event listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Start render loop
    animate();
}

function createGun() {
    const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
    const gunMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.position.set(0.2, -0.2, -0.5);
    camera.add(gun);
}

function onKeyDown(event) {
    if (health != 0 || event.code == "Space"){
        switch (event.code) {
            case 'KeyS':
                moveForward = true;
                break;
            case 'KeyW':
                moveBackward = true;
                break;
            case 'KeyD':
                moveLeft = true;
                break;
            case 'KeyA':
                moveRight = true;
                break;
            case 'Space':
                if (!gameStarted) {
                    startGame();
                } else if (health == 0) {
                    restartGame();
                }
                break;
        }
    }
}

function onKeyUp(event) {
    if(health != 0){
        switch (event.code) {
            case 'KeyS':
                moveForward = false;
                break;
            case 'KeyW':
                moveBackward = false;
                break;
            case 'KeyD':
                moveLeft = false;
                break;
            case 'KeyA':
                moveRight = false;
                break;
        }
    }
}

function startGame() {
    gameStarted = true;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('crosshair').style.display = 'block';
    requestPointerLock();
}

function restartGame() {
    health = 100;
    score = 0;
    updateHUD();
    document.getElementById('game-over').style.display = 'none';
    gameStarted = true;
    clearZombies();
    clearBullets();
    resetPlayerPosition();
    requestPointerLock();
}

function clearZombies() {
    for (const zombie of zombies) {
        scene.remove(zombie);
    }
    zombies = [];
}

function clearBullets() {
    for (const bullet of bullets) {
        scene.remove(bullet);
    }
    bullets = [];
}

function resetPlayerPosition() {
    player.position.set(0, 1.6, 0);
    player.rotation.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
}

function requestPointerLock() {
    document.body.requestPointerLock();
}

function onPointerLockChange() {
    if (document.pointerLockElement === document.body) {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('click', shoot);
        document.body.style.cursor = 'none';
    } else {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('click', shoot);
        document.body.style.cursor = 'auto';
    }
}

function onMouseMove(event) {
    if (document.pointerLockElement === document.body) {
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        player.rotation.y -= movementX * 0.002;
        camera.rotation.x -= movementY * 0.002;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (gameStarted) {
        gameLoop();
    }
    renderer.render(scene, camera);
}

function gameLoop() {
    if (Math.random() < 0.005) {
        spawnZombie();
    }
    updatePlayerPosition();
    updateZombies();
    updateBullets();
    updateGunPosition();
}

function updatePlayerPosition() {
    const speed = 0.1;
    const direction = new THREE.Vector3();
    player.getWorldDirection(direction);
    const sideways = new THREE.Vector3(-direction.z, 0, direction.x);

    if (moveForward) player.position.add(direction.multiplyScalar(speed));
    if (moveBackward) player.position.sub(direction.multiplyScalar(speed));
    if (moveLeft) player.position.sub(sideways.multiplyScalar(speed));
    if (moveRight) player.position.add(sideways.multiplyScalar(speed));
}

function updateGunPosition() {
    // Add slight movement to the gun based on player movement
    gun.position.y = -0.2 + Math.sin(Date.now() * 0.01) * 0.01;
    gun.position.x = 0.2 + Math.cos(Date.now() * 0.01) * 0.005;
}

function spawnZombie() {
    if (health != 0){
        const zombieGeometry = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const zombieMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const zombie = new THREE.Mesh(zombieGeometry, zombieMaterial);
        
        const angle = Math.random() * Math.PI * 2;
        const radius = 10;
        zombie.position.set(
            player.position.x + Math.cos(angle) * radius,
            0.9,
            player.position.z + Math.sin(angle) * radius
        );
        
        scene.add(zombie);
        zombies.push(zombie);
    }
}

function updateZombies() {
    if (health != 0){
        const speed = 0.03;
        for (const zombie of zombies) {
            const direction = new THREE.Vector3()
                .subVectors(player.position, zombie.position)
                .normalize();
            zombie.position.add(direction.multiplyScalar(speed));
            
            if (zombie.position.distanceTo(player.position) < 1) {
                health -= 1;
                updateHUD();
                if (health <= 0) {
                    gameOver();
                }
            }
        }
    }
}

function shoot() {
    const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.position.set(player.position.x, player.position.y, player.position.z);

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    bullet.velocity = direction.multiplyScalar(0.5);

    scene.add(bullet);
    bullets.push(bullet);
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.velocity);

        // Check collision with zombies
        for (let j = zombies.length - 1; j >= 0; j--) {
            const zombie = zombies[j];
            if (bullet.position.distanceTo(zombie.position) < 0.5) {
                scene.remove(zombie);
                zombies.splice(j, 1);
                scene.remove(bullet);
                bullets.splice(i, 1);
                score += 10;
                updateHUD();
                break;
            }
        }

        // Remove bullet if it's too far away
        if (bullet.position.distanceTo(player.position) > 50) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
}

function updateHUD() {
    document.getElementById('health-value').textContent = health;
    document.getElementById('score-value').textContent = score;
}

function gameOver() {
    clearZombies();
    document.getElementById('game-over').style.display = 'block';
     // Add this line to clear zombies when the game is over
}

init();