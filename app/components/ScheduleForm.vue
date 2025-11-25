<template>
  <div class="schedule-form">
    <h3>Добавить расписание для сотрудника</h3>
    
    <div class="form-group">
      <label>Сотрудник</label>
      <select v-model="selectedUserId" class="input">
        <option value="">Выберите сотрудника</option>
        <option v-for="user in users" :key="user.id" :value="user.id">
          {{ user.lastName }} {{ user.firstName }} ({{ user.position }})
        </option>
      </select>
    </div>

    <div class="schedule-days">
      <div class="day-schedule" v-for="day in days" :key="day.key">
        <div class="day-header">
          <label class="day-label">{{ day.label }}</label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="day.off" @change="toggleDay(day.key, day.off)" />
            <span>Выходной</span>
          </label>
        </div>
        <div v-if="!day.off" class="time-inputs">
          <div class="time-input-group">
            <label>С:</label>
            <input 
              type="number" 
              v-model.number="day.start" 
              class="input time-input" 
              min="0" 
              max="23" 
              placeholder="10"
              @input="updateDaySchedule(day.key)"
            />
            <span class="time-label">:00</span>
          </div>
          <div class="time-input-group">
            <label>До:</label>
            <input 
              type="number" 
              v-model.number="day.end" 
              class="input time-input" 
              min="0" 
              max="23" 
              placeholder="24"
              @input="updateDaySchedule(day.key)"
            />
            <span class="time-label">:00</span>
          </div>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn btn-primary" @click="submitSchedule" :disabled="loading || !selectedUserId">
        <span>{{ loading ? 'Сохранение...' : 'Сохранить расписание' }}</span>
      </button>
      <button class="btn btn-secondary" @click="resetForm" :disabled="loading">
        <span>Очистить</span>
      </button>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">{{ success }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface User {
  id: string
  firstName: string
  lastName: string
  position: string
}

const props = defineProps<{
  users: User[]
  weekStart: Date
  weekEnd: Date
}>()

const emit = defineEmits<{
  submit: []
}>()

const selectedUserId = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

// Структура для дней недели
const days = reactive([
  { key: 'monday', label: 'Понедельник', start: 10, end: 24, off: false },
  { key: 'tuesday', label: 'Вторник', start: 10, end: 24, off: false },
  { key: 'wednesday', label: 'Среда', start: 10, end: 24, off: false },
  { key: 'thursday', label: 'Четверг', start: 10, end: 2, off: false },
  { key: 'friday', label: 'Пятница', start: 10, end: 2, off: false },
  { key: 'saturday', label: 'Суббота', start: 10, end: 2, off: false },
  { key: 'sunday', label: 'Воскресенье', start: 10, end: 24, off: false }
])

// Объект для хранения финальных значений расписания
const schedule = reactive({
  monday: 'в',
  tuesday: 'в',
  wednesday: 'в',
  thursday: 'в',
  friday: 'в',
  saturday: 'в',
  sunday: 'в'
})

function toggleDay(dayKey: string, isOff: boolean) {
  const day = days.find(d => d.key === dayKey)
  if (!day) return
  
  if (isOff) {
    schedule[dayKey as keyof typeof schedule] = 'в'
  } else {
    updateDaySchedule(dayKey)
  }
}

function updateDaySchedule(dayKey: string) {
  const day = days.find(d => d.key === dayKey)
  if (!day) return
  
  if (day.off) {
    schedule[dayKey as keyof typeof schedule] = 'в'
    return
  }
  
  const start = day.start !== null && day.start !== undefined ? day.start : 10
  const end = day.end !== null && day.end !== undefined ? day.end : 24
  
  // Валидация: значения должны быть от 0 до 23
  const validStart = Math.max(0, Math.min(23, start))
  const validEnd = Math.max(0, Math.min(23, end))
  
  schedule[dayKey as keyof typeof schedule] = `${validStart}-${validEnd}`
}

async function submitSchedule() {
  if (!selectedUserId.value) {
    error.value = 'Выберите сотрудника'
    return
  }

  // Обновляем все значения перед отправкой
  days.forEach(day => {
    updateDaySchedule(day.key)
  })

  try {
    loading.value = true
    error.value = ''
    success.value = ''

    await $fetch('/api/schedules', {
      method: 'POST',
      body: {
        userId: selectedUserId.value,
        weekStart: props.weekStart,
        weekEnd: props.weekEnd,
        monday: schedule.monday || 'в',
        tuesday: schedule.tuesday || 'в',
        wednesday: schedule.wednesday || 'в',
        thursday: schedule.thursday || 'в',
        friday: schedule.friday || 'в',
        saturday: schedule.saturday || 'в',
        sunday: schedule.sunday || 'в'
      }
    })

    success.value = 'Расписание успешно сохранено!'
    resetForm()
    emit('submit')

    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (err: any) {
    console.error('Error submitting schedule:', err)
    error.value = err.data?.statusMessage || err.data?.message || 'Ошибка при сохранении расписания'
    
    // Автоматически скрываем ошибку через 5 секунд
    setTimeout(() => {
      error.value = ''
    }, 5000)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  selectedUserId.value = ''
  days.forEach(day => {
    day.off = false
    if (['thursday', 'friday', 'saturday'].includes(day.key)) {
      day.start = 10
      day.end = 2
    } else {
      day.start = 10
      day.end = 24
    }
    schedule[day.key as keyof typeof schedule] = 'в'
  })
}
</script>

<style scoped lang="scss">
@use 'sass:color';

.schedule-form {
  background: $color-bg-primary;
  border-radius: $radius-lg;
  padding: $spacing-2xl;
  box-shadow: $shadow-xl;
  margin-bottom: $spacing-xl;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  animation: fadeInUp 0.6s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: $gradient-primary;
  }
  
  @media (max-width: 768px) {
    padding: $spacing-lg;
    border-radius: $radius-md;
  }

  h3 {
    margin-bottom: $spacing-xl;
    color: $color-text-primary;
    font-size: $font-size-2xl;
    font-weight: 700;
    background: $gradient-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    
    @media (max-width: 768px) {
      font-size: $font-size-xl;
      margin-bottom: $spacing-lg;
    }
  }
}

.form-group {
  margin-bottom: $spacing-lg;

  label {
    display: block;
    margin-bottom: $spacing-sm;
    font-weight: 600;
    color: $color-text-primary;
    font-size: $font-size-base;
  }
}

.schedule-days {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-lg;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: $spacing-md;
  }
}

.day-schedule {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: $spacing-lg;
  border-radius: $radius-md;
  border: 2px solid $color-border-light;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: $gradient-primary;
  }
  
  @media (max-width: 768px) {
    padding: $spacing-md;
  }
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-sm;
  border-bottom: 2px solid $color-border-light;
  
  .day-label {
    font-weight: 700;
    color: $color-text-primary;
    margin: 0;
    font-size: $font-size-lg;
    letter-spacing: -0.3px;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-sm;
    cursor: pointer;
    margin: 0;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-sm;
    transition: $transition-base;
    
    &:hover {
      background: $color-bg-tertiary;
    }
    
    input[type="checkbox"] {
      cursor: pointer;
      width: 20px;
      height: 20px;
      accent-color: $color-primary;
      border-radius: $radius-sm;
      
      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

.time-inputs {
  display: flex;
  gap: $spacing-lg;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: $spacing-md;
  }
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex: 1;
  min-width: 140px;
  background: $color-bg-secondary;
  padding: $spacing-sm;
  border-radius: $radius-md;
  
  label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    white-space: nowrap;
    margin: 0;
    font-weight: 600;
  }
  
  .time-input {
    width: 70px;
    text-align: center;
    padding: $spacing-sm $spacing-md;
    border: 2px solid $color-border;
    border-radius: $radius-sm;
    font-weight: 600;
    font-size: $font-size-base;
    transition: $transition-base;
    cursor: text;
    
    &:hover {
      border-color: $color-primary-light;
    }
    
    &:focus {
      border-color: $color-primary;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      outline: none;
    }
  }
  
  .time-label {
    font-size: $font-size-base;
    color: $color-text-secondary;
    font-weight: 600;
  }
}

.form-actions {
  display: flex;
  gap: $spacing-md;
  margin-top: $spacing-xl;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    
    .btn {
      width: 100%;
    }
  }
}
</style>


