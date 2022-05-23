<template>
    <div>
          <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                <b-navbar-nav>
                    <b-nav-item active>Ruleset: {{ ruleset }}</b-nav-item>
                </b-navbar-nav>
                <div class="container justify-content-center">
                    <b-navbar-brand>
                        Chat Log
                    </b-navbar-brand>
                </div>
                <b-navbar-nav class="ml-auto">
                </b-navbar-nav>
            </b-navbar>
        </div>

        <div>
            <b-card no-body>
                <b-tabs card content-class="mt-3" v-model="roundIndex">
                    <b-tab v-for="round in results" :key="round.round">

                        <template #title>
                            Round {{ round.round }}
                        </template>

                        <div class="row">
                            <div v-for="message in (round.results == null || round.results[2] == null ? [] : round.results[2].chatLog).reduce( (a,b) => [b,...a], [])" :key="message.number" class="col-12 mb-1 px-0">
                                <b-card 
                                    :header="message.participants"
                                    header-tag="header"
                                >
                                    <b-card-text><b>{{ players.find(p => p.number === message.sender).tag }}</b>: {{ message.text }}</b-card-text>
                                </b-card>
                            </div>
                        </div>

                    </b-tab>
                </b-tabs>
            </b-card>
        </div>
    </div>
</template>
<script>
    import XLSX from 'xlsx';

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
                results: null,
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

                const xls = [];

                if (this.ruleset === 'Harberger') {
                    this.marketLog[this.winningCondition].forEach(r => {
                        xls.push([
                            r.time,
                            r.round + '.' + r.phase,
                            self.getPlayer(r.actor.number, r.actor.role),
                            r.action,
                            r.quantity,
                            r.price,
                            r.buyer == null ? '' : self.getPlayer(r.buyer.number, r.buyer.role),
                            r.seller == null ? '' : self.getPlayer(r.seller.number, r.seller.role),
                            r.bestBid,
                            r.bestAsk,
                            r.book
                        ]);
                    });
                } else if (this.ruleset === 'Futarchy') {
                    this.marketLog.forEach((m, i) => {
                        m.forEach(r => {
                            xls.push([
                                r.time,
                                r.round + '.' + r.phase,
                                self.getPlayer(r.actor.number, r.actor.role),
                                r.action,
                                r.quantity,
                                r.price,
                                r.buyer == null ? '' : self.getPlayer(r.buyer.number, r.buyer.role),
                                r.seller == null ? '' : self.getPlayer(r.seller.number, r.seller.role),
                                r.bestBid,
                                r.bestAsk,
                                r.book,
                                conditionMap[i]
                            ]);
                        });
                    });
                }

                console.log(xls);
                /* convert state to workbook */
                const ws = XLSX.utils.aoa_to_sheet(xls);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
                /* generate file and send to client */
                XLSX.writeFile(wb, `${this.gameId}.market-log.xlsx`);
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

            this.results = response.data.data.results;
            this.ruleset = response.data.data.ruleset;
            this.chatLog = response.data.data.chatLog;
            this.players = response.data.data.players;

            this.results.forEach(round => {
                if (round.results == null || round.results[2] == null) {
                    return;
                }
                
                round.results[2].chatLog.forEach(message => {
                    const tags = [];

                    self.players.forEach(p => {
                        if (message.to.includes(p.number) || message.sender === p.number) {
                            tags.push(p.tag);
                        }
                    });

                    message.participants = tags.slice(0, tags.length - 1).join(', ') + ' and ' + tags[tags.length - 1];
                })
            });
        }
    }
</script>