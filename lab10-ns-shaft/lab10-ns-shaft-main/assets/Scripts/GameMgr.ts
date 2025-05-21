import Player from "./Player";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameMgr extends cc.Component 
{
    @property(cc.Node)
    background: cc.Node = null;

    @property(cc.Node)
    wall: cc.Node = null;

    @property(cc.Node)
    upperBound: cc.Node = null;

    @property(cc.Node)
    lowerBound: cc.Node = null;

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
    private lifeBar: cc.Node = null;

    @property({type:cc.AudioClip})
    bgm: cc.AudioClip = null;

    private backgroundInitPos = -72;

    private backgroundResetPos = 56;

    private wallInitPos = -23;

    private wallResetPos = 9;

    private physicManager: cc.PhysicsManager = null;

    private leftDown: boolean = false;

    private rightDown: boolean = false;

    private score: number = 0;

    private highestScore: number = 0;

    private scoreCount;

    private pause: boolean = false;

    private playerLife: number = 12;

    onLoad()
    {
        this.physicManager = cc.director.getPhysicsManager();
        this.physicManager.enabled = true;
        this.physicManager.gravity = cc.v2 (0, -200);

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    start () {
        this.schedule(() => {
            let idx = this.randomChoosePlatform();
            let platform = cc.instantiate(this.platformPrefabs[idx]);
            platform.parent = this.platforms;
            platform.position = cc.v2(-144+Math.random()*288, -190);
        }, 1.2);

        this.updateHighestScore(0);
        this.scoreCount = ()=>{ this.updateScore(this.score+1); };
    }

    update(dt)
    {
        if(this.wall.y >= this.wallResetPos)
            this.wall.y = this.wallInitPos;
        
        this.background.y += 0.2;
        if(this.background.y >= this.backgroundResetPos)
            this.background.y = this.backgroundInitPos;
    }

    onKeyDown(event)
    {
        switch(event.keyCode)
        {
            case cc.macro.KEY.left:
                this.leftDown = true;
                this.player.playerMove(-1);
                break;
            case cc.macro.KEY.right:
                this.rightDown = true;
                this.player.playerMove(1);
                break;
            case cc.macro.KEY.a:
                this.gameStart();
                break;
            case cc.macro.KEY.d:
                this.gameOver();
                break;
        }
    }

    onKeyUp(event)
    {
        switch(event.keyCode)
        {
            case cc.macro.KEY.left:
                this.leftDown = false;
                if(this.rightDown)
                    this.player.playerMove(1);
                else
                    this.player.playerMove(0);
                break;
            case cc.macro.KEY.right:
                this.rightDown = false;
                if(this.leftDown)
                    this.player.playerMove(-1);
                else
                    this.player.playerMove(0);
                break;
        }
    }

    randomChoosePlatform()
    {
        let rand = Math.random();

        //0: normal, 1: nails, 2: fake, 3: conveyor, 4: trampoline
        let prob = [6, 2, 2, 3, 2];
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

    updateLife(num: number)
    {
        this.playerLife += num;
        this.playerLife = Math.min(Math.max(this.playerLife, 0), 12);
        this.lifeBar.width = this.playerLife * 8
        if(this.playerLife == 0)
            this.gameOver();
    }

    gameStart()
    {
        this.startIcon.active = false;

        if(this.score > this.highestScore)
        this.updateHighestScore(this.score);
        this.updateScore(1);
        this.updateLife(12);

        let rebornPos = cc.v2();
        this.platforms.children.forEach((platform) => {
            platform.getComponent("Platform").reset();
            if(platform.name != 'Nails')
                rebornPos = platform.position.add(cc.v2(0, 50));
        })

        this.player.reborn(rebornPos);
        this.player.node.active = true;
        this.schedule(this.scoreCount, 2);

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
        this.player.node.active = false;
        this.unschedule(this.scoreCount);

        this.startIcon.active = true;

        cc.audioEngine.stopMusic();
    }

    gameEnd()
    {
        cc.game.end();
    }
}
