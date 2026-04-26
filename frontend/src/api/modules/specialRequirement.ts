import client from '../client'

export interface RequirementTemplate {
  id: string
  name: string
  templateType: string
  description?: string
  isActive: boolean
  creatorName?: string
  fieldCount?: number
  fields: RequirementTemplateField[]
  createdAt: string
  updatedAt: string
}

export interface RequirementTemplateField {
  id: string
  fieldCode: string
  fieldName: string
  fieldType: 'TEXT' | 'NUMBER' | 'SELECT' | 'DATE' | 'BOOLEAN'
  isHidden: boolean
  isPublic: boolean
  isRequired: boolean
  defaultValue?: string
  sortOrder: number
  options?: RequirementTemplateOption[]
}

export interface RequirementTemplateOption {
  id: string
  optionValue: string
  optionLabel: string
  sortOrder: number
}

export interface SpecialRequirement {
  id: string
  templateId: string
  templateName?: string
  departmentId: string
  departmentName?: string
  year: number
  formData: Record<string, any>
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  filledBy?: string
  filledByName?: string
  linkedBudgetId?: string
  createdAt: string
  updatedAt: string
}

export const specialRequirementApi = {
  // 需求收集表模板
  getTemplates: () => client.get('/requirement-templates/'),
  getTemplate: (id: string) => client.get(`/requirement-templates/${id}/`),
  createTemplate: (data: Partial<RequirementTemplate>) => client.post('/requirement-templates/', data),
  updateTemplate: (id: string, data: Partial<RequirementTemplate>) => client.put(`/requirement-templates/${id}/`, data),
  deleteTemplate: (id: string) => client.delete(`/requirement-templates/${id}/`),
  cloneTemplate: (id: string) => client.post(`/requirement-templates/${id}/clone/`),

  // 字段管理
  addField: (templateId: string, data: Partial<RequirementTemplateField>) =>
    client.post(`/requirement-templates/${templateId}/add_field/`, data),
  updateField: (templateId: string, fieldId: string, data: Partial<RequirementTemplateField>) =>
    client.put(`/requirement-templates/${templateId}/update_field/`, { field_id: fieldId, ...data }),
  deleteField: (templateId: string, fieldId: string) =>
    client.post(`/requirement-templates/${templateId}/delete_field/`, { field_id: fieldId }),

  // 专题需求实例
  getRequirements: (params?: Record<string, any>) => client.get('/special-requirements/', { params }),
  getRequirement: (id: string) => client.get(`/special-requirements/${id}/`),
  createRequirement: (data: Partial<SpecialRequirement>) => client.post('/special-requirements/', data),
  updateRequirement: (id: string, data: Partial<SpecialRequirement>) => client.put(`/special-requirements/${id}/`, data),
  deleteRequirement: (id: string) => client.delete(`/special-requirements/${id}/`),
  submitRequirement: (id: string) => client.post(`/special-requirements/${id}/submit/`),
  approveRequirement: (id: string, action: 'APPROVE' | 'REJECT', comment?: string) =>
    client.post(`/special-requirements/${id}/approve/`, { action, comment }),
  myRequirements: () => client.get('/special-requirements/my_requirements/'),
}
