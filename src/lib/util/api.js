import axios from 'axios'

const useApi = () => {
	let pending_get = {}
	let pending_post = {}
	let pending_put = {}
	let pending_patch = {}
	let pending_delete = {}

	const reqOption = () => {
		return {
			headers: {
				'Content-Type': 'application/json'
			},
			timeout: 60000
		}
	}
	const reqOptionWithToken = () => {
		const token = sessionStorage.getItem('accessToken')
		return {
			headers: {
				'Content-Type': 'application/json',
				Authorization: token ? `Bearer ${token}` : undefined
			},
			timeout: 60000
		}
	}

	const reqOptionFormData = () => {
		return {
			headers: {
				'Content-Type': 'multipart/form-data'
			},
			timeout: 60000
		}
	}
	const reqOptionWithTokenFormData = () => {
		const token = sessionStorage.getItem('accessToken')
		return {
			headers: {
				'Content-Type': 'multipart/form-data',
				Authorization: token ? `Bearer ${token}` : undefined
			},
			timeout: 60000
		}
	}

	const statusHandler = (status, noRedirection, isRedirection) => {
		if (status === 400) {
			// 400 코드는 잘못된 요청이므로 에러 메시지만 표시
			noRedirection()
		} else {
			// 401, 403 코드는 토큰 만료 또는 권한 없음이므로 로그인 페이지로 이동
			isRedirection()
		}
	}

	const endPoints = {
		// DOMAIN: import.meta.env.VITE_APP_DOMAIN,
		AUTH_LOGIN: '/api/auth/login', // 로그인
		REFRESH_TOKEN: '/api/auth/refresh', // 토큰 갱신
		ABILITY_TEST: '/api/abilityTest', // 능력고사 테스트(GET,POST,PUT,PATCH,DELETE)
		MBTI_TEST: '/api/mbtiTest' // MBTI 테스트(GET,POST,PUT,PATCH,DELETE)
	}

	const httpGet = async (
		callUrl,
		caller,
		useToken,
		success,
		fail,
		redirection,
		finallyCallback
	) => {
		const reqKey = callUrl + caller
		if (pending_get[reqKey]) {
			console.log('duplication api get fail : ' + reqKey)
			return
		}

		pending_get[reqKey] = true

		let _reqOption = reqOption()

		if (useToken) {
			_reqOption = reqOptionWithToken()
			if (!_reqOption.headers.Authorization) {
				redirection()
			}
		}

		try {
			const response = await axios.get(callUrl, _reqOption)

			success(response)
		} catch (err) {
			fail(err)
		} finally {
			pending_get[reqKey] = false
			finallyCallback()
		}
	}

	const httpPost = async (
		callUrl,
		caller,
		postData,
		useToken,
		success,
		fail,
		redirection,
		finallyCallback
	) => {
		const reqKey = callUrl + caller
		if (pending_post[reqKey]) {
			console.log('duplication api post fail : ' + reqKey)
			return
		}

		pending_post[reqKey] = true

		let _reqOption = reqOption()

		if (useToken) {
			_reqOption = reqOptionWithToken()
			if (!_reqOption.headers.Authorization) {
				redirection()
			}
		}

		try {
			const response = await axios.post(callUrl, postData, _reqOption)
			success(response)
		} catch (err) {
			fail(err.response.data)
		} finally {
			pending_post[reqKey] = false
			finallyCallback() // 최종 작업 완료 후 콜백
		}
	}

	const httpPut = async (callUrl, caller, postData, useToken, success, fail, redirection) => {
		const reqKey = callUrl + caller
		if (pending_put[reqKey]) {
			console.log('duplication api put fail : ' + reqKey)
			return
		}

		pending_put[reqKey] = true

		let _reqOption = reqOption()

		if (useToken) {
			_reqOption = reqOptionWithToken()
			if (!_reqOption.headers.Authorization) {
				redirection()
			}
		}

		try {
			const response = await axios.put(callUrl, postData, _reqOption)
			success(response)
		} catch (err) {
			fail(err)
		} finally {
			pending_put[reqKey] = false
		}
	}

	const httpPatch = async (callUrl, caller, postData, useToken, success, fail, redirection) => {
		const reqKey = callUrl + caller
		if (pending_patch[reqKey]) {
			console.log('duplication api patch fail : ' + reqKey)
			return
		}

		pending_patch[reqKey] = true

		let _reqOption = reqOption()

		if (useToken) {
			_reqOption = reqOptionWithToken()
			if (!_reqOption.headers.Authorization) {
				redirection()
			}
		}

		try {
			const response = await axios.patch(callUrl, postData, _reqOption)
			success(response)
		} catch (err) {
			fail(err)
		} finally {
			pending_patch[reqKey] = false
		}
	}

	const httpDelete = async (
		callUrl,
		caller,
		postData,
		useToken,
		success,
		fail,
		redirection,
		finallyCallback
	) => {
		const reqKey = callUrl + caller
		if (pending_delete[reqKey]) {
			console.log('duplication api delete fail : ' + reqKey)
			return
		}

		pending_delete[reqKey] = true

		let _reqOption = reqOption()

		if (useToken) {
			_reqOption = reqOptionWithToken()
			if (!_reqOption.headers.Authorization) {
				redirection()
			}
		}

		try {
			const response = await axios.delete(callUrl, { ..._reqOption, data: postData })
			success(response)
		} catch (err) {
			fail(err)
		} finally {
			pending_delete[reqKey] = false
			finallyCallback()
		}
	}

	const httpPostFormData = async (
		callUrl,
		caller,
		postData,
		useToken,
		success,
		fail,
		redirection,
		finallyCallback
	) => {
		const reqKey = callUrl + caller
		if (pending_post[reqKey]) {
			console.log('duplication api post fail : ' + reqKey)
			return
		}

		pending_post[reqKey] = true

		let _reqOption = reqOptionFormData()

		if (useToken) {
			_reqOption = reqOptionWithTokenFormData()
			if (!_reqOption.headers.Authorization) {
				redirection()
			}
		}

		try {
			const response = await axios.post(callUrl, postData, _reqOption)
			success(response)
		} catch (err) {
			fail(err)
		} finally {
			pending_post[reqKey] = false
			finallyCallback() // 최종 작업 완료 후 콜백
		}
	}

	const httpPutFormData = async (
		callUrl,
		caller,
		postData,
		useToken,
		success,
		fail,
		redirection,
		finallyCallback
	) => {
		const reqKey = callUrl + caller
		if (pending_post[reqKey]) {
			console.log('duplication api put fail : ' + reqKey)
			return
		}

		pending_post[reqKey] = true

		let _reqOption = reqOptionFormData()

		if (useToken) {
			_reqOption = reqOptionWithTokenFormData()
			if (!_reqOption.headers.Authorization) {
				redirection()
			}
		}

		try {
			const response = await axios.put(callUrl, postData, _reqOption)
			success(response)
		} catch (err) {
			fail(err)
		} finally {
			pending_post[reqKey] = false
			finallyCallback() // 최종 작업 완료 후 콜백
		}
	}

	return {
		httpGet,
		httpPost,
		httpPut,
		httpPatch,
		httpDelete,
		httpPostFormData,
		httpPutFormData,
		endPoints,
		statusHandler
	}
}

export default useApi
