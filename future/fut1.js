// ========== CONFIGURATION ==========
const config = {
    width: 640,
    height: 480,
    useMirror: true,
    highPerformance: true,
    showVisuals: true,
    modelComplexity: 0,
    detectionConfidence: 0.6,
    trackingConfidence: 0.5
};

// ========== ELEMENTS ==========
const video = document.getElementById('videoInput');
const canvas = document.getElementById('canvasOutput');
const ctx = canvas.getContext('2d', { alpha: false });
const fpsDisplay = document.getElementById('fps');
const latencyDisplay = document.getElementById('latency');
const gestureDisplay = document.getElementById('gestureDisplay');
const handCountDisplay = document.getElementById('handCount');
const confidenceDisplay = document.getElementById('confidence');
const processTimeDisplay = document.getElementById('processTime');
const effectCountDisplay = document.getElementById('effectCount');
const visualEffectsContainer = document.getElementById('visualEffects');

// ========== PERFORMANCE VARIABLES ==========
let hands = null;
let currentStream = null;
let lastFrameTime = 0;
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = 0;
let lastGesture = '';
let isProcessing = false;
let activeEffects = 0;
let smoothedLandmarks = null;
const smoothingFactor = 0.3;

// ========== INITIALIZATION ==========
async function init() {
    console.log('🌸 Initializing Hand Gesture Magic...');

    try {
        await startCamera();
        await initMediaPipe();
        startPerformanceMonitor();
        requestAnimationFrame(processLoop);
        console.log('✨ Magic System Ready!');
    } catch (error) {
        console.error('❌ Initialization failed:', error);
    }
}

// ========== CAMERA SETUP ==========
async function startCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: {
            width: { ideal: config.width },
            height: { ideal: config.height },
            frameRate: { ideal: 30 },
            facingMode: 'user'
        }
    };

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;

        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });
    } catch (error) {
        console.error('Camera error:', error);
    }
}

// ========== MEDIAPIPE SETUP ==========
async function initMediaPipe() {
    hands = new self.Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: config.modelComplexity,
        minDetectionConfidence: config.detectionConfidence,
        minTrackingConfidence: config.trackingConfidence,
        selfieMode: true
    });

    hands.onResults(onResults);
}

// ========== MAIN PROCESSING LOOP ==========
function processLoop(timestamp) {
    const startTime = performance.now();

    if (!isProcessing && video.videoWidth > 0 && hands) {
        isProcessing = true;
        hands.send({ image: video })
            .catch(error => console.error('Processing error:', error))
            .finally(() => {
                isProcessing = false;
                const processTime = performance.now() - startTime;
                processTimeDisplay.textContent = `${Math.round(processTime)}ms`;
                latencyDisplay.textContent = Math.round(Date.now() - startTime);
            });
    }

    updateFPS(timestamp);
    requestAnimationFrame(processLoop);
}

// ========== HANDLE RESULTS ==========
function onResults(results) {
    const processStart = performance.now();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video
    ctx.save();
    if (config.useMirror) {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
    }
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        smoothedLandmarks = smoothLandmarks(landmarks, smoothedLandmarks);

        // Draw hand with pink colors
        drawHandPink(smoothedLandmarks);

        // Detect gesture
        const gesture = detectGesture(smoothedLandmarks);
        updateGestureDisplay(gesture);

        // Update stats
        handCountDisplay.textContent = results.multiHandLandmarks.length;

        if (results.multiHandedness && results.multiHandedness[0]) {
            const confidence = results.multiHandedness[0].score * 100;
            confidenceDisplay.textContent = `${Math.round(confidence)}%`;
        }

        // Create full-screen visual effects
        if (config.showVisuals && gesture !== lastGesture) {
            createFullScreenEffect(gesture, landmarks);
            lastGesture = gesture;
        }

        // Update effect count
        effectCountDisplay.textContent = activeEffects;

    } else {
        handCountDisplay.textContent = '0';
        confidenceDisplay.textContent = '0%';
        gestureDisplay.innerHTML = '<i class="fas fa-hand-wave mr-2"></i>Wave your hand!';
        gestureDisplay.className = "text-xl font-bold text-white";
        lastGesture = '';
    }

    const totalTime = performance.now() - processStart;
    processTimeDisplay.textContent = `${Math.round(totalTime)}ms`;
}

// ========== SMOOTHING ==========
function smoothLandmarks(newLandmarks, previousLandmarks) {
    if (!previousLandmarks) return newLandmarks;

    const smoothed = [];
    for (let i = 0; i < newLandmarks.length; i++) {
        const newPoint = newLandmarks[i];
        const prevPoint = previousLandmarks[i];

        smoothed.push({
            x: prevPoint.x * (1 - smoothingFactor) + newPoint.x * smoothingFactor,
            y: prevPoint.y * (1 - smoothingFactor) + newPoint.y * smoothingFactor,
            z: prevPoint.z * (1 - smoothingFactor) + newPoint.z * smoothingFactor
        });
    }

    return smoothed;
}

// ========== PINK HAND DRAWING ==========
function drawHandPink(landmarks) {
    // Draw connections with pink gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#FF6B9D');
    gradient.addColorStop(0.5, '#FF9EBD');
    gradient.addColorStop(1, '#FFB3C6');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Draw finger connections
    const fingerConnections = [
        [0, 1, 2, 3, 4],      // Thumb
        [0, 5, 6, 7, 8],      // Index
        [0, 9, 10, 11, 12],   // Middle
        [0, 13, 14, 15, 16],  // Ring
        [0, 17, 18, 19, 20]   // Pinky
    ];

    fingerConnections.forEach(finger => {
        ctx.beginPath();
        finger.forEach((pointIndex, i) => {
            const point = landmarks[pointIndex];
            let x = point.x * canvas.width;
            let y = point.y * canvas.height;

            if (config.useMirror) {
                x = canvas.width - x;
            }

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    });

    // Draw landmarks as sparkly dots
    landmarks.forEach((point, index) => {
        let x = point.x * canvas.width;
        let y = point.y * canvas.height;

        if (config.useMirror) {
            x = canvas.width - x;
        }

        const radius = index === 0 ? 8 : 5;

        // Outer glow
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 107, 157, 0.3)';
        ctx.fill();

        // Inner dot
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = index === 0 ? '#FF6B9D' : '#FF9EBD';
        ctx.fill();

        // Sparkle highlight
        ctx.beginPath();
        ctx.arc(x, y, radius / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
    });
}

// ========== GESTURE DETECTION ==========
function detectGesture(landmarks) {
    const tips = [4, 8, 12, 16, 20];
    const bases = [2, 5, 9, 13, 17];

    const fingerStates = tips.map((tipIdx, i) => {
        const tip = landmarks[tipIdx];
        const base = landmarks[bases[i]];
        return tip.y < base.y;
    });

    const [thumbUp, indexUp, middleUp, ringUp, pinkyUp] = fingerStates;

    if (indexUp && middleUp && !ringUp && !pinkyUp) {
        return "✌️ Peace Sign";
    } else if (indexUp && !middleUp && !ringUp && !pinkyUp) {
        return "👆 Pointing";
    } else if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
        return "✊ Fist";
    } else if (indexUp && middleUp && ringUp && pinkyUp) {
        return "✋ Open Palm";
    } else if (indexUp && !middleUp && !ringUp && pinkyUp) {
        return "🤘 Rock On";
    } else if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) {
        return "👍 Thumbs Up";
    } else {
        return "🌸 Detecting...";
    }
}

// ========== EPIC FULL-SCREEN VISUAL EFFECTS ==========
function createFullScreenEffect(gesture, landmarks) {
    if (!config.showVisuals) return;

    const center = landmarks[0];
    const x = (config.useMirror ? (1 - center.x) : center.x) * window.innerWidth;
    const y = center.y * window.innerHeight;

    switch (gesture) {
        case "✌️ Peace Sign":
            createFireworks(x, y);
            break;
        case "👆 Pointing":
            createSparkleTrail(x, y);
            break;
        case "✊ Fist":
            clearAllEffects();
            break;
        case "✋ Open Palm":
            createFlowerBloom(x, y);
            break;
        case "🤘 Rock On":
            createHeartExplosion(x, y);
            break;
        case "👍 Thumbs Up":
            createConfettiShower(x, y);
            break;
    }
}

// ========== EFFECT FUNCTIONS ==========
function createFireworks(x, y) {
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.style.left = `${Math.random() * window.innerWidth}px`;
            firework.style.top = `${window.innerHeight}px`;

            const colors = ['#FF6B9D', '#FF9EBD', '#FFB3C6', '#FF8CC6', '#FF4785'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            // Launch firework
            firework.animate([
                { transform: 'translateY(0) scale(0)', opacity: 1 },
                { transform: `translateY(-${y}px) scale(1)`, opacity: 1 }
            ], {
                duration: 1000,
                easing: 'ease-out'
            });

            // Burst effect
            setTimeout(() => {
                for (let j = 0; j < 25; j++) {
                    const particle = document.createElement('div');
                    particle.className = 'effect-circle';
                    particle.style.left = firework.style.left;
                    particle.style.top = firework.style.top;
                    particle.style.width = '10px';
                    particle.style.height = '10px';
                    particle.style.background = `radial-gradient(circle, ${color} 0%, ${color}00 70%)`;

                    const angle = Math.random() * Math.PI * 2;
                    const distance = 100 + Math.random() * 200;
                    particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
                    particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);

                    visualEffectsContainer.appendChild(particle);
                    activeEffects++;

                    particle.animate([
                        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                        { transform: 'translate(var(--tx), var(--ty)) scale(0)', opacity: 0 }
                    ], {
                        duration: 1500,
                        easing: 'ease-out'
                    });

                    setTimeout(() => {
                        if (particle.parentNode) {
                            particle.remove();
                            activeEffects--;
                        }
                    }, 1500);
                }
                firework.remove();
            }, 1000);

            visualEffectsContainer.appendChild(firework);
            activeEffects++;
        }, i * 100);
    }
}

function createSparkleTrail(x, y) {
    for (let i = 0; i < 40; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = `${x + Math.random() * 100 - 50}px`;
            sparkle.style.top = `${y + Math.random() * 100 - 50}px`;
            sparkle.style.width = '20px';
            sparkle.style.height = '20px';
            sparkle.style.background = 'radial-gradient(circle, #FFFFFF 0%, #FF6B9D 100%)';
            sparkle.style.borderRadius = '50%';
            sparkle.style.boxShadow = '0 0 15px #FFFFFF';

            visualEffectsContainer.appendChild(sparkle);
            activeEffects++;

            sparkle.animate([
                { transform: 'scale(0)', opacity: 1 },
                { transform: 'scale(1)', opacity: 0 }
            ], {
                duration: 1000,
                easing: 'ease-out'
            });

            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.remove();
                    activeEffects--;
                }
            }, 1000);
        }, i * 30);
    }
}

function createFlowerBloom(x, y) {
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            const flower = document.createElement('div');
            flower.className = 'effect-circle';
            flower.style.left = `${x}px`;
            flower.style.top = `${y}px`;
            flower.style.width = '120px';
            flower.style.height = '120px';
            flower.style.background = `radial-gradient(circle, #FF6B9D 0%, #FFB3C6 50%, transparent 70%)`;

            visualEffectsContainer.appendChild(flower);
            activeEffects++;

            flower.animate([
                { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                { transform: 'scale(2.5) rotate(360deg)', opacity: 0 }
            ], {
                duration: 1800,
                easing: 'ease-out'
            });

            // Add petals
            for (let j = 0; j < 10; j++) {
                setTimeout(() => {
                    const petal = document.createElement('div');
                    petal.style.position = 'fixed';
                    petal.style.left = `${x}px`;
                    petal.style.top = `${y}px`;
                    petal.style.width = '25px';
                    petal.style.height = '50px';
                    petal.style.background = `linear-gradient(to bottom, #FF6B9D, #FFB3C6)`;
                    petal.style.borderRadius = '50%';
                    petal.style.transformOrigin = 'center bottom';

                    visualEffectsContainer.appendChild(petal);
                    activeEffects++;

                    const angle = (j * 36) * (Math.PI / 180);
                    const distance = 80;

                    petal.animate([
                        { transform: `rotate(${j * 36}deg) translateY(0)`, opacity: 1 },
                        { transform: `rotate(${j * 36}deg) translateY(${-distance}px)`, opacity: 0 }
                    ], {
                        duration: 1200,
                        easing: 'ease-out'
                    });

                    setTimeout(() => {
                        if (petal.parentNode) {
                            petal.remove();
                            activeEffects--;
                        }
                    }, 1200);
                }, j * 80);
            }

            setTimeout(() => {
                if (flower.parentNode) {
                    flower.remove();
                    activeEffects--;
                }
            }, 1800);
        }, i * 250);
    }
}

function createHeartExplosion(x, y) {
    for (let i = 0; i < 25; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.innerHTML = '❤️';
            heart.style.fontSize = '1.5rem';
            heart.style.left = `${x}px`;
            heart.style.top = `${y}px`;

            visualEffectsContainer.appendChild(heart);
            activeEffects++;

            const angle = Math.random() * Math.PI * 2;
            const distance = 150 + Math.random() * 200;

            heart.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1800,
                easing: 'ease-out'
            });

            setTimeout(() => {
                if (heart.parentNode) {
                    heart.remove();
                    activeEffects--;
                }
            }, 1800);
        }, i * 40);
    }
}

function createConfettiShower(x, y) {
    for (let i = 0; i < 80; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * window.innerWidth}px`;
        confetti.style.top = `-20px`;

        const colors = ['#FF6B9D', '#FF9EBD', '#FFB3C6', '#FF8CC6', '#FFFFFF', '#FFD6E0'];
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';

        visualEffectsContainer.appendChild(confetti);
        activeEffects++;

        confetti.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight + 20}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: 2500 + Math.random() * 1500,
            easing: 'cubic-bezier(0.1, 0.8, 0.9, 1)'
        });

        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.remove();
                activeEffects--;
            }
        }, 4000);
    }
}

function clearAllEffects() {
    visualEffectsContainer.innerHTML = '';
    activeEffects = 0;
    effectCountDisplay.textContent = '0';
}

// ========== UI CONTROLS ==========
function toggleVisuals() {
    config.showVisuals = !config.showVisuals;
    const btn = document.querySelector('.effect-status');
    btn.textContent = `Effects: ${config.showVisuals ? 'ON' : 'OFF'}`;

    if (!config.showVisuals) {
        clearAllEffects();
    }
}

function togglePerformanceMode() {
    config.highPerformance = !config.highPerformance;
    config.modelComplexity = config.highPerformance ? 0 : 1;
    const btn = document.querySelector('.performance-status');
    btn.textContent = `Turbo: ${config.highPerformance ? 'ON' : 'OFF'}`;
    initMediaPipe();
}

function calibrate() {
    smoothedLandmarks = null;
    gestureDisplay.innerHTML = '<i class="fas fa-cog animate-spin mr-2"></i>Calibrating...';

    setTimeout(() => {
        gestureDisplay.innerHTML = '<i class="fas fa-check-circle text-green-300 mr-2"></i>Calibrated!';
        setTimeout(() => {
            gestureDisplay.innerHTML = '<i class="fas fa-wand-sparkles mr-2"></i>Wave to Begin!';
        }, 1000);
    }, 1000);
}

// ========== FPS MONITORING ==========
function updateFPS(timestamp) {
    frameCount++;

    if (timestamp >= lastFpsUpdate + 1000) {
        fps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate));
        fpsDisplay.textContent = fps;
        frameCount = 0;
        lastFpsUpdate = timestamp;
    }

    lastFrameTime = timestamp;
}

function startPerformanceMonitor() {
    setInterval(() => {
        if (performance.memory) {
            const memoryMB = performance.memory.usedJSHeapSize / 1048576;
            if (memoryMB > 100) {
                console.warn(`High memory usage: ${memoryMB.toFixed(1)}MB`);
            }
        }
    }, 5000);
}

function updateGestureDisplay(gesture) {
    gestureDisplay.innerHTML = `<i class="fas fa-magic mr-2"></i>${gesture}`;

    const colors = {
        "✌️ Peace Sign": 'from-pink-350 to-pink-450',
        "👆 Pointing": 'from-pink-250 to-pink-350',
        "✊ Fist": 'from-pink-450 to-pink-650',
        "✋ Open Palm": 'from-pink-350 to-pink-550',
        "🤘 Rock On": 'from-pink-550 to-pink-450',
        "👍 Thumbs Up": 'from-pink-450 to-pink-250'
    };

    gestureDisplay.className = `text-xl font-bold bg-gradient-to-r ${colors[gesture] || 'from-pink-250 to-pink-450'} bg-clip-text text-transparent`;
}

// ========== START APPLICATION ==========
document.addEventListener('DOMContentLoaded', init);