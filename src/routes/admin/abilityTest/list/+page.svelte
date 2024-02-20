<!-- 능력고사 테스트 목록 페이지 -->
<script>
	import { onMount } from 'svelte'
	import { page } from '$app/stores.js'
	import { storePath, storeAccessToken } from '$lib/store/store'
	import { showToast } from '$lib/util/alerts'
	import { Stretch } from 'svelte-loading-spinners'
	import { formatDate } from '$lib/util/filter'
	import useApi from '$lib/util/api'

	const { httpGet, endPoints } = useApi()

	let currentPath
	let items = []
	let isLoading = false

	onMount(() => {
		currentPath = $page.url.pathname
		storePath.set(currentPath)
		getItem()
	})

	function sweetToast(title, icon) {
		showToast({
			title: title,
			icon: icon
		})
	}

	function getItem() {
		isLoading = true
		httpGet(
			endPoints.ABILITY_TEST_LIST,
			'AbilityTestList',
			true,
			(res) => {
				items = res.data.data
				console.log(res.data.data)
			},
			(err) => {
				sweetToast(err, 'error')
				console.log(err)
			},
			() => {},
			() => {
				isLoading = false
				console.log('final')
			}
		)
	}
</script>

<main>
	<div class="main_top_box">
		<img src="/imgs/icon_left.svg" alt="icon" />
		<span>능력고사 테스트 목록</span>
	</div>
	<div class="main_box">
		<div class="group_box_01">
			<div class="group_box_01_child">
				<div>
					<span class="child_title">등록된 테스트 갯수</span>
				</div>
				<div>
					<span class="child_sub">12개</span>
				</div>
			</div>
			<div class="group_box_01_child">
				<div>
					<span class="child_title">공개/비공개</span>
				</div>
				<div>
					<span class="child_sub">10개 / 2개</span>
				</div>
			</div>
			<div class="group_box_01_child">
				<div>
					<span class="child_title">총 조회수</span>
				</div>
				<div>
					<span class="child_sub">12,232회</span>
				</div>
			</div>
		</div>
		<!-- 생성일순, 조회수 순, 공개/비공개 인것만, 검색어 -->
		<div class="group_box_02">
			<div class="group_box_02_child">
				<div>SUB ITEM</div>
				<div>SUB ITEM</div>
				<div>SUB ITEM</div>
				<div>SUB ITEM</div>
			</div>
			<!-- <table>
				<th>ID</th>
				<th>테스트 이름</th>
				<th>서브 타이틀</th>
				<th>공개여부</th>
				<th>조회수</th>
				<th>생성일</th>
				<th>상세</th>

				<tr style="position: relative;">
					{#if isLoading}
						<div class="loading-container">
							<Stretch size="60" color="var(--main-bg-purple)" />
						</div>
					{:else}
						{#each items as item, index}
							<td>{item.id}</td>
							<td>{item.title}</td>
							<td>{item.sub_title}</td>
							<td>{item.release ? '공개' : '비공개'}</td>
							<td>{item.count}</td>
							<td>{formatDate(item.created_at)}</td>
							<td>
								<button>보기</button>
							</td>
						{/each}
					{/if}
				</tr>
			</table> -->
		</div>
	</div>
</main>

<style>
	.group_box_01 {
		display: flex;
		width: 100%;
		height: 200px;
	}
	.group_box_01_child {
		display: flex;
		flex-direction: column;
		width: 33.33%;
		height: 100%;
		border: 2px solid var(--main-bg-white);
		background-color: var(--main-bg-purple);
		border-radius: 10px;
	}
	.group_box_01_child div {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 50%;
	}
	.child_title {
		font-size: 2.2rem;
		color: var(--main-bg-lightGray-02);
	}
	.child_sub {
		font-size: 2.2rem;
		color: var(--main-bg-white);
	}
	.group_box_02 {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		margin-top: 100px;
	}
	.group_box_02_child {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		width: 100%;
		margin-bottom: 20px;
	}
	.group_box_02_child div {
		margin-right: 2rem;
	}
	button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 10px;
		background-color: var(--main-bg-lightGray);
		color: var(--main-bg-white);
		cursor: pointer;
	}
	button:hover {
		background-color: var(--main-bg-gray);
	}

	@media (max-width: 768px) {
		.main_top_box {
			margin: 2rem 0;
		}
		.main_top_box img {
			width: 1rem;
		}
		.main_top_box span {
			font-size: 1.5rem;
		}
		.group_box_01 {
			height: 100px;
		}
		.child_title {
			font-size: 1.2rem;
		}
		.child_sub {
			font-size: 1.2rem;
		}
	}
	.loading-container {
		position: absolute;
		left: 50%;
		padding: 5rem 0;
	}
</style>
