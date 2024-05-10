import http from '@/api'
export const getServeInfo = () => {
  return http.get('/server/monitor')
}
