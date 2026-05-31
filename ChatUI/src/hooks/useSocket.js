import { useSocketContext } from '@/contexts/index.js'

export const useSocket = () => {
  const context = useSocketContext()
  return context
}
