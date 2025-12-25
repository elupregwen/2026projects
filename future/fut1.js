// ========== THREE.JS SETUP ==========
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').prepend(renderer.domElement);

camera.position.z = 15;

// Add some lights
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(10, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// ========== GESTURE VARIABLES ==========
let videoElement, canvasElement, canvasCtx;
let hands;
let currentGesture = "none";
let effects = []; // Store all active effects

// ========== MEDIAPIPE SETUP ==========
function setupHandTracking() {
    videoElement = document.getElementById('inputVideo');
    canvasElement = document.getElementById('outputCanvas');
    canvasCtx = canvasElement.getContext('2d');
    
    canvasElement.width = 320;
    canvasElement.height = 240;
    
    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    hands.onResults(onResults);
    
    // Start camera
    startCamera();
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240 } 
        });
        videoElement.srcObject = stream;
        videoElement.addEventListener('loadeddata', () => {
            processVideo();
        });
    } catch (err) {
        console.error("Camera error:", err);
    }
}

function processVideo() {
    function processFrame() {
        if (!videoElement.videoWidth) return;
        
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.restore();
        
        hands.send({ image: videoElement });
        requestAnimationFrame(processFrame);
    }
    processFrame();
}

// ========== GESTURE DETECTION ==========
function onResults(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        currentGesture = "none";
        document.getElementById('gestureText').innerHTML = "👋 Show your hand!";
        return;
    }
    
    const landmarks = results.multiHandLandmarks[0];
    detectGesture(landmarks);
    drawLandmarks(landmarks);
}

function detectGesture(landmarks) {
    const tips = {
        thumb: landmarks[4],
        index: landmarks[8],
        middle: landmarks[12],
        ring: landmarks[16],
        pinky: landmarks[20],
        wrist: landmarks[0]
    };
    
    // Calculate finger states (up/down)
    const fingerUp = {
        thumb: tips.thumb.y < landmarks[3].y,
        index: tips.index.y < landmarks[6].y,
        middle: tips.middle.y < landmarks[10].y,
        ring: tips.ring.y < landmarks[14].y,
        pinky: tips.pinky.y < landmarks[18].y
    };
    
    // Gesture Logic
    let gesture = "none";
    
    // ✋ OPEN PALM - All fingers up
    if (fingerUp.index && fingerUp.middle && fingerUp.ring && fingerUp.pinky) {
        gesture = "open";
        if (currentGesture !== "open") {
            createFireworks();
        }
    }
    // ✌️ PEACE SIGN - Index & middle up
    else if (fingerUp.index && fingerUp.middle && !fingerUp.ring && !fingerUp.pinky) {
        gesture = "peace";
        if (currentGesture !== "peace") {
            createColorWave();
        }
    }
    // 👆 POINTING - Only index up
    else if (fingerUp.index && !fingerUp.middle && !fingerUp.ring && !fingerUp.pinky) {
        gesture = "point";
        createDrawingLine(landmarks[8]); // Use index finger tip
    }
    // 🤘 ROCK ON (index & pinky up)
    else if (fingerUp.index && !fingerUp.middle && !fingerUp.ring && fingerUp.pinky) {
        gesture = "rock";
        if (currentGesture !== "rock") {
            createLightning();
        }
    }
    // ✊ FIST - All fingers down
    else if (!fingerUp.index && !fingerUp.middle && !fingerUp.ring && !fingerUp.pinky) {
        gesture = "fist";
        if (currentGesture !== "fist") {
            clearEffects();
        }
    }
    
    // Update display
    if (gesture !== currentGesture) {
        currentGesture = gesture;
        const gestureNames = {
            "open": "✋ Open Palm",
            "peace": "✌️ Peace Sign", 
            "point": "👆 Pointing",
            "rock": "🤘 Rock On!",
            "fist": "✊ Fist",
            "none": "👋 Show hand"
        };
        document.getElementById('gestureText').innerHTML = gestureNames[gesture];
    }
}

function drawLandmarks(landmarks) {
    canvasCtx.strokeStyle = '#00ff88';
    canvasCtx.lineWidth = 2;
    
    // Simple connections
    const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
                        [0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],
                        [15,16],[0,17],[17,18],[18,19],[19,20]];
    
    connections.forEach(([a,b]) => {
        const p1 = landmarks[a], p2 = landmarks[b];
        canvasCtx.beginPath();
        canvasCtx.moveTo(p1.x * 320, p1.y * 240);
        canvasCtx.lineTo(p2.x * 320, p2.y * 240);
        canvasCtx.stroke();
    });
}

// ========== VISUAL EFFECTS ==========

// 1. ✋ OPEN PALM: Fireworks
function createFireworks() {
    for (let i = 0; i < 20; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshBasicMaterial({ 
                color: new THREE.Color(Math.random(), Math.random(), Math.random()) 
            })
        );
        
        particle.position.set(
            Math.random() * 20 - 10,
            Math.random() * 10 - 5,
            Math.random() * 10 - 5
        );
        
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        
        scene.add(particle);
        effects.push({
            type: 'firework',
            mesh: particle,
            life: 100
        });
    }
}

// 2. ✌️ PEACE SIGN: Color Wave
function createColorWave() {
    const geometry = new THREE.RingGeometry(1, 5, 32);
    const material = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.position.set(
        Math.random() * 15 - 7.5,
        Math.random() * 10 - 5,
        0
    );
    
    scene.add(ring);
    effects.push({
        type: 'ring',
        mesh: ring,
        life: 200,
        scale: 0.1
    });
}

// 3. 👆 POINTING: Drawing line
let lastPoint = null;
function createDrawingLine(landmark) {
    const x = (landmark.x - 0.5) * 20;
    const y = -(landmark.y - 0.5) * 20;
    
    if (lastPoint) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(lastPoint.x, lastPoint.y, 0),
            new THREE.Vector3(x, y, 0)
        ]);
        
        const material = new THREE.LineBasicMaterial({ 
            color: new THREE.Color(Math.random(), Math.random(), Math.random()),
            linewidth: 2
        });
        
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        effects.push({
            type: 'line',
            mesh: line,
            life: 300
        });
    }
    
    lastPoint = { x, y };
}

// 4. 🤘 ROCK ON: Lightning
function createLightning() {
    const points = [];
    let y = 10;
    let x = Math.random() * 10 - 5;
    
    for (let i = 0; i < 10; i++) {
        points.push(new THREE.Vector3(x, y, 0));
        x += (Math.random() - 0.5) * 3;
        y -= 2;
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
        color: 0x00ffff,
        linewidth: 3
    });
    
    const lightning = new THREE.Line(geometry, material);
    scene.add(lightning);
    effects.push({
        type: 'lightning',
        mesh: lightning,
        life: 30
    });
}

// 5. ✊ FIST: Clear effects
function clearEffects() {
    effects.forEach(effect => {
        scene.remove(effect.mesh);
        if (effect.mesh.geometry) effect.mesh.geometry.dispose();
        if (effect.mesh.material) effect.mesh.material.dispose();
    });
    effects = [];
    lastPoint = null;
}

// ========== ANIMATION LOOP ==========
function animate() {
    requestAnimationFrame(animate);
    
    // Update effects
    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        effect.life--;
        
        if (effect.life <= 0) {
            scene.remove(effect.mesh);
            if (effect.mesh.geometry) effect.mesh.geometry.dispose();
            if (effect.mesh.material) effect.mesh.material.dispose();
            effects.splice(i, 1);
            continue;
        }
        
        // Specific behaviors
        switch(effect.type) {
            case 'firework':
                effect.mesh.position.add(effect.velocity);
                effect.mesh.material.opacity = effect.life / 100;
                break;
            case 'ring':
                effect.mesh.scale.x += effect.scale;
                effect.mesh.scale.y += effect.scale;
                effect.mesh.material.opacity = effect.life / 200;
                break;
            case 'lightning':
                effect.mesh.material.opacity = effect.life / 30;
                break;
        }
    }
    
    // Rotate camera slowly
    camera.position.x = Math.sin(Date.now() * 0.0005) * 15;
    camera.position.z = Math.cos(Date.now() * 0.0005) * 15;
    camera.lookAt(0, 0, 0);
    
    renderer.render(scene, camera);
}

// ========== INITIALIZE ==========
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start everything
setupHandTracking();
animate();