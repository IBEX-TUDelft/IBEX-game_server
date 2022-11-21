import fs from 'fs';

import Logic from "../Logic.js";

import WaitToStartPhase from '../common/WaitToStartPhase.js';
import Introduction from './phases/Introduction.js';
import Chat from './phases/Chat.js';
import Request from './phases/Request.js';
import Offer from './phases/Offer.js';
import Vote from './phases/Vote.js';
import End from './phases/6.js';

export default class Voting extends Logic {
    constructor(data) {
        super(data, [WaitToStartPhase, Introduction, Chat, Request, Offer, Chat, Vote, End], 'Voting');
    }

    getRecoveryData(number) {
        const self = this;

        const playerData = self.data.players.find(p => p.number === number);

        const players = self.data.players.map( p => {
            return {
                "number": p.number,
                "role": p.role,
                "tag": p.tag
            }
        });

        const game = {
            "id": self.data.id,
            "round": self.data.currentRound.number,
            "phase": self.data.currentRound.phase,
            "boundaries": self.data.boundaries,
            "conditions": self.data.conditions,
            "players": players,
            "compensationOffers": [],
            "over": self.over
        }

        let messages = null;

        if (self.data.currentRound.phase === 2 || self.data.currentRound.phase === 5) {
            messages = self.data.currentPhase.results.chatLog.map(m => {
                return {
                    "time": m.time,
                    "sender": m.sender,
                    "to": m.to,
                    "text": m.text.replaceAll("&lsquo;", "'")
                }
            });
        } else if (self.data.currentRound.phase > 2) {
            const results = self.data.results.find(r => r.round === self.data.currentRound.number);

            console.log(results);

            messages = results.phase[2].chatLog.map(m => {
                return {
                    "time": m.time,
                    "sender": m.sender,
                    "to": m.to,
                    "text": m.text.replaceAll("&lsquo;", "'")
                }
            });
        }

        if (messages != null) {
            game.messages = messages.filter(m => m.sender === number || m.to.includes(number));
        }

        let compensationRequests = null;

        if (self.data.currentRound.phase >= 3 && playerData.role === 2) {
            compensationRequests = self.data.players.map(p => {
                return {
                    "number": p.number,
                    "compensationRequests": p.compensationRequests
                }
            })
        }

        if (self.data.currentRound.phase === 5) {
            messages = self.data.currentPhase.results.chatLog;
        } else if (self.data.currentRound.phase > 5) {
            messages = self.data.results.find(r => r.round === self.data.currentRound.number).phase[5].chatLog;
        }

        game.compensationRequests = compensationRequests;

        const player = {
            "instructions": self.data.currentPhase.instructions[playerData.role - 1]
        };

        if (self.data.currentRound.phase === 7) {
            game.winningCondition = self.data.winningCondition;
            game.standings = self.data.currentPhase.results.standings;
        }

        if (playerData != null) {
            player.name = playerData.name;
            player.tag = playerData.tag;
            player.number = playerData.number;
            player.role = playerData.role;
            player.property = playerData.property;
            player.recovery = playerData.recovery;
            player.ready = playerData.ready;
        }

        if (self.data.players.find(p => p.role === 2).submittedCompensationOffers === true) {
            game.compensationOffers = self.data.compensationOffers;
            player.compensationOfferReceived = true;
        }

        if (playerData.compensationRequests != null) {
            player.compensationRequestReceived = true;
            player.compensationRequests = playerData.compensationRequests;
        }

        if (playerData.compensationDecisions != null) {
            player.compensationDecisionReceived = true;
            player.compensationDecisions = playerData.compensationDecisions;
        }

        if (self.data.winningCondition != null) {
            const compensation = self.data.compensationOffers[self.data.winningCondition];

            player.result = {
                "condition": self.data.winningCondition,
                "value": player.property.v[self.data.winningCondition],
                "compensation": (player.role === 2) ? - compensation * (self.data.players.length - 1) : compensation
            }

            if (self.data.currentRound.phase === 7) {
                player.result.tally = game.standings[self.data.winningCondition].counter;
            }
        }

        let timer = null;

        if (self.data.currentPhase.timer.set === true) {
            timer = self.data.currentPhase.timer.visibleTimeout
        }

        player.summaries = this.getSummaries(number);

        const data = {
            "game": game,
            "player": player,
            "timer": timer
        };

        return data;
    }

    getSummary(number) {
        const summary = {};

        summary.round = this.data.currentRound.number;

        if (this.data.currentRound.phase === 7) {
            const playerData = this.data.players.find(p => p.number === number);

            summary.condition = this.data.winningCondition;
            summary.value = playerData.property.v[this.data.winningCondition];
            summary.tally = this.data.currentPhase.results.standings[this.data.winningCondition].counter;

            if (playerData.role === 2) {
                summary.compensation = - this.data.compensationOffers[this.data.winningCondition] * ( this.data.players.length - 1);
                summary.profit = summary.value + summary.compensation;
            } else {
                summary.compensation = this.data.compensationOffers[this.data.winningCondition];
                summary.profit = summary.value + summary.compensation;
            }
        }

        return summary;
    }
}
