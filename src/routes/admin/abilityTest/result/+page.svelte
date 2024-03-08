<!-- 능력고사 테스트 결과 페이지 -->
<script>
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'
	import { page } from '$app/stores.js'
	import { goto } from '$app/navigation'
	import { storePath, storeLoadingState } from '$lib/store/store'
	import { formatDate, formatComma } from '$lib/util/filter'
	import { showToast } from '$lib/util/alerts'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import useApi from '$lib/util/api'

	const { httpGet, endPoints, statusHandler } = useApi()

	let currentPath

	let items = []
	let isMobile = false

	if (browser) {
		onMount(() => {
			checkWindowSize()
			window.addEventListener('resize', checkWindowSize)
			currentPath = $page.url.pathname
			storePath.set(currentPath)
			storeLoadingState.set(true)
			getItem()
		})

		onDestroy(() => {
			window.removeEventListener('resize', checkWindowSize)
		})
	}

	function sweetToast(title, icon) {
		showToast({
			title: title,
			icon: icon
		})
	}

	function checkWindowSize() {
		isMobile = window.innerWidth <= 768
	}

	async function getItem() {
		await httpGet(
			endPoints.ABILITY_TEST_RESULT,
			'abilityTestResult',
			true,
			(res) => {
				items = res.data.data
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
			() => {},
			() => {
				storeLoadingState.set(false)
			}
		)
	}
</script>

{#if $storeLoadingState}
	<LoadingSpinner />
{:else}
	<main>
		<div class="main_top_box">
			<img src="/imgs/icon_left.svg" alt="icon" />
			<span>능력고사 테스트 결과 리스트</span>
		</div>

		<div class="main_box">
			<div class="list_option_box"></div>
			<div class="list_box">
				{#if !isMobile}
					<div class="item_box_title">
						<div>ID</div>
						<div>테스트 이름</div>
						<div>닉네임</div>
						<div>총 문항수</div>
						<div>정답/오답</div>
						<div>점수</div>
						<div>브라우저</div>
						<div>메세지</div>
						<div>날짜</div>
					</div>
				{/if}
				{#each items as item}
					<div class="item_box">
						<div>
							<p>{isMobile ? '아이디' : ''}</p>
							{item.id}
						</div>
						<div>
							<p>{isMobile ? '테스트 이름' : ''}</p>
							{item.test_name}
						</div>
						<div style="color: var(--main-bg-lightViolet);">
							<p>{isMobile ? '닉네임' : ''}</p>
							{item.username}
						</div>
						<div>
							<p>{isMobile ? '총 문항수' : ''}</p>
							{item.number_q}개
						</div>
						<div>
							<p>{isMobile ? '정답/오답' : ''}</p>
							{item.correct} / {item.wrong}
						</div>
						<div>
							<p>{isMobile ? '점수' : ''}</p>
							{item.score}점
						</div>
						<div>
							<p>{isMobile ? '브라우저' : ''}</p>
							{item.agent}
						</div>
						<div class="item_message">
							<p>{isMobile ? '메세지' : ''}</p>
							{item.message ? item.message : '-'}
						</div>
						<div>
							<p>{isMobile ? '날짜' : ''}</p>
							{formatDate(item.created_at)}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</main>
{/if}

<style>
	.list_box {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
	.item_box_title {
		background-color: var(--main-bg-gray);
		color: var(--main-bg-white);
		height: 5rem;
	}
	.item_box_title,
	.item_box {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 1.5rem;
	}
	.item_box {
		height: 15rem;
		border-bottom: 2px solid var(--main-bg-white);
		background-color: var(--main-bg-darkPurple);
		color: var(--main-bg-white);
	}
	.item_box_title > div,
	.item_box > div {
		flex: 1; /* 모든 div가 동일한 너비를 갖도록 설정 */
		text-align: center; /* 텍스트 중앙 정렬 */
	}

	/* 예를 들어 첫 번째와 마지막 div에 대해 다른 설정이 필요한 경우 */
	.item_box_title > div:first-child,
	.item_box > div:first-child {
		flex: 0.5; /* 첫 번째 항목의 너비를 다른 항목보다 좁게 설정 */
	}
	.item_box_title > div:last-child,
	.item_box > div:last-child {
		flex: 1.5; /* 마지막 항목의 너비를 다른 항목보다 넓게 설정 */
	}
	.item_message {
		color: var(--main-bg-yellow);
		max-height: 100px;
	}

	@media (max-width: 768px) {
		.item_box {
			flex-direction: column;
			align-items: flex-start; /* 왼쪽 정렬로 변경 */
			height: auto; /* 높이를 자동으로 조절하여 내용에 맞춤 */
			margin-bottom: 1rem;
			padding: 1rem;
			border-radius: 8px;
		}
		.item_box div {
			display: flex;
			justify-content: space-between;
			width: 100%;
			margin-bottom: 1rem;
		}
		.item_box div p {
			flex: 0 0 auto; /* p 태그가 flex 항목의 크기를 결정하지 않도록 설정 */
			margin-right: 5rem; /* p와 내용 사이의 여백 설정 */
			color: var(--main-bg-lightGray);
		}
		.item_message {
			flex: 1; /* item_message가 남은 공간을 모두 차지하도록 설정 */
			overflow-x: scroll; /* 가로 스크롤 활성화 */
			white-space: nowrap; /* 메시지를 한 줄로 표시 */
			max-height: none; /* 모바일에서는 최대 높이 제한을 제거 */
		}
		.main_top_box {
			margin: 2rem 0;
		}
		.main_top_box img {
			width: 1rem;
		}
		.main_top_box span {
			font-size: 1.5rem;
		}
	}
</style>
