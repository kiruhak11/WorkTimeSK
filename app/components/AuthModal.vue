<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="auth-modal" @click.self="close">
        <div class="auth-modal-content">
          <div class="auth-header">
            <h2>Авторизация</h2>
            <button class="close-btn" @click="close" aria-label="Закрыть">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="handleSubmit" class="auth-form">
            <div class="form-group">
              <label for="password">Пароль</label>
              <input
                id="password"
                v-model="password"
                type="password"
                class="input"
                placeholder="Введите пароль"
                required
                :autofocus="!showDepartmentSelect"
                @keyup.enter="handleSubmit"
              />
            </div>
            
            <div v-if="passwordValidated && showDepartmentSelect" class="form-group">
              <label for="department">Выберите отдел</label>
              <select
                id="department"
                v-model="selectedDepartment"
                class="input"
                required
                @keyup.enter="handleSubmit"
              >
                <option value="">-- Выберите отдел --</option>
                <option value="кухня">Кухня</option>
                <option value="штат">Штат</option>
              </select>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="rememberMe"
                  class="checkbox"
                />
                <span>Запомнить меня</span>
              </label>
            </div>
            
            <div v-if="error" class="error-message">
              {{ error }}
            </div>
            
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading">Проверка...</span>
              <span v-else-if="passwordValidated && showDepartmentSelect">Продолжить</span>
              <span v-else>Войти</span>
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const PASSWORD = 'Kitchen777' // Пароль для авторизации

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  success: [department: string]
}>()

const password = ref('')
const selectedDepartment = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const error = ref('')
const passwordValidated = ref(false)
const showDepartmentSelect = ref(false)

function handleSubmit() {
  if (!passwordValidated.value) {
    // Первый шаг - проверка пароля
    if (!password.value) {
      error.value = 'Введите пароль'
      return
    }
    
    loading.value = true
    error.value = ''
    
    setTimeout(() => {
      if (password.value === PASSWORD) {
        passwordValidated.value = true
        showDepartmentSelect.value = true
        loading.value = false
        error.value = ''
      } else {
        error.value = 'Неверный пароль'
        loading.value = false
      }
    }, 300)
    return
  }
  
  // Второй шаг - выбор отдела
  if (!selectedDepartment.value) {
    error.value = 'Выберите отдел'
    return
  }
  
  loading.value = true
  error.value = ''
  
  setTimeout(() => {
    // Сохраняем авторизацию
    const authData = {
      authenticated: true,
      department: selectedDepartment.value,
      timestamp: Date.now()
    }
    
    if (rememberMe.value) {
      // Сохраняем в localStorage на 30 дней
      localStorage.setItem('auth', JSON.stringify(authData))
      localStorage.setItem('authExpiry', String(Date.now() + 30 * 24 * 60 * 60 * 1000))
    } else {
      // Сохраняем в sessionStorage (только на сессию)
      sessionStorage.setItem('auth', JSON.stringify(authData))
    }
    
    emit('success', selectedDepartment.value)
    close()
  }, 300)
}

function close() {
  password.value = ''
  selectedDepartment.value = ''
  error.value = ''
  rememberMe.value = false
  passwordValidated.value = false
  showDepartmentSelect.value = false
  emit('close')
}
</script>

<style scoped lang="scss">
.auth-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
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

.auth-modal-content {
  background: $color-bg-primary;
  border-radius: $radius-xl;
  padding: $spacing-2xl;
  min-width: 400px;
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
  
  @media (max-width: 480px) {
    min-width: auto;
    width: 100%;
    padding: $spacing-lg;
  }
}

.auth-header {
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

.auth-form {
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
      
      &::placeholder {
        color: $color-text-secondary;
      }
    }
  }
  
  .checkbox-group {
    margin-bottom: $spacing-lg;
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
    
    span {
      margin-left: $spacing-xs;
    }
  }
  
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    padding: $spacing-md;
    border-radius: $radius-md;
    margin-bottom: $spacing-lg;
    font-size: $font-size-sm;
    font-weight: 500;
    border-left: 4px solid #dc2626;
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
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
}
</style>

