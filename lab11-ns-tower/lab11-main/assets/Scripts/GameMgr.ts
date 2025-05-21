import Player from "./Player";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameMgr extends cc.Component 
{
    @property()
    noDieMode: boolean = false;
    
    @property(cc.Node)
    background: cc.Node = null;

    @property(cc.Node)
    wall: cc.Node = null;

    @property(Player)
    player: Player = null;

    @property(cc.Node)
    platforms: cc.Node = null;

    @property([cc.Prefab])
    platformPrefabs: cc.Prefab[] = [];

    @property(cc.Node)
    startIcon: cc.Node = null;

    @property(cc.Node)
    pauseIcon: cc.Node = null;

    @property(cc.Node)
    scoreNode: cc.Node = null;

    @property(cc.Node)
    highestScoreNode: cc.Node = null;

    @property(cc.Node)
    energyBar: cc.Node = null;

    @property(cc.Node)
    camera: cc.Node = null;

    @property({type:cc.AudioClip})
    bgm: cc.AudioClip = null;

    debugCollider: cc.Node = null;

    gathering: boolean = false;

    energyValue: number = 0;

    private backgroundSize = 256;

    private wallSize = 384;

    private physicManager: cc.PhysicsManager = null;

    private score: number = 0;

    private highestScore: number = 0;

    private pause: boolean = false;

    private gatherEnergy;

    private inGame: boolean = false;

    private scoreInterval: number = 280;

    private nextTarget: number = 0;

    private posArr: number[] = [1, 3, 0, 2];

    private posIdx: number = 0;

    private mouseDown: boolean = false;

    onLoad()
    {
        this.physicManager = cc.director.getPhysicsManager();
        this.physicManager.enabled = true;
        this.physicManager.gravity = cc.v2 (0, -200);
    }

    start () {
        this.debugCollider = this.node.getChildByName("DebugCollider");

        this.debugCollider.active = this.noDieMode;

        this.updateHighestScore(0);

        this.gatherEnergy = () => {
            let newValue = (this.energyValue+1) % 13;
            this.updateEnergyBar(newValue);
        }

        this.node.on('mousedown', function(event){
            if(event.getButton() == 0 && this.inGame)
            {
                this.mouseDown = true;
            }
        }, this);

        this.node.on('mouseup', function(event){
            if(event.getButton() == 0 && this.inGame)
            {
                this.mouseDown = false;
                if(this.gathering){

                    this.gathering = false;

                    // ===================== TODO =====================
                    // 1. When user releases mouse, you should unschedule "gatherEnergy" function.
                    // 2. Call the "playerJump" function in Player.ts with "this.energyValue * 50" as parameter.
                    // ================================================
                    this.unschedule(this.gatherEnergy);
                    
                    // 執行玩家跳躍
                    if (this.player) {
                        this.player.playerJump(this.energyValue * 50);
                    }
                    this.updateEnergyBar(0);
                }
            }
        }, this);

        this.generatePlatforms(500);
    }

    update(dt)
    {
        if(this.player.fallDown){
            this.gathering = false;
            // ===================== TODO =====================
            // 1. When player falls down,  you should unschedule "gatherEnergy" function.
            // ================================================
            this.unschedule(this.gatherEnergy);
        }else{
            if(this.mouseDown && !this.gathering)
            {
                this.gathering = true;
                // ===================== TODO =====================
                // 1. When user presses mouse,  you should call "gatherEnergy" function every 0.05s.
                // ================================================
                this.schedule(this.gatherEnergy, 0.05);
            }
        }

        if(this.camera.y - this.wall.y >= this.wallSize)
            this.wall.y += this.wallSize;
        
        if(this.camera.y - this.background.y >= this.backgroundSize)
            this.background.y += this.backgroundSize;

        if(this.inGame)
        {
            if(this.player.node.y - this.camera.y > 100)
                this.camera.y = this.player.node.y - 100;
    
            if(this.camera.y-200 > this.player.node.y)
            {
                if(this.player.node.active)
                {
                    this.player.playerDie();
                    this.gameOver();
                }
            }

            if(this.player.node.y >= this.nextTarget)
            {
                this.updateScore(this.score + 1);
                this.nextTarget += this.scoreInterval;
            }
        }
        else
        {
            this.camera.y += 1;
        }

        this.debugCollider.y = 22;
    }

    randomChoosePlatform()
    {
        let rand = Math.random();

        //0: normal, 1: conveyor
        let prob = [8, 1];
        let sum = prob.reduce((a,b)=>a+b);
        for(let i = 1; i < prob.length; i++)
            prob[i] += prob[i-1];
        for(let i = 0; i < prob.length; i++)
        {
            prob[i] /= sum;
            if(rand <= prob[i])
                return i;
        }
    }

    generatePlatforms(num: number)
    {
        this.platforms.removeAllChildren();
        for(let i = 0; i < num; i++)
        {
            let randIdx = this.randomChoosePlatform();
            // let randIdx = 1;
            let platform = cc.instantiate(this.platformPrefabs[randIdx]);
            platform.parent = this.platforms;
            platform.position = cc.v2(-132 + Math.floor(Math.random() * 29) - 14 + 88 * this.posArr[this.posIdx], -105+40*i);
            this.posIdx = (this.posIdx + 1) % 4;
        }
    }

    updateEnergyBar(value: number)
    {
        this.energyValue = value;
        this.energyBar.width = this.energyValue * 8;
    }

    updateHighestScore(score: number)
    {
        this.highestScore = score;
        this.highestScoreNode.getComponent(cc.Label).string = (Array(4).join("0") + this.highestScore.toString()).slice(-4);
    }

    updateScore(score: number)
    {
        this.score = score;
        this.scoreNode.getComponent(cc.Label).string = (Array(4).join("0") + this.score.toString()).slice(-4);
    }

    gameStart()
    {
        this.startIcon.active = false;
        this.generatePlatforms(500);
        this.inGame = true;

        this.background.position = cc.v2();
        this.wall.position = cc.v2();
        this.camera.position = cc.v2();

        if(this.score > this.highestScore)
        this.updateHighestScore(this.score);
        this.updateScore(1);
        this.player.node.active = true;
        this.player.reborn();
        this.nextTarget = this.player.node.y + this.scoreInterval * this.score;

        cc.audioEngine.playMusic(this.bgm, true);
    }

    gamePause()
    {
        if(this.pause)
            this.pause = false;
        else
            this.pause = true;
        if(this.pause)
        {
            this.pauseIcon.active = true;
            this.scheduleOnce(()=>{
                cc.game.pause();
            }, 0.1);
        }
        else
        {
            this.pauseIcon.active = false;
            cc.game.resume();
        }
    }

    gameOver()
    {
        this.startIcon.active = true;
        this.player.node.active = false;
        this.inGame = false;
        this.unschedule(this.gatherEnergy);
        this.updateEnergyBar(0);
        this.gathering = false;

        cc.audioEngine.stopMusic();
    }

    gameEnd()
    {
        cc.game.end();
    }
}
