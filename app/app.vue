<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup>
useHead({
  title: 'WorkTimeSK - Управление расписанием',
  meta: [
    { name: 'description', content: 'Система управления расписанием сотрудников' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' }
  ]
})
</script>
