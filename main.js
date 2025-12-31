// Check if libraries loaded
if (typeof gsap === 'undefined' || typeof Lenis === 'undefined') {
    console.error('Critical libraries (GSAP or Lenis) failed to load from CDN. Check internet connection or content blocking.');
} else {
    // --- Loading Screen Controller ---
    const loadingScreen = document.getElementById('loading-screen');

    // Hide loading screen after assets load
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 2000); // Wait for loading animation to complete
    });

    // Enable Custom Cursor logic only if JS is running
    document.body.classList.add('custom-cursor-active');

    gsap.registerPlugin(ScrollTrigger);

    // --- 1. Variable Gravity Scroll (Lenis) ---
    const lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        smoothTouch: true,
    });

    let currentGravity = 'high';

    // Physics Loop for stronger feedback
    lenis.on('scroll', ({ scroll, limit, velocity }) => {
        const progress = scroll / limit;

        // 0% - 25%: HIGH GRAVITY (Heavy, difficult to scroll)
        if (progress < 0.25) {
            if (currentGravity !== 'high') {
                // Apply 'Heavy' physics: Slow duration, low wheel multiplier
                lenis.options.duration = 4.0; // Viscous feel
                lenis.options.wheelMultiplier = 0.4; // Requires more scrolling force
                document.body.style.transition = 'filter 0.5s';
                // document.body.style.filter = 'grayscale(0.5)'; // Visual feedback of weight
                currentGravity = 'high';
                console.log("Gravity: HIGH");
            }
        }
        // 25%+: ZERO GRAVITY (Weightless, friction-less)
        else {
            if (currentGravity !== 'zero') {
                // Apply 'Zero-G' physics: Fast duration, high wheel multiplier
                lenis.options.duration = 0.8; // Snappy/Floaty
                lenis.options.wheelMultiplier = 1.5; // Glides effortlessly
                document.body.style.transition = 'filter 0.5s';
                document.body.style.filter = 'none';
                currentGravity = 'zero';
                console.log("Gravity: ZERO");
            }
        }
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);


    // --- 2. Custom Cursor ---
    // --- 2. Custom Cursor (Optimized) ---
    const cursor = document.getElementById('cursor');
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    // Track mouse position only
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Ensure visible on first move
        cursor.style.opacity = 1;
    });

    // Smooth Lerp Loop (Decoupled from mouse events for performance)
    function animateCursor() {
        // Lerp factor (0.1 = smooth drag, 0.2 = faster)
        const dt = 1.0 - Math.pow(1.0 - 0.2, 2);

        cursorX += (mouseX - cursorX) * dt;
        cursorY += (mouseY - cursorY) * dt;

        // Use translate3d for hardware acceleration
        // Container moves to exact mouse coordinates. Children are centered via CSS.
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover Effects
    const interactiveElements = document.querySelectorAll('button, a, input, .glass-panel, .slider, .scroll-indicator');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
    });

    // Scroll Down Logic
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            lenis.scrollTo('#section-b', { offset: -50, duration: 1.5 });
        });
        scrollIndicator.style.cursor = 'none'; // Ensure system cursor is hidden on it
    }


    // --- 3. Interactive Liquid Simulation ---
    const dietSlider = document.getElementById('diet-slider');
    const sleepSlider = document.getElementById('sleep-slider');
    const stressSlider = document.getElementById('stress-slider');
    const statusText = document.getElementById('status-text');

    // Canvas Setup
    const liquidCanvas = document.getElementById('liquid-canvas');
    const ctx = liquidCanvas.getContext('2d');
    let width, height;

    // Resize Observer to keep canvas sharp
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            width = entry.contentRect.width;
            height = entry.contentRect.height;
            liquidCanvas.width = width;
            liquidCanvas.height = height;
        }
    });
    resizeObserver.observe(liquidCanvas.parentElement);

    // Liquid Physics State
    let time = 0;

    // Simulation Loop
    function animateLiquid() {
        ctx.clearRect(0, 0, width, height);

        // Get Input Values
        const diet = parseInt(dietSlider.value);
        const sleep = parseInt(sleepSlider.value);
        const stress = parseInt(stressSlider.value);

        // Calculate System State
        const stability = (diet + sleep - stress + 100) / 3; // 0-100
        const stressFactor = stress / 100;

        // Dynamic Parameters
        const waveSpeed = 0.05 + (stressFactor * 0.1); // Stress = Faster
        const waveAmplitude = 10 + (stressFactor * 30); // Stress = Higher waves
        const liquidLevel = height - (stability / 100 * height * 0.8) - 20; // Stability = Higher liquid (inverted y)

        // Color Blending (Cyan to Magenta/Red)
        // Simple RGB lerp
        const r = Math.floor(stressFactor * 255);
        const g = Math.floor((1 - stressFactor) * 242);
        const b = Math.floor((1 - stressFactor) * 255);
        const liquidColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
        const strokeColor = `rgba(${r}, ${g}, ${b}, 1)`;

        // Update Text
        if (stressFactor > 0.6) {
            statusText.innerText = "SYSTEM: CRITICAL";
            statusText.style.color = "#FF00E5";
            statusText.style.textShadow = "0 0 10px #FF00E5";
        } else {
            statusText.innerText = "SYSTEM: STABLE";
            statusText.style.color = "#00F2FF";
            statusText.style.textShadow = "0 0 10px #00F2FF";
        }

        // --- Draw Waves ---
        ctx.beginPath();
        ctx.moveTo(0, height); // Bottom Left

        // Draw sine wave points
        for (let x = 0; x <= width; x += 10) {
            // Combine two sine waves for more organic feel
            const y = liquidLevel +
                Math.sin(x * 0.02 + time) * waveAmplitude +
                Math.sin(x * 0.05 + time * 1.5) * (waveAmplitude / 2);
            ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height); // Bottom Right
        ctx.closePath();

        // Fill
        ctx.fillStyle = liquidColor;
        ctx.fill();

        // Stroke
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Increment time
        time += waveSpeed;

        requestAnimationFrame(animateLiquid);
    }

    // Start Simulation
    animateLiquid();


    // --- 4. Scroll Animations (GSAP) ---
    // --- 4. Scroll Animations & Visuals ---

    // Hyper-Text Decode Effect for Hero
    // Delayed to start after loading screen hides
    const heroTitle = document.querySelector('.hero-title');
    const originalText = heroTitle.innerText;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

    // Start animation after loading screen hides
    setTimeout(() => {
        // Scramble Function
        let iterations = 0;
        const scrambleInterval = setInterval(() => {
            heroTitle.innerText = originalText.split("")
                .map((letter, index) => {
                    if (index < iterations) {
                        return originalText[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)]
                })
                .join("");

            if (iterations >= originalText.length) {
                clearInterval(scrambleInterval);
                // Add subtle glow after decode
                gsap.to(heroTitle, { textShadow: "0 0 30px #00F2FF", color: "#fff", duration: 1 });
            }

            iterations += 1 / 3; // Speed of decode
        }, 30);

        gsap.from(heroTitle, {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power4.out'
        });
    }, 2200); // Wait for loading screen to hide

    // Background Particles
    const particlesContainer = document.getElementById('particles-container');
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.style.left = Math.random() * 100 + 'vw';
        p.style.animationDuration = (Math.random() * 5 + 5) + 's';
        p.style.animationDelay = Math.random() * 5 + 's';
        particlesContainer.appendChild(p);
    }

    // --- Smooth Subtle Floating Particles ---
    // Clean, professional particles that drift slowly across the screen
    const neuralCanvas = document.getElementById('neural-canvas');
    const nCtx = neuralCanvas.getContext('2d');

    // Set canvas size
    function resizeNeuralCanvas() {
        neuralCanvas.width = window.innerWidth;
        neuralCanvas.height = window.innerHeight;
    }
    resizeNeuralCanvas();
    window.addEventListener('resize', resizeNeuralCanvas);

    // Subtle floating particles
    const floatingParticles = [];
    const particleAmount = 40;

    // Initialize particles
    for (let i = 0; i < particleAmount; i++) {
        floatingParticles.push({
            x: Math.random() * neuralCanvas.width,
            y: Math.random() * neuralCanvas.height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.4 + 0.1,
            color: Math.random() > 0.7 ? 'cyan' : 'white'
        });
    }

    function animateFloatingParticles() {
        nCtx.clearRect(0, 0, neuralCanvas.width, neuralCanvas.height);

        floatingParticles.forEach(p => {
            // Update position with slow drift
            p.x += p.speedX;
            p.y += p.speedY;

            // Wrap around screen edges smoothly
            if (p.x < -10) p.x = neuralCanvas.width + 10;
            if (p.x > neuralCanvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = neuralCanvas.height + 10;
            if (p.y > neuralCanvas.height + 10) p.y = -10;

            // Draw particle (no shadow for performance)
            nCtx.beginPath();
            nCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

            if (p.color === 'cyan') {
                nCtx.fillStyle = `rgba(0, 242, 255, ${p.opacity})`;
            } else {
                nCtx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.6})`;
            }
            nCtx.fill();
        });

        requestAnimationFrame(animateFloatingParticles);
    }

    animateFloatingParticles();

    // Molecular Blueprint Fade In
    gsap.to('.content-wrapper', {
        scrollTrigger: {
            trigger: '#section-b',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: "play none none reverse"
        },
        y: 0,
        opacity: 1,
        duration: 1
    });

    // Sandbox Staggered Entry (New Interactive Look)
    // Animate the Container first
    gsap.from('.human-wireframe', {
        scrollTrigger: {
            trigger: '#section-c',
            start: 'top 75%',
        },
        x: -50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    });

    // Stagger the controls
    gsap.from('.controls-panel h3, .control-group', {
        scrollTrigger: {
            trigger: '#section-c',
            start: 'top 75%',
        },
        x: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2, // Sequential entry
        ease: 'power3.out'
    });

    // Partners Grid Stagger
    gsap.from('.partner-card', {
        scrollTrigger: {
            trigger: '#section-f',
            start: 'top 80%',
        },
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1, // Faster stagger
        ease: 'power4.out',
        clearProps: "all" // Ensure they remain visible after animation
    });

    // Footer Pulse Entry (Moved slightly for flow)
    gsap.from('.section-footer', {
        scrollTrigger: {
            trigger: '#section-d',
            start: 'top 90%',
        },
        opacity: 0,
        y: 50,
        duration: 1.5
    });

    // --- 5. Neural Uplink Interaction ---
    const terminalSubmit = document.querySelector('.terminal-submit');
    const transStatus = document.querySelector('.transmission-status');
    const inputs = document.querySelectorAll('.glitch-input');

    // Declare these early so they're accessible in the callback
    const btn = document.getElementById('biometric-btn');
    const statusDiv = document.querySelector('.sync-status');

    if (terminalSubmit) {
        // Connection flash element
        const connectionFlash = document.getElementById('connection-flash');

        terminalSubmit.addEventListener('click', () => {
            // Prevent multiple clicks
            if (terminalSubmit.disabled) return;

            // INPUT VALIDATION - Require at least one field to have data
            let hasInput = false;
            inputs.forEach(input => {
                if (input.value.trim()) {
                    hasInput = true;
                }
            });

            if (!hasInput) {
                // Show error - no input provided
                transStatus.innerText = "ERROR: INPUT_DATA_REQUIRED";
                transStatus.style.color = "#ff5f56";
                transStatus.style.textShadow = "0 0 10px #ff5f56";

                // Shake the button
                gsap.to(terminalSubmit, {
                    x: 10,
                    duration: 0.05,
                    yoyo: true,
                    repeat: 5,
                    onComplete: () => {
                        gsap.set(terminalSubmit, { x: 0 });
                    }
                });

                // Shake the inputs
                inputs.forEach(input => {
                    gsap.to(input, {
                        borderColor: '#ff5f56',
                        duration: 0.1,
                        yoyo: true,
                        repeat: 3,
                        onComplete: () => {
                            gsap.to(input, { borderColor: 'rgba(0, 242, 255, 0.3)', duration: 0.3 });
                        }
                    });
                });

                return; // Don't proceed
            }

            // Disable button and proceed with transmission
            terminalSubmit.disabled = true;

            // DEBUG: Visual Feedback immediately on click
            gsap.to(terminalSubmit, { borderColor: '#00F2FF', duration: 0.1, yoyo: true, repeat: 1 });

            // Glitch Effect on inputs
            inputs.forEach(input => {
                gsap.to(input, { x: 5, duration: 0.05, yoyo: true, repeat: 5 });
            });

            // Phase 1: ANALYZING
            terminalSubmit.innerText = "[ ANALYZING... ]";
            transStatus.innerText = "SCANNING INPUT DATA...";
            transStatus.style.color = "#00F2FF";
            transStatus.style.textShadow = "none";

            setTimeout(() => {
                // Phase 2: ESTABLISHING CONNECTION  
                terminalSubmit.innerText = "[ CONNECTING... ]";
                transStatus.innerText = "ESTABLISHING NEURAL LINK...";

                // Glitch placeholders
                inputs.forEach(input => {
                    input.value = "";
                    input.placeholder = Math.random().toString(2).substring(2, 10);
                });

                gsap.to(terminalSubmit, {
                    borderColor: '#FF00E5',
                    color: '#FF00E5',
                    duration: 0.3
                });

                setTimeout(() => {
                    // Phase 3: UPLOADING with progress
                    terminalSubmit.innerText = "[ UPLOADING... ]";
                    transStatus.style.color = "#FF00E5";

                    let progress = 0;
                    const upInterval = setInterval(() => {
                        progress += Math.floor(Math.random() * 15) + 5;
                        if (progress > 100) progress = 100;

                        transStatus.innerText = `PACKET_LOSS: 0% | UPLOAD: ${progress}%`;

                        if (progress === 100) {
                            clearInterval(upInterval);

                            // Phase 4: SUCCESS with BLUE FLASH
                            transStatus.innerText = "TRANSMISSION SUCCESSFUL. LINK ESTABLISHED.";
                            transStatus.style.color = "#27c93f";
                            transStatus.style.textShadow = "0 0 10px #27c93f";
                            terminalSubmit.innerText = "[ TRANSMITTED ]";
                            terminalSubmit.style.opacity = 0.5;
                            terminalSubmit.style.borderColor = "#27c93f";
                            terminalSubmit.style.color = "#27c93f";

                            // EDGE GLOW EFFECT
                            if (connectionFlash) {
                                connectionFlash.classList.add('active');
                                setTimeout(() => {
                                    connectionFlash.classList.remove('active');
                                }, 600);
                            }

                            // UNLOCK BIOMETRIC SYNC
                            if (btn) {
                                btn.disabled = false;
                                btn.style.opacity = 1;
                                btn.style.cursor = 'pointer';
                                btn.style.pointerEvents = 'auto';

                                statusDiv.innerText = "DATA RECEIVED. BIOMETRIC SYNC UNLOCKED.";
                                statusDiv.style.color = "#00F2FF";
                                statusDiv.style.textShadow = "0 0 10px #00F2FF";

                                gsap.to(btn, {
                                    scale: 1.05,
                                    duration: 0.4,
                                    yoyo: true,
                                    repeat: 3,
                                    boxShadow: "0 0 50px #00F2FF",
                                    ease: "power2.inOut"
                                });
                            }
                        }
                    }, 80);
                }, 1200);
            }, 1000);
        });
    }

    // --- 6. Biometric Sync Interaction ---
    // btn and statusDiv already declared in section 5

    if (btn) {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            btn.disabled = true;
            btn.classList.add('scanning'); // Start Blue Scan

            // Animation Sequence
            const tl = gsap.timeline();

            // 1. Initial Click Feedback
            tl.to(btn, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });

            // 2. Encryption Text Effect
            let steps = 0;
            const maxSteps = 20;
            const interval = setInterval(() => {
                steps++;
                statusDiv.innerText = `SYNCING... [${Math.random().toString(36).substring(7).toUpperCase()}]`;
                statusDiv.style.color = '#fff';

                if (steps >= maxSteps) {
                    clearInterval(interval);
                    completeSync();
                }
            }, 100);

            function completeSync() {
                btn.classList.remove('scanning'); // Stop Scan

                // Success State
                statusDiv.innerText = "BIOMETRIC FUSION COMPLETE";
                statusDiv.style.color = "#00F2FF";
                statusDiv.style.textShadow = "0 0 10px #00F2FF";

                btn.style.borderColor = "#00F2FF";
                btn.style.boxShadow = "0 0 50px #00F2FF";
                btn.querySelector('.btn-text').innerText = "CONNECTED";

                // Flash Screen (Slightly slower for 0.2s visibility)
                gsap.to('body', {
                    backgroundColor: '#00F2FF', duration: 0.2, yoyo: true, repeat: 1, onComplete: () => {
                        gsap.to('body', { backgroundColor: '#050505', duration: 0.5 });
                    }
                });
            }
        });
    }
}
