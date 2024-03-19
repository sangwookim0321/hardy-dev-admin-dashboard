<!-- 포트폴리오 데이터 목록 페이지 -->
<script>
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'
	import { page } from '$app/stores.js'
	import { goto } from '$app/navigation'
	import { storePath, storeLoadingState } from '$lib/store/store'
	import { showToast, showAlert } from '$lib/util/alerts'
	import { formatDate, formatComma } from '$lib/util/filter'
	import useApi from '$lib/util/api'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'

	const { httpGet, httpDelete, endPoints, statusHandler } = useApi()

	let currentPath

	let items = []
	let isMobile = false
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

	function checkWindowSize() {
		isMobile = window.innerWidth <= 768
	}

	async function getItem() {
		await httpGet(
			endPoints.PORTFOLIO,
			'PORTFOLIO',
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

	async function deleteItem(type) {
		await httpDelete(
			`${endPoints.PORTFOLIO}?type=${type}`,
			'PORTFOLIO',
			null,
			true,
			async (res) => {
				items = items.filter((item) => item.type !== type)
				sweetToast('포트폴리오 더미 데이터 삭제 완료', 'success')
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

	function sweetToast(title, icon) {
		showToast({
			title: title,
			icon: icon
		})
	}

	function onTouchStart(type) {
		timer = setTimeout(() => {
			sweetAlert(
				`${type}`,
				`'${type}' 데이터를 삭제하시겠습니까?`,
				'info',
				true,
				'확인',
				'취소',
				() => {
					deleteItem(type)
				}
			)
		}, 800)
	}

	function onTouchEnd() {
		clearTimeout(timer)
	}

	async function moveDetail(type) {
		await goto(`/admin/portfolio/list/${type}`)
	}
</script>

{#if $storeLoadingState}
	<LoadingSpinner />
{:else}
	<main>
		<div class="main_top_box">
			<img src="/imgs/icon_left.svg" alt="icon" />
			<span>포트폴리오 데이터 리스트</span>
		</div>

		<div class="main_box">
			<div class="list_option_box"></div>
			<div class="list_box">
				{#if !isMobile}
					<div class="item_box_title">
						<div>비고</div>
						<div>ID</div>
						<div>타입</div>
						<div>내용</div>
						<div>날짜</div>
					</div>
				{/if}
				{#each items as item, index}
					<div
						class="item_box"
						on:click={moveDetail(item.type)}
						on:mousedown={onTouchStart(item.type)}
						on:mouseup={onTouchEnd}
						on:mouseleave={onTouchEnd}
						on:touchstart={onTouchStart(item.type)}
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
							<p>{isMobile ? '타입' : ''}</p>
							{item.type}
						</div>
						<div class="content" style="color: var(--main-bg-lightViolet);">
							<p>{isMobile ? '내용' : ''}</p>
							{item.content}
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
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
	.content {
		display: flex;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 300px;
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
		.content {
			max-width: 100%;
			overflow-x: scroll;
		}
	}
</style>
