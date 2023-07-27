import { EventEmitter } from "events";

const PhaseBegins = "phase-begins";
const PhaseTimeout = "phase-timeout";
const PhaseComplete = "phase-complete";
const PlayerMessage = "player-message";
const GameOver = "game-over";

class AppTimer {
    id;
    name;
    duration;
    timeCreated = new Date().getMilliseconds();

    constructor(id, name, duration) {
        this.id = id;
        this.duration = duration;
        this.name = name;
    }

    cancel() {
        clearTimeout(this.id);
    }

    elapsed() {
        new Date().getMilliseconds() - this.timeCreated;
    }

    timeToGo() {
        return this.duration - this.elapsed();
    }
}

class AppEvents extends EventEmitter {

    static instances = [];

    constructor(gameId) {
        super();
        this.gameId = gameId;
    }

    static get(gameId) {
        let instance = this.instances.find(i => i.gameId === gameId);

        if (instance == null) {
            instance = new AppEvents(gameId);
            this.instances.push(instance);
        }

        return instance;
    }

    static delete(gameId) {
        const index = this.instances.findIndex(i => i.gameId === gameId);

        if (index == -1) {
            return;
        }

        this.instances.splice(index, 1);
    }

    phaseTimeout(ms, args) {
        return this.getTimer(PhaseTimeout, ms, args);
    }

    getTimer(name, ms, data) {
        console.log(`Setting a timer that after ${ms}ms will trigger ${name}`);

        const id = setTimeout(() => {
            this.emit(name, data);
        }, ms);

        const timer = new AppTimer(id, name);

        this.addListener(PhaseComplete, ( {phase} ) => {
            if (phase === data.phase) {
                console.log(`Phase ${phase} complete before its timer expired. Canceling the timer`);
                timer.cancel();
            }
        });

        this.addListener(GameOver, () => {
            console.log(`Game over complete before its timer expired. Canceling the timer`);
            timer.cancel();
        });

        return timer;
    }

    phaseComplete(data) {
        this.emit(PhaseComplete, data);
    }
}

export {
    AppEvents,
    AppTimer,
    PhaseBegins,
    PhaseTimeout,
    PhaseComplete,
    PlayerMessage,
    GameOver
};
