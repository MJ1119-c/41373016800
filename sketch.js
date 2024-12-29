let player1, player2;
let sprite1Img, sprite2Img;
let bgImg;
let bullets = [];
let particles = [];
let gameStarted = false;  // 新增遊戲狀態變數

function preload() {
  // 載入所有圖片
  sprite1Img = loadImage('1all.png');
  sprite2Img = loadImage('2all.png');
  bgImg = loadImage('3.png');
}

function setup() {
  // 直接設定為全螢幕
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  player1 = new Player(100, height/2, '#FFFF00', sprite1Img, 65, 68, 87, 83, 82);
  player2 = new Player(width-100, height/2, '#00FF00', sprite2Img, LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW, 191);
}

// 當視窗大小改變時調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (!gameStarted && keyCode === 32) {  // 空白鍵的 keyCode 是 32
    gameStarted = true;
    return;
  }

  if (gameStarted) {
    if (keyCode === player1.shootKey) {
      player1.shoot();
    }
    if (keyCode === player2.shootKey) {
      player2.shoot();
    }
  }
}

function draw() {
  if (!gameStarted) {
    displayStartScreen();
    return;
  }

  // 原有的遊戲邏輯
  if (bgImg) {
    let bgRatio = bgImg.width / bgImg.height;
    let screenRatio = width / height;
    
    if (screenRatio > bgRatio) {
      image(bgImg, width/2, height/2, width, width/bgRatio);
    } else {
      image(bgImg, width/2, height/2, height*bgRatio, height);
    }
  }
  
  updateParticles();
  player1.update();
  player1.display();
  player2.update();
  player2.display();
  updateBullets();
  displayHealthAndEnergy();
  checkGameOver();
}

function displayStartScreen() {
  // 繪製半透明黑色背景
  background(0, 0, 0, 200);
  
  push();
  // 標題
  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(60);
  text('遊戲說明', width/2, height/4);

  // 操作說明
  textSize(30);
  textAlign(LEFT, CENTER);
  let instructions = [
    "HOTDOG (玩家1)：",
    "• W A S D - 移動",
    "• R - 發射",
    "",
    "BURGER KING (玩家2)：",
    "• ↑ ← ↓ → - 移動",
    "• / - 射擊",
    "",
    "按下空白鍵開始遊戲"
  ];

  let startY = height/2 - 100;
  let lineHeight = 40;
  for (let i = 0; i < instructions.length; i++) {
    text(instructions[i], width/2 - 200, startY + i * lineHeight);
  }
  pop();
}

class Player {
  constructor(x, y, color, spriteImg, leftKey, rightKey, upKey, downKey, shootKey) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.spriteImg = spriteImg;
    this.size = min(windowWidth/10, windowHeight/4);  // 根據視窗大小調整精靈大小
    this.speed = 5;
    this.health = 100;
    this.energy = 100;
    this.leftKey = leftKey;
    this.rightKey = rightKey;
    this.upKey = upKey;
    this.downKey = downKey;
    this.shootKey = shootKey;
    this.direction = 1;
    this.isMoving = false;
    this.lastShot = 0;
    this.shootDelay = 250;
    
    // 修改動畫設定
    this.frameWidth = 32;    // 單一圖片的寬度
    this.frameHeight = 32;   // 單一圖片的高度
  }

  update() {
    this.isMoving = false;
    if (keyIsDown(this.leftKey)) {
      this.x -= this.speed;
      this.direction = -1;
      this.isMoving = true;
    }
    if (keyIsDown(this.rightKey)) {
      this.x += this.speed;
      this.direction = 1;
      this.isMoving = true;
    }
    if (keyIsDown(this.upKey)) {
      this.y -= this.speed;
      this.isMoving = true;
    }
    if (keyIsDown(this.downKey)) {
      this.y += this.speed;
      this.isMoving = true;
    }
    
    this.x = constrain(this.x, 0, width - this.size);
    this.y = constrain(this.y, 0, height - this.size);

    if (this.energy < 100) {
      this.energy += 0.2;
    }

    if (this.isMoving) {
      this.frameProgress += this.animationSpeed;
      this.currentFrame = floor(this.frameProgress) % this.frameCount;
    } else {
      this.frameProgress = 0;
      this.currentFrame = 0;
    }
  }

  display() {
    push();
    translate(this.x + this.size/2, this.y + this.size/2);
    scale(this.direction, 1);

    if (this.spriteImg) {
      let sourceX = this.currentFrame * this.frameWidth;
      image(this.spriteImg, 
            0, 0,
            this.size, this.size,
            sourceX, 0,
            this.frameWidth, this.frameHeight
      );
    }
    pop();
  }

  createMovementParticles() {
    particles.push(new Particle(this.x + this.size/2, this.y + this.size/2, this.color));
  }

  shoot() {
    let currentTime = millis();
    if (currentTime - this.lastShot >= this.shootDelay && this.energy >= 10) {
      let bulletX = this.x + (this.direction === 1 ? this.size : 0);
      bullets.push(new Bullet(bulletX, this.y + this.size/2, this.color, this.direction));
      this.lastShot = currentTime;
      this.energy -= 10;
      
      for(let i = 0; i < 5; i++) {
        particles.push(new Particle(bulletX, this.y + this.size/2, this.color, true));
      }
    }
  }
}

class Bullet {
  constructor(x, y, color, direction) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = 12;
    this.size = 8;
    this.direction = direction;
  }

  update() {
    this.x += this.speed * this.direction;
    if (frameCount % 2 === 0) {
      particles.push(new Particle(this.x, this.y, this.color));
    }
  }

  display() {
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }

  checkHit(player) {
    if (this.color === player.color) return false;
    
    if (this.x > player.x && 
        this.x < player.x + player.size &&
        this.y > player.y && 
        this.y < player.y + player.size) {
      player.health = max(0, player.health - 10);
      
      for(let i = 0; i < 10; i++) {
        particles.push(new Particle(this.x, this.y, player.color, true));
      }
      return true;
    }
    return false;
  }

  isOffscreen() {
    return this.x < 0 || this.x > width;
  }
}

class Particle {
  constructor(x, y, color, isExplosion = false) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.alpha = 255;
    this.size = random(2, 6);
    this.speedX = isExplosion ? random(-3, 3) : random(-1, 1);
    this.speedY = isExplosion ? random(-3, 3) : random(-1, 1);
    this.life = 255;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= 10;
    this.alpha = this.life;
  }

  display() {
    let c = color(this.color);
    c.setAlpha(this.alpha);
    fill(c);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}

function updateParticles() {
  for(let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if(particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].display();
    
    if (bullets[i].checkHit(player1) || bullets[i].checkHit(player2)) {
      bullets.splice(i, 1);
      continue;
    }
    
    if (bullets[i].isOffscreen()) {
      bullets.splice(i, 1);
    }
  }
}

function setGradientBackground(c1, c2) {
  for(let y = 0; y < height; y++){
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawGrid() {
  stroke(255, 255, 255, 20);
  for(let i = 0; i < width; i += 30) {
    line(i, 0, i, height);
  }
  for(let i = 0; i < height; i += 30) {
    line(0, i, width, i);
  }
}

function displayHealthAndEnergy() {
  const barWidth = 250;  // 對應新的血條寬度
  const barSpacing = 50;  // 增加間距
  const topMargin = 20;
  
  const centerX = width / 2;
  const player1BarX = centerX - barWidth - barSpacing/2;
  const player2BarX = centerX + barSpacing/2;

  drawBar(player1BarX, topMargin, player1.health, 100, '#FFFF00', 'HP');
  drawBar(player2BarX, topMargin, player2.health, 100, '#00FF00', 'HP');
}

function drawBar(x, y, value, max, color, label) {
  const barHeight = 45;  // 再次增加血條高度
  const barWidth = 250;  // 增加血條寬度
  const borderWeight = 3;  // 邊框粗細
  
  // 繪製黑色邊框
  stroke(0);
  strokeWeight(borderWeight);
  fill(0, 0, 0, 150);
  rect(x, y, barWidth, barHeight);
  
  // 繪製血條
  fill(color);
  noStroke();
  rect(x + borderWeight/2, y + borderWeight/2, 
       map(value, 0, max, 0, barWidth - borderWeight), 
       barHeight - borderWeight);
  
  // 繪製文字（黑色、更大、更粗）
  fill(0);  // 黑色文字
  textSize(30);  // 更大的文字
  textStyle(BOLD);  // 文字加粗
  textAlign(LEFT, CENTER);
  text(`${label}: ${ceil(value)}`, x + 15, y + barHeight/2);
}

function checkGameOver() {
  if (player1.health <= 0 || player2.health <= 0) {
    // 遊戲結束，顯示結果
    push();
    // 半透明黑色背景
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);
    
    // GAME OVER 文字
    fill(255);
    textSize(80);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text('GAME OVER', width/2, height/2 - 50);
    
    // 顯示獲勝者，使用新的玩家名稱
    textSize(40);
    if (player1.health <= 0) {
      text('BURGER KING WINS!', width/2, height/2 + 50);
    } else {
      text('HOTDOG WINS!', width/2, height/2 + 50);
    }
    pop();
    
    // 停止遊戲更新
    noLoop();
  }
}
