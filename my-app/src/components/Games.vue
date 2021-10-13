<template>
    <div class="container">
        <h2>Games</h2>
        <table class="table table-bordered">
            <thead>
            <tr>
                <th>Title</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Phase</th>
                <th>Ended At</th>
            </tr>
            </thead>
            <tbody>
              <tr v-for="item in games" :key="item.id">
                  <td>{{ item.title }}</td>
                  <td>{{ item.created_at }}</td>
                  <td>{{ item.updated_at }}</td>
                  <td>{{ item.phase_number }}</td>
                  <td>{{ item.ended_at }}</td>
              </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
    export default {
        name: 'Games',
        props: ['games']
     }
</script>