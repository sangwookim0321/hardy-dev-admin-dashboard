<script>
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import axios from 'axios'
	import { showToast } from '$lib/util/alerts'

	let email = 'pointjumpit@gmail.com'
	let password = '!als970321!'

	async function login() {
		if (!email) {
			sweetToast('이메일을 입력해주세요', 'warning')
			return
		}
		if (!password) {
			sweetToast('비밀번호를 입력해주세요', 'warning')
			return
		}

		try {
			const res = await axios.post(
				'/api/auth',
				{
					email,
					password
				},
				{
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
			console.log(res)
		} catch (error) {
			console.error(error)
		} finally {
			email = ''
			password = ''
		}
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
		<div>
			<input type="email" placeholder="Email" bind:value={email} />
			<input type="password" placeholder="Password" bind:value={password} />
			<button on:click={login}>LOGIN</button>
		</div>
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
		left: 35%;
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
			left: 35%;
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
			left: 40%;
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
</style>
