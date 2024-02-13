<script>
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { showToast } from '$lib/util/alerts'
	import useApi from '$lib/util/api'
	import { storeAccessToken } from '$lib/store/store'

	const { httpPost, endPoints } = useApi()

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
				<a href="/admin/dashBoard">대시보드</a>
				<a href="/admin/abilityTest">능력고사 테스트</a>
				<a href="/admin/mbtiTest">MBTI 테스트</a>
			</div>
			<div class="sidebar_list_box_02">
				<a href="/settings">설정</a>
				<p>로그아웃</p>
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
		background-color: rgb(61, 61, 61);
		color: white;
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
		margin: 1rem 0;
		cursor: pointer;
		text-decoration: none;
		color: #fff;
	}
	.sidebar a:hover {
		color: #007bff;
	}
	.sidebar p {
		margin: 1rem 0;
		cursor: pointer;
	}
	.sidebar p:hover {
		color: #007bff;
	}
	.sidebar div {
		margin: 1rem 0;
	}
	.content {
		margin-left: 250px;
		padding: 5rem 6rem;
	}
</style>
