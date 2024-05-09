<script>
	import { onMount, onDestroy } from 'svelte'
	import { goto } from '$app/navigation'
	import { showToast } from '$lib/util/alerts'
	import { storePath } from '$lib/store/store'
	import useApi from '$lib/util/api'

	const { httpPost, endPoints, statusHandler } = useApi()

	let currentPath
	let refreshInterval
	let username = ''
	let role = ''

	const unsubscribe = storePath.subscribe((value) => {
		currentPath = value
	})

	let menuItems = [
		{
			id: 'abilityTest',
			title: '능력고사 테스트',
			submenu: [
				{ path: '/admin/abilityTest/add', label: '등록' },
				{ path: '/admin/abilityTest/list', label: '목록' },
				{ path: '/admin/abilityTest/result', label: '결과' }
			]
		},
		{
			id: 'subjectiveTest',
			title: '주관식 테스트',
			submenu: [
				{ path: '/admin/subjectiveTest/add', label: '등록' },
				{ path: '/admin/subjectiveTest/list', label: '목록' },
				{ path: '/admin/subjectiveTest/result', label: '결과' }
			]
		},
		{
			id: 'mbtiTest',
			title: '유형 테스트',
			submenu: [
				{ path: '/admin/mbtiTest/add', label: '등록' },
				{ path: '/admin/mbtiTest/list', label: '목록' }
				// { path: '/admin/mbtiTest/list', label: '결과' },
			]
		},
		{
			id: 'portfolio',
			title: '포트폴리오 데이터',
			submenu: [
				{ path: '/admin/portfolio/add', label: '등록' },
				{ path: '/admin/portfolio/list', label: '목록' }
			]
		},
		{
			id: 'autoCrawling',
			title: '오토 크롤링',
			submenu: [
				{ path: '/admin/autoCrawling/collection', label: '수집' },
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

	onMount(async () => {
		username = sessionStorage.getItem('username')
		role = sessionStorage.getItem('role')
		await refresh()

		refreshInterval = setInterval(async () => {
			await refresh()
		}, 3600000)
	})

	onDestroy(() => {
		unsubscribe()
		clearInterval(refreshInterval)
	})

	function sweetToast(title, icon) {
		showToast({
			title: title,
			icon: icon
		})
	}

	async function refresh() {
		let refreshToken = sessionStorage.getItem('refreshToken')
		let accessToken = sessionStorage.getItem('accessToken')

		if (!accessToken) {
			await goto('/')
			sweetToast('인증 토큰이 없습니다.', 'error')
			return
		}
		if (!refreshToken) {
			await goto('/')
			sweetToast('리프레시 토큰이 없습니다.', 'error')
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
				sessionStorage.setItem('accessToken', res.data.accessToken)
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
			() => {}
		)
	}

	async function logout() {
		sessionStorage.removeItem('accessToken')
		sessionStorage.removeItem('refreshToken')
		sweetToast('로그아웃 되었습니다.', 'success')
		await goto('/')
	}
</script>

<div class="layout">
	<div class="sidebar">
		<div class="sidebar_logo_box">
			<img class="sidebar_logo_img" src="/imgs/main-logo-128.png" alt="main-logo" />
			<div class="sidebar_info">
				<p>Hardy Dev. Admin App</p>
				<p>{role} {username}</p>
			</div>
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
				<div class="icon_box" tabindex="0" role="button" on:click={logout}>
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
		margin: 0.5rem 0;
	}
	.sidebar_info p {
		padding: 1rem 0;
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
			padding: 8rem 1rem;
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
		.sidebar_info {
			display: flex;
			flex-direction: column;
			align-items: center;
		}
		.sidebar_info p {
			padding: 2px 0;
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
			max-height: 100dvh;
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
			margin: 7.5rem 0;
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
