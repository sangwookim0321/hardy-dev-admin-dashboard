import axios from 'axios'
import { storeAccessToken } from '../store/store'
import { get } from 'svelte/store'

const useApi = () => {
	let pending_get = {}
	let pending_post = {}
	let pending_put = {}
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
		const token = get(storeAccessToken)
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
		const token = get(storeAccessToken)
		return {
			headers: {
				'Content-Type': 'multipart/form-data',
				Authorization: token ? `Bearer ${token}` : undefined
			},
			timeout: 60000
		}
	}

	const endPoints = {
		// DOMAIN: import.meta.env.VITE_APP_DOMAIN,
		AUTH_LOGIN: '/api/auth/login',
		REFRESH_TOKEN: '/api/auth/refresh',
		ABILITY_TEST_ADD: '/api/abilityTest/add'
	}

	const httpGet = async (callUrl, caller, useToken, success, fail, redirection) => {
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
			fail(err)
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

	const httpDelete = async (callUrl, caller, useToken, success, fail, redirection) => {
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
			const response = await axios.delete(callUrl, _reqOption)
			success(response)
		} catch (err) {
			fail(err)
		} finally {
			pending_delete[reqKey] = false
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

	return { httpGet, httpPost, httpPostFormData, httpPut, httpDelete, endPoints }
}

export default useApi
