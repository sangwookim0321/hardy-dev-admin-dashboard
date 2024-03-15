<!-- 능력고사 테스트 결과 페이지 -->
<script>
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'
	import { page } from '$app/stores.js'
	import { goto } from '$app/navigation'
	import { storePath, storeLoadingState } from '$lib/store/store'
	import { formatDate, formatComma } from '$lib/util/filter'
	import { showToast, showAlert } from '$lib/util/alerts'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import LoadingSpinnerCircle from '$lib/components/LoadingSpinnerCircle.svelte'
	import InfiniteScroll from '$lib/components/InfiniteScroll.svelte'
	import useApi from '$lib/util/api'

	const { httpGet, httpDelete, endPoints, statusHandler } = useApi()

	let currentPath

	let items = []
	let pageNum = 1
	let limit = 5
	let total = 0
	let isMobile = false
	let isLoading = false
	let timer

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

	function sweetAlert(title, text, icon, isCancel, confirmButtonText, cancelButtonText, callback) {
		showAlert({
			title: title,
			text: text,
			icon: icon,
			isCancel: isCancel,
			confirmButtonText: confirmButtonText,
			cancelButtonText: cancelButtonText,
			callback: callback
		})
	}

	function checkWindowSize() {
		isMobile = window.innerWidth <= 768
	}

	async function fetchNextPage() {
		if (items.length >= total) {
			return
		}
		pageNum += 1
		await getItem()
	}

	async function getItem() {
		// 첫 페이지 로딩 또는 아직 로드할 데이터가 더 있는 경우에만 요청
		if (pageNum === 1 || items.length < total) {
			const params = new URLSearchParams({ page: pageNum, limit: limit })
			isLoading = true

			await httpGet(
				`${endPoints.ABILITY_TEST_RESULT}?${params}`,
				'abilityTestResult',
				true,
				(res) => {
					if (res.data && res.data.data) {
						items = [...items, ...res.data.data]
						total = res.data.total
					}
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
					isLoading = false
				}
			)
		} else {
			console.log('data already loaded')
		}
	}

	async function deleteItem(id) {
		await httpDelete(
			`${endPoints.ABILITY_TEST_RESULT}?id=${id}`,
			'abilityTestResult',
			null,
			true,
			async (res) => {
				items = items.filter((item) => item.id !== id)
				sweetToast('테스트 결과 삭제 완료', 'success')
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
			() => {}
		)
	}

	function onTouchStart(id, test_name, username) {
		timer = setTimeout(() => {
			sweetAlert(
				`${test_name}`,
				`'${username}'님의 테스트 결과를 삭제 하시겠습니까?`,
				'info',
				true,
				'확인',
				'취소',
				() => {
					deleteItem(id)
				}
			)
		}, 800)
	}

	function onTouchEnd() {
		clearTimeout(timer)
	}
</script>

{#if $storeLoadingState}
	<LoadingSpinner />
{:else}
	<main>
		<div class="main_top_box">
			<img src="/imgs/icon_left.svg" alt="icon" />
			<span>능력고사 테스트 결과 리스트({total}개)</span>
		</div>

		<div class="main_box">
			<div class="list_option_box"></div>
			<div class="list_box">
				{#if !isMobile}
					<div class="item_box_title">
						<div>비고</div>
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
				{#each items as item, index}
					<div
						class="item_box"
						on:mousedown={onTouchStart(item.id, item.test_name, item.username)}
						on:mouseup={onTouchEnd}
						on:mouseleave={onTouchEnd}
						on:touchstart={onTouchStart(item.id, item.test_name, item.username)}
						on:touchend={onTouchEnd}
						on:touchcancel={onTouchEnd}
						on:touchmove={onTouchEnd}
					>
						<div>
							<p>{isMobile ? '비고' : ''}</p>
							{index + 1}
						</div>
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
				{#if isLoading}
					<LoadingSpinnerCircle />
				{/if}
				<InfiniteScroll fetchNext={fetchNextPage} />
			</div>
		</div>
	</main>
{/if}

<style>
	.list_box {
		position: relative;
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
		cursor: pointer;
	}
	.item_box:hover {
		background-color: var(--main-bg-purple);
	}
	.item_box_title > div,
	.item_box > div {
		flex: 1;
		text-align: center;
	}

	.item_box_title > div:first-child,
	.item_box > div:first-child {
		flex: 0.5;
	}
	.item_box_title > div:last-child,
	.item_box > div:last-child {
		flex: 1.5;
	}
	.item_message {
		color: var(--main-bg-yellow);
		max-height: 100px;
	}
	.item_box,
	.item_box * {
		-webkit-user-select: none; /* Safari */
		-moz-user-select: none; /* Firefox */
		-ms-user-select: none; /* Internet Explorer/Edge */
		user-select: none; /* Non-prefixed version, currently supported by Chrome, Opera, and Edge */
	}

	@media (max-width: 768px) {
		.item_box {
			flex-direction: column;
			align-items: flex-start;
			height: auto;
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
			flex: 0 0 auto;
			margin-right: 5rem;
			color: var(--main-bg-lightGray);
		}
		.item_message {
			flex: 1;
			overflow-x: scroll;
			white-space: nowrap;
			max-height: none;
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
