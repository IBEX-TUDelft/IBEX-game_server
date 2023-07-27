<template>
  <div class="container-fluid vh-100 p-0">
    <Header />
    <div v-if="datasets.length > 0" class="d-flex">
      <div class="table-responsive px-5">
        <b-table :items="datasets" :fields="fields" head-variant="dark" :fixed="true">
          <template #cell(ctrls)="data">
            <b-button variant="success" @click="play(data.item.name, generateName(data.item.name))">Play</b-button>
          </template>
        </b-table>
      </div>
    </div>
    <div v-else>
      <p>No games to display. Click &quot;<b>New Game</b>&quot; on the right top menu to create a new one.</p>
    </div>
  </div>
</template>

<script>
import Header from './Header.vue';
import { listDatasets, play } from '../services/SimulationService';

export default {
  name: 'SimulationDatasets',
  components: {
    Header
  },
  data() {
    return {
      datasets: [],
      fields: [
        {
          label: "Name",
          key: 'name',
          sortable: true
        },
        {
          label: "Controls",
          key: 'ctrls',
          sortable: false,
          formatter: function (value, key, item) {
            console.log(value, key, item);
            return `<b-button variant="success" @click="play(dataset, generateName(${value}))">Play</b-button>`;
          },
          class: 'text-center'
        }
      ]
    }
  },
  methods: {
    getAllData: async function () {
      this.datasets = await listDatasets();

      this.datasets = this.datasets.map(i => {
        return {
          "name": i,
          "ctrls": i
        }
      });

      console.log(this.datasets)
    },
    play: async function (name, title) {
      const response = await play(name, title);

      let subPath = 'analyse';

      if (response.type === 'voting') {
        subPath = 'analyse-voting';
      }

      try {
        const routeData = this.$router.resolve({ path: `/${subPath}/${response.id}` });
        console.log('HRef:' + routeData.href);
        window.open(routeData.href, '_blank');
      } catch (e) {
        console.log(e);
      }
    },
    generateName(dataset) {
      const date = new Date();
      const month = date.toLocaleString('default', { month: 'long' });
      const day = date.getDate();

      let suffix = 'th';

      if (day <= 3 || day >= 21) {
        switch (day % 10) {
          case 1:
            suffix = 'st';
            break;
          case 2:
            suffix = 'nd';
            break;
          case 3:
            suffix = 'rd';
            break;
          default:
            break;
        }
      }

      return `Simulation ${month}, ${day}${suffix} ${date.getHours()}:${date.getMinutes()} ${dataset}`
    }
  },
  mounted() {
    this.getAllData();
  }
}
</script>