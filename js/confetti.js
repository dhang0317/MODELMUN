  function launchConfettiCannon() {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 pointer-events-none z-[99999] overflow-hidden';
    document.body.appendChild(overlay);

    // Elegant, restrained palette (Gold, Rose, Sky blue, Silver white)
    const colors = [
      '#f59e0b', '#fbbf24', '#f472b6', '#38bdf8', '#818cf8', '#ffffff', '#34d399'
    ];

    const pieceCount = 60;
    for (let i = 0; i < pieceCount; i++) {
      const p = document.createElement('div');
      const isRibbon = Math.random() > 0.4;
      const color = colors[Math.floor(Math.random() * colors.length)];

      const startX = window.innerWidth * (0.2 + Math.random() * 0.6);
      const startY = window.innerHeight * 0.65;

      p.style.position = 'fixed';
      p.style.left = `${startX}px`;
      p.style.top = `${startY}px`;
      p.style.backgroundColor = color;
      p.style.pointerEvents = 'none';
      p.style.zIndex = '99999';

      if (isRibbon) {
        p.style.width = `${3 + Math.random() * 3}px`;
        p.style.height = `${14 + Math.random() * 16}px`;
        p.style.borderRadius = '2px';
      } else {
        const size = 6 + Math.random() * 6;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      }

      const angle = (Math.random() * 120 - 150) * (Math.PI / 180); // upward fan arc
      const velocity = 350 + Math.random() * 450;
      const vx = Math.cos(angle) * velocity;
      let vy = Math.sin(angle) * velocity;

      overlay.appendChild(p);

      let posX = startX;
      let posY = startY;
      let rotX = Math.random() * 360;
      let rotY = Math.random() * 360;
      let rotZ = Math.random() * 360;
      const spinX = (Math.random() - 0.5) * 360;
      const spinY = (Math.random() - 0.5) * 360;
      const spinZ = (Math.random() - 0.5) * 360;
      let opacity = 1;
      let lastTime = performance.now();

      function animate(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        vy += 600 * dt; // gentle gravity
        posX += vx * dt;
        posY += vy * dt;
        rotX += spinX * dt;
        rotY += spinY * dt;
        rotZ += spinZ * dt;

        if (posY > window.innerHeight * 0.8) {
          opacity -= dt * 1.5;
        }

        p.style.transform = `translate(${posX - startX}px, ${posY - startY}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
        p.style.opacity = Math.max(0, opacity);

        if (opacity > 0 && posY < window.innerHeight + 100) {
          requestAnimationFrame(animate);
        } else {
          p.remove();
        }
      }
      setTimeout(() => {
        requestAnimationFrame(animate);
      }, Math.random() * 200);
    }

    setTimeout(() => {
      overlay.remove();
    }, 4500);
  }