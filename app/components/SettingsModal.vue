<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="settings-modal" @click.self="close">
        <div class="settings-modal-content">
          <div class="settings-header">
            <h2>Настройки</h2>
            <button class="close-btn" @click="close" aria-label="Закрыть">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="settings-content">
            <!-- Смена типа пользователя -->
            <div class="settings-section">
              <h3>Смена типа пользователя</h3>
              
              <div class="form-group">
                <select
                  v-model="newDepartment"
                  class="input"
                >
                  <option value="кухня">Кухня</option>
                  <option value="штат">Штат</option>
                </select>
              </div>
              
              <button
                class="btn btn-primary"
                @click="saveDepartment"
                :disabled="loading || newDepartment === props.currentDepartment"
              >
                <span v-if="loading">Сохранение...</span>
                <span v-else>Сохранить</span>
              </button>
            </div>
            
            <div class="settings-divider"></div>
            
            <!-- Очистка базы данных -->
            <div class="settings-section danger-section">
              <h3>Очистка базы данных</h3>
              <p class="settings-description warning-text">
                ⚠️ ВНИМАНИЕ: Это действие удалит всех пользователей и все расписания. 
                Это действие нельзя отменить!
              </p>
              
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="confirmClear"
                    class="checkbox"
                  />
                  <span>Я понимаю, что это действие необратимо</span>
                </label>
              </div>
              
              <button
                class="btn btn-danger"
                @click="clearDatabase"
                :disabled="!confirmClear || loading"
              >
                <span v-if="loading">Очистка...</span>
                <span v-else>Очистить базу данных</span>
              </button>
            </div>
            
            <div v-if="error" class="error-message">
              {{ error }}
            </div>
            <div v-if="successMessage" class="success-message">
              {{ successMessage }}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface User {
  id: string
  firstName: string
  lastName: string
  position: string
  department: string
}

const props = defineProps<{
  show: boolean
  users: User[]
  currentDepartment?: string
}>()

const emit = defineEmits<{
  close: []
  refresh: []
  'department-changed': [department: string]
}>()

const confirmClear = ref(false)
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const newDepartment = ref('кухня')

watch(() => props.show, (newVal) => {
  if (newVal) {
    // Инициализируем текущий отдел при открытии модального окна
    newDepartment.value = props.currentDepartment || 'кухня'
  } else {
    resetForm()
  }
})

watch(() => props.currentDepartment, (newVal) => {
  if (props.show && newVal) {
    // Обновляем отдел при изменении пропса
    newDepartment.value = newVal
  }
})

function resetForm() {
  confirmClear.value = false
  error.value = ''
  successMessage.value = ''
  newDepartment.value = props.currentDepartment || 'кухня'
}

async function saveDepartment() {
  if (!newDepartment.value || newDepartment.value === props.currentDepartment) {
    return
  }
  
  try {
    loading.value = true
    error.value = ''
    successMessage.value = ''
    
    // Сохраняем в localStorage/sessionStorage
    if (typeof window !== 'undefined') {
      // Проверяем, есть ли сохраненная авторизация
      const sessionAuth = sessionStorage.getItem('auth')
      const localAuth = localStorage.getItem('auth')
      
      const authData = {
        authenticated: true,
        department: newDepartment.value,
        timestamp: Date.now()
      }
      
      if (localAuth) {
        // Обновляем localStorage
        localStorage.setItem('auth', JSON.stringify(authData))
      } else if (sessionAuth) {
        // Обновляем sessionStorage
        sessionStorage.setItem('auth', JSON.stringify(authData))
      } else {
        // Если нет сохраненной авторизации, сохраняем в sessionStorage
        sessionStorage.setItem('auth', JSON.stringify(authData))
      }
    }
    
    successMessage.value = 'Тип пользователя успешно изменен!'
    emit('department-changed', newDepartment.value)
    
    setTimeout(() => {
      close()
    }, 1500)
  } catch (err: any) {
    console.error('Error saving department:', err)
    error.value = err.data?.statusMessage || err.message || 'Ошибка при сохранении типа пользователя'
  } finally {
    loading.value = false
  }
}

async function clearDatabase() {
  if (!confirm('Вы уверены, что хотите очистить всю базу данных? Это действие НЕОБРАТИМО!')) {
    return
  }
  
  try {
    loading.value = true
    error.value = ''
    successMessage.value = ''
    
    const response = await $fetch('/api/admin/clear-database', {
      method: 'POST'
    })
    
    successMessage.value = 'База данных успешно очищена!'
    emit('refresh')
    
    setTimeout(() => {
      resetForm()
      close()
    }, 2000)
  } catch (err: any) {
    console.error('Error clearing database:', err)
    
    let errorMessage = 'Ошибка при очистке базы данных'
    
    if (err.data) {
      errorMessage = err.data.statusMessage || err.data.message || errorMessage
    } else if (err.statusMessage) {
      errorMessage = err.statusMessage
    } else if (err.message) {
      errorMessage = err.message
    }
    
    error.value = errorMessage
  } finally {
    loading.value = false
  }
}

function close() {
  resetForm()
  emit('close')
}
</script>

<style scoped lang="scss">
.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(8px);
  padding: $spacing-lg;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.settings-modal-content {
  background: $color-bg-primary;
  border-radius: $radius-xl;
  padding: $spacing-2xl;
  min-width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: $shadow-2xl;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.8);
  
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
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;
  
  h2 {
    font-size: $font-size-2xl;
    font-weight: 700;
    background: $gradient-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }
  
  .close-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: $color-text-secondary;
    padding: $spacing-xs;
    border-radius: $radius-sm;
    transition: $transition-base;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: $color-bg-secondary;
      color: $color-text-primary;
    }
  }
}

.settings-content {
  .settings-section {
    margin-bottom: $spacing-2xl;
    
    h3 {
      font-size: $font-size-xl;
      font-weight: 700;
      color: $color-text-primary;
      margin-bottom: $spacing-sm;
    }
    
    .settings-description {
      color: $color-text-secondary;
      font-size: $font-size-sm;
      margin-bottom: $spacing-lg;
      
      &.warning-text {
        color: #dc2626;
        font-weight: 600;
      }
    }
    
    .hint-text {
      color: $color-text-secondary;
      font-size: $font-size-sm;
      font-weight: 400;
      font-style: italic;
    }
  }
  
  .danger-section {
    border-top: 2px solid $color-border;
    padding-top: $spacing-xl;
  }
  
  .settings-divider {
    height: 2px;
    background: $color-border;
    margin: $spacing-xl 0;
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
    
    .input {
      width: 100%;
      padding: $spacing-md;
      border: 2px solid $color-border;
      border-radius: $radius-md;
      font-size: $font-size-base;
      transition: $transition-base;
      background: $color-bg-primary;
      color: $color-text-primary;
      
      &:focus {
        outline: none;
        border-color: $color-primary;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      }
      
      &:disabled {
        background: $color-bg-secondary;
        color: $color-text-secondary;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
    
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      cursor: pointer;
      font-size: $font-size-base;
      font-weight: 500;
      color: $color-text-primary;
      user-select: none;
      
      .checkbox {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: $color-primary;
        border-radius: $radius-sm;
      }
    }
  }
  
  .btn {
    width: 100%;
    padding: $spacing-md $spacing-lg;
    font-size: $font-size-base;
    font-weight: 600;
    border-radius: $radius-md;
    border: none;
    cursor: pointer;
    transition: $transition-base;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .btn-primary {
    background: $gradient-primary;
    color: $color-text-light;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: $shadow-lg;
    }
  }
  
  .btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: $color-text-light;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: $shadow-lg;
    }
  }
  
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    padding: $spacing-md;
    border-radius: $radius-md;
    margin-top: $spacing-lg;
    font-size: $font-size-sm;
    font-weight: 500;
    border-left: 4px solid #dc2626;
  }
  
  .success-message {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    padding: $spacing-md;
    border-radius: $radius-md;
    margin-top: $spacing-lg;
    font-size: $font-size-sm;
    font-weight: 500;
    border-left: 4px solid #059669;
  }
  
  .empty-users {
    text-align: center;
    padding: $spacing-xl;
    color: $color-text-secondary;
  }
  
  .users-department-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }
  
  .user-department-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md;
    background: $color-bg-secondary;
    border-radius: $radius-md;
    border: 1px solid $color-border;
    
    .user-info {
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      flex: 1;
      
      strong {
        color: $color-text-primary;
        font-size: $font-size-base;
      }
      
      .user-position {
        color: $color-text-secondary;
        font-size: $font-size-sm;
      }
    }
    
    .department-select {
      width: 150px;
      flex-shrink: 0;
    }
  }
}
</style>

