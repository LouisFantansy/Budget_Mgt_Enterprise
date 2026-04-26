import client from '../client'

export interface TemplateFieldOption {
  id?: string
  optionValue: string
  optionLabel: string
  sortOrder?: number
}

export interface TemplateField {
  id?: string
  fieldCode: string
  fieldName: string
  fieldType: 'TEXT' | 'NUMBER' | 'SELECT' | 'DATE' | 'BOOLEAN'
  isRequired: boolean
  isFormula: boolean
  formula?: string
  defaultValue?: string
  sortOrder: number
  options?: TemplateFieldOption[]
}

export interface BudgetTemplate {
  id: string
  name: string
  templateType: string
  description?: string
  isActive: boolean
  creatorName?: string
  fieldCount?: number
  fields: TemplateField[]
  createdAt: string
  updatedAt: string
}

export interface BudgetTask {
  id: string
  name: string
  year: number
  budgetType: 'OPEX' | 'CAPEX'
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  deadline?: string
  description?: string
  createdAt: string
}

export const budgetTemplateApi = {
  // 模板管理
  getTemplates: () => client.get('/templates/'),
  getTemplate: (id: string) => client.get(`/templates/${id}/`),
  createTemplate: (data: Partial<BudgetTemplate>) => client.post('/templates/', data),
  updateTemplate: (id: string, data: Partial<BudgetTemplate>) => client.put(`/templates/${id}/`, data),
  deleteTemplate: (id: string) => client.delete(`/templates/${id}/`),
  cloneTemplate: (id: string) => client.post(`/templates/${id}/clone/`),

  // 字段管理
  addField: (templateId: string, data: Partial<TemplateField>) =>
    client.post(`/templates/${templateId}/add_field/`, data),
  updateField: (templateId: string, fieldId: string, data: Partial<TemplateField>) =>
    client.put(`/templates/${templateId}/update_field/`, { field_id: fieldId, ...data }),
  deleteField: (templateId: string, fieldId: string) =>
    client.post(`/templates/${templateId}/delete_field/`, { field_id: fieldId }),

  // 任务管理
  getTasks: (params?: Record<string, any>) => client.get('/tasks/', { params }),
  createTask: (data: Partial<BudgetTask>) => client.post('/tasks/', data),
  updateTask: (id: string, data: Partial<BudgetTask>) => client.put(`/tasks/${id}/`, data),
  deleteTask: (id: string) => client.delete(`/tasks/${id}/`),
  triggerTask: (templateId: string, data: { department_ids: string[] }) => client.post(`/templates/${templateId}/trigger_task/`, data),
}
