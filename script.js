    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const uiEl = document.getElementById('ui');
    const scoreEl = document.getElementById('score');
    const startScreen = document.getElementById('startScreen');
    const polaroidModal = document.getElementById('polaroidModal');
    const polaroidImage = document.getElementById('polaroidImage');
    const polaroidText = document.getElementById('polaroidText');

    // Game States: 'HOME' | 'PLAYING' | 'POLAROID'
    let gameState = 'HOME';

    let width, height;
    let score = 0;

    // Photos will be populated dynamically from the images folder.
    let photos = [];

    async function loadPhotos() {
      const fallbackPhotos = Array.from({ length: 10 }, (_, i) => `images/photo-${i + 1}.jpeg`);

      try {
        const response = await fetch('images/');
        if (!response.ok) throw new Error('Could not load images directory.');

        const html = await response.text();
        const discoveredPhotos = [...html.matchAll(/href="([^"]+\.(?:jpe?g|png|gif|webp|bmp|svg))"/gi)]
          .map((match) => match[1])
          .filter((fileName) => !fileName.startsWith('._') && !fileName.startsWith('/'))
          .map((fileName) => `images/${fileName.replace(/^\.\//, '')}`);

        photos = [...new Set(discoveredPhotos)];
      } catch (error) {
        photos = fallbackPhotos;
      }

      if (!photos.length) {
        photos = fallbackPhotos;
      }

      return photos;
    }

    // Romantic Quotes Pool
    const loveQuotes = [
      "You make every single day feel like a beautiful adventure.",
      "Forever my favorite person to share morning coffee with.",
      "Choosing you every day is the easiest decision I ever make.",
      "You are my best friend, my home, and my favorite person.",
      "I love you to the moon and back a million times.",
      "You make my heart smile in ways no one else can.",
      "My favorite place in the entire world is right next to you.",
      "Life with you is better than any dream I've ever had.",
      "Thank you for making my life so sweet, fun, and full of love.",
      "You are my favorite notification and my favorite thought.",
      "Every little moment with you turns into a memory I want to keep forever.",
      "You are the calm in my chaos and the spark in my every day.",
      "I still get butterflies every time I see your smile.",
      "The best part of my life is simply loving you.",
      "You make ordinary days feel like the most magical ones.",
      "I never knew love could feel this soft, safe, and sincere.",
      "My heart always finds its way back to you.",
      "You are my most treasured blessing and my favorite person.",
      "Being with you feels like the sweetest kind of home.",
      "You deserve all the love in the world, and I want to give it to you.",
      "Every day with you is a chapter I want to reread forever.",
      "You are the reason my world feels brighter, warmer, and fuller.",
      "I love the way your presence makes everything else fade away.",
      "You are my favorite hello and my hardest goodbye.",
      "My heart is happiest when it's wrapped up in your love."
    ];

    let availablePhotoIndices = [];

    // Slingshot / Bow Origin Point
    const slingshot = { x: 0, y: 0, maxPull: 110 };
    let isDragging = false;
    let dragPos = { x: 0, y: 0 };

    // Game Entities
    let arrows = [];
    let balloons = [];
    let confetti = [];
    let stars = [];

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
      slingshot.x = width / 2;
      slingshot.y = height - 90;
      initStars();
    }

    function initStars() {
      stars = [];
      for (let i = 0; i < 50; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.7),
          size: Math.random() * 2 + 1,
          alpha: Math.random()
        });
      }
    }

    window.addEventListener('resize', resize);
    resize();

    // Game State Flow Controls
    async function startGame() {
      await loadPhotos();
      score = 0;
      scoreEl.textContent = score;
      arrows = [];
      balloons = [];
      confetti = [];
      availablePhotoIndices = [...Array(photos.length).keys()];

      startScreen.classList.remove('active');
      uiEl.classList.add('active');
      gameState = 'PLAYING';
    }

    function exitGame() {
      gameState = 'HOME';
      uiEl.classList.remove('active');
      polaroidModal.classList.remove('active');
      startScreen.classList.add('active');

      // Clear game elements
      arrows = [];
      balloons = [];
      confetti = [];
    }

    function createBalloon() {
      return {
        x: Math.random() * (width - 100) + 50,
        y: -50,
        radius: 28,
        speedY: Math.random() * 0.8 + 0.6,
        swaySpeed: Math.random() * 0.03 + 0.01,
        swayOffset: Math.random() * Math.PI * 2,
        color: `hsl(${Math.random() * 40 + 320}, 90%, 75%)`
      };
    }

    // Touch / Mouse Controls
    function getPointerPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function onStart(e) {
      if (gameState !== 'PLAYING') return;
      const pos = getPointerPos(e);
      const dist = Math.hypot(pos.x - slingshot.x, pos.y - slingshot.y);
      if (dist < 100) {
        isDragging = true;
        dragPos = pos;
      }
    }

    function onMove(e) {
      if (!isDragging || gameState !== 'PLAYING') return;
      const pos = getPointerPos(e);
      const dx = pos.x - slingshot.x;
      const dy = pos.y - slingshot.y;
      const dist = Math.hypot(dx, dy);

      if (dist > slingshot.maxPull) {
        const angle = Math.atan2(dy, dx);
        dragPos = {
          x: slingshot.x + Math.cos(angle) * slingshot.maxPull,
          y: slingshot.y + Math.sin(angle) * slingshot.maxPull
        };
      } else {
        dragPos = pos;
      }
    }

    function onEnd() {
      if (!isDragging || gameState !== 'PLAYING') return;
      isDragging = false;

      const dx = slingshot.x - dragPos.x;
      const dy = slingshot.y - dragPos.y;
      const power = 0.18;

      arrows.push({
        x: slingshot.x,
        y: slingshot.y,
        vx: dx * power,
        vy: dy * power,
        angle: Math.atan2(dy, dx),
        life: 0
      });
    }

    window.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    window.addEventListener('touchstart', onStart);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);

    function explodeBalloon(x, y, color) {
      for (let i = 0; i < 25; i++) {
        confetti.push({
          x, y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 2,
          size: Math.random() * 6 + 4,
          color: i % 2 === 0 ? color : '#ffffff',
          alpha: 1
        });
      }
    }

    function triggerPolaroid() {
      gameState = 'POLAROID';
      score++;
      scoreEl.textContent = score;

      if (availablePhotoIndices.length === 0) {
        availablePhotoIndices = [...Array(photos.length).keys()];
      }

      const randomIndexPosition = Math.floor(Math.random() * availablePhotoIndices.length);
      const photoIndex = availablePhotoIndices.splice(randomIndexPosition, 1)[0];
      const randomQuote = loveQuotes[Math.floor(Math.random() * loveQuotes.length)];

      polaroidImage.src = photos[photoIndex];
      polaroidText.textContent = `"${randomQuote}"`;

      setTimeout(() => {
        polaroidModal.classList.add('active');
      }, 300);
    }

    function closePolaroid() {
      polaroidModal.classList.remove('active');
      gameState = 'PLAYING';
    }

    function update() {
      // Only update balloons and collision logic during active play
      if (gameState === 'PLAYING') {
        if (Math.random() < 0.02 && balloons.length < 4) {
          balloons.push(createBalloon());
        }

        for (let i = balloons.length - 1; i >= 0; i--) {
          const b = balloons[i];
          b.y += b.speedY;
          b.x += Math.sin(b.y * b.swaySpeed + b.swayOffset) * 1.2;
          if (b.y > height + 60) balloons.splice(i, 1);
        }

        for (let i = arrows.length - 1; i >= 0; i--) {
          const a = arrows[i];
          a.x += a.vx;
          a.y += a.vy;
          a.vy += 0.08;
          a.angle = Math.atan2(a.vy, a.vx);

          for (let j = balloons.length - 1; j >= 0; j--) {
            const b = balloons[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);

            if (dist < b.radius + 15) {
              explodeBalloon(b.x, b.y, b.color);
              balloons.splice(j, 1);
              arrows.splice(i, 1);
              triggerPolaroid();
              break;
            }
          }

          if (a.x < -20 || a.x > width + 20 || a.y > height + 20) {
            arrows.splice(i, 1);
          }
        }
      }

      // Confetti physics still update smoothly during transitions
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.x += c.vx;
        c.y += c.vy;
        c.alpha -= 0.025;
        if (c.alpha <= 0) confetti.splice(i, 1);
      }
    }

    function drawTrajectory() {
      if (!isDragging || gameState !== 'PLAYING') return;

      const dx = slingshot.x - dragPos.x;
      const dy = slingshot.y - dragPos.y;
      const power = 0.18;

      let simX = slingshot.x;
      let simY = slingshot.y;
      let simVx = dx * power;
      let simVy = dy * power;

      ctx.fillStyle = 'rgba(255, 182, 193, 0.7)';
      for (let i = 0; i < 18; i++) {
        simX += simVx;
        simY += simVy;
        simVy += 0.08;

        ctx.beginPath();
        ctx.arc(simX, simY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawHeart(x, y, size, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      const topCurve = size * 0.3;
      ctx.moveTo(x, y + topCurve);
      ctx.bezierCurveTo(x, y, x - size/2, y, x - size/2, y + topCurve);
      ctx.bezierCurveTo(x - size/2, y + (size + topCurve)/2, x, y + size, x, y + size);
      ctx.bezierCurveTo(x, y + size, x + size/2, y + (size + topCurve)/2, x + size/2, y + topCurve);
      ctx.bezierCurveTo(x + size/2, y, x, y, x, y + topCurve);
      ctx.fill();
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Starry background
      stars.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(Date.now() * 0.003 + s.x) * 0.3})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Balloons
      balloons.forEach(b => {
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;
        drawHeart(b.x, b.y - 10, b.radius * 1.1, b.color);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.radius);
        ctx.lineTo(b.x + Math.sin(Date.now() * 0.005) * 5, b.y + b.radius + 25);
        ctx.stroke();
      });

      // Draw Trajectory & Bow only while playing
      if (gameState === 'PLAYING') {
        drawTrajectory();

        ctx.strokeStyle = '#ff80ab';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(slingshot.x - 30, slingshot.y);
        ctx.lineTo(isDragging ? dragPos.x : slingshot.x, isDragging ? dragPos.y : slingshot.y);
        ctx.lineTo(slingshot.x + 30, slingshot.y);
        ctx.stroke();

        ctx.fillStyle = '#ff4081';
        ctx.beginPath();
        ctx.arc(slingshot.x - 30, slingshot.y, 6, 0, Math.PI * 2);
        ctx.arc(slingshot.x + 30, slingshot.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Flying Arrows
      arrows.forEach(a => {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);

        ctx.strokeStyle = '#ffe3ec';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();

        ctx.shadowColor = '#ff4081';
        ctx.shadowBlur = 10;
        drawHeart(12, -8, 14, '#ff4081');

        ctx.restore();
      });

      // Draw Confetti
      confetti.forEach(c => {
        ctx.save();
        ctx.globalAlpha = c.alpha;
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    function gameLoop() {
      update();
      draw();
      requestAnimationFrame(gameLoop);
    }

    gameLoop();
