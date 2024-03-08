<!-- 로그인 페이지 -->
<script>
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { showToast } from '$lib/util/alerts'
	import useApi from '$lib/util/api'

	const { httpPost, endPoints, statusHandler } = useApi()

	let email = 'pointjumpit@gmail.com'
	let password = '!als970321!'
	let emailFocused = false
	let passwordFocused = false

	function handleFocus(type) {
		if (type === 'email') {
			emailFocused = true
		} else if (type === 'password') {
			passwordFocused = true
		}
	}

	function handleBlur(type) {
		if (type === 'email' && email.length === 0) {
			emailFocused = false
		} else if (type === 'password' && password.length === 0) {
			passwordFocused = false
		}
	}

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
				sessionStorage.setItem('accessToken', res.data.accessToken)
				sessionStorage.setItem('refreshToken', res.data.refreshToken)

				await goto('/admin/dashBoard')
				sweetToast('로그인 되었습니다!', 'success')
			},
			(err) => {
				console.error(err)
				statusHandler(
					err.status,
					() => {
						sweetToast(err.message, 'error')
					},
					async () => {
						await goto('/')
						sweetToast(err.message, 'error')
					}
				)
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
			<img class="main_logo_img" src="/imgs/main-logo-128.png" alt="main-logo" />
		</div>
		<span>Hardy Admin DashBoard</span>

		<form on:submit|preventDefault={login}>
			<div>
				<div style="position: relative;">
					<input
						type="email"
						placeholder="Email"
						bind:value={email}
						on:focus={() => handleFocus('email')}
						on:blur={() => handleBlur('email')}
					/>
					{#if !emailFocused && email.length === 0}
						<img class="icon_input" src="/imgs/icon_email.svg" alt="email" />
					{:else}
						<img class="icon_input" src="/imgs/icon_email_focus.svg" alt="email" />
					{/if}
				</div>

				<div style="position: relative;">
					<input
						type="password"
						placeholder="Password"
						bind:value={password}
						on:focus={() => handleFocus('password')}
						on:blur={() => handleBlur('password')}
					/>
					{#if !passwordFocused && password.length === 0}
						<img class="icon_input" src="/imgs/icon_key.svg" alt="password" />
					{:else}
						<img class="icon_input" src="/imgs/icon_key_focus.svg" alt="password" />
					{/if}
				</div>
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
		max-width: 40rem;
		height: 30rem;
		padding: 0 1rem;
		background-color: var(--main-bg-dark);
		border-radius: 1rem;
	}
	.main_box div {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
	.icon_input {
		position: absolute;
		top: 50%;
		left: 1.5rem;
		transform: translateY(-50%);
		width: 2rem;
	}
	span {
		display: block;
		margin: 1rem 0;
		font-size: 1.5rem;
		text-align: center;
		color: var(--main-bg-white);
	}
	input {
		width: 100%;
		padding: 1.2rem 5rem;
		margin: 0.5rem 0;
		border: 1px solid var(--main-bg-lightGray);
		border-radius: 0.5rem;
		background-color: var(--main-bg-white);
		font-size: 1.5rem;
	}
	input:focus {
		border-color: var(--main-bg-purple);
		outline: none;
	}
	button {
		width: 30%;
		padding: 1rem;
		margin: 0.5rem 0;
		border: none;
		border-radius: 0.5rem;
		background-color: var(--main-bg-purple);
		color: var(--main-bg-white);
		font-size: 1.5rem;
		cursor: pointer;
	}
	button:hover {
		background-color: var(--main-bg-darkPurple);
	}

	@media (max-width: 768px) {
		.main_box {
			max-width: 30rem;
			height: 25rem;
		}
		.main_logo_box {
			position: absolute;
			top: -60px;
			left: 50%;
			transform: translateX(-50%);
		}
		.main_logo_img {
			width: 100px;
			height: 100px;
		}
		.icon_input {
			left: 1rem;
		}
		span {
			font-size: 1.5rem;
		}
		input {
			width: 100%;
			font-size: 1.5rem;
			padding-top: 1rem;
			padding-bottom: 1rem;
			padding-left: 4rem;
			padding-right: 0;
		}
		button {
			width: 40%;
			font-size: 1.5rem;
		}
	}
	@media (min-width: 768px) and (max-width: 1024px) {
		.main_box {
			max-width: 25rem;
			height: 25rem;
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
			font-size: 1.5rem;
		}
		input {
			width: 85%;
			font-size: 1.5rem;
		}
		button {
			width: 35%;
			font-size: 1.2rem;
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
