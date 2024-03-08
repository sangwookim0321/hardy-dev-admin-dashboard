<!-- MBTI 테스트 목록 페이지 -->
<script>
	import { onMount } from 'svelte'
	import { page } from '$app/stores.js'
	import { goto } from '$app/navigation'
	import { storePath, storeLoadingState } from '$lib/store/store'
	import { showToast } from '$lib/util/alerts'
	import { formatDate, formatComma } from '$lib/util/filter'
	import { paginate, LightPaginationNav } from 'svelte-paginate'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import useApi from '$lib/util/api'

	const { httpGet, httpDelete, httpPatch, endPoints, statusHandler } = useApi()

	let currentPath
	let items = []
	let subItems = {
		totaltests: 0,
		releasedtests: 0,
		unreleasedtests: 0,
		totalcount: 0
	}
	let currentPage = 1
	let pageSize = 5
	let totalItems = 0
	$: paginatedItems = paginate({ items, pageSize, currentPage })
	let selectedCreationDate = '' // 생성일
	let selectedViews = '' // 조회수
	let selectedDisclosure = '' // 공개여부
	let creationDateOptions = ['최신순', '오래된순']
	let viewsDateOptions = ['높은순', '낮은순']
	let disclosureDateOptions = ['공개', '비공개']
	let searchKeyword = ''
	let checkboxStatus = []
	let selectedIds = []
	let oldImagePaths = []

	const params = new URLSearchParams($page.url.search)
	if (params.has('page')) {
		currentPage = parseInt(params.get('page'))
	}

	onMount(() => {
		currentPath = $page.url.pathname
		storePath.set(currentPath)
		storeLoadingState.set(true)

		// URL 쿼리 파라미터 읽기
		selectedCreationDate = params.get('creation_date') || ''
		selectedViews = params.get('views') || ''
		selectedDisclosure = params.get('disclosure') || ''

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
			`${endPoints.MBTI_TEST}/?creation_date=${selectedCreationDate}&views=${selectedViews}&disclosure=${selectedDisclosure}&search=${searchKeyword}&page=${currentPage}&limit=${pageSize}`,
			'MBTITestList',
			true,
			(res) => {
				items = res.data.data
				totalItems = res.data.total
				subItems = res.data.totalData[0]
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

	async function deleteItem() {
		if (selectedIds.length <= 0) {
			sweetToast('삭제할 항목을 선택해주세요.', 'error')
			return
		}

		await httpDelete(
			endPoints.MBTI_TEST,
			'MBTITestDelete',
			{ ids: selectedIds, oldImagePaths: oldImagePaths },
			true,
			async (res) => {
				await getItem()
				sweetToast('테스트 삭제 완료', 'success')
				checkboxStatus = [] // 삭제 후 체크박스 초기화
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
				selectedIds = []
			}
		)
	}

	function patchRelease(id, release, title) {
		httpPatch(
			endPoints.MBTI_TEST,
			'MBTITestRelease',
			{ id: id, release: release },
			true,
			(res) => {
				getItem()
				sweetToast(`${title}의 공개상태 변경 완료`, 'success')
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

	async function updatePage(page) {
		currentPage = page
		await getItem()
		await goto(`/admin/mbtiTest/list?page=${currentPage}`, { replaceState: true })
		checkboxStatus = [] // 페이지 이동 후 체크박스 초기화
	}

	async function updateQueryParams(param, value) {
		const url = new URL(window.location)
		url.searchParams.set(param, value)
		await goto(url.toString(), { replaceState: true })
		await getItem()
	}

	async function moveDetail(id) {
		await goto(`/admin/mbtiTest/list/${id}?page=${currentPage}`)
	}

	function handleKeydown(event) {
		if (event.key === 'Enter') {
			currentPage = 1
			getItem()
		}
	}

	function searchRemove() {
		searchKeyword = ''
	}

	function setId(id, img, index) {
		if (!selectedIds.includes(id)) {
			selectedIds.push(id)
			oldImagePaths.push(img)
			checkboxStatus[index] = true
		} else {
			selectedIds = selectedIds.filter((selectedId) => selectedId !== id)
			oldImagePaths = oldImagePaths.filter((oldImagePath) => oldImagePath !== img)
			checkboxStatus[index] = false
		}
	}
</script>

{#if $storeLoadingState}
	<LoadingSpinner />
{:else}
	<main>
		<div class="main_top_box">
			<img src="/imgs/icon_left.svg" alt="icon" />
			<span style="color: var(--main-bg-violet);">MBTI 테스트 목록</span>
		</div>
		<div class="main_box">
			<div class="group_box_01">
				<div class="group_box_01_child">
					<div>
						<span class="child_title">등록된 테스트 갯수</span>
					</div>
					<div>
						<span class="child_sub">{subItems.totaltests}개</span>
					</div>
				</div>
				<div class="group_box_01_child">
					<div>
						<span class="child_title">공개 / 비공개</span>
					</div>
					<div>
						<span class="child_sub">{subItems.releasedtests}개 / {subItems.unreleasedtests}개</span>
					</div>
				</div>
				<div class="group_box_01_child">
					<div>
						<span class="child_title">총 조회수</span>
					</div>
					<div>
						<span class="child_sub">{formatComma(subItems.totalcount)}회</span>
					</div>
				</div>
			</div>

			<div class="group_box_02">
				<div class="group_box_02_child">
					<div class="group_box_02_select">
						<div class="select_div">
							<span>날짜 순</span>
							<select
								bind:value={selectedCreationDate}
								on:change={() => updateQueryParams('creation_date', selectedCreationDate)}
							>
								<option value="">선택</option>
								{#each creationDateOptions as option}
									<option value={option}>{option}</option>
								{/each}
							</select>
							<img src="/imgs/icon_top_bottom.svg" alt="arrow" />
						</div>
						<div class="select_div">
							<span>조회수 순</span>
							<select
								bind:value={selectedViews}
								on:change={() => updateQueryParams('views', selectedViews)}
							>
								<option value="">선택</option>
								{#each viewsDateOptions as option}
									<option value={option}>{option}</option>
								{/each}
							</select>
							<img src="/imgs/icon_top_bottom.svg" alt="arrow" />
						</div>
						<div class="select_div">
							<span>공개여부</span>
							<select
								bind:value={selectedDisclosure}
								on:change={() => updateQueryParams('disclosure', selectedDisclosure)}
							>
								<option value="">선택</option>
								{#each disclosureDateOptions as option}
									<option value={option}>{option}</option>
								{/each}
							</select>
							<img src="/imgs/icon_top_bottom.svg" alt="arrow" />
						</div>
					</div>
					<div class="search_box">
						<input
							bind:value={searchKeyword}
							type="text"
							on:keydown={handleKeydown}
							placeholder="ID/이름으로 검색하기"
						/>
						{#if searchKeyword.length > 0}
							<img
								src="/imgs/icon_remove.svg"
								alt="삭제 아이콘"
								on:click={() => {
									searchRemove()
								}}
							/>
						{/if}
						<button
							class="search_button"
							on:click={() => {
								currentPage = 1
								getItem()
							}}>검색</button
						>
					</div>
				</div>
				<div class="table_box">
					<table style="position: relative;">
						<th>
							<button
								class="removeBtn"
								on:click={() => {
									deleteItem()
								}}>삭제</button
							>
						</th>
						<th>ID</th>
						<th>테스트 이름</th>
						<th>서브 타이틀</th>
						<th>공개여부</th>
						<th>조회수</th>
						<th style="width: 20rem">생성일</th>
						<th>상세</th>

						{#each items as item, index}
							<tr>
								{#if items.length > 0}
									<td>
										<input
											id={`check${index}`}
											type="checkbox"
											bind:checked={checkboxStatus[index]}
											on:change={() => setId(item.id, item.img_url)}
										/>
									</td>
									<td>{item.id}</td>
									<td>{item.title}</td>
									<td>{item.sub_title}</td>
									<td>
										<span
											style={item.release
												? 'color: var(--main-bg-purple)'
												: 'color: var(--main-bg-lightGray)'}
											class="releaseSpan"
											on:click={() => {
												patchRelease(item.id, item.release, item.title)
											}}>{item.release ? '공개' : '비공개'}</span
										>
									</td>
									<td>{formatComma(item.count)}</td>
									<td>{formatDate(item.created_at)}</td>
									<td>
										<button
											on:click={() => {
												moveDetail(item.id)
											}}>보기</button
										>
									</td>
								{/if}
							</tr>
						{/each}
					</table>
				</div>

				{#if items.length <= 0}
					<div class="noData_box">
						<span>조회된 데이터가 없습니다.</span>
					</div>
				{/if}
				<LightPaginationNav
					{totalItems}
					{pageSize}
					{currentPage}
					limit={2}
					showStepOptions={true}
					on:setPage={(e) => {
						updatePage(e.detail.page)
					}}
				/>
			</div>
		</div>
	</main>
{/if}

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
		background-color: var(--main-bg-violet);
		border: 2px solid var(--main-bg-white);
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
		display: flex;
	}
	.search_box img {
		position: absolute;
		width: 2rem;
		top: 1rem;
		right: 9rem;
		cursor: pointer;
	}
	.search_box input {
		border: 1px solid var(--main-bg-lightGray-02);
		border-radius: 5px;
		padding: 1rem 8rem 1rem 1rem;
		width: 80%;
		margin: 0 auto;
	}
	.search_box input:focus {
		outline: 1px solid var(--main-bg-lightGray);
	}
	.search_box button {
		width: 10rem;
		padding: 1rem 1rem;
		margin-left: 1rem;
		border: none;
		background-color: var(--main-bg-violet);
		color: var(--main-bg-white);
		cursor: pointer;
	}
	.search_box button:hover {
		background-color: var(--main-bg-darkViolet);
	}
	.select_div {
		position: relative;
	}
	.select_div span {
		margin-right: 1rem;
		font-weight: 600;
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
		border-radius: 5px;
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
	.releaseSpan {
		cursor: pointer;
	}
	.releaseSpan:hover {
		text-decoration: underline;
	}
	.removeBtn {
		background-color: var(--main-bg-red);
		color: var(--main-bg-white);
	}
	.removeBtn:hover {
		background-color: var(--main-bg-darkRed);
		color: var(--main-bg-white);
	}
	input:checked {
		accent-color: var(--main-bg-red);
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
		.select_div {
			display: flex;
			flex-direction: column;
			align-items: center;
		}
		.select_div span {
			margin-bottom: 1rem;
		}
		.select_div img {
			top: 64%;
			right: 0.5rem;
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
			right: 9rem;
		}
		.releaseSpan {
			font-size: 1rem;
			cursor: pointer;
		}
	}
</style>
