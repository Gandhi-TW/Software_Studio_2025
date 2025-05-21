const { ccclass, property } = cc._decorator;

@ccclass
export default class Platform extends cc.Component {

    @property({ type: cc.AudioClip })
    soundEffect: cc.AudioClip = null;

    private hasDamaged: boolean = false;
    private hasHealed: boolean = false;    // 普通平台回血標記
    private trampolineHealed: boolean = false; // 彈簧床專用標記
    private isTouched: boolean = false;
    private originalColliderState: boolean;
    private conveyorSpeed: number = 0;

    private anim: cc.Animation = null;
    private highestPos: number = 118;
    private moveSpeed: number = 100;
    private springVelocity: number = 320;

    onLoad() {
        this.anim = this.getComponent(cc.Animation);
        this.originalColliderState = this.getComponent(cc.PhysicsBoxCollider).enabled;

        if (this.node.name === "Conveyor") {
            this.node.scaleX = Math.random() >= 0.5 ? 1 : -1;
            this.conveyorSpeed = this.moveSpeed * this.node.scaleX;
        }

        const collider = this.getComponent(cc.PhysicsBoxCollider);
        // collider.onBeginContact = this.onBeginContact.bind(this);
        // collider.onEndContact = this.onEndContact.bind(this);
        // collider.onPreSolve = this.onPreSolve.bind(this);
    }

    update(dt: number) {
        if (this.node.y > this.highestPos + 100) {
            this.platformDestroy();
        }
    }

    reset() {
        this.hasDamaged = false;
        this.hasHealed = false;
        this.trampolineHealed = false;
        this.isTouched = false;
        
        if (this.node.name === "Fake") {
            const collider = this.getComponent(cc.PhysicsBoxCollider);
            collider.enabled = this.originalColliderState;
        }
    }

    onBeginContact(contact: cc.PhysicsContact, 
                  selfCollider: cc.PhysicsCollider, 
                  otherCollider: cc.PhysicsCollider) 
    {
        const normal = contact.getWorldManifold().normal;
        if (normal.y < 0.7) {
            contact.disabled = true;
            return;
        }

        const player = otherCollider.node.getComponent("Player");
        if (!player) return;

        const platformType = this.node.name;

        // 音效播放邏輯
        if (platformType === "Trampoline") {
            cc.audioEngine.playEffect(this.soundEffect, false);
        } else if (!this.isTouched && this.soundEffect) {
            cc.audioEngine.playEffect(this.soundEffect, false);
            this.isTouched = true;
        }

        // 釘子平台處理
        if (platformType === "Nails") {
            if (!this.hasDamaged) {
                player.playerDamage();
                this.hasDamaged = true;
            }
            return;
        }

        // 回血邏輯
        switch (platformType) {
            case "Trampoline":
                if (!this.trampolineHealed) {
                    player.playerRecover();
                    this.trampolineHealed = true;
                }
                break;
            default:
                if (!this.hasHealed) {
                    player.playerRecover();
                    this.hasHealed = true;
                }
                break;
        }

        // 平台特殊行為
        switch (platformType) {
            case "Trampoline":
                this.handleTrampoline(otherCollider);
                break;
            case "Fake":
                this.handleFakePlatform();
                break;
        }
    }

    onEndContact(contact: cc.PhysicsContact, 
                selfCollider: cc.PhysicsCollider, 
                otherCollider: cc.PhysicsCollider) 
    {
        const platformType = this.node.name;

        // 傳送帶速度重置
        if (platformType === "Conveyor") {
            const rb = otherCollider.node.getComponent(cc.RigidBody);
            if (rb) {
                rb.linearVelocity = cc.v2(0, rb.linearVelocity.y);
            }
        }

        // 重置彈簧床回血標記
        if (platformType === "Trampoline") {
            this.trampolineHealed = false;
        }
    }

    private handleTrampoline(otherCollider: cc.PhysicsCollider) {
        const rb = otherCollider.node.getComponent(cc.RigidBody);
        if (rb) {
            rb.linearVelocity = cc.v2(rb.linearVelocity.x, this.springVelocity);
            this.playAnim();
        }
    }

    private handleFakePlatform() {
        this.playAnim();
        this.scheduleOnce(() => {
            const collider = this.getComponent(cc.PhysicsBoxCollider);
            collider.enabled = false;
        }, 0.2);
    }

    onPreSolve(contact: cc.PhysicsContact, 
              selfCollider: cc.PhysicsCollider, 
              otherCollider: cc.PhysicsCollider) 
    {
        if (this.node.name === "Conveyor") {
            const rb = otherCollider.node.getComponent(cc.RigidBody);
            if (rb) {
                rb.linearVelocity = cc.v2(this.conveyorSpeed, rb.linearVelocity.y);
            }
        }
    }

    platformDestroy() {
        this.node.destroy();
    }

    playAnim() {
        if (this.anim) {
            this.anim.play();
        }
    }
}

    // ===================== TODO =====================
  // 1. In the physics lecture, we know that Cocos Creator
  //    provides four contact callbacks. You need to use callbacks to
  //    design different behaviors for different platforms.
  //
  //    Hints: The callbacks are "onBeginContact", "onEndContact", "onPreSolve", "onPostSolve".
  //
  // 2. There are five different types of platforms: "Normal", "Fake", "Nails", "Trampoline", "Conveyor".
  //    When player touches the platform, you need to play the corresponding
  //    sound effect for each platform. (The audioClip named "soundEffect")
  //    Note that the sound effect only plays on the first time the player touches the platform.
  //
  // 3. "Trampoline" and "Fake" need to play animation when the player touches them.
  //    TAs have finished the animation functions, "playAnim" & "getAnimState", for you.
  //    You can directly call "playAnim" to play animation, and call "getAnimState" to get the current animation state.
  //    You have to play animations at the proper timing.
  //
  // 4. For "Trampoline", you have to do "spring effect" whenever the player touches it
  //
  //    Hints: Change "linearVelocity" of the player's rigidbody to make him jump.
  //    The jump value is "springVelocity".
  //
  // 5. For "Conveyor", you have to do "delivery effect" when player is in contact with it.
  //
  //    Hints: Change "linearVelocity" of the player's rigidbody to make him move.
  //    The move value is "moveSpeed".
  //
  // 6. For "Fake", you need to make the player fall 0.2 seconds after he touches the platform.
  //
  // 7. All the platforms have only "upside" collision. You have to prevent the collisions from the other directions.
  //
  //    Hints: You can use "contact.getWorldManifold().normal" or Player's velocity to judge collision direction.
  //
  //
  // 8. When player touches "Nails" platform, you need to call the function "playerDamage" in "Player.ts" to update player health,
  //    or call the function "playerRecover" in "Player.ts" when player touches other platforms.
  //
  // 9. When platforms touch the node named "upperBound", you need to call the function "platformDestroy" to destroy the platform.
  //
  // 10. You may use otherCollider.node.getComponent("Player") to get Player component.
  // 
  // 11. You may use contact.disabled = true/false to controll the collision occurence.
  //
  // 12. You may use otherCollider.node.getComponent(cc.RigidBody).linearVelocity = ?? to change velocity.
  // ================================================


