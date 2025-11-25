<template>
  <div class="admin-page">
    <!-- Модальное окно авторизации -->
    <AuthModal 
      :show="!isAuthenticated" 
      @success="handleAuthSuccess"
      @close="handleAuthClose"
    />
    
    <header class="header" v-if="isAuthenticated">
      <div class="container">
        <h1>Система управления расписанием</h1>
      </div>
    </header>

    <div class="container" v-if="isAuthenticated">
      <!-- Выбор недели -->
      <div class="card week-selector">
        <h3>Выберите неделю</h3>
        <div class="week-select-wrapper">
          <select v-model="selectedWeekIndex" class="input week-select" @change="onWeekChange">
            <option v-for="(week, index) in availableWeeks" :key="index" :value="index">
              {{ week.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Форма добавления расписания -->
      <ScheduleForm 
        v-if="users.length > 0"
        :users="users"
        :week-start="weekStart"
        :week-end="weekEnd"
        @submit="loadSchedules"
      />

      <!-- Фильтр по должностям -->
      <div class="card position-filter" v-if="uniquePositions.length > 0">
        <h3>Фильтр по должностям</h3>
        <div class="position-buttons">
          <button
            v-for="position in uniquePositions"
            :key="position"
            class="position-btn"
            :class="{ active: selectedPosition === position }"
            @click="selectedPosition = position"
          >
            {{ position }}
          </button>
          <button
            class="position-btn"
            :class="{ active: selectedPosition === 'all' }"
            @click="selectedPosition = 'all'"
          >
            Все
          </button>
        </div>
      </div>

      <!-- Таблицы расписаний по должностям -->
      <div v-if="loading" class="loading"></div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <template v-else>
        <div v-for="position in filteredPositions" :key="position" class="position-schedule-section">
          <div class="card position-header">
            <h2>{{ position }}</h2>
          </div>
          <ScheduleTable 
            v-if="getSchedulesByPosition(position).length > 0"
            :schedules="getSchedulesByPosition(position)"
            :week-start="weekStart"
            :week-end="weekEnd"
            @refresh="loadSchedules"
            @confirm="handleConfirm"
          />
          <div v-else class="card">
            <p>Нет расписаний для должности "{{ position }}" на выбранную неделю.</p>
          </div>
        </div>
        <div v-if="filteredSchedules.length === 0" class="card">
          <p>Нет расписаний на выбранную неделю. Добавьте расписания через форму выше.</p>
        </div>
      </template>

      <!-- Список сотрудников -->
      <div class="card users-list">
        <h3>Зарегистрированные сотрудники ({{ users.length }})</h3>
        <div v-if="users.length === 0" class="empty-state">
          <p>Пока нет зарегистрированных сотрудников.</p>
          <p>Сотрудники могут зарегистрироваться через Telegram бота.</p>
        </div>
        <div v-else class="users-grid">
          <div v-for="user in users" :key="user.id" class="user-card">
            <div class="user-info">
              <strong>{{ user.lastName }} {{ user.firstName }}</strong>
              <span class="user-position">{{ user.position }}</span>
            </div>
            <button 
              class="delete-btn" 
              @click="deleteUser(user.id, user.firstName, user.lastName)"
              :disabled="deletingUserId === user.id"
              title="Удалить пользователя"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import AuthModal from '~/components/AuthModal.vue'

interface User {
  id: string
  firstName: string
  lastName: string
  position: string
  telegramId: string
}

interface Schedule {
  id: string
  user: User
  monday: string | null
  tuesday: string | null
  wednesday: string | null
  thursday: string | null
  friday: string | null
  saturday: string | null
  sunday: string | null
  totalHours: number
}

const users = ref<User[]>([])
const schedules = ref<Schedule[]>([])
const loading = ref(false)
const error = ref('')
const deletingUserId = ref<string | null>(null)
const availableWeeks = ref<Array<{ weekStart: Date; weekEnd: Date; label: string }>>([])
const selectedWeekIndex = ref(0)
const selectedPosition = ref<string>('all')
const isAuthenticated = ref(false)

const weekStart = computed(() => {
  if (availableWeeks.value.length > 0 && selectedWeekIndex.value >= 0) {
    return new Date(availableWeeks.value[selectedWeekIndex.value].weekStart)
  }
  // Fallback на текущую неделю
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)
  return monday
})

const weekEnd = computed(() => {
  if (availableWeeks.value.length > 0 && selectedWeekIndex.value >= 0) {
    return new Date(availableWeeks.value[selectedWeekIndex.value].weekEnd)
  }
  // Fallback на текущую неделю
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return sunday
})

// Уникальные должности из расписаний
const uniquePositions = computed(() => {
  const positions = new Set(schedules.value.map(s => s.user.position))
  return Array.from(positions).sort()
})

// Фильтрованные расписания
const filteredSchedules = computed(() => {
  if (selectedPosition.value === 'all') {
    return schedules.value
  }
  return schedules.value.filter(s => s.user.position === selectedPosition.value)
})

// Должности для отображения
const filteredPositions = computed(() => {
  if (selectedPosition.value === 'all') {
    return uniquePositions.value
  }
  return [selectedPosition.value]
})

// Функция для получения расписаний по должности
function getSchedulesByPosition(position: string): Schedule[] {
  return schedules.value.filter(s => s.user.position === position)
}

// Проверка авторизации
function checkAuth() {
  // Проверяем sessionStorage
  if (typeof window !== 'undefined') {
    const sessionAuth = sessionStorage.getItem('auth')
    if (sessionAuth) {
      try {
        const authData = JSON.parse(sessionAuth)
        if (authData.authenticated) {
          isAuthenticated.value = true
          return
        }
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }
    
    // Проверяем localStorage
    const localAuth = localStorage.getItem('auth')
    const authExpiry = localStorage.getItem('authExpiry')
    
    if (localAuth && authExpiry) {
      try {
        const authData = JSON.parse(localAuth)
        const expiry = parseInt(authExpiry)
        
        if (authData.authenticated && Date.now() < expiry) {
          isAuthenticated.value = true
          return
        } else {
          // Срок истек, удаляем
          localStorage.removeItem('auth')
          localStorage.removeItem('authExpiry')
        }
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }
  }
  
  isAuthenticated.value = false
}

function handleAuthSuccess() {
  isAuthenticated.value = true
  // Загружаем данные после успешной авторизации
  loadUsers()
  loadWeeks()
  loadSchedules()
}

function handleAuthClose() {
  // Не позволяем закрыть модальное окно без авторизации
  if (!isAuthenticated.value) {
    checkAuth()
  }
}

async function loadWeeks() {
  try {
    const response = await $fetch<{ weeks: Array<{ weekStart: string; weekEnd: string; label: string }> }>('/api/schedules/weeks')
    availableWeeks.value = response.weeks.map(week => ({
      weekStart: new Date(week.weekStart),
      weekEnd: new Date(week.weekEnd),
      label: week.label
    }))
    
    // Устанавливаем текущую неделю по умолчанию
    if (availableWeeks.value.length > 0) {
      const currentWeekIndex = availableWeeks.value.findIndex(w => w.label.includes('(Текущая)'))
      
      if (currentWeekIndex >= 0) {
        selectedWeekIndex.value = currentWeekIndex
      } else {
        // Если текущей недели нет, берем первую доступную
        selectedWeekIndex.value = 0
      }
    }
  } catch (err: any) {
    console.error('Error loading weeks:', err)
    // Fallback на текущую неделю
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    availableWeeks.value = [{
      weekStart: monday,
      weekEnd: sunday,
      label: formatWeekLabel(monday, sunday) + ' (Текущая)'
    }]
    selectedWeekIndex.value = 0
  }
}

function formatWeekLabel(start: Date, end: Date): string {
  const startDay = start.getDate()
  const startMonth = start.getMonth() + 1
  const startYear = start.getFullYear()
  
  const endDay = end.getDate()
  const endMonth = end.getMonth() + 1
  const endYear = end.getFullYear()
  
  return `${startDay}.${startMonth}.${startYear}-${endDay}.${endMonth}.${endYear}`
}

function onWeekChange() {
  loadSchedules()
}

async function loadUsers() {
  try {
    const response = await $fetch<{ users: User[] }>('/api/users')
    users.value = response.users
  } catch (err: any) {
    console.error('Error loading users:', err)
    error.value = 'Ошибка при загрузке пользователей'
  }
}

async function loadSchedules() {
  try {
    loading.value = true
    error.value = ''
    
    const response = await $fetch<{ schedules: Schedule[] }>('/api/schedules', {
      query: {
        weekStart: weekStart.value.toISOString(),
        weekEnd: weekEnd.value.toISOString()
      }
    })
    
    schedules.value = response.schedules
  } catch (err: any) {
    console.error('Error loading schedules:', err)
    error.value = 'Ошибка при загрузке расписаний'
  } finally {
    loading.value = false
  }
}

function handleConfirm() {
  loadSchedules()
  // Обновляем список недель после подтверждения, чтобы новая неделя появилась в списке
  setTimeout(() => {
    loadWeeks()
  }, 500)
}

async function deleteUser(userId: string, firstName: string, lastName: string) {
  if (!confirm(`Вы уверены, что хотите удалить пользователя ${firstName} ${lastName}?`)) {
    return
  }
  
  try {
    deletingUserId.value = userId
    
    await $fetch(`/api/users/${userId}`, {
      method: 'DELETE'
    })
    
    // Обновляем список пользователей
    await loadUsers()
    
    alert('Пользователь успешно удален. Сообщение отправлено в Telegram.')
  } catch (err: any) {
    console.error('Error deleting user:', err)
    alert(err.data?.statusMessage || 'Ошибка при удалении пользователя')
  } finally {
    deletingUserId.value = null
  }
}

onMounted(async () => {
  checkAuth()
  if (isAuthenticated.value) {
    await loadUsers()
    await loadWeeks()
    await loadSchedules()
  }
})

// Следим за изменением выбранной должности
watch(selectedPosition, () => {
  // Можно добавить дополнительную логику при изменении фильтра
})
</script>

<style scoped lang="scss">

.admin-page {
  min-height: 100vh;
  background: $color-bg-secondary;
}

.week-selector {
  h3 {
    margin-bottom: $spacing-lg;
    font-size: $font-size-xl;
    font-weight: 700;
    background: $gradient-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .week-select-wrapper {
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      pointer-events: none;
      z-index: 2;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-size: contain;
    }
    
    .week-select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background: transparent;
      padding-right: 50px;
      cursor: pointer;
      font-weight: 600;
      font-size: $font-size-base;
      transition: $transition-base;
      
      &:hover {
        border-color: $color-primary-light;
      }
      
      &:focus {
        border-color: $color-primary;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      }
    }
  }
}

.form-group {
  label {
    display: block;
    margin-bottom: $spacing-sm;
    font-weight: 600;
    color: $color-text-primary;
    font-size: $font-size-base;
  }
}

.position-filter {
  margin-bottom: $spacing-xl;
  
  h3 {
    margin-bottom: $spacing-lg;
    font-size: $font-size-xl;
    font-weight: 700;
    background: $gradient-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .position-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    
    .position-btn {
      padding: $spacing-md $spacing-lg;
      border: 2px solid $color-border;
      border-radius: $radius-md;
      background: $color-bg-primary;
      color: $color-text-primary;
      font-weight: 600;
      font-size: $font-size-base;
      cursor: pointer;
      transition: $transition-base;
      
      &:hover {
        border-color: $color-primary-light;
        transform: translateY(-2px);
        box-shadow: $shadow-md;
      }
      
      &.active {
        background: $gradient-primary;
        color: $color-text-light;
        border-color: transparent;
        box-shadow: $shadow-lg;
      }
    }
  }
}

.position-schedule-section {
  margin-bottom: $spacing-2xl;
  
  .position-header {
    margin-bottom: $spacing-lg;
    
    h2 {
      font-size: $font-size-2xl;
      font-weight: 700;
      background: $gradient-primary;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }
  }
}

.users-list {
  h3 {
    margin-bottom: $spacing-lg;
    font-size: $font-size-2xl;
    font-weight: 700;
    background: $gradient-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .empty-state {
    text-align: center;
    padding: $spacing-2xl;
    color: $color-text-secondary;
    background: $color-bg-secondary;
    border-radius: $radius-md;
    border: 2px dashed $color-border;
    
    p {
      margin-bottom: $spacing-md;
      font-size: $font-size-lg;
      font-weight: 500;
    }
  }
  
  .users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: $spacing-lg;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: $spacing-md;
    }
  }
  
  .user-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    padding: $spacing-lg;
    border-radius: $radius-md;
    border: 2px solid $color-border-light;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $spacing-md;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: $gradient-primary;
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
      flex: 1;
      
      strong {
        color: $color-text-primary;
        font-size: $font-size-lg;
        font-weight: 700;
      }
      
      .user-position {
        color: $color-text-secondary;
        font-size: $font-size-sm;
        font-weight: 600;
        padding: $spacing-xs $spacing-sm;
        background: $color-bg-secondary;
        border-radius: $radius-sm;
        display: inline-block;
        width: fit-content;
      }
    }
    
    .delete-btn {
      background: transparent;
      border: 2px solid $color-danger;
      border-radius: $radius-md;
      padding: $spacing-sm;
      cursor: pointer;
      color: $color-danger;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: $transition-base;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      
      &:hover {
        background: $color-danger;
        color: $color-text-light;
        transform: scale(1.1);
        box-shadow: $shadow-md;
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      svg {
        width: 20px;
        height: 20px;
      }
    }
  }
}
</style>


