export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  is_active: boolean
  roles: string[]
  permissions: string[]
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}
