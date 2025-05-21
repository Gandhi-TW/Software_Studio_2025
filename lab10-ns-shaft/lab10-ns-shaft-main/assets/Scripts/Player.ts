import GameMgr from "./GameMgr";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Player extends cc.Component 
{
    @property()
    playerSpeed: number = 300;

    @property()
    playerStandSpeed: number = 50;

    @property({type:cc.AudioClip})
    nailSound: cc.AudioClip = null;

    @property({type:cc.AudioClip})
    dieSound: cc.AudioClip = null;

    @property(cc.Node)
    gameMgr: cc.Node = null;
    
    private idleFrame: cc.SpriteFrame = null;

    private anim: cc.Animation = null;

    private moveDir = 0;

    private ceilingPos: number = 155;

    private fallDown: boolean = false;

    private damageTime: number = 0;

    start () {
        this.idleFrame = this.getComponent(cc.Sprite).spriteFrame;
        this.anim = this.getComponent(cc.Animation);
    }

    update(dt)
    {
        this.node.x += this.playerSpeed * this.moveDir * dt;
        this.node.scaleX = (this.moveDir >= 0) ? 1 : -1;
        this.node.y = (this.node.y >= this.ceilingPos) ? this.ceilingPos : this.node.y;
        if(this.getComponent(cc.RigidBody).linearVelocity.y != this.playerStandSpeed)
            this.fallDown = true;
        else
            this.fallDown = false;

        if(this.damageTime > 0)
            this.damageTime -= dt;
        else
            this.damageTime = 0;

        this.playerAnimation();
    }

    reborn(rebornPos: cc.Vec2)
    {
        this.damageTime = 0;
        this.node.position = rebornPos;
        this.getComponent(cc.RigidBody).linearVelocity = cc.v2();
    }

    playerMove(moveDir: number)
    {
        this.moveDir = moveDir;
    }

    playerRecover()
    {
        this.gameMgr.getComponent("GameMgr").updateLife(1);
    }

    playerDamage()
    {
        this.damageTime = 1;
        cc.audioEngine.playEffect(this.nailSound, false);
        this.gameMgr.getComponent("GameMgr").updateLife(-5);
    }

    playerDie()
    {
        cc.audioEngine.playEffect(this.dieSound,false);
        this.gameMgr.getComponent("GameMgr").updateLife(-12);
    }

    playerAnimation()
    {
        if(this.fallDown)
        {
            if(this.damageTime > 0)
            {
                if(this.moveDir == 0 && !this.anim.getAnimationState("fall_front_hurt").isPlaying)
                    this.anim.play("fall_front_hurt");
                else if(this.moveDir != 0 && !this.anim.getAnimationState("fall_side_hurt").isPlaying)
                    this.anim.play("fall_side_hurt");
            }
            else
            {
                if(this.moveDir == 0 && !this.anim.getAnimationState("fall_front").isPlaying)
                    this.anim.play("fall_front");
                else if(this.moveDir != 0 && !this.anim.getAnimationState("fall_side").isPlaying)
                    this.anim.play("fall_side");
            }
        }
        else
        {
            if(this.damageTime > 0)
            {
                if(this.moveDir == 0 && !this.anim.getAnimationState("idle_hurt").isPlaying)
                    this.anim.play("idle_hurt");
                else if(this.moveDir != 0 && !this.anim.getAnimationState("walk_hurt").isPlaying)
                    this.anim.play("walk_hurt");
            }
            else
            {
                if(this.moveDir == 0)
                {
                    this.anim.stop();
                    this.getComponent(cc.Sprite).spriteFrame = this.idleFrame;
                }
                else if(!this.anim.getAnimationState("walk").isPlaying)
                    this.anim.play("walk");
            }
        }
    }

    onBeginContact(contact, selfCollider, otherCollider)
    {
        if(otherCollider.node.name == "lowerBound")
        {
            this.playerDie();
        }
        else if(otherCollider.node.name == "ceiling")
        {
            cc.log("player contact");
            this.playerDamage();
        }

    }
}
