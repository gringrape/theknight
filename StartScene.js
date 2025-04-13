export default class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.add.text(centerX, centerY, 'The Knight', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 60, 'SPACE 를 눌러 시작하세요.', {
      fontSize: '18px',
      color: '#cccccc',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MainScene');
    });
  }
}
