import Swal from 'sweetalert2'
// success, error, warning, info, question

export function showAlert({
	title,
	text,
	icon,
	isCancel,
	confirmButtonText,
	cancelButtonText,
	callback
}) {
	return Swal.fire({
		title,
		text,
		icon,
		showCancelButton: isCancel,
		confirmButtonColor: '#816bff',
		cancelButtonColor: '#6c757d',
		confirmButtonText,
		cancelButtonText
	}).then((result) => {
		if (result.isConfirmed) {
			callback()
		}
	})
}

const Toast = Swal.mixin({
	toast: true,
	position: 'top-end',
	showConfirmButton: false,
	timer: 3000,
	timerProgressBar: true,
	didOpen: (toast) => {
		toast.onmouseenter = Swal.stopTimer
		toast.onmouseleave = Swal.resumeTimer
	}
})

export function showToast({ title, icon }) {
	const isMobile = window.innerWidth < 768

	return Toast.fire({
		title,
		icon,
		position: isMobile ? 'bottom' : 'top-end'
	})
}
