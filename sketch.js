let spots = [];
let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Створюємо декілька плямок, уникаючи початкового розташування занадто близько до країв
  for (let i = 0; i < 10; i++) {
    spots.push(new Spot(random(50, width - 50), random(50, height - 50), random(-2, 2), random(-2, 2)));
  }
  noStroke();
}

function draw() {
  // Малюємо фон із злегка прозорим чорним відтінком, щоб залишався слід руху
  background(20, 30, 50, 25);

  // Оновлюємо та відображаємо кожну плямку
  for (let spot of spots) {
    spot.update();
    spot.display();
  }
  
  // Оновлюємо та відображаємо частинки
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].lifespan <= 0) {
      particles.splice(i, 1);
    }
  }
  
  // Обробка зіткнень між плямками
  handleCollisions();
}

function mousePressed() {
  // При кліку перевіряємо чи натиснута плямка, і якщо так – запускаємо її обробку кліку
  for (let spot of spots) {
    spot.handleClick(mouseX, mouseY);
  }
}

function touchEnded() {
  // При кліку перевіряємо чи натиснута плямка, і якщо так – запускаємо її обробку кліку
  for (let spot of spots) {
    spot.handleClick(mouseX, mouseY);
  }
}

function handleCollisions() {
  for (let i = 0; i < spots.length; i++) {
    for (let j = i + 1; j < spots.length; j++) {
      let spotA = spots[i];
      let spotB = spots[j];
      let d = p5.Vector.dist(spotA.pos, spotB.pos);
      let minDist = spotA.radius + spotB.radius;
      if (d < minDist) {
        // Обчислюємо перекриття та напрямок для розштовхування
        let overlap = minDist - d;
        let direction = p5.Vector.sub(spotA.pos, spotB.pos).normalize();
        let shift = direction.copy().mult(overlap / 2);
        spotA.pos.add(shift);
        spotB.pos.sub(shift);
        // Додаємо легке відштовхування
        spotA.vel.add(direction.copy().mult(0.5));
        spotB.vel.sub(direction.copy().mult(0.5));
      }
    }
  }
}

// Клас для плямки
class Spot {
  constructor(x, y, vx, vy) {
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.radius = 40;
    // Початковий та цільовий кольори для плавної зміни
    this.startColor = color(random(255), random(255), random(255));
    this.targetColor = this.startColor;
    this.progress = 1;
  }

  update() {
    this.pos.add(this.vel);

    // Перевірка країв холста – коригуємо позицію та швидкість
    if (this.pos.x < this.radius) {
      this.pos.x = this.radius;
      this.vel.x *= -1;
      this.vel.x += random(0.5, 1);
    }
    if (this.pos.x > width - this.radius) {
      this.pos.x = width - this.radius;
      this.vel.x *= -1;
      this.vel.x -= random(0.5, 1);
    }
    if (this.pos.y < this.radius) {
      this.pos.y = this.radius;
      this.vel.y *= -1;
      this.vel.y += random(0.5, 1);
    }
    if (this.pos.y > height - this.radius) {
      this.pos.y = height - this.radius;
      this.vel.y *= -1;
      this.vel.y -= random(0.5, 1);
    }

    // Плавна зміна кольору
    if (this.progress < 1) {
      this.progress += 0.02;
      if (this.progress > 1) this.progress = 1;
    }
    
    // Створюємо trail-частинки (щоб додати ефект світлового сліду)
    particles.push(new Particle(this.pos.x, this.pos.y, this.getCurrentColor(), false));
  }

  display() {
    let currentColor = lerpColor(this.startColor, this.targetColor, this.progress);
    
    // Малюємо основне коло
    fill(currentColor);
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
    
    // Додаємо ефект "глоу" – кілька розмитих кіл навколо
    for (let i = 1; i <= 5; i++) {
      fill(red(currentColor), green(currentColor), blue(currentColor), 50 - i * 10);
      ellipse(this.pos.x, this.pos.y, this.radius * 2 + i * 8);
    }
  }

  getCurrentColor() {
    return lerpColor(this.startColor, this.targetColor, this.progress);
  }

  // Обробка кліку: додаємо імпульс залежно від відстані та запускаємо зміну кольору
  handleClick(mx, my) {
    let d = dist(mx, my, this.pos.x, this.pos.y);
    if (d < this.radius) {
      // Обчислюємо напрямок імпульсу: від точки кліку до центру плямки
      let clickPoint = createVector(mx, my);
      let impulseDir = p5.Vector.sub(this.pos, clickPoint);
      let impulseMagnitude = impulseDir.mag();
      impulseDir.normalize();
      // Масштабуємо імпульс – чим далі від центру, тим сильніше
      let impulse = impulseDir.mult(impulseMagnitude * 0.1);
      this.vel.add(impulse);
      
      // При кліку випускаємо спалах частинок
      for (let i = 0; i < 20; i++) {
        particles.push(new Particle(this.pos.x, this.pos.y, this.getCurrentColor(), true));
      }
      
      // Запускаємо зміну кольору
      this.startColor = lerpColor(this.startColor, this.targetColor, this.progress);
      this.targetColor = color(random(255), random(255), random(255));
      this.progress = 0;
    }
  }
}

// Клас для частинок
class Particle {
  // burst: true – вибухові (при кліку), false – trail-частинки
  constructor(x, y, col, burst = false) {
    this.pos = createVector(x, y);
    if (burst) {
      // При вибухових частинках задаємо випадковий напрямок і швидкість
      let angle = random(TWO_PI);
      let speed = random(1, 3);
      this.vel = p5.Vector.fromAngle(angle).mult(speed);
      this.lifespan = 255;
      this.size = random(6, 10);
    } else {
      // Для trail-частинок – повільне дрейфування
      this.vel = createVector(random(-0.5, 0.5), random(-0.5, 0.5));
      this.lifespan = 150;
      this.size = 6;
    }
    this.col = col;
  }
  
  update() {
    this.pos.add(this.vel);
    this.lifespan -= 2;
  }
  
  display() {
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), this.lifespan);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}
