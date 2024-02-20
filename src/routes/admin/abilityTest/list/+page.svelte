<!-- 능력고사 테스트 목록 페이지 -->
<script>
	import { onMount } from 'svelte'
	import { page } from '$app/stores.js'
	import { storePath, storeAccessToken } from '$lib/store/store'
	import { showToast } from '$lib/util/alerts'
	import { BarLoader } from 'svelte-loading-spinners'
	import { formatDate } from '$lib/util/filter'
	import { paginate, LightPaginationNav } from 'svelte-paginate'
	import useApi from '$lib/util/api'

	const { httpGet, endPoints } = useApi()

	let currentPath
	let items = []
	let currentPage = 1
	let pageSize = 4
	$: paginatedItems = paginate({ items, pageSize, currentPage })
	let isLoading = false
	let selectedCreationDate = '' // 생성일
	let selectedViews = '' // 조회수
	let selectedDisclosure = '' // 공개여부
	let creationDateOptions = ['최신순', '오래된순']
	let viewsDateOptions = ['높은순', '낮은순']
	let disclosureDateOptions = ['공개', '비공개']
	let searchKeyword = ''

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
				<div class="group_box_02_select">
					<div class="select_div">
						<select bind:value={selectedCreationDate}>
							<option value="">선택</option>
							{#each creationDateOptions as option}
								<option value={option}>{option}</option>
							{/each}
						</select>
						<img src="/imgs/icon_top_bottom.svg" alt="arrow" />
					</div>
					<div class="select_div">
						<select bind:value={selectedViews}>
							<option value="">선택</option>
							{#each viewsDateOptions as option}
								<option value={option}>{option}</option>
							{/each}
						</select>
						<img src="/imgs/icon_top_bottom.svg" alt="arrow" />
					</div>
					<div class="select_div">
						<select bind:value={selectedDisclosure}>
							<option value="">선택</option>
							{#each disclosureDateOptions as option}
								<option value={option}>{option}</option>
							{/each}
						</select>
						<img src="/imgs/icon_top_bottom.svg" alt="arrow" />
					</div>
				</div>
				<div class="search_box">
					<img src="/imgs/icon_search.svg" alt="검색 아이콘" />
					<input bind:value={searchKeyword} type="text" placeholder="ID/이름으로 검색하기" />
				</div>
			</div>
			<div class="table_box">
				<table style="position: relative;">
					<th>ID</th>
					<th>테스트 이름</th>
					<th>서브 타이틀</th>
					<th>공개여부</th>
					<th>조회수</th>
					<th style="width: 20rem">생성일</th>
					<th>상세</th>

					{#each items as item, index}
						<tr>
							<td>{item.id}</td>
							<td>{item.title}</td>
							<td>{item.sub_title}</td>
							<td>{item.release ? '공개' : '비공개'}</td>
							<td>{item.count}</td>
							<td>{formatDate(item.created_at)}</td>
							<td>
								<button>보기</button>
							</td>
						</tr>
					{/each}
				</table>
			</div>
			{#if !items.length >= 1 && !isLoading}
				<div class="noData_box">
					<span>조회된 데이터가 없습니다.</span>
				</div>
			{/if}
			<LightPaginationNav
				class="custom-pagination-nav"
				totalItems={items.length}
				{pageSize}
				{currentPage}
				limit={1}
				showStepOptions={true}
				on:setPage={(e) => (currentPage = e.detail.page)}
			/>
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
		align-items: center;
		width: 100%;
		margin-bottom: 20px;
	}
	.group_box_02_child div {
		margin-right: 2rem;
	}
	.group_box_02_select {
		display: flex;
	}
	.noData_box {
		width: 100%;
		margin: 6rem 0;
		text-align: center;
	}
	.noData_box span {
		font-size: 1.6rem;
	}
	.search_box {
		position: relative;
	}
	.search_box img {
		position: absolute;
		right: 0rem;
		bottom: 0.6rem;
		width: 1.6rem;
		cursor: pointer;
	}
	.search_box input {
		border: 1px solid var(--main-bg-lightGray-02);
		border-radius: 5px;
		padding: 0.5rem 4rem 0.5rem 1rem;
		width: 80%;
		margin: 0 auto;
	}
	.search_box input:focus {
		outline: 1px solid var(--main-bg-lightGray);
	}
	.select_div {
		position: relative;
	}
	.select_div img {
		position: absolute;
		top: 25%;
		right: 0.5rem;
		width: 0.8rem;
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
	select {
		appearance: none;
		padding: 0.5rem 2rem;
		border: 1px solid var(--main-bg-lightGray-02);
		background-color: var(--main-bg-white);
		cursor: pointer;
	}
	select:focus {
		outline: none;
		border-color: var(--main-bg-lightGray);
	}
	select option {
		border: none;
		outline: none;
		background-color: var(--main-bg-lightGray-02);
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
		.group_box_02_select {
			display: flex;
			justify-content: space-between;
			width: 100%;
			margin-bottom: 2rem;
		}
		.group_box_02_child {
			width: 100%;
			flex-direction: column;
			align-items: flex-start;
		}
		.group_box_02_child div {
			margin-right: 0;
		}
		.search_box {
			display: flex;
			justify-content: center;
			width: 100%;
		}
		.search_box input {
			width: 90%;
		}
		.search_box img {
			right: 1rem;
		}
	}
	.loading-container {
		position: absolute;
		top: 12%;
	}
</style>
