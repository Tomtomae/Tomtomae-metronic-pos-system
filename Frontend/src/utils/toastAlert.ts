import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

export const Toast = MySwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast: HTMLElement) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  },
})


type ToastType = 'success' | 'error' | 'warning' | 'info'

export const showToast = (icon: ToastType, title: string) => {
  Toast.fire({
    icon: icon,
    title: title
  })
}