import StartScene from './StartScene.js';
import MainScene from './MainScene.js';

// -------------------------
// 🎮 Phaser 게임 설정
// -------------------------

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#222',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
  scene: [StartScene, MainScene] // ✅ 클래스 기반 씬 배열
}; 

const game = new Phaser.Game(config);
