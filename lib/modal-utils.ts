// Centralized modal utility classes and configurations

export const MODAL_SCROLLBAR_CLASSES = "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"

export const MODAL_CONTAINER_CLASSES = `
  max-w-6xl 
  max-h-[90vh] 
  overflow-y-auto 
  ${MODAL_SCROLLBAR_CLASSES}
  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:bg-transparent
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-gray-300
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb:hover]:bg-gray-400
  [&>.scroll-content]:pt-2
  [&>.scroll-content]:pb-2
  [&>.scroll-content]:pr-2
`.replace(/\s+/g, ' ').trim()

export const MODAL_RTL_CLASSES = "dir-rtl text-right"

// Complete modal classes for different sizes
export const getModalClasses = (size: 'sm' | 'md' | 'lg' | 'xl' = 'lg', rtl = true) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl', 
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }
  
  return `
    ${sizeClasses[size]}
    max-h-[90vh]
    overflow-y-auto
    ${MODAL_SCROLLBAR_CLASSES}
    ${rtl ? 'dir-rtl' : ''}
    [&::-webkit-scrollbar]:w-2
    [&::-webkit-scrollbar-track]:bg-transparent
    [&::-webkit-scrollbar-track]:rounded-full
    [&::-webkit-scrollbar-thumb]:bg-gray-300
    [&::-webkit-scrollbar-thumb]:rounded-full
    [&::-webkit-scrollbar-thumb:hover]:bg-gray-400
  `.replace(/\s+/g, ' ').trim()
}

// Modal content wrapper to preserve rounded corners
// Note: This is just a utility - use the classes directly in components
export const modalContentWrapperClass = "scroll-content p-1"
