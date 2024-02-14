<script>
	import { onMount, onDestroy } from 'svelte'
	import { goto } from '$app/navigation'
	import { showToast } from '$lib/util/alerts'
	import useApi from '$lib/util/api'
	import { storeAccessToken } from '$lib/store/store'
	import { storePath } from '$lib/store/store'

	const { httpPost, endPoints } = useApi()

	let currentPath

	const unsubscribe = storePath.subscribe((value) => {
		currentPath = value
	})

	const routePaths = [
		'/admin/dashBoard',
		'/admin/mbtiTest',
		'/admin/abilityTest',
		'/admin/settings'
	]

	onDestroy(() => {
		unsubscribe()
	})

	onMount(() => {
		if ($storeAccessToken) {
			console.log('auth login success')
		} else {
			console.log('auth login faliled')
			refresh()
		}
	})

	function sweetToast(title, icon) {
		showToast({
			title: title,
			icon: icon
		})
	}

	function getCookie(name) {
		let cookies = document.cookie.split(';')

		for (let i = 0; i < cookies.length; i++) {
			let cookie = cookies[i].trim()

			if (cookie.startsWith(name + '=')) {
				return decodeURIComponent(cookie.substring(name.length + 1))
			}
		}

		return null // 찾는 쿠키가 없을 경우 null 반환
	}

	async function refresh() {
		let refreshToken = getCookie('refreshToken')

		if (!refreshToken) {
			await goto('/')
			sweetToast('갱신 토큰이 없습니다.', 'error')
			return
		}

		const data = {
			refreshToken: refreshToken
		}

		httpPost(
			endPoints.REFRESH_TOKEN,
			'refresh',
			data,
			false,
			(res) => {
				storeAccessToken.set(res.data.accessToken)
			},
			(err) => {
				showToast(err.response.data.error, 'error')
			},
			null,
			() => {}
		)
	}
</script>

<div class="layout">
	<div class="sidebar">
		<div class="sidebar_logo_box">
			<img src="/main-logo-128.png" alt="main-logo" />
			<p>Hardy Dev. Admin App</p>
		</div>
		<div class="sidebar_menu_box">
			<div class="sidebar_list_box_01">
				<div class="icon_box">
					<img
						src="/icon_arrowUp.svg"
						alt="arrowUp"
						class={currentPath === '/admin/dashBoard' ? 'rotation' : 'noRotation'}
					/>
					<a
						href="/admin/dashBoard"
						class={currentPath === '/admin/dashBoard' ? 'highlighted' : 'noHighlight'}>대시보드</a
					>
				</div>
				<div class="icon_box">
					<img
						src="/icon_arrowUp.svg"
						alt="arrowUp"
						class={currentPath === '/admin/mbtiTest' ? 'rotation' : 'noRotation'}
					/>
					<a
						href="/admin/mbtiTest"
						class={currentPath === '/admin/mbtiTest' ? 'highlighted' : 'noHighlight'}>MBTI 테스트</a
					>
				</div>
				<div class="icon_box">
					<img
						src="/icon_arrowUp.svg"
						alt="arrowUp"
						class={currentPath === '/admin/abilityTest' ? 'rotation' : 'noRotation'}
					/>
					<a
						href="/admin/abilityTest"
						class={currentPath === '/admin/abilityTest' ? 'highlighted' : 'noHighlight'}
						>능력고사 테스트</a
					>
				</div>
			</div>
			<div class="sidebar_list_box_02">
				<div class="icon_box">
					<img src="/icon_setting.svg" alt="setting" />
					<a
						href="/admin/settings"
						class={currentPath === '/admin/settings' ? 'highlighted' : 'noHighlight'}>설정</a
					>
				</div>
				<div class="icon_box">
					<img src="/icon_logout.svg" alt="logout" />
					<p>로그아웃</p>
				</div>
			</div>
		</div>
	</div>
	<div class="content">
		<slot />
	</div>
</div>

<style>
	.layout {
		display: flex;
		min-height: 100vh;
	}
	.sidebar {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 250px;
		background-color: var(--main-bg-gray);
		color: var(--main-bg-white);
		padding: 1rem;
		position: fixed;
		height: 100vh;
	}
	.sidebar_logo_box {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.sidebar_logo_box img {
		cursor: pointer;
	}
	.sidebar_logo_box p {
		font-weight: 600;
	}
	.sidebar_menu_box {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100vh;
		overflow-y: scroll;

		/* Firefox */
		scrollbar-width: none;

		/* IE and Edge */
		-ms-overflow-style: none;

		/* Chrome, Safari, Opera */
		&::-webkit-scrollbar {
			display: none;
		}
	}

	.sidebar_list_box_01 {
		display: flex;
		flex-direction: column;
	}
	.sidebar_list_box_02 {
		display: flex;
		flex-direction: column;
	}
	.sidebar a {
		cursor: pointer;
		text-decoration: none;
	}
	.sidebar a:hover {
		color: var(--main-bg-purple);
	}
	.sidebar p {
		cursor: pointer;
	}
	.sidebar p:hover {
		color: var(--main-bg-purple);
	}
	.highlighted {
		color: var(--main-bg-purple);
	}
	.noHighlight {
		color: var(--main-bg-white);
	}
	.sidebar div {
		margin: 1rem 0;
	}
	.icon_box {
		display: flex;
	}
	.icon_box img {
		width: 1rem;
		margin-right: 1rem;
	}
	.rotation {
		transform: rotate(90deg);
		transition: transform 0.2s ease-in-out;
	}
	.noRotation {
		transform: rotate(0deg);
		transition: transform 0.2s ease-in-out;
	}
	.content {
		width: 100%;
		margin-left: 250px;
		padding: 5rem 6rem;
	}
</style>
