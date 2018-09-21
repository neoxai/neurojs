var car = require('./car.js');


function agent(opt, world, startPoint) {
    this.car = new car(world, {})
    this.options = opt

    this.world = world
    this.frequency = 20
    this.reward = 0
    this.loaded = false
    this.stuckCounter = 0;

    this.North = { posX: 2, posY: -10, angle: 0 };
    this.South = { posX: -2, posY: 10, angle: Math.PI }
    this.East = { posX: 15, posY: -2, angle: Math.PI / 2 }
    this.West = { posX: -15, posY: 2, angle: - Math.PI / 2 }

    if (startPoint == "N") {
        this.startPoint = this.North
        this.endPoint = this.South
    }
    else if (startPoint == "E") {
        this.startPoint = this.East
        this.endPoint = this.West
    }
    else if (startPoint == "W") {
        this.startPoint = this.West
        this.endPoint = this.East
    }
    else {
        this.startPoint = this.South
        this.endPoint = this.North
    }

    this.originalDistance = Math.sqrt(Math.pow(this.endPoint.posX - this.startPoint.posX, 2)
        + Math.pow(this.endPoint.posY - this.startPoint.posY, 2))

    this.loss = 0
    this.timer = 0
    this.timerFrequency = 60 / this.frequency

    if (this.options.dynamicallyLoaded !== true) {
        this.init(world.brains.actor.newConfiguration(), null)
    }

};

agent.prototype.init = function (actor, critic) {
    var actions = 2
    var temporal = 1
    var states = this.car.sensors.dimensions

    var input = window.neurojs.Agent.getInputDimension(states, actions, temporal)

    this.brain = new window.neurojs.Agent({

        actor: actor,
        critic: critic,

        states: states,
        actions: actions,

        algorithm: 'ddpg',

        temporalWindow: temporal,

        discount: 0.97,

        experience: 75e3,
        // buffer: window.neurojs.Buffers.UniformReplayBuffer,

        learningPerTick: 40,
        startLearningAt: 900,

        theta: 0.05, // progressive copy

        alpha: 0.1 // advantage learning

    })

    // this.world.brains.shared.add('actor', this.brain.algorithm.actor)
    this.world.brains.shared.add('critic', this.brain.algorithm.critic)

    this.actions = actions
    this.car.addToWorldWithPos(this.startPoint)
    this.loaded = true
};

agent.prototype.step = function (dt) {
    if (!this.loaded) {
        return
    }

    this.timer++

    if (this.timer % this.timerFrequency === 0) {
        this.car.update()

        var vel = this.car.speed.local
        var speed = this.car.speed.velocity

        var distance = this.getDistanceFromEndpoint()

        this.reward = Math.pow(vel[1], 2) - 0.10 * Math.pow(vel[0], 2) - this.car.contact * 10 - this.car.impact * 20
        this.reward += (this.originalDistance - distance) * .25

        if (Math.abs(speed) < 1e-2) { // punish no movement; it harms exploration
            this.reward -= 1.0
            this.stuckCounter++
        }
        else {
            this.stuckCounter = 0;
        }

        this.loss = this.brain.learn(this.reward)
        this.action = this.brain.policy(this.car.sensors.data)

        this.car.impact = 0
        this.car.step()
    }

    if (this.action) {
        this.car.handle(this.action[0], this.action[1])
    }

    return this.timer % this.timerFrequency === 0
};

agent.prototype.isStuck = function () {
    return (this.stuckCounter > 100)

}
agent.prototype.selfDestruct = function () {
    this.car.removeFromWorld()
}
agent.prototype.getDistanceFromEndpoint = function () {
    var carX = this.car.chassisBody.position[0]
    var carY = this.car.chassisBody.position[1]

    return Math.sqrt(Math.pow(this.endPoint.posX - carX, 2) + Math.pow(this.endPoint.posY - carY, 2))
};

agent.prototype.draw = function (context) {
};

module.exports = agent;