<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 个人设置 -->
      <el-tab-pane label="个人设置" name="profile">
        <div class="tab-content">
          <!-- 头像区域 -->
          <div class="avatar-section">
            <div class="avatar-wrapper">
              <el-avatar
                :size="100"
                :src="authStore.user?.avatar || defaultAvatar"
                class="user-avatar"
              />
              <el-upload
                class="avatar-uploader"
                action="/api/auth/avatar"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :on-error="handleAvatarError"
                :before-upload="beforeAvatarUpload"
                accept="image/*"
              >
                <div class="avatar-overlay">
                  <el-icon :size="24"><Camera /></el-icon>
                  <span>更换头像</span>
                </div>
              </el-upload>
            </div>
            <div class="avatar-info">
              <h4 class="user-name">{{ authStore.user?.realName || authStore.user?.username || '用户' }}</h4>
              <p class="user-role">{{ authStore.user?.roles?.[0]?.name || '普通用户' }}</p>
            </div>
          </div>

          <el-divider />

          <h3 class="section-title">基本信息</h3>
          <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-width="100px" style="max-width: 600px">
            <el-form-item label="用户名">
              <el-input :model-value="authStore.user?.username" disabled />
            </el-form-item>
            <el-form-item label="姓名" prop="realName">
              <el-input v-model="profileForm.realName" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="手机" prop="phone">
              <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="profileLoading" @click="handleUpdateProfile">保存修改</el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <h3 class="section-title">修改密码</h3>
          <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px" style="max-width: 600px">
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
              <div class="password-strength" v-if="passwordForm.newPassword">
                <div class="strength-bar">
                  <div class="strength-fill" :style="{ width: passwordStrength.percent + '%' }" :class="passwordStrength.level"></div>
                </div>
                <span class="strength-text" :class="passwordStrength.level">{{ passwordStrength.text }}</span>
              </div>
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="passwordLoading" @click="handleChangePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 系统参数 -->
      <el-tab-pane label="系统参数" name="system">
        <div class="tab-content">
          <el-empty description="系统参数配置开发中..." />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import * as authApi from '@/api/modules/auth'
import { put } from '@/api/client'
import { Camera } from '@element-plus/icons-vue'

const authStore = useAuthStore()

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 上传请求头
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`
}))

// 头像上传成功
const handleAvatarSuccess: UploadProps['onSuccess'] = (response) => {
  if (response.code === 200) {
    ElMessage.success('头像上传成功')
    // 刷新用户信息
    authStore.fetchUserInfo()
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 头像上传失败
const handleAvatarError: UploadProps['onError'] = () => {
  ElMessage.error('头像上传失败，请重试')
}

// 上传前检查
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isImage = rawFile.type.startsWith('image/')
  const isLt2M = rawFile.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('请上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

// ===================== 状态 =====================
const activeTab = ref('profile')

// 个人信息表单
const profileFormRef = ref<FormInstance>()
const profileLoading = ref(false)
const profileForm = reactive({
  realName: '',
  email: '',
  phone: '',
})

const profileRules: FormRules = {
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
}

// 修改密码表单
const passwordFormRef = ref<FormInstance>()
const passwordLoading = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少8位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// 密码强度
const passwordStrength = computed(() => {
  const pwd = passwordForm.newPassword
  if (!pwd) return { percent: 0, level: '', text: '' }

  let score = 0
  if (pwd.length >= 8) score += 25
  if (pwd.length >= 12) score += 15
  if (/[a-z]/.test(pwd)) score += 15
  if (/[A-Z]/.test(pwd)) score += 15
  if (/[0-9]/.test(pwd)) score += 15
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 15

  if (score <= 30) return { percent: 33, level: 'weak', text: '弱' }
  if (score <= 60) return { percent: 66, level: 'medium', text: '中' }
  return { percent: 100, level: 'strong', text: '强' }
})

// ===================== 方法 =====================

// 初始化表单
function initProfileForm() {
  if (authStore.user) {
    profileForm.realName = authStore.user.realName || ''
    profileForm.email = authStore.user.email || ''
    profileForm.phone = authStore.user.phone || ''
  }
}

// 更新个人信息
async function handleUpdateProfile() {
  const valid = await profileFormRef.value?.validate().catch(() => false)
  if (!valid) return

  profileLoading.value = true
  try {
    await put('/auth/profile', {
      realName: profileForm.realName,
      email: profileForm.email,
      phone: profileForm.phone,
    })
    // 刷新用户信息
    await authStore.fetchUserInfo()
    ElMessage.success('个人信息更新成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '更新失败')
  } finally {
    profileLoading.value = false
  }
}

// 修改密码
async function handleChangePassword() {
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid) return

  passwordLoading.value = true
  try {
    await authApi.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    ElMessage.success('密码修改成功，请重新登录')
    // 清空表单
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    // 退出登录
    await authStore.logout()
  } catch (error: any) {
    ElMessage.error(error?.message || '密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

// ===================== 生命周期 =====================
onMounted(() => {
  initProfileForm()
})
</script>

<style scoped lang="scss">
// 苹果商务风格配色
$apple-blue: #007AFF;
$apple-bg: #F5F5F7;
$apple-card-bg: #FFFFFF;
$apple-text: #1D1D1F;
$apple-text-secondary: #6E6E73;

.page-container {
  padding: 24px;
  background: $apple-bg;
  min-height: 100%;
}

:deep(.el-tabs--border-card) {
  border-radius: 16px;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  background: $apple-card-bg;

  > .el-tabs__header {
    border-radius: 16px 16px 0 0;
    background: transparent;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);

    .el-tabs__item {
      font-weight: 500;
      color: $apple-text-secondary;

      &.is-active {
        color: $apple-blue;
      }
    }
  }

  > .el-tabs__content {
    padding: 0;
  }
}

.tab-content {
  padding: 32px;
}

// 头像区域
.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;

  .user-avatar {
    width: 100%;
    height: 100%;
    border: 3px solid rgba($apple-blue, 0.1);
  }
}

.avatar-uploader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;

  :deep(.el-upload) {
    width: 100%;
    height: 100%;
  }
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;

  .el-icon {
    margin-bottom: 4px;
  }
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-info {
  .user-name {
    font-size: 20px;
    font-weight: 600;
    color: $apple-text;
    margin: 0 0 4px 0;
    letter-spacing: -0.01em;
  }

  .user-role {
    font-size: 14px;
    color: $apple-text-secondary;
    margin: 0;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px 0;
  padding-left: 12px;
  border-left: 3px solid $apple-blue;
  color: $apple-text;
}

.password-strength {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;

  .strength-bar {
    width: 120px;
    height: 6px;
    background: #e9ecef;
    border-radius: 3px;
    overflow: hidden;

    .strength-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s, background-color 0.3s;

      &.weak {
        background-color: #f56c6c;
      }
      &.medium {
        background-color: #e6a23c;
      }
      &.strong {
        background-color: #67c23a;
      }
    }
  }

  .strength-text {
    font-size: 12px;

    &.weak {
      color: #f56c6c;
    }
    &.medium {
      color: #e6a23c;
    }
    &.strong {
      color: #67c23a;
    }
  }
}
</style>
