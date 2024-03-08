<!-- 능력고사 테스트 결과 페이지 -->
<script>
	import { onMount } from 'svelte'
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

	onMount(() => {
		currentPath = $page.url.pathname
		storePath.set(currentPath)
		storeLoadingState.set(true)
		getItem()
	})

	function sweetToast(title, icon) {
		showToast({
			title: title,
			icon: icon
		})
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
				{#each items as item}
					<div class="item_box">
						<div>{item.id}</div>
						<div>{item.test_name}</div>
						<div>{item.username}</div>
						<div>{item.number_q}</div>
						<div>{item.correct}/{item.wrong}</div>
						<div>{item.score}점</div>
						<div>{item.agent}</div>
						<div>{item.message ? item.message : '-'}</div>
						<div>{formatDate(item.created_at)}</div>
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
		background-color: var(--main-bg-dark);
		color: var(--main-bg-white);
		height: 3rem;
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
		height: 5rem;
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

	@media (max-width: 768px) {
	}
</style>
