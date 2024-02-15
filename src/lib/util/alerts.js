import Swal from 'sweetalert2'
// success, error, warning, info, question

export function showAlert({ title, text, icon, isCancel, confirmButtonText }) {
	return Swal.fire({
		title,
		text,
		icon,
		showCancelButton: isCancel,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText
	}).then((result) => {
		if (result.isConfirmed) {
			Swal.fire('Success!', '', 'success')
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
