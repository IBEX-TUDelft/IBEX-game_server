<template>
    <b-col><div class="d-flex flex-column h-100">
          <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                <b-navbar-nav>
                    <b-nav-item active></b-nav-item>
                </b-navbar-nav>
                <b-navbar-nav class="container justify-content-center">
                    <b-navbar-brand>
                        Surveys
                    </b-navbar-brand>
                </b-navbar-nav>
                <b-navbar-nav>
                    <button :disabled="false" class="btn btn-success" @click="exportXlsx()">Export</button>
                </b-navbar-nav>
            </b-navbar>
        </div>

        <div>
            <div class="col-12 p-2">
                <table class="table table-bordered" style="table-layout: fixed;">
                    <thead class="thead-dark">
                        <th scope="col">Number</th>
                        <th scope="col">Role</th>
                        <th scope="col">Age</th>
                        <th scope="col">Gender</th>
                        <th scope="col">Year of Study</th>
                        <th scope="col">Faculty</th>
                        <th scope="col">Risk</th>
                    </thead>
                    <tbody>
                        <tr v-for="record in records" :key="record.id">
                            <td>{{ record.number }}</td>
                            <td>{{ record.tag }}</td>
                            <td>{{ record.age }}</td>
                            <td>{{ record.gender }}</td>
                            <td>{{ record.yearOfStudy }}</td>
                            <td>{{ record.faculty }}</td>
                            <td>{{ record.risk }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div></b-col>
</template>
<script>
    import XLSX from 'xlsx';

    export default {
        data() {
            return {
                records: []
            };
        },
        components: {
        },
        name: 'ChatLog',
        created() {
        },
        methods: {
            exportXlsx() {
                const self = this;

                const wb = XLSX.utils.book_new();

                const xls = [];

                xls.push([
                    'Player',
                    'Role',
                    'Age',
                    'Gender',
                    'Year of Study',
                    'Faculty',
                    'Risk'
                ]);

                self.records.forEach(record => {
                    xls.push([
                        record.number,
                        record.tag,
                        record.age,
                        record.gender,
                        record.yearOfStudy,
                        record.faculty,
                        record.risk
                    ]);
                });

                /* convert state to workbook */
                const ws = XLSX.utils.aoa_to_sheet(xls);
                XLSX.utils.book_append_sheet(wb, ws, `Surveys`);

                /* generate file and send to client */
                XLSX.writeFile(wb, `${this.gameId}.surveys.xlsx`);
            }
        },
        async mounted () {
            const self = this;

            const token = localStorage.getItem("token");

            this.gameId = parseInt(this.$route.params.id);

            const response = await this.$http.get("/games/surveys", {
                params: {
                    token,
                    game_id: self.gameId
                }
            });

            this.ruleset = response.data.data.ruleset;
            this.records = response.data.data.records;

            window.vue = this;
        }
    }
</script>