<template>
  <b-container fluid class="no-gutters">
    <Header />

    <confirm></confirm>
    <acknowledge></acknowledge>

    <div v-if="datasets.length > 0" class="d-flex">
      <b-table class="mx-3" :items="datasets" :fields="fields" head-variant="dark" :fixed="true">
        <template #cell(ctrls)="data">
          <b-button variant="success" @click="restore(data.item)">{{ data.item.exists ? 'Overwrite' : 'Restore' }}</b-button>
        </template>
      </b-table>
    </div>
    <div v-else>
      <p>No data to display. Play a new game to create one, or, alternatively, upload one from other sources.</p>
    </div>
  </b-container>
</template>

<script>
import Header from './Header.vue';
import Acknowledge from './modals/Acknowledge.vue';
import Confirm from './modals/Confirm.vue';
import { listbackups, restore } from '../services/RestoreService';

export default {
  name: 'SimulationDatasets',
  components: {
    Header,
    Acknowledge,
    Confirm
  },
  data() {
    return {
      modals: {
        confirm: {
          show: false,
          title: 'Confirmation Request',
          description: 'There is a problem',
          callback: null
        },
        acknowledge: {
          title: 'None',
          description: 'None',
          show: false,
          callback: null
        }
      },
      datasets: [],
      fields: [
        {
          label: "Name",
          key: "name",
          sortable: true,
          tdClass: "align-middle"
        },
        {
          label: "Title",
          key: "title",
          sortable: true,
          tdClass: "align-middle"
        },
        {
          label: "Type",
          key: "type",
          sortable: true,
          tdClass: "align-middle"
        },
        {
          label: "Controls",
          key: 'ctrls',
          sortable: false,
          class: 'text-center'
        }
      ]
    }
  },
  methods: {
    getAllData: async function () {
      const datasets = await listbackups();

      this.datasets = datasets.map(i => {
        return {
          "id": i.id,
          "exists": i.exists,
          "name": i.name,
          "title": i.title,
          "type": i.type,
          "ctrls": i
        }
      });
    },
    acknowledge(title, description) {
        this.modals.acknowledge.title = title;
        this.modals.acknowledge.description = description;
        this.modals.acknowledge.show = true;
    },
    async confirm(title, description) {
        this.modals.confirm.title = title;
        this.modals.confirm.description = description;
        this.modals.confirm.show = true;

        const result = await new Promise((resolve) => {
            this.modals.confirm.confirm = () => {
                resolve(true);
            };

            this.modals.confirm.cancel = () => {
                resolve(false);
            };
        });

        this.modals.confirm.show = false;

        return result;
    },
    restore: async function (item) {
      console.log(item);

      let description;

      if (item.exists) {
        description = `By doing this you will overwrite the data of an existing game with backup data`;
      } else {
        description = `By doing this you will restore the data of a previously deleted game`;
      }

      const confirmed = await this.confirm('Are you sure?', description);

      if (!confirmed) {
        return;
      }

      if (item.exists) {
        return this.acknowledge('TODO', 'The overwrite function is not yet implemented, currently you may only restore deleted games.');
      } else {
        const response = await restore(item.name);

        if (response.error != null) {
          return this.acknowledge('Something Went Wrong', response.error);
        }
      }

      this.$router.push({ path: 'dashboard' });
    },
    resolvePlaceHolder(placeHolder) {
      switch(placeHolder) {
        case 'confirm-button':
          return 'Confirm';
        case 'cancel-button':
          return 'Cancel';
        case 'acknowledge-button':
          return 'OK';
        default:
          return 'Missing Placeholder'
      }
    }
  },
  mounted() {
    this.getAllData();
  }
}
</script>