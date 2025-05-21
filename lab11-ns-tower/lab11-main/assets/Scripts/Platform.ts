const { ccclass, property } = cc._decorator;

@ccclass
export default class Platform extends cc.Component {

    protected isTouched: boolean = false;

    private anim: cc.Animation = null;

    private moveSpeed: number = 50;

    private camera: cc.Node = null;

    start() {
        this.anim = this.getComponent(cc.Animation);

        this.camera = cc.find('Canvas/Main Camera');
        
        let collider = this.getComponent(cc.PhysicsCollider);


        if (this.node.name == "Conveyor") {
            this.node.scaleX = (Math.random() >= 0.5) ? 1 : -1;
            this.moveSpeed *= this.node.scaleX;
        }
        else if(this.node.name == "Normal")
        {
            let canMove = (Math.random() > 0.8) ? true : false;
            if(canMove)
            {
                let moveDir = (Math.random() > 0.5) ? "v" : "h";
                let delayTime = Math.random() * 2;
                this.platformMove(moveDir, delayTime);
            }
        }
    }

    update(dt)
    {   
        if(this.camera.y - this.node.y >= 190) // platform out of screen
            this.platformDestroy();
    }

    playAnim() {
        if(this.anim)
            this.anim.play();
    }

    platformDestroy()
    {
        this.node.destroy();
    }
    
    onPreSolve(
        contact: cc.PhysicsContact,
        selfCollider: cc.PhysicsCollider,
        otherCollider: cc.PhysicsCollider
    ) {
        const otherRb = otherCollider.node.getComponent(cc.RigidBody);
        
        if (!otherRb) return;

        
        const manifold = contact.getWorldManifold();
        const normal = manifold.normal;
        
        if (otherRb.linearVelocity.y > 0 && normal.y < -0.5) {
            contact.disabled = true; // 禁用物理碰撞
        }
        
        if (this.node.name !== "Conveyor") return;
        
        // 持續施加速度
        if (this.isTouched) {
            otherRb.linearVelocity = cc.v2(
                this.moveSpeed,
                otherRb.linearVelocity.y
            );
        }
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        const otherRb = otherCollider.node.getComponent(cc.RigidBody);
        if (!otherRb) return;

        // 新增速度方向检查
        if (otherRb.linearVelocity.y > 0) {
            return; // 玩家正在上升，忽略碰撞
        }
        
        const normal = contact.getWorldManifold().normal;
        
        // 只允許上方碰撞（法線方向向下）
        if (normal.y < 0.7) return;

        // 輸送帶平台處理
        if (this.node.name === "Conveyor") {
            // const rigidbody = otherCollider.node.getComponent(cc.RigidBody);
            // if (rigidbody) {
            //     // 施加水平速度
            //     rigidbody.linearVelocity = cc.v2(this.moveSpeed, rigidbody.linearVelocity.y);
            //     this.playAnim();
            //     this.isTouched = true;
            // }
            const newVelocity = cc.v2(
                this.moveSpeed,
                otherRb.linearVelocity.y
            );
            otherRb.linearVelocity = newVelocity;
            this.playAnim();
            this.isTouched = true;
        }
    }

    // 物理碰撞結束回調
    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.node.name === "Conveyor" && this.isTouched) {
            const rigidbody = otherCollider.node.getComponent(cc.RigidBody);
            if (rigidbody) {
                // 重置水平速度
                rigidbody.linearVelocity = cc.v2(0, rigidbody.linearVelocity.y);
                // this.anim.stop();
                this.isTouched = false;
            }
        }
    }

    platformMove(moveDir: string, delayTime: number)
    {
        let easeRate: number = 2;
        // ===================== TODO =====================
        // 1. Make platform move back and forth. You should use moveDir to decide move direction.
        //    'v' for vertical, and 'h' for horizontal.
        // 2. Use action system to make platfrom move forever.
        //    For horizontal case, you should first move right 50 pixel in 2s and then move back to initial position in 2s
        //    For vertical case, you should first move up 50 pixel in 2s and then move back to initial position in 2s
        //    You need to use "easeInOut" to modify your action with "easeRate" as parameter.
        // 3. Use scheduleOnce with delayTime to run this action. 
        // ================================================
        let moveAction: cc.ActionInterval;

        // 根據方向建立動作序列
        if (moveDir === "h") {
            moveAction = cc.sequence(
                cc.moveBy(2, cc.v2(50, 0)).easing(cc.easeInOut(easeRate)),
                cc.moveBy(2, cc.v2(-50, 0)).easing(cc.easeInOut(easeRate))
            );
        } else {
            moveAction = cc.sequence(
                cc.moveBy(2, cc.v2(0, 50)).easing(cc.easeInOut(easeRate)),
                cc.moveBy(2, cc.v2(0, -50)).easing(cc.easeInOut(easeRate))
            );
        }

        // 延遲啟動並循環執行
        this.scheduleOnce(() => {
            this.node.runAction(cc.repeatForever(moveAction));
        }, delayTime);
    }

  // ===================== TODO =====================
  // 1. In the physics lecture, we know that Cocos Creator
  //    provides four contact callbacks. You need to use callbacks to
  //    design different behaviors for different platforms.
  //
  //    Hints: The callbacks are "onBeginContact", "onEndContact", "onPreSolve", "onPostSolve".
  //
  // 2. There are two different types of platforms: "Normal" & Conveyor".
  //    For "Conveyor", you have to do "delivery effect" when player is in contact with it.
  //    Note that the platforms have "delivery effect" only when player stands on them. 
  //
  //    Hints: Change "linearVelocity" of the player's rigidbody to make him move.
  //    The move value is "moveSpeed".
  //
  // 3. All the platforms have only "upside" collision. You have to prevent the collisions from the other directions.
  //
  //    Hints: You can use "contact.getWorldManifold().normal" to judge collision direction.
  //
  // ================================================
}
