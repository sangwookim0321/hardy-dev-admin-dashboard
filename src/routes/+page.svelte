<!-- 로그인 페이지 -->
<script>
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { showToast } from '$lib/util/alerts'
	import { storeAccessToken } from '$lib/store/store'
	import useApi from '$lib/util/api'

	const { httpPost, endPoints } = useApi()

	let email = 'pointjumpit@gmail.com'
	let password = '!als970321!'

	function login() {
		if (!email) {
			sweetToast('이메일을 입력해주세요', 'warning')
			return
		}
		if (!password) {
			sweetToast('비밀번호를 입력해주세요', 'warning')
			return
		}

		const data = {
			email: email,
			password: password
		}

		httpPost(
			endPoints.AUTH_LOGIN,
			'login',
			data,
			false,
			async (res) => {
				document.cookie = `refreshToken=${res.data.refreshToken}; path=/; max-age=86400;`
				storeAccessToken.set(res.data.accessToken)
				console.log($storeAccessToken)

				await goto('/dashboard')
				sweetToast('로그인 되었습니다!', 'success')
				console.log(res)
			},
			(err) => {
				sweetToast(err.response.data.error, 'error')
			},
			null,
			() => {
				email = ''
				password = ''
			}
		)
	}

	function sweetToast(title, icon) {
		showToast({
			title: title,
			icon: icon
		})
	}

	onMount(() => {
		if (!browser) {
			console.log('This is a browser environment')
			return
		}
	})
</script>

<main class="main">
	<div class="main_box">
		<div class="main_logo_box">
			<img class="main_logo_img" src="/main-logo-128.png" alt="main-logo" />
		</div>
		<span>Hardy Admin DashBoard</span>
		<!-- form 태그 추가 -->
		<form on:submit|preventDefault={login}>
			<div>
				<input type="email" placeholder="Email" bind:value={email} />
				<input type="password" placeholder="Password" bind:value={password} />
				<button type="submit">LOGIN</button>
			</div>
		</form>
	</div>
</main>

<style>
	.main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100vh;
		background-color: var(--main-bg-gray);
	}
	.main_logo_box {
		position: absolute;
		top: -70px;
		left: 50%;
		transform: translateX(-50%);
	}
	.main_logo_img {
		animation: spin 5s linear infinite;
	}
	.main_box {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		width: 100%;
		max-width: 25rem;
		height: 20rem;
		padding: 0 1rem;
		background-color: var(--main-bg-dark);
		border-radius: 1rem;
	}
	span {
		display: block;
		margin: 1rem 0;
		font-size: 1.3rem;
		text-align: center;
		color: #fff;
	}
	.main_box div {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
	input {
		width: 80%;
		padding: 0.5rem;
		margin: 0.5rem 0;
		border: 1px solid #ccc;
		border-radius: 0.5rem;
		background-color: #fff;
		font-size: 1rem;
	}
	input:focus {
		border-color: #816bff;
		outline: none;
	}
	button {
		width: 30%;
		padding: 0.5rem;
		margin: 0.5rem 0;
		border: none;
		border-radius: 0.5rem;
		background-color: #816bff;
		color: #fff;
		font-size: 0.8rem;
		cursor: pointer;
	}
	button:hover {
		background-color: #6a5acd;
	}

	@media (max-width: 768px) {
		.main_box {
			max-width: 15rem;
		}
		.main_logo_box {
			position: absolute;
			top: -50px;
			left: 50%;
			transform: translateX(-50%);
		}
		.main_logo_img {
			width: 100px;
			height: 100px;
		}
		span {
			font-size: 1rem;
		}
		input {
			width: 90%;
			font-size: 0.8rem;
		}
		button {
			width: 40%;
			font-size: 0.7rem;
		}
	}
	@media (min-width: 768px) and (max-width: 1024px) {
		.main_box {
			max-width: 20rem;
		}
		.main_logo_box {
			top: -60px;
			left: 50%;
			transform: translateX(-50%);
		}
		.main_logo_img {
			width: 120px;
			height: 120px;
		}
		span {
			font-size: 1.2rem;
		}
		input {
			width: 85%;
			font-size: 0.9rem;
		}
		button {
			width: 35%;
			font-size: 0.75rem;
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
