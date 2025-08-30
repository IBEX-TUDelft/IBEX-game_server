<template>
    <b-col><div class="d-flex flex-column h-100">
          <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                <b-navbar-nav>
                    <b-nav-item active>Ruleset: {{ ruleset }}</b-nav-item>
                </b-navbar-nav>
                <b-navbar-nav class="container justify-content-center">
                    <b-navbar-brand>
                        Chat Log
                    </b-navbar-brand>
                </b-navbar-nav>
                <b-navbar-nav>
                    <button :disabled="false" class="btn btn-success" @click="exportXlsx()">Export</button>
                </b-navbar-nav>
            </b-navbar>
        </div>

        <div>
            <b-card no-body>
                <b-tabs card content-class="mt-3" v-model="roundIndex">
                    <b-tab v-for="round in rounds" :key="round.round">

                        <template #title>
                            Round {{ round.round }}
                        </template>

                        <div class="row">
                            <div v-for="message in (chatLog[round.round] == null ? [] : chatLog[round.round])" :key="message.number" class="col-12 mb-1 px-0">
                                <b-card 
                                    :header="message.participants"
                                    header-tag="header"
                                >
                                    <b-card-text><b>{{ players.find(p => p.number === message.sender).tag }}</b>: {{ decode(message.text) }}</b-card-text>
                                </b-card>
                            </div>
                        </div>

                    </b-tab>
                </b-tabs>
            </b-card>
        </div>
    </div></b-col>
</template>
<script>
    import * as XLSX from "xlsx";
    import he from 'he';

    const roleMap = {
        1: "Sniper",
        2: "Developer",
        3: "Owner"
    };

    const conditionMap = {
        0: "No Project",
        1: "Project A",
        2: "Project B",
    }

    export default {
        data() {
            return {
                gameId: null,
                ruleset: null,
                chatLog: null,
                rounds: null,
                tabIndex: 0,
                roundIndex: 0
            };
        },
        components: {
        },
        name: 'ChatLog',
        created() {
        },
        methods: {
            decode(str) {
                return he.decode(str);
            },
            getValue(declaration, property, index) {
                let value
                
                if (index != null) {
                    value = declaration[property][index];
                } else {
                    value = declaration[property];
                }

                if (value < 0) {
                    return '';
                }

                return value;
            },
            getYesOrNo(bool) {
                if (bool == null) {
                    return '';
                }

                return bool ? 'Y' : 'N';
            },
            getWinningCondition(i) {
                if (this.winningCondition == null) {
                    return '';
                }

                return this.winningCondition === i ? 'Y' : 'N';
            },
            getPlayer(number, role) {
                return roleMap[role] + ' ' + number;
            },
            getDeclarationPlayer(i) {
                const declaration = this.game.declarations[i];

                if (declaration == null) {
                    console.log(`Could not find declaration ${i}`);
                    return 'Unavailable';
                }

                return roleMap[declaration.role] + ' ' + i;
            },
            conditionToString(c) {
                return conditionMap[c];
            },
            showPreview() {
                //TODO
            },
            formatNumber(num) {
                if (num == null || typeof num != 'number') {
                    return num;
                }

                return num.toLocaleString('en-US');
            },
            exportXlsx() {
                const self = this;

                const wb = XLSX.utils.book_new();

                self.rounds.forEach(round => {
                    const xls = [];

                    xls.push([
                        'People',
                        'Message'
                    ]);

                    self.chatLog[round.round].forEach(message => {
                        xls.push([
                            [message.sender, ...message.to]
                                .sort((a,b,) => a - b)
                                .map(number => self.players.find(p => p.number === number).tag)
                                .join(','),
                            self.decode(message.text)
                        ]);
                    });

                    /* convert state to workbook */
                    const ws = XLSX.utils.aoa_to_sheet(xls);
                    XLSX.utils.book_append_sheet(wb, ws, `Round ${round.round}`);
                });

                /* generate file and send to client */
                XLSX.writeFile(wb, `${this.gameId}.game-chat.xlsx`);
            }
        },
        async mounted () {
            const self = this;

            const token = localStorage.getItem("token");

            this.gameId = parseInt(this.$route.params.id);

            const response = await this.$http.get("/games/chat-log", {
                params: {
                    token,
                    game_id: self.gameId
                }
            });

            this.rounds = response.data.data.results;
            this.ruleset = response.data.data.ruleset;
            this.players = response.data.data.players;

            function extractChatLog (rounds) {
                const result = [];
                
                rounds.forEach(r => {
                    const partial = [];

                    [2,5].forEach((phase) => {
                        if (r.phase[phase] == null) {
                            return
                        }

                        partial.push(...r.phase[phase].chatLog);
                    });

                    result.push(partial);
                })
                

                return result;
            }

            this.chatLog = extractChatLog(this.rounds);

            this.rounds.forEach(round => {
                if (round.phase == null || round.phase[2] == null) {
                    return;
                }
                
                round.phase[2].chatLog.forEach(message => {
                    const tags = [];

                    self.players.forEach(p => {
                        if (message.to.includes(p.number) || message.sender === p.number) {
                            tags.push(p.tag);
                        }
                    });

                    message.participants = tags.slice(0, tags.length - 1).join(', ') + ' and ' + tags[tags.length - 1];
                });

                if (round.phase[5] == null) {
                    return;
                }

                round.phase[5].chatLog.forEach(message => {
                    const tags = [];

                    self.players.forEach(p => {
                        if (message.to.includes(p.number) || message.sender === p.number) {
                            tags.push(p.tag);
                        }
                    });

                    message.participants = tags.slice(0, tags.length - 1).join(', ') + ' and ' + tags[tags.length - 1];
                });
            });

            console.log(response.data.data);

            window.vue = this;
        }
    }
</script>