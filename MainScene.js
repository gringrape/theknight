export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });

    // 🎮 플레이어 및 입력
    this.player = null;
    this.cursors = null;
    this.attackKey = null;

    // 📦 게임 설정 상수

    // 타일 단위
    this.TILE_WIDTH = 64;
    this.TILE_HEIGHT = 64;
    this.TILE_CENTER_OFFSET_X = this.TILE_WIDTH / 2;
    this.TILE_CENTER_OFFSET_Y = this.TILE_HEIGHT / 2;

    // 바닥 기준선
    this.GROUND_START_Y = 500;

    // 플레이어 스프라이트
    this.PLAYER_SPRITE_WIDTH = 120;
    this.PLAYER_SPRITE_HEIGHT = 80;
    this.PLAYER_SCALE = 3;
    this.PLAYER_WIDTH = this.PLAYER_SPRITE_WIDTH * this.PLAYER_SCALE;
    this.PLAYER_HEIGHT = this.PLAYER_SPRITE_HEIGHT * this.PLAYER_SCALE;

    // 적 - 임프 스프라이트
    this.IMP_SPRITE_WIDTH = 50;
    this.IMP_SPRITE_HEIGHT = 43;
    this.IMP_SCALE = this.PLAYER_SCALE;
    this.IMP_WIDTH = this.IMP_SPRITE_WIDTH * this.IMP_SCALE;
    this.IMP_HEIGHT = this.IMP_SPRITE_HEIGHT * this.IMP_SCALE;     
  }

  preload() {
    const PLAYER_SPRITE_WIDTH = 120;
    const PLAYER_SPRITE_HEIGHT = 80;
    const IMP_SPRITE_WIDTH = 50;
    const IMP_SPRITE_HEIGHT = 43;

    this.load.audio('bgm', 'assets/audio/bgm.mp3');
    this.load.audio('sword_swing', 'assets/audio/sword_swing.mp3');
    this.load.audio('hit', 'assets/audio/hit.mp3');
    this.load.audio('ugh', 'assets/audio/ugh.mp3');

    this.load.image('background', 'assets/background_castle.png');
    this.load.image('ground', 'assets/ground.png');

    this.load.spritesheet('player_idle', 'assets/player/_Idle.png', {
      frameWidth: PLAYER_SPRITE_WIDTH,
      frameHeight: PLAYER_SPRITE_HEIGHT
    });
    this.load.spritesheet('player_run', 'assets/player/_Run.png', {
      frameWidth: PLAYER_SPRITE_WIDTH,
      frameHeight: PLAYER_SPRITE_HEIGHT
    });
    this.load.spritesheet('player_jump', 'assets/player/_Jump.png', {
      frameWidth: PLAYER_SPRITE_WIDTH,
      frameHeight: PLAYER_SPRITE_HEIGHT
    });
    this.load.spritesheet('player_jumpFall', 'assets/player/_JumpFallInbetween.png', {
      frameWidth: PLAYER_SPRITE_WIDTH,
      frameHeight: PLAYER_SPRITE_HEIGHT
    });
    this.load.spritesheet('player_attack', 'assets/player/_Attack.png', {
      frameWidth: PLAYER_SPRITE_WIDTH,
      frameHeight: PLAYER_SPRITE_HEIGHT
    });
    this.load.spritesheet('player_hit', 'assets/player/_Hit.png', {
      frameWidth: PLAYER_SPRITE_WIDTH,
      frameHeight: PLAYER_SPRITE_HEIGHT
    });
    this.load.spritesheet('imp_walk', 'assets/enemy/imp/_walk.png', {
      frameWidth: IMP_SPRITE_WIDTH,
      frameHeight: IMP_SPRITE_HEIGHT
    });     
    this.load.spritesheet('imp_hit', 'assets/enemy/imp/_hit.png', {
      frameWidth: IMP_SPRITE_WIDTH,
      frameHeight: IMP_SPRITE_HEIGHT
    });
  }

  create() {
    this.createUI();
    this.createImps();
    this.startImpSpawnLoop();
    this.playBackgroundMusic();
    this.createBackground();
    this.createGround();
    this.createStatus();
    this.createScore();
    this.createAnimations();
    this.createPlayer();
    this.setupCollisions();
    this.setupInput();
  }

  createUI() {
    this.helpText = this.add.text(
      this.scale.width / 2,
      this.scale.height - 40, // ← 여기!
      '← →: 이동   ↑: 점프   Z: 공격',
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 12, y: 4 }
      }
    ).setOrigin(0.5, 1).setScrollFactor(0).setDepth(1000);
  }

  startImpSpawnLoop() {
    this.time.addEvent({
      delay: 3000,
      callback: () => {
        this.spawnImpsFromRight(1);
      },
      loop: true
    });
  }
  
  spawnImpsFromRight(count = 1) {
    const baseY = this.GROUND_START_Y - this.IMP_HEIGHT / 2;

    // 화면 기준 오른쪽 가장자리 안쪽에서 생성
    const screenRight = this.cameras.main.scrollX + this.scale.width - 20;
  
    for (let i = 0; i < count; i++) {
      const offsetX = i * 30;
      const offsetY = (i % 2 === 0) ? 0 : -10;
  
      const spawnX = screenRight + offsetX;
      const spawnY = baseY + offsetY;
  
      this.createImp(spawnX, spawnY);
  
      // 🔍 디버깅용 로그
      console.log(`🧟‍♂️ 임프 생성 at (${spawnX}, ${spawnY})`);
    }
  }

  createImps() {
    // 👹 임프 그룹 생성
    this.imps = this.physics.add.group();

    // 👹 임프 생성 함수
    this.createImp = (x, y) => {
      const imp = this.physics.add.sprite(x, y, 'imp_walk');
      console.log('Imp 위치:', imp.x, imp.y);
      imp.setScale(this.IMP_SCALE);
      imp.body.setSize(18, 30);
      imp.body.setOffset(18, 13);
      imp.body.allowGravity = false;
      imp.flipX = true;
      imp.setData('isHit', false);
      imp.setData('hp', 2);
      imp.play('imp_walk');
      
      
      // 피격 애니메이션이 끝나면 다시 걷기
      imp.on('animationcomplete', (anim) => {
        if (anim.key === 'imp_hit') {
          imp.setData('isHit', false);
          imp.play('imp_walk');
        }
      });
      
      this.imps.add(imp);
    };    
  }

  createStatus() {
    this.playerHp = 100;

    // 🅰️ HP 텍스트
    this.add.text(75, 52, 'HP', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
  
    // 🅱️ 체력바 배경 (진한 테두리 느낌, 둥근 모서리)
    this.hpBarBg = this.add.graphics();
    this.hpBarBg.fillStyle(0x222222);
    this.hpBarBg.fillRoundedRect(100, 40, 304, 28, 6);  // +20
  
    // 🅾️ 체력바 본체 (노란색, 둥근 모서리)
    this.hpBar = this.add.graphics();
    this.hpBar.fillStyle(0xffff00);
    this.hpBar.fillRoundedRect(102, 42, 300, 24, 6);  // +20
  }

  createScore() {
    // 🎯 초기 스코어 값
    this.score = 0;

    // 💯 스코어 텍스트 (오른쪽 상단, 8자리, 오른쪽 정렬)
    this.scoreText = this.add.text(this.scale.width - 100, 60, '00000000', {
      fontSize: '32px',
      fontFamily: 'Courier',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);
  }

  updateScore(amount) {
    this.score += amount;
    const scoreString = this.score.toString().padStart(8, '0');
    this.scoreText.setText(scoreString);
  }    

  updateHpBar() {
    const hpRatio = Phaser.Math.Clamp(this.playerHp / 100, 0, 1);
    const fullWidth = 300;
    const currentWidth = fullWidth * hpRatio;
  
    this.hpBar.clear();
    this.hpBar.fillStyle(0xffff00);
    this.hpBar.fillRoundedRect(102, 42, currentWidth, 24, 6);    
  }

  // 🎵 배경 음악 재생
  playBackgroundMusic() {
    this.music = this.sound.add('bgm', { loop: true, volume: 0.5 });
    this.music.play();
  }

  // 🏰 배경 이미지 생성
  createBackground() {
    const SCREEN_WIDTH = this.scale.width;
    const SCREEN_HEIGHT = this.scale.height;
    this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'background').setScrollFactor(0);
  }

  // 🧱 바닥 타일 생성
  createGround() {
    const SCREEN_WIDTH = this.scale.width;
    const SCREEN_HEIGHT = this.scale.height;

    this.groundGroup = this.physics.add.staticGroup();

    for (let x = 0; x < SCREEN_WIDTH; x += this.TILE_WIDTH) {
      for (let y = this.GROUND_START_Y; y < SCREEN_HEIGHT; y += this.TILE_HEIGHT) {
        this.groundGroup.create(
          x + this.TILE_CENTER_OFFSET_X,
          y + this.TILE_CENTER_OFFSET_Y,
          'ground'
        );
      }
    }
  }

  // 🌀 애니메이션 정의
  createAnimations() {
    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 9 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 9 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('player_jump', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'jumpFall', frames: this.anims.generateFrameNumbers('player_jumpFall', { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'attack', frames: this.anims.generateFrameNumbers('player_attack', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'hit', frames: [ { key: 'player_hit', frame: 0 } ], frameRate: 1, repeat: 0 });
    this.anims.create({ key: 'imp_walk', frames: this.anims.generateFrameNumbers('imp_walk', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'imp_hit', frames: this.anims.generateFrameNumbers('imp_hit', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
  }

  // 🧍‍♂️ 플레이어 생성
  createPlayer() {
    const playerStartX = this.scale.width / 4;
    const playerStartY = this.GROUND_START_Y - this.PLAYER_HEIGHT / 2;

    this.player = this.physics.add.sprite(playerStartX, playerStartY, 'player_idle');
    this.player.setScale(this.PLAYER_SCALE);
    this.player.play('idle');
    this.player.body.setSize(20, 40);
    this.player.body.setOffset(45, 40);
    this.player.isHit = false;

    this.attackGraphics = this.add.graphics();
    const hitAreaWidth = 70;
    const hitAreaHeight = 100;
    this.attackHitboxZone = this.physics.add.sprite(0, 0, null)
      .setDisplaySize(hitAreaWidth, hitAreaHeight)
      .setVisible(false);
    this.attackHitboxZone.body.allowGravity = false;
    this.attackHitboxZone.body.enable = false;

    this.player.on('animationupdate', (anim, frame) => {
      this.player.body.setOffset(this.player.flipX ? 55 : 45, 40);
      if (anim.key !== 'attack') return;

      const isHitFrame = frame.index === 2 || frame.index === 3;
      this.attackGraphics.clear();

      const offsetX = 100;
      const offsetY = 30;
      const x = this.player.flipX
        ? this.player.x - offsetX - hitAreaWidth
        : this.player.x + offsetX;
      const y = this.player.y + offsetY;

      if (isHitFrame) {
        this.attackHitboxZone.setPosition(x + hitAreaWidth / 2, y + hitAreaHeight / 2);
        this.attackHitboxZone.body.enable = true;
      } else {
        this.attackHitboxZone.body.enable = false;
      }
    });
  }

  // 💥 충돌 및 피격 처리
  setupCollisions() {
    this.physics.add.collider(this.player, this.groundGroup);
    this.physics.add.collider(this.imps, this.groundGroup);

    this.physics.add.overlap(this.attackHitboxZone,  this.imps, (hitbox, imp) => {
      if (!imp.getData('isHit')) {
        imp.setData('isHit', true);
        // 💖 HP 감소
        const currentHp = imp.getData('hp');
        imp.setData('hp', currentHp - 1);        
        imp.play('imp_hit');
        this.sound.play('hit');
    
        // 💨 강한 넉백 적용
        const knockbackPower = 200;
        const knockbackUpward = -150;
        const direction = (imp.x < this.player.x) ? -1 : 1;
        imp.setVelocity(knockbackPower * direction, knockbackUpward);
    
        // 🌈 피격 시 일시적으로 빨간색
        imp.setTint(0xff0000);
    
        // ⏱️ 상태 회복: 색, 속도, 상태 초기화
        this.time.delayedCall(150, () => {
          imp.setVelocity(0, 0);
          imp.clearTint();

          const currentHp = imp.getData('hp');
          if (currentHp === 0) {
            // 💀 적 사망 처리: 비활성화 + 숨기기
            this.updateScore(300);
            imp.setActive(false);
            imp.setVisible(false);
            imp.disableBody(true, true); // 물리 충돌도 제거          
          }
        });
      }
    });

    // 피격, 무적
    const INVINCIBLE_DURATION = 800;
    this.physics.add.overlap(this.player, this.imps, (player, imp) => {
      if (player.isInvincible) return;

      this.playerHp = Math.max(this.playerHp - 20, 0);
      this.updateHpBar();
      if (this.playerHp === 0) {
        this.gameOver();
      }

      this.sound.play('ugh');
      player.isInvincible = true;
    
      const knockbackPower = 50;
      const knockbackUpward = -100;
      const direction = (this.player.x < imp.x) ? -1 : 1;
      player.setVelocity(knockbackPower * direction, knockbackUpward);
    
      player.isHit = true;
      player.play('hit', true);
      player.setTint(0xff0000);
    
      // ✨ 깜빡임 (총 1440ms)
      this.tweens.add({
        targets: player,
        alpha: 0,
        ease: 'Linear',
        duration: 80,
        yoyo: true,
        repeat: 8,
      });
    
      // 😵 피격 상태 해제 (빠르게)
      this.time.delayedCall(300, () => {
        player.isHit = false;
      });
    
      // 🛡️ 무적 상태 해제 (무적 시간: 1500ms)
      this.time.delayedCall(1500, () => {
        player.isInvincible = false;
        player.clearTint();
        player.setAlpha(1);
      });
    });  
  }

  // ⌨️ 키보드 입력 등록
  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  }  
    
  update() {
    const SPEED = 200;
    const JUMP_POWER = 270;
  
    const isMovingLeft = this.cursors.left.isDown;
    const isMovingRight = this.cursors.right.isDown;
    const isJumpPressed = this.cursors.up.isDown;
    const isOnGround = this.player.body.blocked.down;
    const isIdle = !isMovingLeft && !isMovingRight;
    const isAttackPressed = Phaser.Input.Keyboard.JustDown(this.attackKey);
    const isAttacking = this.player.anims.isPlaying && this.player.anims.currentAnim.key === 'attack';

    // 임프 이동
    this.imps.children.iterate((imp) => {
      if (!imp.getData('isHit')) {
        imp.setVelocityX(-60);
      }
    });
  
    // 💥 넉백 중이면 움직임 무시
    if (this.player.isHit) return;
    
    // 공격
    if (isAttacking) return;
  
    if (isAttackPressed && isOnGround) {
      this.player.setVelocityX(0);
      this.sound.play('sword_swing');
      this.player.play('attack', true);
      return;
    }
  
    // 점프
    if (isJumpPressed && isOnGround) {
      this.player.setVelocityY(-JUMP_POWER);
      this.player.play('jump', true);
    }
  
    // 공중 상태
    if (!isOnGround && this.player.body.velocity.y > 0) {
      this.player.play('jumpFall', true);
    }
  
    // 이동
    if (isMovingLeft) {
      this.player.setVelocityX(-SPEED);
      this.player.flipX = true;
      if (isOnGround) this.player.play('run', true);
    }
  
    if (isMovingRight) {
      this.player.setVelocityX(SPEED);
      this.player.flipX = false;
      if (isOnGround) this.player.play('run', true);
    }
  
    // 정지
    if (isIdle && isOnGround) {
      this.player.setVelocityX(0);
      this.player.play('idle', true);
    }
  }
  
  gameOver() {
    // 💥 플레이어 움직임 정지
    this.player.setVelocity(0, 0);
    this.player.setTint(0x000000);
    this.player.anims.stop();
  
    // 🟥 Game Over 텍스트 표시
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'GAME OVER', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#ff0000',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  
    // ⛔ 입력도 막아버리기 (선택사항)
    this.input.keyboard.shutdown();
  
    // 🔒 물리 멈춤 (선택사항)
    this.physics.pause();

    this.music.stop();

    // ✅ 1. SPACE 키 누르면 StartScene 으로 전환
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey.once('down', () => {
      this.scene.start('StartScene');
    });

    // ✅ 2. 3초 후 자동으로 StartScene 으로 전환
    this.time.delayedCall(3000, () => {
      this.scene.start('StartScene');
    });    
  }  
}
