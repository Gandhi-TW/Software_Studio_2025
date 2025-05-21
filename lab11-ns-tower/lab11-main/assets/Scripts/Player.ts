import GameMgr from "./GameMgr";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Player extends cc.Component 
{
    @property()
    playerSpeed: number = 300;

    @property({type:cc.AudioClip})
    dieSound: cc.AudioClip = null;

    @property(cc.Node)
    gameMgr: cc.Node = null;

    @property(cc.SpriteFrame)
    jumpFrame: cc.SpriteFrame = null;

    fallDown: boolean = false;

    private anim: cc.Animation = null;

    private moveDir = 1;

    private rebornPos: cc.Vec2 = cc.v2(0, -146);

    private rb: cc.RigidBody = null;


    start () {
        this.anim = this.getComponent(cc.Animation);
        this.rb = this.getComponent(cc.RigidBody);
    }

    update(dt)
    {
        this.node.x += this.playerSpeed * this.moveDir * dt;
        this.node.scaleX = (this.moveDir >= 0) ? 1 : -1;

        // raycast: check whether the player is standing on the platform?
        let point1 = this.node.position;
        point1.addSelf(cc.v2(12, 2));
        point1 = this.node.parent.convertToWorldSpaceAR(point1);
        let point2 = this.node.position;
        point2.addSelf(cc.v2(-12, 2));
        point2 = this.node.parent.convertToWorldSpaceAR(point2);
        let isHit = this.raycastTest(point1, cc.v2(0, -5)) || this.raycastTest(point2, cc.v2(0, -5));
        // if(isHit){
        //     if(this.fallDown){
        //         this.gameMgr.getComponent("GameMgr").updateEnergyBar(0);
        //         this.fallDown = false;
        //     }
        // }else{
        //     this.fallDown = true;
        // }
        this.fallDown = !isHit;

        this.playerAnimation();
    }

    raycastTest(start: cc.Vec2, direction: cc.Vec2){
        let result = this.gameMgr.getComponent("GameMgr").physicManager.rayCast(start, start.add(direction), cc.RayCastType.AllClosest);
        for(let i = 0; i < result.length; i++)
        {
            let colliderName = result[i].collider.node.name;
            if(colliderName != this.node.name)
            {
                return true;
            }
        }
        return false;
    }

    reborn()
    {
        this.node.position = this.rebornPos;
        this.getComponent(cc.RigidBody).linearVelocity = cc.v2();
    }

    playerJump(velocity: number)
    {
        if(!this.fallDown)
            this.node.getComponent(cc.RigidBody).linearVelocity = cc.v2(0, velocity);
    }

    playerDie()
    {
        cc.audioEngine.playEffect(this.dieSound,false);
    }

    playerAnimation()
    {
        if(this.fallDown)
        {
            this.anim.stop();
            this.node.getChildByName('effect').active = false;
            this.getComponent(cc.Sprite).spriteFrame = this.jumpFrame;
        }
        else
        {
            if(this.gameMgr.getComponent("GameMgr").gathering)
            {
                if(!this.anim.getAnimationState('gather').isPlaying)
                {
                    this.node.getChildByName('effect').active = true;
                    this.anim.play('gather');
                }
            }
            else
            {
                if(!this.anim.getAnimationState('walk').isPlaying)
                {
                    if(!this.anim.getAnimationState('gather').isPlaying){
                        this.gameMgr.getComponent("GameMgr").updateEnergyBar(0);
                    }

                    this.node.getChildByName('effect').active = false;
                    this.anim.play('walk');
                }
            }
        }
    }

    onBeginContact(contact, selfCollider, otherCollider)
    {
        if(otherCollider.node.name == "wall")
        {
            this.moveDir *= -1;
        }
    }
}
