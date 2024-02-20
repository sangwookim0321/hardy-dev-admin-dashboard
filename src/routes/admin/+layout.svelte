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

	let menuItems = [
		{
			id: 'abilityTest',
			title: '능력고사 테스트',
			submenu: [
				{ path: '/admin/abilityTest/add', label: '추가' },
				{ path: '/admin/abilityTest/modify', label: '수정' },
				{ path: '/admin/abilityTest/list', label: '목록' }
			]
		},
		{
			id: 'mbtiTest',
			title: 'MBTI 테스트',
			submenu: [
				{ path: '/admin/mbtiTest/add', label: '추가' },
				{ path: '/admin/mbtiTest/modify', label: '수정' },
				{ path: '/admin/mbtiTest/list', label: '목록' }
			]
		}
	]

	let submenuVisibility = {}

	menuItems.forEach((item) => {
		submenuVisibility[item.id] = false
	})

	function toggleSubmenu(id) {
		submenuVisibility[id] = !submenuVisibility[id]
	}

	let isSidebarOpen = false

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen
	}

	function closeSidebar() {
		isSidebarOpen = false
	}

	onDestroy(() => {
		unsubscribe()
	})

	onMount(async () => {
		if ($storeAccessToken) {
			console.log('auth login success')
		} else {
			console.log('auth login faliled')
			await refresh()
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

		await httpPost(
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
			<img class="sidebar_logo_img" src="/imgs/main-logo-128.png" alt="main-logo" />
			<p>Hardy Dev. Admin App</p>
			<button style="background-color: transparent; border: none;" on:click={toggleSidebar}>
				<img src="/imgs/icon_s_menu.svg" alt="menu" class="mobile-menu" />
			</button>
		</div>
		<div class="sidebar_menu_box {isSidebarOpen ? 'active' : ''}">
			<div class="sidebar_list_box_01">
				{#each menuItems as item}
					<div
						class="icon_box"
						role="button"
						tabindex="0"
						on:click={() => toggleSubmenu(item.id)}
						on:keydown={(event) =>
							event.key === 'Enter' || event.key === ' ' ? toggleSubmenu(item.id) : null}
					>
						<img
							src="/imgs/icon_arrowUp.svg"
							alt="arrowUp"
							class={submenuVisibility[item.id] ? 'rotation' : 'noRotation'}
						/>
						<div
							style="cursor: pointer;"
							class="sidebar_list_box_01_title {submenuVisibility[item.id]
								? 'highlightedWhite'
								: 'noHighlight'}"
						>
							{item.title}
						</div>
					</div>
					<div class="sub_menu {submenuVisibility[item.id] ? 'sub_menu_open' : ''}">
						{#each item.submenu as submenuItem}
							<a
								on:click={closeSidebar}
								href={submenuItem.path}
								class={currentPath === submenuItem.path ? 'highlightedPurple' : 'noHighlight'}
							>
								{submenuItem.label}
							</a>
						{/each}
					</div>
				{/each}
				<!-- ------------------------------------------------------------------------------------------------ -->
			</div>
			<div class="sidebar_list_box_02">
				<div class="icon_box">
					<img src="/imgs/icon_dashBoard.svg" alt="dashBoard" />
					<a
						on:click={closeSidebar}
						href="/admin/dashBoard"
						class={currentPath === '/admin/dashBoard' ? 'highlightedPurple' : 'noHighlight'}
						>대시보드</a
					>
				</div>
				<div class="icon_box">
					<img src="/imgs/icon_setting.svg" alt="setting" />
					<a
						on:click={closeSidebar}
						href="/admin/settings"
						class={currentPath === '/admin/settings' ? 'highlightedPurple' : 'noHighlight'}>설정</a
					>
				</div>
				<div class="icon_box" tabindex="0" role="button" on:click={closeSidebar}>
					<img src="/imgs/icon_logout.svg" alt="logout" />
					<p>로그아웃</p>
				</div>
			</div>
		</div>
	</div>
	<div class="content" on:click={closeSidebar} role="button" tabindex="0">
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
		font-size: 1.5rem;
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
		margin: 3rem 0;
	}
	.sidebar_list_box_01_title {
		font-size: 1.8rem;
	}
	.sidebar_list_box_02 {
		position: fixed;
		display: flex;
		flex-direction: column;
		margin: 2rem 0;
		bottom: 0;
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
	.highlightedPurple {
		color: var(--main-bg-purple);
	}
	.highlightedWhite {
		color: var(--main-bg-white);
	}
	.noHighlight {
		color: var(--main-bg-lightGray);
	}
	.sidebar_list_box_02 div {
		margin: 1rem 0;
	}
	.icon_box {
		display: flex;
		transition: transform 0.2s ease-in-out;
	}
	.icon_box img {
		width: 1.5rem;
		margin-right: 1rem;
	}
	.icon_box a {
		font-size: 1.5rem;
	}
	.icon_box p {
		font-size: 1.5rem;
		color: var(--main-bg-lightGray);
	}
	.rotation {
		transform: rotate(0deg);
		transition: transform 0.2s ease-in-out;
	}
	.noRotation {
		transform: rotate(180deg);
		transition: transform 0.2s ease-in-out;
	}
	.sub_menu {
		overflow: hidden;
		max-height: 0;
		transform-origin: top;
		transform: scaleY(0);
		transition:
			max-height 0.2s ease-out,
			transform 0.2s ease-out;
		padding: 1rem 0;
	}

	.sub_menu_open {
		max-height: 500px;
		transform: scaleY(1);
	}
	.sub_menu a {
		display: block;
		margin-left: 2.5rem;
		font-size: 1.5rem;
		padding: 0.5rem 0;
	}
	.mobile-menu {
		display: none;
	}
	.content {
		width: 100%;
		margin-left: 250px;
		padding: 5rem 6rem;
	}
	/* 모바일 사이즈 미디어 쿼리 */
	@media (max-width: 768px) {
		.content {
			width: 100%;
			margin-left: 0px;
			padding: 6rem 1rem;
		}
		.sidebar {
			flex-direction: column;
			width: 100%;
			height: auto;
			padding: 1rem 0;
			z-index: 9999;
		}
		.sidebar_logo_box {
			flex-direction: row;
			justify-content: space-between;
			width: 100%;
		}
		.sidebar_logo_box p {
			font-size: 1.2rem;
		}
		.sidebar_logo_img {
			width: 3.5rem;
			margin: 0rem 1rem;
		}
		.mobile-menu {
			display: block;
			width: 2rem;
			margin: 0rem 1rem;
		}
		.sidebar_menu_box {
			display: flex;
			align-items: center;
			width: 100%;
			background-color: var(--main-bg-gray);
			height: 100vh;
			overflow: hidden;
			max-height: 0;
			transform-origin: top;
			transform: scaleY(0);
			transition:
				max-height 0.2s ease,
				transform 0.2s ease;
		}
		.sidebar_menu_box.active {
			max-height: 100vh;
			transform: scaleY(1);
		}
		.sidebar_list_box_01 img {
			width: 1.5rem;
		}
		.sidebar_list_box_01_title {
			font-size: 1.5rem;
		}
		.sidebar_list_box_02 {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			width: 90%;
			margin: 5.5rem 0;
		}
		.sidebar_list_box_02 img {
			width: 1.5rem;
		}
		.sidebar_list_box_02 a {
			font-size: 1.5rem;
		}
		.sidebar_list_box_02 p {
			font-size: 1.5rem;
		}
		.sub_menu a {
			margin-left: 2.5rem;
			font-size: 1.6rem;
		}
	}
</style>
