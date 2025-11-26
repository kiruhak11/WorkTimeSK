<template>
  <div class="schedule-table-wrapper">
    <div class="schedule-table-header">
      <h2>{{ weekTitle }}</h2>
      <div class="schedule-legend">
        <div class="legend-item">
          <span class="legend-color" style="background: #8BC34A"></span>
          <span>с 10:00</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #2196F3"></span>
          <span>с 12:00</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #f44336"></span>
          <span>с 14:00</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #FFC107"></span>
          <span>с 16:00/17:00</span>
        </div>
      </div>
    </div>

    <div class="schedule-table">
      <table>
        <thead>
          <tr>
            <th class="col-name">ФИО</th>
            <th class="col-position">Должность</th>
            <th class="col-day">Пн</th>
            <th class="col-day">Вт</th>
            <th class="col-day">Ср</th>
            <th class="col-day">Чт</th>
            <th class="col-day">Пт</th>
            <th class="col-day">Сб</th>
            <th class="col-day">Вс</th>
            <th class="col-hours">Кол часов</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="schedule in schedules" :key="schedule.id" :class="{ 'auto-row': schedule.user.position === 'Авто' }">
            <td class="col-name">{{ schedule.user.lastName }} {{ schedule.user.firstName }}</td>
            <td class="col-position">{{ schedule.user.position }}</td>
            <td class="col-day" :class="getCellClass(schedule.monday)" @click="editCell(schedule.id, 'monday', schedule.monday)">
              {{ formatTime(schedule.monday) }}
            </td>
            <td class="col-day" :class="getCellClass(schedule.tuesday)" @click="editCell(schedule.id, 'tuesday', schedule.tuesday)">
              {{ formatTime(schedule.tuesday) }}
            </td>
            <td class="col-day" :class="getCellClass(schedule.wednesday)" @click="editCell(schedule.id, 'wednesday', schedule.wednesday)">
              {{ formatTime(schedule.wednesday) }}
            </td>
            <td class="col-day" :class="getCellClass(schedule.thursday)" @click="editCell(schedule.id, 'thursday', schedule.thursday)">
              {{ formatTime(schedule.thursday) }}
            </td>
            <td class="col-day" :class="getCellClass(schedule.friday)" @click="editCell(schedule.id, 'friday', schedule.friday)">
              {{ formatTime(schedule.friday) }}
            </td>
            <td class="col-day" :class="getCellClass(schedule.saturday)" @click="editCell(schedule.id, 'saturday', schedule.saturday)">
              {{ formatTime(schedule.saturday) }}
            </td>
            <td class="col-day" :class="getCellClass(schedule.sunday)" @click="editCell(schedule.id, 'sunday', schedule.sunday)">
              {{ formatTime(schedule.sunday) }}
            </td>
            <td class="col-hours">{{ schedule.totalHours }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="schedule-actions">
      <button class="btn btn-primary" @click="confirmSchedule" :disabled="loading">
        <span>{{ loading ? 'Обработка...' : 'Подтвердить и отправить' }}</span>
      </button>
      <button class="btn btn-secondary" @click="duplicateWeek" :disabled="loading">
        <span>{{ loading ? 'Копирование...' : 'Дублировать с прошлой недели' }}</span>
      </button>
      <button class="btn btn-secondary" @click="exportSchedule" :disabled="loading">
        <span>Экспорт в XLS</span>
      </button>
    </div>

    <!-- Модальное окно редактирования -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="editingCell" class="modal" @click.self="closeEdit" @keyup.esc="closeEdit">
          <div class="modal-content" @click.stop @mousedown.stop>
            <h3>Редактировать время</h3>
            <p class="modal-day-info">{{ getDayInfo(editingCell.day) }}</p>
            
            <div class="modal-checkbox">
              <label class="checkbox-label">
                <input type="checkbox" v-model="editIsOff" @change="handleOffChange" />
                <span>Выходной</span>
              </label>
            </div>
            
            <div v-if="!editIsOff" class="modal-time-inputs">
              <div class="time-input-group">
                <label>С:</label>
                <input 
                  type="number" 
                  v-model.number="editStart" 
                  class="input time-input" 
                  min="0" 
                  max="23" 
                  placeholder="10"
                  ref="editInput"
                  @keyup.enter="saveEdit"
                  @keyup.esc="closeEdit"
                />
                <span class="time-label">:00</span>
              </div>
              <div class="time-input-group">
                <label>До:</label>
                <input 
                  type="number" 
                  v-model.number="editEnd" 
                  class="input time-input" 
                  min="0" 
                  max="23" 
                  placeholder="24"
                  @keyup.enter="saveEdit"
                  @keyup.esc="closeEdit"
                />
                <span class="time-label">:00</span>
              </div>
            </div>
            
          <div class="modal-actions">
            <button class="btn btn-primary" @click="saveEdit" :disabled="loading">
              <span>{{ loading ? 'Сохранение...' : 'Сохранить' }}</span>
            </button>
            <button class="btn btn-secondary" @click="closeEdit" :disabled="loading">
              <span>Отмена</span>
            </button>
          </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

interface User {
  id: string
  firstName: string
  lastName: string
  position: string
  department?: string
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

const props = defineProps<{
  schedules: Schedule[]
  weekStart: Date
  weekEnd: Date
}>()

const emit = defineEmits<{
  refresh: []
  confirm: []
}>()

const loading = ref(false)
const editingCell = ref<{ scheduleId: string; day: string; value: string | null } | null>(null)
const editStart = ref<number>(10)
const editEnd = ref<number>(24)
const editIsOff = ref(false)
const editInput = ref<HTMLInputElement | null>(null)

const weekTitle = computed(() => {
  const start = new Date(props.weekStart)
  const end = new Date(props.weekEnd)
  return `График курьеров ${start.getDate()}.${start.getMonth() + 1} - ${end.getDate()}.${end.getMonth() + 1}`
})

const dayNames: Record<string, string> = {
  'monday': 'Понедельник',
  'tuesday': 'Вторник',
  'wednesday': 'Среда',
  'thursday': 'Четверг',
  'friday': 'Пятница',
  'saturday': 'Суббота',
  'sunday': 'Воскресенье'
}

function getDayInfo(day: string): string {
  const dayName = dayNames[day] || day
  const lateNightDays = ['thursday', 'friday', 'saturday']
  const endTime = lateNightDays.includes(day) ? '02:00' : '00:00'
  return `${dayName} (режим работы ресторана: 10:00 - ${endTime})`
}

function formatTime(time: string | null): string {
  if (!time) return 'в'
  return time.toLowerCase() === 'выходной' || time.toLowerCase() === 'в' ? 'в' : time
}

function getCellClass(time: string | null): string {
  if (!time || time.toLowerCase() === 'выходной' || time.toLowerCase() === 'в') {
    return 'cell-off'
  }
  
  const match = time.match(/(\d{1,2})-/)
  if (!match) return ''
  
  const startHour = parseInt(match[1])
  
  if (startHour <= 10) return 'cell-green'
  if (startHour === 11 || startHour === 12) return 'cell-blue'
  if (startHour === 13 || startHour === 14) return 'cell-red'
  if (startHour >= 16) return 'cell-yellow'
  
  return ''
}

function editCell(scheduleId: string, day: string, value: string | null) {
  if (!editingCell.value) {
    editingCell.value = { scheduleId, day, value }
  } else {
    editingCell.value.scheduleId = scheduleId
    editingCell.value.day = day
    editingCell.value.value = value
  }
  
  // Парсим значение
  if (!value || value.toLowerCase() === 'выходной' || value.toLowerCase() === 'в') {
    editIsOff.value = true
    editStart.value = 10
    editEnd.value = ['thursday', 'friday', 'saturday'].includes(day) ? 2 : 24
  } else {
    editIsOff.value = false
    const match = value.match(/(\d{1,2})-(\d{1,2})/)
    if (match) {
      editStart.value = parseInt(match[1])
      editEnd.value = parseInt(match[2])
    } else {
      editStart.value = 10
      editEnd.value = ['thursday', 'friday', 'saturday'].includes(day) ? 2 : 24
    }
  }
  
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus()
      editInput.value.select()
    }
  })
}

function handleOffChange() {
  if (editIsOff.value) {
    editStart.value = 10
    editEnd.value = ['thursday', 'friday', 'saturday'].includes(editingCell.value?.day || '') ? 2 : 24
  }
}

function closeEdit() {
  editingCell.value = null
  editStart.value = 10
  editEnd.value = 24
  editIsOff.value = false
}

async function saveEdit() {
  if (!editingCell.value) return
  
  try {
    loading.value = true
    
    const updateData: any = {}
    let normalizedValue: string
    
    if (editIsOff.value) {
      normalizedValue = 'в'
    } else {
      const start = editStart.value ?? 10
      const end = editEnd.value ?? 24
      if (start !== null && end !== null) {
        normalizedValue = `${start}-${end}`
      } else {
        normalizedValue = 'в'
      }
    }
    
    updateData[editingCell.value.day] = normalizedValue
    
    await $fetch(`/api/schedules/${editingCell.value.scheduleId}`, {
      method: 'PATCH',
      body: updateData
    })
    
    closeEdit()
    emit('refresh')
  } catch (error: any) {
    console.error('Error updating schedule:', error)
    const errorMessage = error.data?.statusMessage || error.data?.message || 'Ошибка при обновлении расписания'
    alert(errorMessage)
  } finally {
    loading.value = false
  }
}

async function confirmSchedule() {
  try {
    loading.value = true
    
    await $fetch('/api/schedules/confirm', {
      method: 'POST',
      body: {
        weekStart: props.weekStart,
        weekEnd: props.weekEnd
      }
    })
    
    emit('confirm')
    alert('Расписание подтверждено и отправлено сотрудникам!')
  } catch (error) {
    console.error('Error confirming schedule:', error)
    alert('Ошибка при подтверждении расписания')
  } finally {
    loading.value = false
  }
}

async function exportSchedule() {
  try {
    loading.value = true
    
    const weekStart = new Date(props.weekStart).toISOString()
    const weekEnd = new Date(props.weekEnd).toISOString()
    
    window.open(`/api/export/schedule?weekStart=${weekStart}&weekEnd=${weekEnd}`, '_blank')
  } catch (error) {
    console.error('Error exporting schedule:', error)
    alert('Ошибка при экспорте расписания')
  } finally {
    loading.value = false
  }
}

async function duplicateWeek() {
  if (!confirm('Скопировать расписание с прошлой недели на текущую?')) {
    return
  }
  
  try {
    loading.value = true
    
    // Вычисляем предыдущую неделю
    const currentStart = new Date(props.weekStart)
    const previousStart = new Date(currentStart)
    previousStart.setDate(currentStart.getDate() - 7)
    
    const previousEnd = new Date(previousStart)
    previousEnd.setDate(previousStart.getDate() + 6)
    
    // Копируем расписание
    await $fetch('/api/schedules/duplicate', {
      method: 'POST',
      body: {
        fromWeekStart: previousStart.toISOString(),
        fromWeekEnd: previousEnd.toISOString(),
        toWeekStart: props.weekStart.toISOString(),
        toWeekEnd: props.weekEnd.toISOString()
      }
    })
    
    emit('refresh')
    alert('Расписание успешно скопировано с прошлой недели!')
  } catch (error: any) {
    console.error('Error duplicating schedule:', error)
    alert(error.data?.statusMessage || 'Ошибка при копировании расписания')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use 'sass:color';

.schedule-table-wrapper {
  background: $color-bg-primary;
  border-radius: $radius-lg;
  padding: $spacing-2xl;
  box-shadow: $shadow-xl;
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
}

.schedule-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;
  flex-wrap: wrap;
  gap: $spacing-lg;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-md;
  }
  
  h2 {
    font-size: $font-size-3xl;
    font-weight: 700;
    background: $gradient-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
    
    @media (max-width: 768px) {
      font-size: $font-size-2xl;
    }
  }
}

.schedule-legend {
  display: flex;
  gap: $spacing-lg;
  flex-wrap: wrap;
  padding: $spacing-md;
  background: $color-bg-secondary;
  border-radius: $radius-md;
  
  @media (max-width: 768px) {
    gap: $spacing-md;
    width: 100%;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text-secondary;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-sm;
  }
  
  .legend-color {
    width: 24px;
    height: 24px;
    border-radius: $radius-sm;
    box-shadow: $shadow-sm;
    border: 2px solid rgba(255, 255, 255, 0.5);
  }
}

.schedule-table {
  overflow-x: auto;
  margin-bottom: $spacing-xl;
  border-radius: $radius-md;
  box-shadow: $shadow-md;
  
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: $color-bg-secondary;
    border-radius: $radius-sm;
  }
  
  &::-webkit-scrollbar-thumb {
    background: $color-primary;
    border-radius: $radius-sm;
    
    &:hover {
      background: $color-primary-dark;
    }
  }
  
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: $color-bg-primary;
    
    th, td {
      padding: $spacing-md;
      text-align: center;
      font-size: $font-size-sm;
      border-bottom: 1px solid $color-border;
    }
    
    th {
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      font-weight: 700;
      color: $color-text-light;
      text-transform: uppercase;
      font-size: $font-size-xs;
      letter-spacing: 0.5px;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      
      &:first-child {
        border-top-left-radius: $radius-md;
      }
      
      &:last-child {
        border-top-right-radius: $radius-md;
      }
    }
    
    tbody tr {
      position: relative;
      
      &::before,
      &::after {
        display: none !important;
      }
      
      &:last-child td {
        border-bottom: none;
      }
    }
    
    .col-name {
      min-width: 200px;
      text-align: left;
      font-weight: 600;
      color: $color-text-primary;
      padding-left: $spacing-lg;
    }
    
    .col-position {
      min-width: 120px;
      font-weight: 500;
      color: $color-text-secondary;
    }
    
    .col-day {
      min-width: 100px;
      cursor: pointer;
      transition: $transition-base;
      position: relative;
      font-weight: 600;
      
      &:hover {
        transform: scale(1.05);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3), $shadow-md;
        z-index: 5;
        outline: 2px solid $color-primary;
        outline-offset: -2px;
      }
      
      &:active {
        transform: scale(0.98);
      }
    }
    
    .col-hours {
      min-width: 100px;
      font-weight: 700;
      color: $color-primary-dark;
      font-size: $font-size-base;
    }
    
    .cell-green {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: $color-text-light;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .cell-blue {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: $color-text-light;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .cell-red {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: $color-text-light;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .cell-yellow {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: $color-text-light;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .cell-off {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      color: $color-text-light;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .auto-row {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    }
  }
}

.schedule-actions {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
  margin-top: $spacing-lg;
  
  @media (max-width: 768px) {
    flex-direction: column;
    
    .btn {
      width: 100%;
    }
  }
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  pointer-events: auto;
  padding: $spacing-lg;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: $color-bg-primary;
  border-radius: $radius-xl;
  padding: $spacing-2xl;
  min-width: 420px;
  max-width: 90vw;
  box-shadow: $shadow-2xl;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.8);
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
  
  @keyframes slideUp {
    from {
      transform: translateY(30px) scale(0.95);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
  
  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
    padding: $spacing-lg;
    border-radius: $radius-lg;
  }
  
  h3 {
    margin-bottom: $spacing-md;
    color: $color-text-primary;
    font-size: $font-size-2xl;
    font-weight: 700;
    background: $gradient-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .modal-day-info {
    color: $color-text-secondary;
    font-size: $font-size-sm;
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    border-radius: $radius-md;
    border-left: 4px solid $color-primary;
    font-weight: 500;
  }
  
  .modal-checkbox {
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background: $color-bg-secondary;
    border-radius: $radius-md;
    
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      cursor: pointer;
      font-size: $font-size-base;
      font-weight: 600;
      color: $color-text-primary;
      transition: $transition-base;
      
      &:hover {
        color: $color-primary;
      }
      
      input[type="checkbox"] {
        cursor: pointer;
        width: 22px;
        height: 22px;
        accent-color: $color-primary;
        border-radius: $radius-sm;
        transition: $transition-base;
        
        &:hover {
          transform: scale(1.1);
        }
      }
    }
  }
  
  .modal-time-inputs {
    display: flex;
    gap: $spacing-lg;
    margin-bottom: $spacing-lg;
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
    min-width: 160px;
    background: $color-bg-secondary;
    padding: $spacing-md;
    border-radius: $radius-md;
    
    label {
      font-size: $font-size-sm;
      color: $color-text-secondary;
      white-space: nowrap;
      font-weight: 600;
    }
    
    .time-input {
      width: 80px;
      text-align: center;
      padding: $spacing-sm $spacing-md;
      border: 2px solid $color-border;
      border-radius: $radius-sm;
      font-weight: 700;
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
}

.modal-actions {
  display: flex;
  gap: $spacing-md;
  justify-content: flex-end;
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 2px solid $color-border-light;
  
  @media (max-width: 480px) {
    flex-direction: column;
    
    .btn {
      width: 100%;
    }
  }
}
</style>


